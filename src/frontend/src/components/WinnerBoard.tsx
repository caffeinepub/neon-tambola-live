import { useState } from "react";
import type { Ticket } from "../utils/ticketGenerator";
import type { Winner } from "../utils/winDetector";

interface Props {
  winners: Winner[];
  tickets: Ticket[];
  calledNumbers: number[];
  compact?: boolean;
}

const WIN_COLORS: Record<string, string> = {
  "Early 5": "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  "Top Line": "text-cyan-400 border-cyan-400/40 bg-cyan-400/10",
  "Middle Line": "text-blue-400 border-blue-400/40 bg-blue-400/10",
  "Bottom Line": "text-indigo-400 border-indigo-400/40 bg-indigo-400/10",
  "Full House": "text-pink-400 border-pink-400/40 bg-pink-400/10",
  "Half Sheet Bonus": "text-orange-400 border-orange-400/40 bg-orange-400/10",
  "Full Sheet Bonus": "text-green-400 border-green-400/40 bg-green-400/10",
};

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

function MiniTicket({
  ticket,
  calledNumbers,
  winType,
}: { ticket: Ticket; calledNumbers: number[]; winType: string }) {
  const calledSet = new Set(calledNumbers);
  const isWinRow = (ri: number) =>
    (winType === "Top Line" && ri === 0) ||
    (winType === "Middle Line" && ri === 1) ||
    (winType === "Bottom Line" && ri === 2);

  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-2 py-1 bg-white/5">
        <span className="text-xs font-mono text-muted-foreground">
          Ticket #{ticket.id}
        </span>
        <span className="text-xs text-foreground/80">{ticket.playerName}</span>
      </div>
      <div className="p-2 space-y-1">
        {ticket.grid.map((row, ri) => (
          <div key={ROW_KEYS[ri]} className="grid grid-cols-9 gap-0.5">
            {row.map((cell, ci) => {
              const isCalled = cell !== null && calledSet.has(cell);
              const isWin = isCalled && isWinRow(ri);
              return (
                <div
                  key={COL_KEYS[ci]}
                  className={`flex items-center justify-center rounded text-[9px] font-mono font-bold h-5 ${
                    cell === null
                      ? "bg-black/20"
                      : isWin
                        ? "bg-accent text-accent-foreground shadow-neon-cyan"
                        : isCalled
                          ? "bg-primary/70 text-white"
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
}

export function WinnerMarquee({ winners }: { winners: Winner[] }) {
  if (winners.length === 0) return null;
  const text = winners
    .map((w) => `🏆 ${w.playerName} — ${w.winType} (Ticket #${w.ticketId})`)
    .join("   •   ");
  return (
    <div className="w-full glass border-accent/20 overflow-hidden py-2.5 rounded-xl">
      <div className="flex items-center gap-3 px-4">
        <span className="text-accent text-xs font-bold whitespace-nowrap font-mono tracking-wider">
          WINNERS
        </span>
        <div className="w-px h-4 bg-accent/30" />
        <div className="overflow-hidden flex-1">
          <div className="whitespace-nowrap text-sm text-foreground/90 animate-marquee">
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WinnerBoard({
  winners,
  tickets,
  calledNumbers,
  compact = false,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleExpand = (key: string) =>
    setExpanded((prev) => (prev === key ? null : key));

  if (winners.length === 0) {
    return (
      <div
        className="glass rounded-2xl p-6 text-center"
        data-ocid="winners.empty_state"
      >
        <div className="text-3xl mb-2">🎯</div>
        <p className="text-muted-foreground text-sm">
          No winners yet — game in progress!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <h2 className="text-sm font-heading font-bold text-muted-foreground uppercase tracking-widest">
          ✦ Winners Board
        </h2>
      )}
      <div
        className={`grid gap-3 ${
          compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {winners.map((w, idx) => {
          const key = `${w.ticketId}-${w.winType}`;
          const colorClass =
            WIN_COLORS[w.winType] ??
            "text-purple-400 border-purple-400/40 bg-purple-400/10";
          const ticket = tickets.find((t) => t.id === w.ticketId);
          const isOpen = expanded === key;

          return (
            <button
              key={key}
              type="button"
              className="glass rounded-xl p-4 hover:bg-white/[8%] transition-all duration-300 animate-slide-up cursor-pointer w-full text-left"
              style={{ animationDelay: `${idx * 60}ms` }}
              onClick={() => toggleExpand(key)}
              data-ocid={`winners.item.${idx + 1}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-block text-xs font-mono font-bold px-2 py-0.5 rounded-full border mb-2 ${colorClass}`}
                  >
                    {w.winType}
                  </span>
                  <p className="font-heading font-semibold text-foreground truncate">
                    {w.playerName}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    Ticket #{w.ticketId} • Called at #{w.calledCount}
                  </p>
                </div>
                <div className="text-lg">{isOpen ? "▲" : "▼"}</div>
              </div>
              {isOpen && ticket && (
                <MiniTicket
                  ticket={ticket}
                  calledNumbers={calledNumbers}
                  winType={w.winType}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
