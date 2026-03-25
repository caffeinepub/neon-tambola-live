import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { useEffect, useState } from "react";
import AgentLogin from "./components/AgentLogin";
import AgentPanel from "./components/AgentPanel";
import CallingDisplay from "./components/CallingDisplay";
import Confetti from "./components/Confetti";
import NumberBoard from "./components/NumberBoard";
import { applyTheme } from "./components/ThemeManager";
import TicketsGrid from "./components/TicketsGrid";
import WinnerBoard, { WinnerMarquee } from "./components/WinnerBoard";
import { useGameState } from "./hooks/useGameState";

// ─── Countdown ────────────────────────────────────────────────────
function Countdown({ targetIso }: { targetIso: string }) {
  const [diff, setDiff] = useState(
    Math.max(0, new Date(targetIso).getTime() - Date.now()),
  );
  useEffect(() => {
    const iv = setInterval(
      () => setDiff(Math.max(0, new Date(targetIso).getTime() - Date.now())),
      1000,
    );
    return () => clearInterval(iv);
  }, [targetIso]);

  const s = Math.floor(diff / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const d = Math.floor(s / 86400);
  const pad = (n: number) => String(n).padStart(2, "0");

  if (s <= 0)
    return (
      <div className="text-center">
        <span className="text-2xl font-mono font-black text-success neon-text-green animate-pulse">
          STARTING NOW!
        </span>
      </div>
    );

  return (
    <div className="flex justify-center gap-3 sm:gap-5">
      {d > 0 && <Unit val={pad(d)} label="days" />}
      <Unit val={pad(h % 24)} label="hrs" accent />
      <Sep />
      <Unit val={pad(m)} label="min" accent />
      <Sep />
      <Unit val={pad(sec)} label="sec" />
    </div>
  );
}

function Unit({
  val,
  label,
  accent,
}: { val: string; label: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div
        className={`text-4xl sm:text-5xl font-mono font-black tabular-nums ${
          accent
            ? "text-accent neon-text-cyan"
            : "text-primary neon-text-purple"
        }`}
      >
        {val}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-mono">
        {label}
      </div>
    </div>
  );
}
function Sep() {
  return (
    <div className="text-4xl sm:text-5xl font-mono font-black text-muted-foreground/40 self-start mt-1">
      :
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  React.useEffect(() => {
    const activeId = localStorage.getItem("tambola_active_theme");
    if (activeId) {
      const savedThemes = JSON.parse(
        localStorage.getItem("tambola_themes") || "[]",
      );
      const presets = [
        {
          id: "preset-neon-dark",
          bgType: "gradient",
          bgColor1: "#0a0a1a",
          bgColor2: "#1a0a2e",
          ticketBg: "rgba(30,10,60,0.7)",
          ticketBorder: "rgba(139,92,246,0.4)",
        },
        {
          id: "preset-ocean-blue",
          bgType: "gradient",
          bgColor1: "#020c1b",
          bgColor2: "#0a2744",
          ticketBg: "rgba(5,30,70,0.75)",
          ticketBorder: "rgba(0,200,255,0.4)",
        },
        {
          id: "preset-fire-red",
          bgType: "gradient",
          bgColor1: "#1a0505",
          bgColor2: "#2e0a0a",
          ticketBg: "rgba(60,10,10,0.75)",
          ticketBorder: "rgba(239,68,68,0.5)",
        },
        {
          id: "preset-royal-gold",
          bgType: "gradient",
          bgColor1: "#1a1400",
          bgColor2: "#2e2000",
          ticketBg: "rgba(50,35,0,0.75)",
          ticketBorder: "rgba(234,179,8,0.5)",
        },
        ...savedThemes,
      ];
      const theme = presets.find((t: any) => t.id === activeId);
      if (theme) applyTheme(theme as any);
    }
  }, []);

  const {
    state,
    newWinners,
    setNewWinners,
    autoCallEnabled,
    setAutoCallEnabled,
    generateTickets,
    addTicketsFromGrids,
    addManualTicket,
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
  } = useGameState();

  const [view, setView] = useState<"player" | "agent-login" | "agent">(
    "player",
  );
  const [isAgentLoggedIn, setIsAgentLoggedIn] = useState(false);

  useEffect(() => {
    if (newWinners.length > 0) {
      const t = setTimeout(() => setNewWinners([]), 6000);
      return () => clearTimeout(t);
    }
  }, [newWinners, setNewWinners]);

  const handleAgentLogin = (success: boolean) => {
    if (success) {
      setIsAgentLoggedIn(true);
      setView("agent");
    }
  };
  const handleAgentLogout = () => {
    setIsAgentLoggedIn(false);
    setView("player");
  };

  if (view === "agent-login") {
    return (
      <AgentLogin onLogin={handleAgentLogin} onBack={() => setView("player")} />
    );
  }
  if (view === "agent" && isAgentLoggedIn) {
    return (
      <AgentPanel
        state={state}
        autoCallEnabled={autoCallEnabled}
        setAutoCallEnabled={setAutoCallEnabled}
        onGenerateTickets={generateTickets}
        onAddTicketsFromGrids={addTicketsFromGrids}
        onAddManualTicket={addManualTicket}
        onDeleteTicket={deleteTicket}
        onUpdateTicketName={updateTicketName}
        onUpdateTicketCell={updateTicketCell}
        onPublishTickets={publishTickets}
        onSetBooking={setBooking}
        onStartPreview={startPreview}
        onStartGame={startGame}
        onStopGame={stopGame}
        onCallNext={callNextNumber}
        onManualCall={manualCallNumber}
        onSetCallSpeed={setCallSpeed}
        onSetStartTime={setStartTime}
        onReset={resetGame}
        onLogout={handleAgentLogout}
        onApproveBooking={approveBookingRequest}
        onRejectBooking={rejectBookingRequest}
        onUpdateSettings={updateGameSettings}
        newWinners={newWinners}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 glass-heavy border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎱</span>
            <span className="font-heading font-black text-foreground neon-text-purple">
              {state.gameName || "Neon Tambola"}
            </span>
            {!state.gameName && (
              <span className="hidden sm:block font-heading font-light text-muted-foreground">
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <PhaseTag phase={state.phase} />
            <button
              type="button"
              onClick={() => setView("agent-login")}
              className="text-xs font-mono text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1 transition-all hover:border-primary/40"
              data-ocid="nav.link"
            >
              Agent
            </button>
          </div>
        </div>
      </header>

      {state.winners.length > 0 && (
        <div className="px-4 pt-3 max-w-6xl mx-auto w-full">
          <WinnerMarquee winners={state.winners} />
        </div>
      )}

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {state.phase === "idle" && (
            <IdlePhase key="idle" gameName={state.gameName} />
          )}
          {state.phase === "booking" && (
            <BookingPhase
              key="booking"
              state={state}
              onBookingRequest={addBookingRequest}
            />
          )}
          {state.phase === "preview" && (
            <PreviewPhase key="preview" state={state} />
          )}
          {state.phase === "active" && (
            <ActivePhase key="active" state={state} />
          )}
          {state.phase === "ended" && <EndedPhase key="ended" state={state} />}
        </AnimatePresence>
      </main>

      <footer className="py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

function PhaseTag({ phase }: { phase: string }) {
  const colorMap: Record<string, string> = {
    idle: "text-yellow-400",
    booking: "text-orange-400",
    preview: "text-blue-400",
    active: "text-success",
    ended: "text-destructive",
  };
  const labels: Record<string, string> = {
    idle: "Idle",
    booking: "Booking Open",
    preview: "Preview",
    active: "🔴 LIVE",
    ended: "Game Over",
  };
  return (
    <span className={`text-xs font-mono font-bold ${colorMap[phase] ?? ""}`}>
      {labels[phase] ?? phase}
    </span>
  );
}

function PhaseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      {children}
    </motion.div>
  );
}

function IdlePhase({ gameName }: { gameName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 text-center"
    >
      <div className="animate-float text-7xl sm:text-8xl mb-6">🎱</div>
      <h1 className="text-4xl sm:text-6xl font-heading font-black text-foreground neon-text-purple mb-3">
        {gameName || "Neon Tambola"}
      </h1>
      <p className="text-lg sm:text-xl font-heading text-muted-foreground mb-2">
        Live
      </p>
      <div className="my-8 px-6 py-3 glass rounded-full">
        <p className="text-muted-foreground font-mono text-sm">
          ⏳ Waiting for game to start...
        </p>
      </div>
      <p className="text-xs text-muted-foreground/60">
        The agent will announce the start time shortly.
      </p>
    </motion.div>
  );
}

type GameState = ReturnType<typeof useGameState>["state"];

function BookingPhase({
  state,
  onBookingRequest,
}: { state: GameState; onBookingRequest: (id: number, name: string) => void }) {
  const booked = state.tickets.filter(
    (t) => !t.playerName.startsWith("Player "),
  ).length;
  return (
    <PhaseWrapper>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading font-black text-foreground neon-text-purple mb-2">
          🎟️ Ticket Booking Open
        </h2>
        <p className="text-muted-foreground text-sm mb-1">
          {booked} of {state.tickets.length} tickets booked
        </p>
        {state.ticketLimit > 0 && (
          <p className="text-xs text-muted-foreground/70 mb-4">
            Max {state.ticketLimit} bookings allowed
          </p>
        )}
        {state.startTime && (
          <div className="glass rounded-2xl inline-block px-8 py-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-2">
              Game starts in
            </p>
            <Countdown targetIso={state.startTime} />
          </div>
        )}
      </div>
      <TicketsGrid
        tickets={state.tickets}
        calledNumbers={[]}
        currentNumber={null}
        winners={[]}
        bookingRequests={state.bookingRequests}
        onBookingRequest={onBookingRequest}
        bookingMode
      />
    </PhaseWrapper>
  );
}

function PreviewPhase({ state }: { state: GameState }) {
  return (
    <PhaseWrapper>
      <div className="mb-6 glass rounded-2xl px-5 py-3 border-blue-400/20 flex items-center gap-3 flex-wrap">
        <span className="text-blue-400 text-lg">🔒</span>
        <div>
          <p className="text-blue-400 font-heading font-bold text-sm">
            Booking Closed
          </p>
          <p className="text-xs text-muted-foreground">
            Game starting soon. Find your ticket below.
          </p>
        </div>
        {state.startTime && (
          <div className="ml-auto">
            <Countdown targetIso={state.startTime} />
          </div>
        )}
      </div>
      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
        <div className="space-y-6">
          <CallingDisplay
            currentNumber={state.currentNumber}
            calledNumbers={state.calledNumbers}
            phase={state.phase}
          />
          <WinnerBoard
            winners={state.winners}
            tickets={state.tickets}
            calledNumbers={state.calledNumbers}
          />
        </div>
        <div className="space-y-6">
          <NumberBoard
            calledNumbers={state.calledNumbers}
            currentNumber={state.currentNumber}
          />
          <TicketsGrid
            tickets={state.tickets}
            calledNumbers={state.calledNumbers}
            currentNumber={state.currentNumber}
            winners={state.winners}
            searchOnly
          />
        </div>
      </div>
    </PhaseWrapper>
  );
}

function ActivePhase({ state }: { state: GameState }) {
  return (
    <PhaseWrapper>
      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
        <div className="space-y-6">
          <div className="glass rounded-2xl">
            <CallingDisplay
              currentNumber={state.currentNumber}
              calledNumbers={state.calledNumbers}
              phase={state.phase}
            />
          </div>
          <WinnerBoard
            winners={state.winners}
            tickets={state.tickets}
            calledNumbers={state.calledNumbers}
          />
        </div>
        <div className="space-y-6">
          <NumberBoard
            calledNumbers={state.calledNumbers}
            currentNumber={state.currentNumber}
          />
          <TicketsGrid
            tickets={state.tickets}
            calledNumbers={state.calledNumbers}
            currentNumber={state.currentNumber}
            winners={state.winners}
            searchOnly
          />
        </div>
      </div>
    </PhaseWrapper>
  );
}

function EndedPhase({ state }: { state: GameState }) {
  return (
    <>
      <Confetti />
      <PhaseWrapper>
        <div className="text-center mb-10">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-4xl sm:text-5xl font-heading font-black neon-text-cyan text-accent mb-2">
            Game Over!
          </h2>
          <p className="text-muted-foreground">
            Congratulations to all winners!
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <WinnerBoard
            winners={state.winners}
            tickets={state.tickets}
            calledNumbers={state.calledNumbers}
          />
          <TicketsGrid
            tickets={state.tickets}
            calledNumbers={state.calledNumbers}
            currentNumber={state.currentNumber}
            winners={state.winners}
            searchOnly
          />
        </div>
      </PhaseWrapper>
    </>
  );
}
