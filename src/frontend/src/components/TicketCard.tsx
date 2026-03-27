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
  displaySize?: "small" | "medium" | "large";
  minimized?: boolean;
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
  displaySize = "medium",
  minimized = false,
}: Props) {
  const calledSet = new Set(calledNumbers);
  const ticketWins = winners.filter((w) => w.ticketId === ticket.id);
  const isBooked =
    ticket.playerName && !ticket.playerName.startsWith("Player ");

  const ticketBg = "var(--theme-ticket-bg, #FFE135)";
  const isWinner = ticketWins.length > 0;

  // Compute effective size from displaySize prop (overrides `large` if provided)
  const effectiveSize = large ? "large" : displaySize;

  const cellH =
    effectiveSize === "large" ? 44 : effectiveSize === "small" ? 16 : 22;
  const fontSize =
    effectiveSize === "large" ? 15 : effectiveSize === "small" ? 7 : 9;
  const headerFontSize =
    effectiveSize === "large" ? 11 : effectiveSize === "small" ? 6 : 8;
  const playerFontSize =
    effectiveSize === "large" ? 11 : effectiveSize === "small" ? 6.5 : 7.5;
  const headerPadding =
    effectiveSize === "large"
      ? "6px 10px 4px"
      : effectiveSize === "small"
        ? "2px 4px 1px"
        : "3px 6px 2px";
  const playerPadding =
    effectiveSize === "large"
      ? "3px 8px 4px"
      : effectiveSize === "small"
        ? "1px 3px"
        : "2px 4px";

  const headerSection = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: headerPadding,
        borderBottom: "1px solid rgba(0,0,0,0.25)",
      }}
    >
      <span
        style={{
          fontSize: headerFontSize,
          fontWeight: 700,
          color: "#444",
          letterSpacing: 0.5,
          fontFamily: "monospace",
        }}
      >
        Neon Tambola
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: effectiveSize === "large" ? 8 : 4,
        }}
      >
        {isWinner && (
          <span
            style={{
              fontSize: effectiveSize === "large" ? 10 : 7,
              fontWeight: 700,
              color: "#b45309",
            }}
          >
            🏆 Winner
          </span>
        )}
        <span
          style={{
            fontSize: headerFontSize,
            fontWeight: 800,
            color: "#222",
            fontFamily: "monospace",
          }}
        >
          #{ticket.id}
        </span>
      </div>
    </div>
  );

  const playerSection = (
    <div
      style={{
        textAlign: "center",
        padding: playerPadding,
        borderBottom: minimized ? undefined : "1px solid rgba(0,0,0,0.18)",
      }}
    >
      {showBookingBadge ? (
        <span
          style={{
            fontSize: playerFontSize,
            fontWeight: 700,
            color: isPending ? "#b45309" : isBooked ? "#166534" : "#777",
          }}
        >
          {isPending ? "⏳ Pending" : isBooked ? ticket.playerName : "UNBOOKED"}
        </span>
      ) : (
        <span
          style={{
            fontSize: playerFontSize,
            fontWeight: 600,
            color: "#555",
          }}
        >
          {ticket.playerName}
        </span>
      )}
    </div>
  );

  const grid = (
    <table
      style={{
        borderCollapse: "collapse",
        width: "100%",
        tableLayout: "fixed",
      }}
    >
      <tbody>
        {ticket.grid.map((row, ri) => (
          <tr key={ROW_KEYS[ri]}>
            {row.map((cell, ci) => {
              const isCurrent = cell === currentNumber;
              const isCalled = cell !== null && calledSet.has(cell);
              let cellBg = "transparent";
              let color = "#111";
              if (cell !== null) {
                if (isCurrent) {
                  cellBg = "#7c3aed";
                  color = "#fff";
                } else if (isCalled) {
                  cellBg = "#dc2626";
                  color = "#fff";
                }
              }
              return (
                <td
                  key={COL_KEYS[ci]}
                  style={{
                    border: "1.5px solid rgba(0,0,0,0.35)",
                    height: cellH,
                    textAlign: "center",
                    verticalAlign: "middle",
                    fontSize,
                    fontWeight: 800,
                    color,
                    background: cellBg,
                    fontFamily: "monospace",
                    transition: "background 0.2s",
                    padding: 0,
                  }}
                >
                  {cell ?? ""}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const winBadges = isWinner && effectiveSize === "large" && (
    <div
      style={{
        padding: "4px 8px 6px",
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
      }}
    >
      {ticketWins.map((w) => (
        <span
          key={w.winType}
          style={{
            fontSize: 10,
            fontWeight: 700,
            background: "#fef3c7",
            color: "#92400e",
            border: "1px solid #d97706",
            borderRadius: 99,
            padding: "1px 8px",
          }}
        >
          {w.winType}
        </span>
      ))}
    </div>
  );

  const bookBtn = showBookingBadge && !isBooked && !isPending && onBook && (
    <div
      style={{
        padding: effectiveSize === "large" ? "6px 8px 8px" : "3px 4px 4px",
      }}
    >
      <button
        type="button"
        onClick={onBook}
        data-ocid="tickets.open_modal_button"
        style={{
          width: "100%",
          fontSize: effectiveSize === "large" ? 12 : 8,
          fontWeight: 700,
          padding: effectiveSize === "large" ? "6px 0" : "3px 0",
          borderRadius: 6,
          border: "1.5px solid rgba(0,0,0,0.3)",
          background: "rgba(0,0,0,0.08)",
          color: "#333",
          cursor: "pointer",
        }}
      >
        + Request Booking
      </button>
    </div>
  );

  return (
    <div
      style={{
        background: ticketBg,
        borderRadius: 10,
        overflow: "hidden",
        border: isWinner ? "2px solid #7c3aed" : "1.5px solid rgba(0,0,0,0.25)",
        boxShadow: isWinner
          ? "0 4px 20px rgba(124,58,237,0.35)"
          : "0 2px 8px rgba(0,0,0,0.18)",
        display: "inline-block",
        width: "100%",
      }}
    >
      {headerSection}
      {playerSection}
      {!minimized && grid}
      {winBadges}
      {bookBtn}
    </div>
  );
}
