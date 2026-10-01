import { cn } from "@/lib/utils";
import type { GameMode } from "@/lib/game/types";

export function GameHeader({ round, maxRounds, label }: { round: number; maxRounds: number; label: string }) {
  return (
    <header className="flex flex-col items-center gap-3 pt-6">
      <div className="text-xs font-bold tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="text-sm font-black tracking-[0.2em]">
        ROUND {round}
        <span className="text-muted-foreground"> / {maxRounds}</span>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: maxRounds }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-5 rounded-full transition-colors",
              i < round - 1 ? "bg-foreground/60" : i === round - 1 ? "bg-foreground" : "bg-border",
            )}
          />
        ))}
      </div>
    </header>
  );
}

export function gameLabel(mode: GameMode, puzzleNumber: number | null): string {
  return mode === "daily" && puzzleNumber !== null ? `DAILY #${puzzleNumber}` : "UNLIMITED";
}
