import React from "react";
import type { Winner } from "../utils/winDetector";

interface Props {
  winners: Winner[];
}

export default function WinnerMarquee({ winners }: Props) {
  if (winners.length === 0) return null;

  const text = winners
    .map((w) => `🏆 ${w.playerName} won ${w.winType} (Ticket #${w.ticketId})`)
    .join("   •   ");

  return (
    <div className="w-full rounded-xl border border-cyan-500/40 bg-[#141A26] overflow-hidden py-2 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
      <div className="flex items-center gap-2 px-4">
        <span className="text-cyan-400 text-sm font-bold whitespace-nowrap">
          WINNERS:
        </span>
        <div className="overflow-hidden flex-1">
          <div
            className="whitespace-nowrap text-sm text-white animate-marquee"
            style={{ animation: "marquee 20s linear infinite" }}
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}
