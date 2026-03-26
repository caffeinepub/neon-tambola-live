import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { ALL_PRIZES, type GameState } from "../utils/gameStorage";
import { getAllVoices } from "../utils/soundEffects";
import type { Winner } from "../utils/winDetector";
import OcrUploader from "./OcrUploader";
import ThemeManager from "./ThemeManager";

interface Props {
  state: GameState;
  autoCallEnabled: boolean;
  setAutoCallEnabled: (v: boolean) => void;
  onGenerateTickets: (count: number) => void;
  onAddTicketsFromGrids: (grids: (number | null)[][][]) => void;
  onAddManualTicket: () => void;
  onDeleteTicket: (id: number) => void;
  onUpdateTicketName: (id: number, name: string) => void;
  onUpdateTicketCell: (
    ticketId: number,
    row: number,
    col: number,
    value: number | null,
  ) => void;
  onPublishTickets: () => void;
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
  onUpdateSettings: (s: Partial<GameState>) => void;
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
  onAddTicketsFromGrids,
  onAddManualTicket,
  onDeleteTicket,
  onUpdateTicketName,
  onUpdateTicketCell,
  onPublishTickets,
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
  onUpdateSettings,
  newWinners,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "setup" | "tickets" | "game" | "bookings" | "winners" | "themes"
  >("setup");
  const [manualNum, setManualNum] = useState("");
  const [editingTickets, setEditingTickets] = useState<Set<number>>(new Set());
  const [cellEdit, setCellEdit] = useState<CellEditState | null>(null);
  const [nameEdits, setNameEdits] = useState<Record<number, string>>({});
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Local setup form state
  const [localName, setLocalName] = useState(state.gameName);
  const [localLimit, setLocalLimit] = useState(state.ticketLimit);
  const [localPrizes, setLocalPrizes] = useState<string[]>(state.activePrizes);
  const [localVoice] = useState(state.selectedVoice);
  const [localVoiceMode, setLocalVoiceMode] = useState(
    state.voiceMode ?? "auto",
  );
  const [localPreviewDuration, setLocalPreviewDuration] = useState(
    state.previewDuration ?? 5,
  );
  const [ticketCount, setTicketCount] = useState(state.ticketCount || 60);

  void Badge;

