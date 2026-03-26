import React, { useEffect, useState } from "react";

interface Props {
  currentNumber: number | null;
  calledNumbers: number[];
  phase: string;
}

export default function CallingDisplay({
  currentNumber,
  calledNumbers,
  phase,
}: Props) {
  const [flash, setFlash] = useState(false);
  const [prevNum, setPrevNum] = useState<number | null>(null);

  useEffect(() => {
    if (currentNumber && currentNumber !== prevNum) {
      setFlash(true);
      setPrevNum(currentNumber);
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [currentNumber, prevNum]);

  const phrase = currentNumber ? `Single number, ${currentNumber}` : null;
  const recent = calledNumbers.slice(-6).slice(0, -1).reverse();

  return (
    <div className="flex flex-col items-center py-6 sm:py-10">
      <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-4 font-mono">
        ✦ Now Calling ✦
      </p>

      {/* Main circle */}
      <div className="relative flex items-center justify-center mb-4">
        {/* Outer glow ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-500 ${
            flash
              ? "animate-cyan-pulse"
              : currentNumber
                ? "animate-neon-pulse"
                : ""
          }`}
          style={{
            width: "clamp(140px,20vw,200px)",
            height: "clamp(140px,20vw,200px)",
          }}
        />
        {/* Ring 1 */}
        <div
          className={`absolute rounded-full border-2 transition-all duration-500 ${
            flash ? "border-accent/80" : "border-primary/40 animate-glow-ring"
          }`}
          style={{
            width: "clamp(140px,20vw,200px)",
            height: "clamp(140px,20vw,200px)",
          }}
        />
        {/* Ring 2 */}
        <div
          className="absolute rounded-full border border-white/5"
          style={{
            width: "clamp(120px,17vw,170px)",
            height: "clamp(120px,17vw,170px)",
          }}
        />
        {/* Inner bg */}
        <div
          className="relative z-10 rounded-full glass flex flex-col items-center justify-center"
          style={{
            width: "clamp(120px,17vw,170px)",
            height: "clamp(120px,17vw,170px)",
          }}
        >
          <span
            className={`font-mono font-black leading-none transition-all duration-300 ${
              flash ? "text-accent neon-text-cyan scale-110" : "text-foreground"
            } ${flash ? "animate-number-flash" : ""}`}
            style={{ fontSize: "clamp(3rem,8vw,5rem)" }}
          >
            {currentNumber ?? (phase === "idle" ? "—" : "...")}
          </span>
          <span
            className="text-muted-foreground font-mono"
            style={{ fontSize: "0.65rem" }}
          >
            {calledNumbers.length}/90
          </span>
        </div>
      </div>

      {/* Call phrase */}
      {phrase && (
        <div
          className={`text-center transition-all duration-500 ${
            flash ? "opacity-100 translate-y-0" : "opacity-80"
          }`}
        >
          <p className="text-accent font-heading font-semibold text-base sm:text-xl italic mb-1 neon-text-cyan">
            {phrase}
          </p>
        </div>
      )}

      {/* Recent chips */}
      {recent.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">
            Previously:
          </span>
          {recent.map((n) => (
            <span
              key={n}
              className="text-xs font-mono bg-primary/10 border border-primary/20 text-primary/70 px-2 py-0.5 rounded-full"
            >
              {n}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
