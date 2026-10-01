import { Button } from "@/components/ui/button";
import type { GameMode } from "@/lib/game/types";
import type { PlayerScores } from "@/lib/game/scores";
import { ScoreSummary } from "./scores-screen";

export function Landing({
  onPlay, onScores, scores, busy, error,
}: {
  onPlay: (mode: GameMode) => void;
  onScores: () => void;
  scores: PlayerScores | null;
  busy: boolean;
  error: string | null;
}) {
  const daily = scores?.dailyGame;
  const dailyLabel = daily?.status === "active" ? "RESUME DAILY" : daily ? "DAILY RESULT" : "PLAY DAILY";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8 text-center animate-in fade-in duration-500">
      <div className="space-y-4">
        <h1 className="text-6xl font-black leading-[0.9] tracking-tight">
          SAME
          <br />
          MIND
        </h1>
        <p className="text-lg text-muted-foreground">Think the same. Don&rsquo;t cheat.</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button onClick={() => onPlay("daily")} disabled={busy} className="h-16 rounded-2xl text-xl font-black tracking-widest">
          {busy ? "…" : dailyLabel}
        </Button>
        <p className="text-xs text-muted-foreground">One free puzzle a day. Same words for everyone.</p>
        <Button variant="outline" onClick={() => onPlay("unlimited")} disabled={busy} className="mt-3 h-16 rounded-2xl border-2 text-xl font-black tracking-widest">
          PLAY UNLIMITED
        </Button>
        <p className="text-xs text-muted-foreground">New words every game. Play as much as you like.</p>
      </div>
      <div className="w-full space-y-4">
        {scores && <ScoreSummary scores={scores.daily} />}
        <Button variant="ghost" onClick={onScores} disabled={busy}>YOUR SCORES</Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