  useEffect(() => {
    const load = () => setVoices(getAllVoices());
    load();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  const pendingCount = state.bookingRequests.filter(
    (r) => r.status === "pending",
  ).length;

  const handleSaveSettings = () => {
    onUpdateSettings({
      gameName: localName,
      ticketLimit: localLimit,
      activePrizes: localPrizes,
      selectedVoice: localVoice,
      voiceMode: localVoiceMode,
      previewDuration: localPreviewDuration,
    });
  };

  const togglePrize = (prize: string) => {
    setLocalPrizes((prev) =>
      prev.includes(prize) ? prev.filter((p) => p !== prize) : [...prev, prize],
    );
  };

  const toggleTicketEdit = (ticketId: number) => {
    setEditingTickets((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
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

  const localDateValue = state.startTime
    ? new Date(state.startTime).toISOString().slice(0, 16)
    : "";

  const tabs = [
    { id: "setup", label: "Setup" },
    { id: "tickets", label: "Tickets" },
    { id: "game", label: "Game" },
    { id: "bookings", label: "Bookings", badge: pendingCount },
    { id: "winners", label: "Winners" },
    { id: "themes", label: "Themes" },
  ] as const;

  return (
    <div className="min-h-screen text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-black text-foreground neon-text-purple">
              Agent Control Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              {state.gameName || "Neon Tambola Live"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-mono font-bold px-3 py-1 rounded-full border uppercase ${PHASE_COLORS[state.phase] ?? ""}`}
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

        {/* New winner alert */}
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

        {/* Tabs */}
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

        {/* ── Setup Tab ── */}
        {activeTab === "setup" && (
          <div className="space-y-4">
            {/* Game name & schedule */}
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest">
                Game Settings
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Game Name
                  </Label>
                  <input
                    type="text"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    placeholder="Neon Tambola Live"
                    className="w-full glass rounded-lg px-3 py-2 text-foreground text-sm outline-none focus:border-primary/60"
                    data-ocid="setup.input"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Ticket Limit (max bookings)
                  </Label>
                  <input
                    type="number"
                    value={localLimit}
                    onChange={(e) => setLocalLimit(Number(e.target.value))}
                    min={1}
                    max={600}
                    className="w-full glass rounded-lg px-3 py-2 text-foreground text-sm outline-none focus:border-primary/60"
                    data-ocid="setup.ticket_limit_input"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Preview Duration (minutes)
                  </Label>
                  <input
                    type="number"
                    value={localPreviewDuration}
                    onChange={(e) =>
                      setLocalPreviewDuration(
                        Math.max(1, Math.min(30, Number(e.target.value))),
                      )
                    }
                    min={1}
                    max={30}
                    className="w-full glass rounded-lg px-3 py-2 text-foreground text-sm outline-none focus:border-primary/60"
                    data-ocid="setup.preview_duration_input"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Start Time
                </Label>
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
                    data-ocid="setup.start_time_input"
                  />
                  {state.startTime && (
                    <button
                      type="button"
                      onClick={() => onSetStartTime(null)}
                      className="text-xs text-destructive border border-destructive/30 px-2 py-1 rounded-full hover:bg-destructive/10"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Preview starts {localPreviewDuration} min before. Game starts
                  automatically.
                </p>
              </div>
            </div>

            {/* Active prizes */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest mb-4">
                Active Prizes
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALL_PRIZES.map((prize) => (
                  <div key={prize} className="flex items-center gap-2">
                    <Checkbox
                      id={`prize-${prize}`}
                      checked={localPrizes.includes(prize)}
                      onCheckedChange={() => togglePrize(prize)}
                      data-ocid={`setup.${prize.toLowerCase().replace(/ /g, "_")}.checkbox`}
                    />
                    <Label
                      htmlFor={`prize-${prize}`}
                      className="text-sm text-foreground cursor-pointer"
                    >
                      {prize}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Only selected prizes will be tracked and announced during the
                game.
              </p>
            </div>

            {/* Voice selection */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest mb-4">
                Number Calling Voice
              </h3>
              <p className="text-xs text-muted-foreground mb-3 font-mono">
                Select voice gender. Each number is called once: "Single number
                X"
              </p>
              <div
                className="grid grid-cols-2 gap-2 mb-5"
                data-ocid="setup.voice_mode.panel"
              >
                {(
                  [
                    { key: "male", label: "♂ Male", desc: "Male voice" },
                    { key: "female", label: "♀ Female", desc: "Female voice" },
                  ] as { key: string; label: string; desc: string }[]
                ).map(({ key, label, desc }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLocalVoiceMode(key)}
                    data-ocid="setup.voice_mode.toggle"
                    className={`rounded-xl px-3 py-2.5 border-2 text-xs font-mono font-bold text-left transition-all ${
                      localVoiceMode === key
                        ? "bg-primary/20 border-primary text-primary shadow-[0_0_8px] shadow-primary/30"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <div>{label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
              {/* Test voice */}
              <button
                type="button"
                className="text-xs font-mono text-primary underline underline-offset-2 hover:text-primary/80"
                onClick={() => {
                  window.speechSynthesis.cancel();
                  const utt = new SpeechSynthesisUtterance(
                    "Single number, seven",
                  );
                  const all = window.speechSynthesis.getVoices();
                  const FEMALE_RE =
                    /female|zira|samantha|victoria|karen|moira|fiona|google uk english female/i;
                  const voice =
                    localVoiceMode === "female"
                      ? (all.find((v) => FEMALE_RE.test(v.name)) ??
                        all.find((v) => /en/i.test(v.lang)) ??
                        null)
                      : (all.find((v) =>
                          /male|david|mark|james|google uk english male/i.test(
                            v.name,
                          ),
                        ) ??
                        all.find((v) => /en/i.test(v.lang)) ??
                        null);
                  if (voice) utt.voice = voice;
                  utt.pitch = 1.0;
                  utt.rate = 0.9;
                  window.speechSynthesis.speak(utt);
                }}
              >
                Test Voice
              </button>
              {voices.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  No voices loaded yet. Voices appear after first page
                  interaction in most browsers.
                </p>
              )}
            </div>

            <Button
              onClick={handleSaveSettings}
              className="w-full bg-gradient-to-r from-primary/80 to-accent/80 hover:from-primary hover:to-accent text-white font-heading font-bold"
              data-ocid="setup.save_button"
            >
              Save Settings
            </Button>

            {/* New game reset */}
            <div className="glass rounded-2xl p-4 border-destructive/20">
              <h3 className="text-xs font-mono font-bold text-destructive uppercase tracking-widest mb-3">
                Danger Zone
              </h3>
              <Button
                size="sm"
                onClick={onReset}
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                data-ocid="setup.delete_button"
              >
                Reset & Start New Game
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Clears all tickets, bookings, and called numbers.
              </p>
            </div>
          </div>
        )}

        {/* ── Tickets Tab ── */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            {/* Upload */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest mb-4">
                Upload Ticket Photo / PDF
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Upload a photo of printed Tambola tickets. Numbers will be
                extracted automatically via OCR.
              </p>
              <OcrUploader onTicketsExtracted={onAddTicketsFromGrids} />
            </div>

            {/* Manual generation */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest mb-4">
                Generate / Add Manually
              </h3>
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <input
                  type="number"
                  value={ticketCount}
                  onChange={(e) => setTicketCount(Number(e.target.value))}
                  min={6}
                  max={600}
                  step={6}
                  className="w-28 glass rounded-lg px-3 py-2 text-foreground text-sm outline-none focus:border-primary/60"
                  data-ocid="tickets.count_input"
                />
                <span className="text-xs text-muted-foreground">
                  tickets (multiples of 6)
                </span>
                <Button
                  onClick={() =>
                    onGenerateTickets(
                      Math.max(6, Math.floor(ticketCount / 6) * 6),
                    )
                  }
                  size="sm"
                  className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                  data-ocid="tickets.generate_button"
                >
                  Auto-Generate
                </Button>
                <Button
                  onClick={onAddManualTicket}
                  size="sm"
                  variant="outline"
                  className="border-accent/30 text-accent hover:bg-accent/10"
                  data-ocid="tickets.add_manual_button"
                >
                  + Add Blank Ticket
                </Button>
              </div>
              {state.tickets.length > 0 && (
                <p className="text-xs text-success font-mono">
                  ✓ {state.tickets.length} tickets ready
                </p>
              )}
            </div>

            {/* Publish */}
            {state.tickets.length > 0 && !state.isPublished && (
              <div className="glass rounded-2xl p-5 border-accent/20">
                <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-widest mb-3">
                  Publish Tickets
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Once published, players can see and book tickets. Currently{" "}
                  <span className="text-foreground font-bold">
                    {state.tickets.length}
                  </span>{" "}
                  tickets ready.
                </p>
                <Button
                  onClick={onPublishTickets}
                  className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 font-heading font-bold"
                  data-ocid="tickets.publish_button"
                >
                  🚀 Publish Tickets & Open Booking
                </Button>
              </div>
            )}
            {state.isPublished && (
              <div className="glass rounded-xl p-3 border-success/20">
                <p className="text-xs text-success font-mono">
                  ✓ Tickets published — booking is open
                </p>
              </div>
            )}

            {/* Ticket list */}
            {state.tickets.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest">
                    All Tickets ({state.tickets.length})
                  </h3>
                </div>
                <ScrollArea className="h-[50vh] pr-2">
                  <div className="space-y-3">
                    {state.tickets.map((t) => {
                      const isEditing = editingTickets.has(t.id);
                      return (
                        <div key={t.id} className="glass rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-mono font-black text-primary">
                              #{t.id}
                            </span>
                            <input
                              type="text"
                              defaultValue={t.playerName}
                              onChange={(e) =>
                                setNameEdits((prev) => ({
                                  ...prev,
                                  [t.id]: e.target.value,
                                }))
                              }
                              onBlur={() => {
                                if (nameEdits[t.id])
                                  onUpdateTicketName(t.id, nameEdits[t.id]);
                              }}
                              className="flex-1 glass rounded px-2 py-1 text-xs text-foreground outline-none focus:border-primary/60 min-w-0"
                            />
                            <button
                              type="button"
                              onClick={() => toggleTicketEdit(t.id)}
                              className={`text-[10px] px-2 py-0.5 rounded-full border transition-all font-mono ${
                                isEditing
                                  ? "bg-accent/20 border-accent/40 text-accent"
                                  : "border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {isEditing ? "✓" : "Edit"}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTicket(t.id)}
                              className="text-[10px] px-2 py-0.5 rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 font-mono"
                              data-ocid="tickets.delete_button"
                            >
                              ✕
                            </button>
                          </div>
                          {isEditing && (
                            <div className="grid grid-cols-9 gap-1 mb-1">
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
                                      <div
                                        key={COL_KEYS[ci]}
                                        className="relative"
                                      >
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
                                                  setCellEdit(null);
                                              }}
                                              onBlur={commitCellEdit}
                                              className="w-full h-7 glass rounded text-[10px] text-center text-foreground outline-none border border-accent/40 font-mono"
                                            />
                                            {cellEdit.error && (
                                              <span className="text-[8px] text-destructive">
                                                {cellEdit.error}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="relative group">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                startCellEdit(
                                                  t.id,
                                                  ri,
                                                  ci,
                                                  cell,
                                                )
                                              }
                                              className={`w-full h-7 rounded text-[10px] font-mono font-semibold flex items-center justify-center transition-all ${
                                                cell === null
                                                  ? "bg-black/30 border border-dashed border-border/30 hover:border-accent/30 text-muted-foreground/30"
                                                  : "bg-white/8 text-foreground hover:bg-accent/20 hover:text-accent border border-transparent hover:border-accent/30"
                                              }`}
                                            >
                                              {cell ?? ""}
                                            </button>
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
                                                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive/80 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                              >
                                                ×
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return (
                                    <div
                                      key={COL_KEYS[ci]}
                                      className={`h-6 rounded flex items-center justify-center text-[10px] font-mono font-semibold ${
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
          </div>
        )}

        {/* ── Game Tab ── */}
        {activeTab === "game" && (
          <div className="space-y-4">
            {/* Phase controls */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest mb-4">
                Phase Controls
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={onSetBooking}
                  disabled={state.tickets.length === 0}
                  variant="outline"
                  className="border-border text-foreground"
                  data-ocid="game.open_booking_button"
                >
                  Open Booking
                </Button>
                <Button
                  size="sm"
                  onClick={onStartPreview}
                  disabled={state.phase === "idle"}
                  variant="outline"
                  className="border-blue-400/30 text-blue-400"
                  data-ocid="game.preview_button"
                >
                  Start Preview
                </Button>
                <Button
                  size="sm"
                  onClick={onStartGame}
                  disabled={state.phase === "active" || state.phase === "ended"}
                  className="bg-success/20 text-success border border-success/30"
                  data-ocid="game.start_button"
                >
                  Start Game
                </Button>
                <Button
                  size="sm"
                  onClick={onStopGame}
                  disabled={state.phase !== "active"}
                  variant="destructive"
                  className="bg-destructive/20 text-destructive border-destructive/30"
                  data-ocid="game.stop_button"
                >
                  Stop Game
                </Button>
              </div>
            </div>

            {/* Number calling */}
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
                  data-ocid="game.call_next_button"
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
                  data-ocid="game.auto_call_toggle"
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
                />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="number"
                  placeholder="#"
                  value={manualNum}
                  onChange={(e) => setManualNum(e.target.value)}
                  min={1}
                  max={90}
                  className="w-20 glass rounded-lg px-3 py-2 text-foreground text-sm outline-none focus:border-primary/60"
                  data-ocid="game.manual_number_input"
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
                  data-ocid="game.manual_call_button"
                >
                  Call Manual
                </Button>
              </div>

              {/* 90-number grid */}
              <div className="mt-2">
                <p className="text-xs text-muted-foreground font-mono mb-2">
                  {state.calledNumbers.length}/90 called
                </p>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => {
                    const called = state.calledNumbers.includes(n);
                    const isCurrent = state.currentNumber === n;
                    return (
                      <div
                        key={n}
                        className={`aspect-square rounded flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                          isCurrent
                            ? "bg-accent text-accent-foreground shadow-neon-cyan scale-110"
                            : called
                              ? "bg-primary/30 text-primary"
                              : "bg-white/5 text-muted-foreground/40"
                        }`}
                      >
                        {n}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Bookings Tab ── */}
        {activeTab === "bookings" && (
          <div className="glass rounded-2xl p-5">
            <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest mb-5">
              Booking Requests
            </h3>
            {state.bookingRequests.length === 0 ? (
              <div
                className="text-center py-10 text-muted-foreground"
                data-ocid="bookings.empty_state"
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
                    data-ocid={`bookings.item.${idx + 1}`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-heading font-semibold text-foreground">
                          {req.playerName}
                        </span>
                        {/* Package type badge */}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            (req as any).packageType === "full"
                              ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/10"
                              : (req as any).packageType === "half"
                                ? "text-cyan-400 border-cyan-400/40 bg-cyan-400/10"
                                : "text-purple-400 border-purple-400/40 bg-purple-400/10"
                          }`}
                        >
                          {(req as any).packageType === "full"
                            ? "Full Sheet (6 tickets)"
                            : (req as any).packageType === "half"
                              ? "Half Sheet (3 tickets)"
                              : "Single Ticket"}
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
                      <div className="text-xs text-muted-foreground font-mono">
                        {(req as any).packageType !== "single" &&
                        (req as any).ticketIds?.length > 0 ? (
                          <span>
                            Tickets:{" "}
                            {((req as any).ticketIds as number[])
                              .map((id: number) => `#${id}`)
                              .join(", ")}{" "}
                            ·{" "}
                          </span>
                        ) : (
                          <span>Ticket #{req.ticketId} · </span>
                        )}
                        {new Date(req.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => onApproveBooking(req.id)}
                          className="bg-success/20 text-success border border-success/30 hover:bg-success/30 text-xs"
                          data-ocid="bookings.confirm_button"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRejectBooking(req.id)}
                          className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"
                          data-ocid="bookings.delete_button"
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

        {/* ── Winners Tab ── */}
        {activeTab === "winners" && (
          <div className="glass rounded-2xl p-5">
            <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest mb-5">
              Winner Board
            </h3>
            {state.winners.length === 0 ? (
              <div
                className="text-center py-10 text-muted-foreground"
                data-ocid="winners.empty_state"
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
                        data-ocid={`winners.row.${idx + 1}`}
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
