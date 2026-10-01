import type { FirstGuessBoard } from "@/lib/game/first-guesses";

export function FirstGuesses({ board, yourWord }: { board: FirstGuessBoard; yourWord: string }) {
  return (
    <section className="w-full space-y-3 rounded-2xl border p-4 text-left">
      <h3 className="text-xs font-bold tracking-widest">FIRST GUESSES · ALL PLAYERS</h3>
      <p className="text-xs text-muted-foreground">{board.attempts} accepted attempts for these starting words</p>
      <ul className="space-y-2">
        {board.guesses.slice(0, 8).map((guess) => (
          <li key={guess.word} className="flex items-center justify-between gap-3 text-sm">
            <span className={guess.word === yourWord ? "font-bold" : ""}>
              {guess.word}{guess.word === yourWord && <span className="ml-2 text-xs text-muted-foreground">YOU</span>}
            </span>
            <span className="font-bold tabular-nums">{guess.count}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Equivalent first guesses share a count. Each new guess starts at 1.</p>
    </section>
  );
}
