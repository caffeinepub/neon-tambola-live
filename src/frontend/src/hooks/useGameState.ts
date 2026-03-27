import { useCallback, useEffect, useRef, useState } from "react";
import {
  ALL_PRIZES,
  type BookingRequest,
  type GamePhase,
  type GameSettings,
  type GameState,
  defaultState,
  loadState,
  saveState,
} from "../utils/gameStorage";
import {
  playCallSound,
  playWinnerSound,
  speakNumber,
  speakWinner,
} from "../utils/soundEffects";
import {
  type Ticket,
  countTicketNumbers,
  generateSingleTicket,
  generateTickets,
  isValidTicket,
} from "../utils/ticketGenerator";
import { type Winner, detectWins } from "../utils/winDetector";

export function useGameState() {
  const [state, setState] = useState<GameState>(() => loadState());
  const [newWinners, setNewWinners] = useState<Winner[]>([]);
  const autoCallRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoCallEnabled, setAutoCallEnabled] = useState(false);
  const autoCallEnabledRef = useRef(false);

  // Keep ref in sync with state so callbacks can read current value
  useEffect(() => {
    autoCallEnabledRef.current = autoCallEnabled;
  }, [autoCallEnabled]);

  const update = useCallback((updates: Partial<GameState>) => {
    setState((prev) => {
      const next = { ...prev, ...updates };
      saveState(next);
      return next;
    });
  }, []);

  const updateGameSettings = useCallback(
    (settings: Partial<GameSettings>) => {
      update(settings);
    },
    [update],
  );

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
        isPublished: false,
      });
    },
    [update],
  );

  const addTicketsFromGrids = useCallback((grids: (number | null)[][][]) => {
    setState((prev) => {
      const startId = prev.tickets.length + 1;
      const newTickets: Ticket[] = grids.map((grid, i) => ({
        id: startId + i,
        playerName: `Player ${startId + i}`,
        setIndex: Math.floor((startId + i - 1) / 6),
        grid,
      }));
      const tickets = [...prev.tickets, ...newTickets];
      const next = { ...prev, tickets, ticketCount: tickets.length };
      saveState(next);
      return next;
    });
  }, []);

  const addManualTicket = useCallback(() => {
    setState((prev) => {
      const newId = prev.tickets.length + 1;
      const ticket = generateSingleTicket(newId, Math.floor((newId - 1) / 6));
      const tickets = [...prev.tickets, ticket];
      const next = { ...prev, tickets, ticketCount: tickets.length };
      saveState(next);
      return next;
    });
  }, []);

  const updateTicketGrid = useCallback(
    (ticketId: number, grid: (number | null)[][]) => {
      setState((prev) => {
        const tickets = prev.tickets.map((t) =>
          t.id === ticketId ? { ...t, grid } : t,
        );
        const next = { ...prev, tickets };
        saveState(next);
        return next;
      });
    },
    [],
  );

  const deleteTicket = useCallback((ticketId: number) => {
    setState((prev) => {
      const tickets = prev.tickets.filter((t) => t.id !== ticketId);
      const next = { ...prev, tickets, ticketCount: tickets.length };
      saveState(next);
      return next;
    });
  }, []);

  const publishTickets = useCallback(() => {
    update({ isPublished: true, phase: "booking" });
  }, [update]);

  // Determines if game should end based on winners and active prizes
  const shouldEndGame = useCallback(
    (
      winners: Winner[],
      activePrizes: string[],
      calledCount: number,
    ): boolean => {
      // Always end when all 90 numbers are called
      if (calledCount >= 90) return true;
      // End when Full House is won (it's always the final prize)
      if (winners.some((w) => w.winType === "Full House")) return true;
      // End when all active prizes have been won
      if (
        activePrizes.length > 0 &&
        activePrizes.every((p) => winners.some((w) => w.winType === p))
      )
        return true;
      return false;
    },
    [],
  );

  const callNumber = useCallback(
    (s: GameState, onSpeechEnd?: () => void): GameState | null => {
      const uncalled: number[] = [];
      for (let n = 1; n <= 90; n++) {
        if (!s.calledNumbers.includes(n)) uncalled.push(n);
      }
      if (uncalled.length === 0) return null;
      const num = uncalled[Math.floor(Math.random() * uncalled.length)];
      const calledNumbers = [...s.calledNumbers, num];
      playCallSound();
      speakNumber(num, s.selectedVoice, s.voiceMode, onSpeechEnd);
      const newWins = detectWins(
        s.tickets,
        calledNumbers,
        s.winners,
        s.activePrizes,
      );
      if (newWins.length > 0) {
        playWinnerSound();
        for (const w of newWins)
          speakWinner(w.winType, w.playerName, w.ticketId, s.selectedVoice);
      }
      const winners = [...s.winners, ...newWins];
      const phase: GamePhase = shouldEndGame(
        winners,
        s.activePrizes,
        calledNumbers.length,
      )
        ? "ended"
        : s.phase;
      return { ...s, calledNumbers, currentNumber: num, winners, phase };
    },
    [shouldEndGame],
  );

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

  const manualCallNumber = useCallback(
    (n: number) => {
      setState((prev) => {
        if (prev.calledNumbers.includes(n)) return prev;
        const calledNumbers = [...prev.calledNumbers, n];
        playCallSound();
        speakNumber(n, prev.selectedVoice, prev.voiceMode);
        const newWins = detectWins(
          prev.tickets,
          calledNumbers,
          prev.winners,
          prev.activePrizes,
        );
        if (newWins.length > 0) {
          playWinnerSound();
          for (const w of newWins)
            speakWinner(
              w.winType,
              w.playerName,
              w.ticketId,
              prev.selectedVoice,
            );
        }
        const winners = [...prev.winners, ...newWins];
        const phase: GamePhase = shouldEndGame(
          winners,
          prev.activePrizes,
          calledNumbers.length,
        )
          ? "ended"
          : prev.phase;
        const next = {
          ...prev,
          calledNumbers,
          currentNumber: n,
          winners,
          phase,
        };
        setNewWinners(newWins);
        if (phase === "ended") setAutoCallEnabled(false);
        saveState(next);
        return next;
      });
    },
    [shouldEndGame],
  );

  const setBooking = useCallback(() => update({ phase: "booking" }), [update]);
  const startPreview = useCallback(
    () => update({ phase: "preview" }),
    [update],
  );
  const startGame = useCallback(() => {
    setState((prev) => {
      const bookedIds = new Set(
        prev.bookingRequests
          .filter((r) => r.status === "approved")
          .flatMap((r) => r.ticketIds ?? [r.ticketId]),
      );
      const tickets = prev.tickets.filter((t) => bookedIds.has(t.id));
      const next = { ...prev, phase: "active" as GamePhase, tickets };
      saveState(next);
      return next;
    });
  }, []);
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
    const next = {
      ...defaultState,
      gameName: state.gameName,
      ticketLimit: state.ticketLimit,
      activePrizes: state.activePrizes,
      selectedVoice: state.selectedVoice,
    };
    setState(next);
    saveState(next);
    setNewWinners([]);
  }, [
    state.gameName,
    state.ticketLimit,
    state.activePrizes,
    state.selectedVoice,
  ]);

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
          if (value !== null) {
            const currentRowNums = t.grid[row].filter(
              (c, ci) => c !== null && ci !== col,
            ).length;
            if (currentRowNums >= 5) return t;
            const currentTotal = countTicketNumbers(t.grid);
            const cellWasNull = t.grid[row][col] === null;
            if (cellWasNull && currentTotal >= 15) return t;
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

  const addBookingRequest = useCallback(
    (playerName: string, ticketIds: number[]) => {
      setState((prev) => {
        // Compute visible tickets based on ticketLimit
        const visibleTickets =
          prev.ticketLimit > 0
            ? prev.tickets.slice(0, prev.ticketLimit)
            : prev.tickets;
        const visibleIds = new Set(visibleTickets.map((t) => t.id));

        // Reject if any requested ticket is outside the visible set
        if (ticketIds.some((id) => !visibleIds.has(id))) return prev;

        // Check all requested tickets are available (not already taken)
        const takenIds = new Set(
          prev.bookingRequests
            .filter((r) => r.status !== "rejected")
            .flatMap((r) => r.ticketIds ?? [r.ticketId]),
        );
        if (ticketIds.some((id) => takenIds.has(id))) return prev;

        // Auto-determine package type by count
        const count = ticketIds.length;
        const packageType =
          count === 1
            ? "single"
            : count === 3
              ? "half"
              : count === 6
                ? "full"
                : "custom";

        const req: BookingRequest = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          ticketId: ticketIds[0],
          ticketIds,
          packageType,
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
      const allTicketIds = req.ticketIds ?? [req.ticketId];
      const tickets = prev.tickets.map((t) =>
        allTicketIds.includes(t.id) ? { ...t, playerName: req.playerName } : t,
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
        const previewMs = (prev.previewDuration ?? 5) * 60 * 1000;
        let nextPhase = prev.phase;
        if (prev.phase === "booking" && now >= start - previewMs)
          nextPhase = "preview";
        else if (prev.phase === "preview" && now >= start) nextPhase = "active";
        if (nextPhase !== prev.phase) {
          let tickets = prev.tickets;
          if (nextPhase === "active") {
            const bookedIds = new Set(
              prev.bookingRequests
                .filter((r) => r.status === "approved")
                .flatMap((r) => r.ticketIds ?? [r.ticketId]),
            );
            tickets = tickets.filter((t) => bookedIds.has(t.id));
          }
          const next = { ...prev, phase: nextPhase as GamePhase, tickets };
          saveState(next);
          return next;
        }
        return prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto call — speech-end chaining
  useEffect(() => {
    // Clear any pending timeout on config change
    if (autoCallRef.current) {
      clearTimeout(autoCallRef.current);
      autoCallRef.current = null;
    }

    if (!autoCallEnabled || state.phase !== "active") return;

    // Schedules the next call after `delayMs` ms, then chains via onEnd
    const scheduleCall = (delayMs: number) => {
      autoCallRef.current = setTimeout(() => {
        if (!autoCallEnabledRef.current) return;
        setState((prev) => {
          if (prev.phase !== "active") return prev;

          const onSpeechEnd = () => {
            if (!autoCallEnabledRef.current) return;
            // After speech finishes, wait callSpeed seconds then call next
            scheduleCall(prev.callSpeed * 1000);
          };

          const next = callNumber(prev, onSpeechEnd);
          if (!next) {
            setAutoCallEnabled(false);
            return prev;
          }
          const nw = next.winners.slice(prev.winners.length);
          setNewWinners(nw);
          if (next.phase === "ended") {
            setAutoCallEnabled(false);
          }
          saveState(next);
          return next;
        });
      }, delayMs);
    };

    // First call: immediate (0 delay)
    scheduleCall(0);

    return () => {
      if (autoCallRef.current) {
        clearTimeout(autoCallRef.current);
        autoCallRef.current = null;
      }
    };
  }, [autoCallEnabled, state.phase, callNumber]);

  void ALL_PRIZES;
  void isValidTicket;

  return {
    state,
    newWinners,
    setNewWinners,
    autoCallEnabled,
    setAutoCallEnabled,
    generateTickets: generateTicketsAction,
    addTicketsFromGrids,
    addManualTicket,
    updateTicketGrid,
    deleteTicket,
    publishTickets,
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
    updateGameSettings,
  };
}
