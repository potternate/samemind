"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import { copyText, shareText } from "@/lib/client/share";
import { buildShareText } from "@/lib/game/share";
import type { GameView } from "@/lib/game/types";
import type { PlayerScores } from "@/lib/game/scores";
import { Chain } from "./chain";
import { gameLabel } from "./header";
import { ScoreSummary } from "./scores-screen";
import { FirstGuesses } from "./first-guesses";

export function ResultScreen({
  game, scores, onPlayAgain, onHome, onScores, busy, error,
}: {
  game: GameView;
  scores: PlayerScores | null;
  onPlayAgain: () => void;
  onHome: () => void;
  onScores: () => void;
  busy: boolean;
  error: string | null;
}) {
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [openSeparately, setOpenSeparately] = useState(false);
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const won = game.status === "won";
  const rounds = game.rounds.length;

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    setShareStatus(null);
    setOpenSeparately(false);
    setManualCopy(null);
    const operation = shareText(buildShareText(game), window.location.origin);
    void api.trackShare(game.id);
    const outcome = await operation;
    setSharing(false);
    if (outcome === "copied") setShareStatus("Copied to clipboard");
    if (outcome === "blocked" && window.self !== window.top) {
      setOpenSeparately(true);
      setShareStatus("Open the game in its own tab to use your phone’s share sheet.");
    } else if (outcome === "blocked" || outcome === "failed") {
      setShareStatus("Sharing unavailable here. Tap Copy result.");
    }
  }

  async function handleCopy() {
    const text = buildShareText(game, window.location.origin);
    const outcome = await copyText(text);
    setShareStatus(outcome === "copied" ? "Copied to clipboard" : "Select and copy your result below.");
    setManualCopy(outcome === "failed" ? text : null);
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-8 pt-10 pb-8 text-center">
      <Button variant="ghost" className="self-start" onClick={onHome} disabled={busy}>← HOME</Button>
      <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-xs font-bold tracking-[0.3em] text-muted-foreground">{gameLabel(game.mode, game.puzzleNumber)}</div>
        <h2 className={won ? "animate-pop text-5xl font-black tracking-tight text-emerald-600" : "text-4xl font-black tracking-tight"}>
          {won ? "CONNECTED" : "NOT CONNECTED"}
        </h2>
        <p className="text-lg font-bold">
          {won ? `${rounds} ROUND${rounds === 1 ? "" : "S"}` : `No match in ${game.maxRounds} rounds`}
        </p>
      </div>

      <Chain game={game} />

      {game.firstGuesses && game.rounds[0] && <FirstGuesses board={game.firstGuesses} yourWord={game.rounds[0].playerAnswer} />}
      {scores && (
        <div className="w-full space-y-3">
          <h3 className="text-xs font-bold tracking-widest">{game.mode === "daily" ? "DAILY" : "UNLIMITED"} SCORES</h3>
          <ScoreSummary scores={game.mode === "daily" ? scores.daily : scores.unlimited} />
          <Button variant="ghost" onClick={onScores} disabled={busy}>YOUR SCORES</Button>
        </div>
      )}

      <div className="flex w-full flex-col gap-3">
        <Button onClick={handleShare} disabled={sharing} className="h-16 rounded-2xl text-2xl font-black tracking-widest">
          {sharing ? "SHARING…" : "SHARE"}
        </Button>
        <Button variant="ghost" onClick={handleCopy} disabled={sharing}>COPY RESULT</Button>
        {openSeparately && (
          <a href={`?game=${encodeURIComponent(game.id)}`} target="_blank" rel="noopener noreferrer" className="py-3 text-sm font-bold underline">
            OPEN GAME TO SHARE
          </a>
        )}
        {manualCopy && (
          <textarea aria-label="Result to copy" readOnly value={manualCopy} onFocus={(event) => event.currentTarget.select()} className="min-h-48 w-full rounded-xl border p-3 text-base" />
        )}
        <Button
          variant="outline"
          onClick={onPlayAgain}
          disabled={busy}
          className="h-14 rounded-2xl border-2 text-xl font-black tracking-widest"
        >
          {busy ? "…" : game.mode === "daily" ? "PLAY UNLIMITED" : "PLAY AGAIN"}
        </Button>
        {game.mode === "daily" && <p className="text-xs text-muted-foreground">Daily complete. Next puzzle at midnight UTC.</p>}
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
          {shareStatus}
        </p>
      </div>
    </div>
  );
}
