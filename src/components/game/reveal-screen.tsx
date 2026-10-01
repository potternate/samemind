"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { Reveal } from "@/lib/game/types";
import type { FirstGuessBoard } from "@/lib/game/first-guesses";
import { cn } from "@/lib/utils";
import { BigWord } from "./word";
import { FirstGuesses } from "./first-guesses";

interface Props {
  reveal: Reveal;
  gameOver: boolean;
  onContinue: () => void;
  firstGuesses?: FirstGuessBoard;
}

function Card({ label, word, matched, delay }: { label: string; word: string; matched: boolean; delay: number }) {
  return (
    <div
      className={cn(
        "animate-flip-in flex flex-col items-center gap-2 rounded-3xl border-2 px-4 py-6",
        matched ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-border bg-muted/40",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-xs font-bold tracking-[0.3em] opacity-60">{label}</span>
      <BigWord word={word} />
    </div>
  );
}

export function RevealScreen({ reveal, gameOver, onContinue, firstGuesses }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = setTimeout(() => buttonRef.current?.focus(), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 pt-8">
      <div className="grid gap-3 [perspective:800px]">
        <Card label="YOU" word={reveal.playerAnswer} matched={reveal.matched} delay={0} />
        <Card label="AI" word={reveal.aiAnswer} matched={reveal.matched} delay={250} />
      </div>

      {reveal.roundNumber === 1 && firstGuesses && <FirstGuesses board={firstGuesses} yourWord={reveal.playerAnswer} />}
      {reveal.matched && reveal.playerAnswer !== reveal.aiAnswer && (
        <p className="text-center text-sm text-emerald-700">Same meaning counts as a match.</p>
      )}

      <div className="animate-in fade-in fill-mode-both text-center delay-700 duration-500">
        {reveal.matched ? (
          <p className="animate-pop text-3xl font-black tracking-widest text-emerald-600">CONNECTED!</p>
        ) : gameOver ? (
          <p className="text-lg font-bold">Out of rounds.</p>
        ) : (
          <p className="text-muted-foreground">No match. These are your next two words.</p>
        )}
      </div>

      <Button
        ref={buttonRef}
        onClick={onContinue}
        className="animate-in fade-in fill-mode-both h-16 rounded-2xl text-2xl font-black tracking-widest delay-700 duration-500"
      >
        {gameOver ? "SEE RESULT" : "NEXT ROUND →"}
      </Button>
    </div>
  );
}
