import type { GameView } from "./types";

const MISS = "⬜";
const HIT = "🟩";

/**
 * Spoiler-free result: the starting pair is public, so it is shown as emoji;
 * every guessed word is masked as a square so the chain can't be copied.
 */
export function buildShareText(game: GameView, url?: string): string {
  const title =
    game.mode === "daily" && game.puzzleNumber !== null
      ? `SAME MIND #${game.puzzleNumber}`
      : game.mode === "unlimited" ? "SAME MIND · UNLIMITED" : "SAME MIND · PRACTICE";
  const lines = [title, `${game.startPair.emojiA} → ${game.startPair.emojiB}`];
  for (const round of game.rounds) {
    lines.push(round.matched ? `${HIT} → ${HIT}` : `${MISS} → ${MISS}`);
  }
  const n = game.rounds.length;
  lines.push(game.status === "won" ? `${n} ROUND${n === 1 ? "" : "S"}` : `X/${game.maxRounds}`);
  if (url) lines.push(url);
  return lines.join("\n");
}
