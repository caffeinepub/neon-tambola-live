import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import type { GameState } from "../utils/gameStorage";
import type { Winner } from "../utils/winDetector";
import ThemeManager from "./ThemeManager";

interface Props {
  state: GameState;
  autoCallEnabled: boolean;
  setAutoCallEnabled: (v: boolean) => void;
  onGenerateTickets: (count: number) => void;
  onUpdateTicketName: (id: number, name: string) => void;
  onUpdateTicketCell: (
    ticketId: number,
    row: number,
    col: number,
    value: number | null,
  ) => void;
  onSetBooking: () => void;
  onStartPreview: () => void;
  onStartGame: () => void;
  onStopGame: () => void;
  onCallNext: () => void;
  onManualCall: (n: number) => void;
  onSetCallSpeed: (s: number) => void;
  onSetStartTime: (iso: string | null) => void;
  onReset: () => void;
  onLogout: () => void;
  onApproveBooking: (id: string) => void;
  onRejectBooking: (id: string) => void;
  newWinners: Winner[];
}

const COL_RANGES = [
  "1-9",
  "10-19",
  "20-29",
  "30-39",
  "40-49",
  "50-59",
  "60-69",
  "70-79",
  "80-90",
];
const COL_MINS = [1, 10, 20, 30, 40, 50, 60, 70, 80];
const COL_MAXS = [9, 19, 29, 39, 49, 59, 69, 79, 90];
const ROW_KEYS = ["top", "mid", "bot"] as const;
const COL_KEYS = [
  "c0",
  "c1",
  "c2",
  "c3",
  "c4",
  "c5",
  "c6",
  "c7",
  "c8",
] as const;

const PHASE_COLORS: Record<string, string> = {
  idle: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  booking: "bg-orange-500/20 text-orange-400 border-orange-400/30",
  preview: "bg-blue-500/20 text-blue-400 border-blue-400/30",
  active: "bg-green-500/20 text-green-400 border-green-400/30",
  ended: "bg-red-500/20 text-red-400 border-red-400/30",
};

interface CellEditState {
  ticketId: number;
  row: number;
  col: number;
  value: string;
  error: string | null;
}

