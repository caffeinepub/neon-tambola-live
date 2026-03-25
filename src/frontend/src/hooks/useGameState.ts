import { useCallback, useEffect, useRef, useState } from "react";
import {
  type BookingRequest,
  type GamePhase,
  type GameState,
  defaultState,
  loadState,
  saveState,
} from "../utils/gameStorage";
import {
  playCallSound,
  playWinnerSound,
  speakNumber,
} from "../utils/soundEffects";
import { countTicketNumbers, generateTickets } from "../utils/ticketGenerator";
import { type Winner, detectWins } from "../utils/winDetector";

export function useGameState() {
  const [state, setState] = useState<GameState>(() => loadState());
  const [newWinners, setNewWinners] = useState<Winner[]>([]);
  const autoCallRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoCallEnabled, setAutoCallEnabled] = useState(false);

  const update = useCallback((updates: Partial<GameState>) => {
    setState((prev) => {
      const next = { ...prev, ...updates };
      saveState(next);
      return next;
    });
  }, []);

  const generateTicketsAction = useCallback(
    (count: number) => {
      const tickets = generateTickets(count);
      update({
        tickets,
        ticketCount: count,
        calledNumbers: [],
        currentNumber: null,
        winners: [],
        phase: "idle",
        bookingRequests: [],
      });
    },
    [update],
  );

  const callNumber = useCallback((s: GameState): GameState | null => {
    const uncalled: number[] = [];
    for (let n = 1; n <= 90; n++) {
      if (!s.calledNumbers.includes(n)) uncalled.push(n);
    }
    if (uncalled.length === 0) return null;
    const num = uncalled[Math.floor(Math.random() * uncalled.length)];
    const calledNumbers = [...s.calledNumbers, num];
    playCallSound();
    speakNumber(num);
    const newWins = detectWins(s.tickets, calledNumbers, s.winners);
    if (newWins.length > 0) playWinnerSound();
    const winners = [...s.winners, ...newWins];
    const hasFullHouse = newWins.some((w) => w.winType === "Full House");
    const phase: GamePhase =
      hasFullHouse || calledNumbers.length === 90 ? "ended" : s.phase;
    return { ...s, calledNumbers, currentNumber: num, winners, phase };
  }, []);

  const callNextNumber = useCallback(() => {
    setState((prev) => {
      const next = callNumber(prev);
      if (!next) return prev;
      const nw = next.winners.slice(prev.winners.length);
      setNewWinners(nw);
      if (next.phase === "ended") setAutoCallEnabled(false);
      saveState(next);
      return next;
    });
  }, [callNumber]);

  const manualCallNumber = useCallback((n: number) => {
    setState((prev) => {
      if (prev.calledNumbers.includes(n)) return prev;
      const calledNumbers = [...prev.calledNumbers, n];
      playCallSound();
      speakNumber(n);
      const newWins = detectWins(prev.tickets, calledNumbers, prev.winners);
      if (newWins.length > 0) playWinnerSound();
      const winners = [...prev.winners, ...newWins];
      const hasFullHouse = newWins.some((w) => w.winType === "Full House");
      const phase: GamePhase =
        hasFullHouse || calledNumbers.length === 90 ? "ended" : prev.phase;
      const next = { ...prev, calledNumbers, currentNumber: n, winners, phase };
      setNewWinners(newWins);
      if (phase === "ended") setAutoCallEnabled(false);
      saveState(next);
      return next;
    });
  }, []);

  const setBooking = useCallback(() => update({ phase: "booking" }), [update]);
  const startPreview = useCallback(
    () => update({ phase: "preview" }),
    [update],
  );
  const startGame = useCallback(() => update({ phase: "active" }), [update]);
  const stopGame = useCallback(() => {
    setAutoCallEnabled(false);
    update({ phase: "idle" });
  }, [update]);
  const setStartTime = useCallback(
    (iso: string | null) => update({ startTime: iso }),
    [update],
  );

  const resetGame = useCallback(() => {
    setAutoCallEnabled(false);
    const tickets = generateTickets(state.ticketCount);
    const next = {
      ...defaultState,
      ticketCount: state.ticketCount,
      callSpeed: state.callSpeed,
      tickets,
    };
    setState(next);
    saveState(next);
    setNewWinners([]);
  }, [state.ticketCount, state.callSpeed]);

  const updateTicketName = useCallback((ticketId: number, name: string) => {
    setState((prev) => {
      const tickets = prev.tickets.map((t) =>
        t.id === ticketId ? { ...t, playerName: name } : t,
      );
      const next = { ...prev, tickets };
      saveState(next);
      return next;
    });
  }, []);

  const updateTicketCell = useCallback(
    (ticketId: number, row: number, col: number, value: number | null) => {
      setState((prev) => {
        const tickets = prev.tickets.map((t) => {
          if (t.id !== ticketId) return t;

          // If setting a number (not clearing), enforce limits:
          // - row must have < 5 numbers already
          // - ticket must have < 15 numbers already
          if (value !== null) {
            const currentRowNums = t.grid[row].filter(
              (c, ci) => c !== null && ci !== col,
            ).length;
            if (currentRowNums >= 5) return t; // row already full

            const currentTotal = countTicketNumbers(t.grid);
            const cellWasNull = t.grid[row][col] === null;
            if (cellWasNull && currentTotal >= 15) return t; // ticket already full
          }

          const grid = t.grid.map((r, ri) =>
            ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r,
          );
          return { ...t, grid };
        });
        const next = { ...prev, tickets };
        saveState(next);
        return next;
      });
    },
    [],
  );

  const setCallSpeed = useCallback(
    (speed: number) => update({ callSpeed: speed }),
    [update],
  );

  // Booking request actions
  const addBookingRequest = useCallback(
    (ticketId: number, playerName: string) => {
      setState((prev) => {
        const existing = prev.bookingRequests.find(
          (r) => r.ticketId === ticketId && r.status === "pending",
        );
        if (existing) return prev;
        const req: BookingRequest = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          ticketId,
          playerName,
          status: "pending",
          timestamp: Date.now(),
        };
        const next = {
          ...prev,
          bookingRequests: [...prev.bookingRequests, req],
        };
        saveState(next);
        return next;
      });
    },
    [],
  );

  const approveBookingRequest = useCallback((requestId: string) => {
    setState((prev) => {
      const req = prev.bookingRequests.find((r) => r.id === requestId);
      if (!req) return prev;
      const bookingRequests = prev.bookingRequests.map((r) =>
        r.id === requestId ? { ...r, status: "approved" as const } : r,
      );
      const tickets = prev.tickets.map((t) =>
        t.id === req.ticketId ? { ...t, playerName: req.playerName } : t,
      );
      const next = { ...prev, bookingRequests, tickets };
      saveState(next);
      return next;
    });
  }, []);

  const rejectBookingRequest = useCallback((requestId: string) => {
    setState((prev) => {
      const bookingRequests = prev.bookingRequests.map((r) =>
        r.id === requestId ? { ...r, status: "rejected" as const } : r,
      );
      const next = { ...prev, bookingRequests };
      saveState(next);
      return next;
    });
  }, []);

  // Auto phase transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev.startTime) return prev;
        const start = new Date(prev.startTime).getTime();
        const now = Date.now();
        const fiveMin = 5 * 60 * 1000;
        let nextPhase = prev.phase;
        if (prev.phase === "booking" && now >= start - fiveMin)
          nextPhase = "preview";
        else if (prev.phase === "preview" && now >= start) nextPhase = "active";
        if (nextPhase !== prev.phase) {
          const next = { ...prev, phase: nextPhase as GamePhase };
          saveState(next);
          return next;
        }
        return prev;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto call
  useEffect(() => {
    if (autoCallRef.current) clearInterval(autoCallRef.current);
    if (autoCallEnabled && state.phase === "active") {
      autoCallRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.phase !== "active") return prev;
          const next = callNumber(prev);
          if (!next) {
            setAutoCallEnabled(false);
            return prev;
          }
          const nw = next.winners.slice(prev.winners.length);
          setNewWinners(nw);
          if (next.phase === "ended") setAutoCallEnabled(false);
          saveState(next);
          return next;
        });
      }, state.callSpeed * 1000);
    }
    return () => {
      if (autoCallRef.current) clearInterval(autoCallRef.current);
    };
  }, [autoCallEnabled, state.phase, state.callSpeed, callNumber]);

  return {
    state,
    newWinners,
    setNewWinners,
    autoCallEnabled,
    setAutoCallEnabled,
    generateTickets: generateTicketsAction,
    callNextNumber,
    manualCallNumber,
    setBooking,
    startPreview,
    startGame,
    stopGame,
    resetGame,
    updateTicketName,
    updateTicketCell,
    setCallSpeed,
    setStartTime,
    addBookingRequest,
    approveBookingRequest,
    rejectBookingRequest,
  };
}
