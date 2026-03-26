import React from "react";

interface Props {
  calledNumbers: number[];
  currentNumber: number | null;
}

const COL_LABELS = [
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

export default function NumberBoard({ calledNumbers, currentNumber }: Props) {
  const calledSet = new Set(calledNumbers);
  const phrase = currentNumber ? `Single number, ${currentNumber}` : null;

  return (
    <div className="w-full">
      {/* Current Number Showcase */}
      {currentNumber ? (
        <div className="flex flex-col items-center justify-center mb-5 py-4 glass rounded-2xl border border-accent/30 shadow-neon-cyan relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 pointer-events-none" />
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-accent/70 mb-1">
            ✦ Just Called
          </p>
          <div className="text-7xl sm:text-8xl font-heading font-black text-accent neon-text-cyan animate-number-flash leading-none">
            {currentNumber}
          </div>
          {phrase && (
            <p className="mt-2 text-sm sm:text-base font-heading font-semibold text-foreground/80 text-center px-4">
              {phrase}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center mb-5 py-4 glass rounded-2xl border border-border/30">
          <p className="text-sm text-muted-foreground font-mono">
            Awaiting first number...
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-heading font-bold text-muted-foreground uppercase tracking-widest">
          ✦ Number Board
        </h2>
        <span className="text-xs font-mono text-muted-foreground">
          {calledNumbers.length} / 90 called
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-9 gap-1 mb-1">
        {COL_LABELS.map((l) => (
          <div
            key={l}
            className="text-center text-[8px] font-mono text-muted-foreground/50"
          >
            {l.split("-")[0]}
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-3 sm:p-4">
        <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
          {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => {
            const isCurrent = n === currentNumber;
            const isCalled = calledSet.has(n);
            return (
              <div
                key={n}
                className={`
                  flex items-center justify-center rounded-md aspect-square
                  text-[10px] sm:text-xs font-mono font-bold
                  transition-all duration-400
                  ${
                    isCurrent
                      ? "bg-accent text-accent-foreground shadow-neon-cyan scale-110 animate-number-flash"
                      : isCalled
                        ? "bg-primary/60 text-white shadow-neon-purple"
                        : "bg-white/[4%] text-muted-foreground/60 hover:bg-white/[8%]"
                  }
                `}
              >
                {n}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