export default function AgentPanel({
  state,
  autoCallEnabled,
  setAutoCallEnabled,
  onGenerateTickets,
  onUpdateTicketName,
  onUpdateTicketCell,
  onSetBooking,
  onStartPreview,
  onStartGame,
  onStopGame,
  onCallNext,
  onManualCall,
  onSetCallSpeed,
  onSetStartTime,
  onReset,
  onLogout,
  onApproveBooking,
  onRejectBooking,
  newWinners,
}: Props) {
  const [ticketCount, setTicketCount] = useState(state.ticketCount);
  const [manualNum, setManualNum] = useState("");
  const [editNames, setEditNames] = useState(false);
  const [nameEdits, setNameEdits] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<
    "control" | "tickets" | "bookings" | "winners" | "themes"
  >("control");
  // Per-ticket edit mode set
  const [editingTickets, setEditingTickets] = useState<Set<number>>(new Set());
  // Active cell edit state
  const [cellEdit, setCellEdit] = useState<CellEditState | null>(null);

  // suppress unused warning — Badge imported for potential future use
  void Badge;

  const pendingCount = state.bookingRequests.filter(
    (r) => r.status === "pending",
  ).length;

  const handleGenerate = () => {
    const count = Math.max(6, Math.floor(ticketCount / 6) * 6);
    onGenerateTickets(count);
  };

  const handleSaveNames = () => {
    for (const [id, name] of Object.entries(nameEdits)) {
      onUpdateTicketName(Number(id), name);
    }
    setNameEdits({});
    setEditNames(false);
  };

  const toggleTicketEdit = (ticketId: number) => {
    setEditingTickets((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
        // clear any active cell edit for this ticket
        setCellEdit((c) => (c?.ticketId === ticketId ? null : c));
      } else {
        next.add(ticketId);
      }
      return next;
    });
  };

  const startCellEdit = (
    ticketId: number,
    row: number,
    col: number,
    currentVal: number | null,
  ) => {
    setCellEdit({
      ticketId,
      row,
      col,
      value: currentVal !== null ? String(currentVal) : "",
      error: null,
    });
  };

  const commitCellEdit = () => {
    if (!cellEdit) return;
    const { ticketId, row, col, value } = cellEdit;
    if (value === "") {
      onUpdateTicketCell(ticketId, row, col, null);
      setCellEdit(null);
      return;
    }
    const num = Number.parseInt(value, 10);
    if (Number.isNaN(num) || num < COL_MINS[col] || num > COL_MAXS[col]) {
      setCellEdit((prev) =>
        prev ? { ...prev, error: `Must be ${COL_RANGES[col]}` } : null,
      );
      return;
    }
    onUpdateTicketCell(ticketId, row, col, num);
    setCellEdit(null);
  };

  const cancelCellEdit = () => setCellEdit(null);

  const localDateValue = state.startTime
    ? new Date(state.startTime).toISOString().slice(0, 16)
    : "";

  const tabs = [
    { id: "control", label: "Control" },
    { id: "tickets", label: "Tickets" },
    { id: "bookings", label: "Bookings", badge: pendingCount },
    { id: "winners", label: "Winners" },
    { id: "themes", label: "Themes" },
  ] as const;

  return (
    <div className="min-h-screen text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-black text-foreground neon-text-purple">
              Agent Control Panel
            </h1>
            <p className="text-sm text-muted-foreground">Neon Tambola Live</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-mono font-bold px-3 py-1 rounded-full border uppercase ${
                PHASE_COLORS[state.phase] ?? ""
              }`}
            >
              {state.phase}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs"
              data-ocid="agent.secondary_button"
            >
              Logout
            </Button>
          </div>
        </div>

        {newWinners.length > 0 && (
          <div className="mb-4 glass rounded-xl border-accent/40 p-3 animate-slide-up">
            <p className="text-accent font-bold text-sm mb-1">🏆 New Winner!</p>
            {newWinners.map((w) => (
              <p
                key={`${w.ticketId}-${w.winType}`}
                className="text-foreground text-sm"
              >
                {w.playerName} — {w.winType} (Ticket #{w.ticketId})
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 rounded-full text-sm font-heading font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-primary/20 text-primary border border-primary/50 shadow-neon-purple"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
              data-ocid={`agent.${tab.id}.tab`}
            >
              {tab.label}
              {"badge" in tab && tab.badge ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {activeTab === "control" && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest mb-4">
                Ticket Configuration
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="number"
                  value={ticketCount}
                  onChange={(e) => setTicketCount(Number(e.target.value))}
                  min={6}
                  max={600}
                  step={6}
                  className="w-28 glass rounded-lg px-3 py-2 text-foreground text-sm outline-none focus:border-primary/60"
                />
                <span className="text-xs text-muted-foreground">
                  tickets (multiples of 6)
                </span>
                <Button
                  onClick={handleGenerate}
                  size="sm"
                  className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                  data-ocid="agent.primary_button"
                >
                  Generate Tickets
                </Button>
              </div>
              {state.tickets.length > 0 && (
                <p className="text-xs text-success mt-2 font-mono">
                  ✓ {state.tickets.length} tickets generated
                </p>
              )}
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest mb-4">
                Schedule Start Time
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="datetime-local"
                  value={localDateValue}
                  onChange={(e) =>
                    onSetStartTime(
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    )
                  }
                  className="glass rounded-lg px-3 py-2 text-foreground text-sm outline-none focus:border-primary/60"
                  data-ocid="agent.input"
                />
                {state.startTime && (
                  <>
                    <span className="text-xs text-success font-mono">
                      {new Date(state.startTime).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSetStartTime(null)}
                      className="text-xs text-destructive border border-destructive/30 px-2 py-1 rounded-full hover:bg-destructive/10"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Preview starts 5 min before. Game starts automatically.
              </p>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest mb-4">
                Game Phase Controls
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={onSetBooking}
                  disabled={state.tickets.length === 0}
                  variant="outline"
                  className="border-border text-foreground"
                  data-ocid="agent.primary_button"
                >
                  Open Booking
                </Button>
                <Button
                  size="sm"
                  onClick={onStartPreview}
                  disabled={state.phase === "idle"}
                  variant="outline"
                  className="border-blue-400/30 text-blue-400"
                  data-ocid="agent.primary_button"
                >
                  Start Preview
                </Button>
                <Button
                  size="sm"
                  onClick={onStartGame}
                  disabled={state.phase === "active" || state.phase === "ended"}
                  className="bg-success/20 text-success border border-success/30"
                  data-ocid="agent.primary_button"
                >
                  Start Game
                </Button>
                <Button
                  size="sm"
                  onClick={onStopGame}
                  disabled={state.phase !== "active"}
                  variant="destructive"
                  className="bg-destructive/20 text-destructive border-destructive/30"
                  data-ocid="agent.stop_game_button"
                >
                  Stop Game
                </Button>
                <Button
                  size="sm"
                  onClick={onReset}
                  variant="outline"
                  className="border-destructive/30 text-destructive"
                  data-ocid="agent.delete_button"
                >
                  New Game
                </Button>
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest mb-4">
                Number Calling
              </h3>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Button
                  size="sm"
                  onClick={onCallNext}
                  disabled={state.phase !== "active"}
                  className="bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30"
                  data-ocid="agent.call_next_button"
                >
                  Call Next
                </Button>
                <button
                  type="button"
                  onClick={() => setAutoCallEnabled(!autoCallEnabled)}
                  disabled={state.phase !== "active"}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all disabled:opacity-40 ${
                    autoCallEnabled
                      ? "bg-success/20 border-success/40 text-success"
                      : "glass border-border text-muted-foreground"
                  }`}
                  data-ocid="agent.auto_call_toggle"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${autoCallEnabled ? "bg-success animate-pulse" : "bg-muted-foreground"}`}
                  />
                  Auto: {autoCallEnabled ? "ON" : "OFF"}
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-muted-foreground font-mono w-20">
                  Speed: {state.callSpeed}s
                </span>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={state.callSpeed}
                  onChange={(e) => onSetCallSpeed(Number(e.target.value))}
                  className="flex-1 accent-primary"
                  data-ocid="agent.toggle"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="#"
                  value={manualNum}
                  onChange={(e) => setManualNum(e.target.value)}
                  min={1}
                  max={90}
                  className="w-20 glass rounded-lg px-3 py-2 text-foreground text-sm outline-none focus:border-primary/60"
                  data-ocid="agent.manual_number_input"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    onManualCall(Number(manualNum));
                    setManualNum("");
                  }}
                  disabled={!manualNum || state.phase !== "active"}
                  variant="outline"
                  className="border-border"
                  data-ocid="agent.manual_call_button"
                >
                  Call Manual
                </Button>
              </div>
              {state.calledNumbers.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground font-mono mb-1.5">
                    {state.calledNumbers.length}/90 called
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[...state.calledNumbers]
                      .reverse()
                      .slice(0, 25)
                      .map((n) => (
                        <span
                          key={n}
                          className="text-xs font-mono bg-primary/15 text-primary/80 px-2 py-0.5 rounded-full border border-primary/20"
                        >
                          {n}
                        </span>
                      ))}
                    {state.calledNumbers.length > 25 && (
                      <span className="text-xs text-muted-foreground">
                        +{state.calledNumbers.length - 25} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "tickets" && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest">
                Ticket Management
              </h3>
              <div className="flex gap-2">
                {!editNames && (
                  <button
                    type="button"
                    onClick={() => setEditNames(true)}
                    className="text-xs px-3 py-1.5 rounded-full border glass border-border text-muted-foreground hover:text-foreground font-mono"
                    data-ocid="agent.edit_names_button"
                  >
                    Edit Names
                  </button>
                )}
                {editNames && (
                  <Button
                    size="sm"
                    onClick={handleSaveNames}
                    className="bg-success/20 text-success border border-success/30 text-xs"
                    data-ocid="agent.save_names_button"
                  >
                    Save All
                  </Button>
                )}
              </div>
            </div>

            <ScrollArea className="h-[70vh] pr-2">
              <div className="space-y-3">
                {state.tickets.map((t) => {
                  const isEditing = editingTickets.has(t.id);
                  return (
                    <div key={t.id} className="glass rounded-xl p-3">
                      {/* Ticket header */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono font-black text-primary">
                          #{t.id}
                        </span>
                        {editNames ? (
                          <input
                            type="text"
                            defaultValue={t.playerName}
                            onChange={(e) =>
                              setNameEdits((prev) => ({
                                ...prev,
                                [t.id]: e.target.value,
                              }))
                            }
                            className="flex-1 glass rounded px-2 py-1 text-xs text-foreground outline-none focus:border-primary/60 min-w-0"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground flex-1 truncate">
                            {t.playerName}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Set {t.setIndex + 1}
                        </span>
                        {/* Edit Numbers toggle — always available to admin */}
                        <button
                          type="button"
                          onClick={() => toggleTicketEdit(t.id)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all font-mono ${
                            isEditing
                              ? "bg-accent/20 border-accent/40 text-accent"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                          data-ocid="agent.edit_numbers_toggle"
                        >
                          {isEditing ? "✓ Editing" : "Edit #s"}
                        </button>
                      </div>

                      {/* Column range labels when editing */}
                      {isEditing && (
                        <div className="grid grid-cols-9 gap-1 mb-1 mt-1">
                          {COL_RANGES.map((r) => (
                            <div
                              key={r}
                              className="text-center text-[8px] font-mono text-accent/60"
                            >
                              {r}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ticket grid */}
                      <div className="space-y-1">
                        {t.grid.map((row, ri) => (
                          <div
                            key={ROW_KEYS[ri]}
                            className="grid grid-cols-9 gap-1"
                          >
                            {row.map((cell, ci) => {
                              const isActiveEdit =
                                cellEdit?.ticketId === t.id &&
                                cellEdit?.row === ri &&
                                cellEdit?.col === ci;

                              if (isEditing) {
                                return (
                                  <div key={COL_KEYS[ci]} className="relative">
                                    {isActiveEdit ? (
                                      <div className="flex flex-col gap-0.5">
                                        <input
                                          // biome-ignore lint/a11y/noAutofocus: intentional for inline editing
                                          autoFocus
                                          type="number"
                                          value={cellEdit.value}
                                          min={COL_MINS[ci]}
                                          max={COL_MAXS[ci]}
                                          onChange={(e) =>
                                            setCellEdit((prev) =>
                                              prev
                                                ? {
                                                    ...prev,
                                                    value: e.target.value,
                                                    error: null,
                                                  }
                                                : null,
                                            )
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter")
                                              commitCellEdit();
                                            if (e.key === "Escape")
                                              cancelCellEdit();
                                          }}
                                          onBlur={commitCellEdit}
                                          className="w-full h-7 glass rounded text-[10px] text-center text-foreground outline-none focus:border-accent/60 font-mono border border-accent/40"
                                        />
                                        {cellEdit.error && (
                                          <span className="text-[8px] text-destructive leading-none text-center">
                                            {cellEdit.error}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="relative group">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            startCellEdit(t.id, ri, ci, cell)
                                          }
                                          className={`w-full h-7 rounded text-[10px] font-mono font-semibold flex items-center justify-center transition-all
                                            ${
                                              cell === null
                                                ? "bg-black/30 text-muted-foreground/30 border border-dashed border-border/30 hover:border-accent/30"
                                                : "bg-white/8 text-foreground hover:bg-accent/20 hover:text-accent border border-transparent hover:border-accent/30"
                                            }`}
                                        >
                                          {cell ?? ""}
                                        </button>
                                        {/* Delete/clear button */}
                                        {cell !== null && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onUpdateTicketCell(
                                                t.id,
                                                ri,
                                                ci,
                                                null,
                                              );
                                            }}
                                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive/80 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive z-10"
                                            title="Clear cell"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              // Non-edit mode: plain cell
                              return (
                                <div
                                  key={COL_KEYS[ci]}
                                  className={`h-6 rounded flex items-center justify-center text-[10px] font-mono font-semibold
                                    ${
                                      cell === null
                                        ? "bg-black/20"
                                        : "bg-white/5 text-muted-foreground"
                                    }`}
                                >
                                  {cell ?? ""}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="glass rounded-2xl p-5">
            <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest mb-5">
              Booking Requests
            </h3>
            {state.bookingRequests.length === 0 ? (
              <div
                className="text-center py-10 text-muted-foreground"
                data-ocid="agent.empty_state"
              >
                No booking requests yet
              </div>
            ) : (
              <div className="space-y-3">
                {[...state.bookingRequests].reverse().map((req, idx) => (
                  <div
                    key={req.id}
                    className={`glass rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap ${
                      req.status === "approved"
                        ? "border-success/30"
                        : req.status === "rejected"
                          ? "border-destructive/30"
                          : ""
                    }`}
                    data-ocid={`agent.item.${idx + 1}`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-heading font-semibold text-foreground">
                          {req.playerName}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          → Ticket #{req.ticketId}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            req.status === "approved"
                              ? "text-success border-success/40 bg-success/10"
                              : req.status === "rejected"
                                ? "text-destructive border-destructive/40 bg-destructive/10"
                                : "text-yellow-400 border-yellow-400/40 bg-yellow-400/10"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {new Date(req.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => onApproveBooking(req.id)}
                          className="bg-success/20 text-success border border-success/30 hover:bg-success/30 text-xs"
                          data-ocid="agent.confirm_button"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRejectBooking(req.id)}
                          className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"
                          data-ocid="agent.delete_button"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "winners" && (
          <div className="glass rounded-2xl p-5">
            <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest mb-5">
              Winner Board
            </h3>
            {state.winners.length === 0 ? (
              <div
                className="text-center py-10 text-muted-foreground"
                data-ocid="agent.empty_state"
              >
                No winners yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-mono text-muted-foreground uppercase tracking-widest border-b border-border">
                      <th className="pb-3">Prize</th>
                      <th className="pb-3">Player</th>
                      <th className="pb-3">Ticket</th>
                      <th className="pb-3">At #</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {state.winners.map((w, idx) => (
                      <tr
                        key={`${w.ticketId}-${w.winType}`}
                        data-ocid={`agent.row.${idx + 1}`}
                      >
                        <td className="py-2.5 text-accent font-mono font-bold">
                          {w.winType}
                        </td>
                        <td className="py-2.5 text-foreground">
                          {w.playerName}
                        </td>
                        <td className="py-2.5 text-muted-foreground font-mono">
                          #{w.ticketId}
                        </td>
                        <td className="py-2.5 text-muted-foreground font-mono">
                          {w.calledCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "themes" && <ThemeManager />}
      </div>
    </div>
  );
}
