import type { Ticket } from "../utils/ticketGenerator";
import type { Winner } from "../utils/winDetector";

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

interface Props {
  ticket: Ticket;
  calledNumbers: number[];
  currentNumber: number | null;
  winners: Winner[];
  showBookingBadge?: boolean;
  onBook?: () => void;
  isPending?: boolean;
  large?: boolean;
}

export default function TicketCard({
  ticket,
  calledNumbers,
  currentNumber,
  winners,
  showBookingBadge = false,
  onBook,
  isPending = false,
  large = false,
}: Props) {
  const calledSet = new Set(calledNumbers);
  const ticketWins = winners.filter((w) => w.ticketId === ticket.id);
  const isBooked =
    ticket.playerName && !ticket.playerName.startsWith("Player ");

  if (large) {
    return (
      <div
        className={`glass rounded-2xl p-4 sm:p-6 transition-all duration-300 border ${
          ticketWins.length > 0
            ? "border-accent/50 shadow-neon-cyan"
            : "border-primary/20"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xl font-mono font-black text-primary neon-text-purple">
              #{ticket.id}
            </span>
            {ticketWins.length > 0 && (
              <span className="text-sm font-mono font-bold text-accent border border-accent/40 rounded-full px-2 py-0.5">
                🏆 Winner
              </span>
            )}
          </div>
          <div className="text-right">
            {showBookingBadge ? (
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  isPending
                    ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/10"
                    : isBooked
                      ? "text-success border-success/30 bg-success/10"
                      : "text-muted-foreground border-border"
                }`}
              >
                {isPending
                  ? "⏳ Pending"
                  : isBooked
                    ? ticket.playerName
                    : "UNBOOKED"}
              </span>
            ) : (
              <span className="text-sm font-semibold text-foreground">
                {ticket.playerName}
              </span>
            )}
          </div>
        </div>

        {/* Large grid */}
        <div className="space-y-1.5">
          {ticket.grid.map((row, ri) => (
            <div
              key={ROW_KEYS[ri]}
              className="grid grid-cols-9 gap-1 sm:gap-1.5"
            >
              {row.map((cell, ci) => {
                const isCurrent = cell === currentNumber;
                const isCalled = cell !== null && calledSet.has(cell);
                return (
                  <div
                    key={COL_KEYS[ci]}
                    className={`flex items-center justify-center rounded-lg text-sm sm:text-base font-mono font-bold
                      h-8 sm:h-11 md:h-12 transition-all duration-300
                      ${
                        cell === null
                          ? "bg-black/30"
                          : isCurrent
                            ? "bg-accent text-accent-foreground shadow-neon-cyan scale-105 animate-number-flash"
                            : isCalled
                              ? "bg-primary/70 text-white shadow-neon-purple"
                              : "bg-white/8 text-foreground"
                      }`}
                  >
                    {cell ?? ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Win types */}
        {ticketWins.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {ticketWins.map((w) => (
              <span
                key={w.winType}
                className="text-xs font-mono font-bold text-accent border border-accent/30 bg-accent/10 px-2 py-0.5 rounded-full"
              >
                {w.winType}
              </span>
            ))}
          </div>
        )}

        {showBookingBadge && !isBooked && !isPending && onBook && (
          <button
            type="button"
            onClick={onBook}
            className="mt-3 w-full text-sm font-semibold py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-all duration-200"
            data-ocid="tickets.open_modal_button"
          >
            + Request Booking
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`glass rounded-xl p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-glow ${
        ticketWins.length > 0 ? "border-accent/40" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2 gap-1">
        <span className="text-xs font-mono font-bold text-primary/80">
          #{ticket.id}
        </span>
        <div className="flex-1 min-w-0 text-center">
          {showBookingBadge ? (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isPending
                  ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/10"
                  : isBooked
                    ? "text-success border-success/30 bg-success/10"
                    : "text-muted-foreground border-border"
              }`}
            >
              {isPending
                ? "⏳ Pending"
                : isBooked
                  ? ticket.playerName
                  : "UNBOOKED"}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground truncate max-w-[90px] block mx-auto">
              {ticket.playerName}
            </span>
          )}
        </div>
        {ticketWins.length > 0 && (
          <span className="text-[9px] font-mono font-bold text-accent border border-accent/40 rounded-full px-1.5 py-0.5">
            🏆
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        {ticket.grid.map((row, ri) => (
          <div key={ROW_KEYS[ri]} className="grid grid-cols-9 gap-0.5">
            {row.map((cell, ci) => {
              const isCurrent = cell === currentNumber;
              const isCalled = cell !== null && calledSet.has(cell);
              return (
                <div
                  key={COL_KEYS[ci]}
                  className={`flex items-center justify-center rounded text-[8px] sm:text-[10px] font-mono font-semibold h-5 sm:h-6 transition-all duration-300 ${
                    cell === null
                      ? "bg-black/20"
                      : isCurrent
                        ? "bg-accent text-accent-foreground shadow-neon-cyan scale-110"
                        : isCalled
                          ? "bg-primary/70 text-white shadow-neon-purple"
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

      {showBookingBadge && !isBooked && !isPending && onBook && (
        <button
          type="button"
          onClick={onBook}
          className="mt-2 w-full text-[10px] font-semibold py-1 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-all duration-200"
          data-ocid="tickets.open_modal_button"
        >
          + Request Booking
        </button>
      )}
    </div>
  );
}
