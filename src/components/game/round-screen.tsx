"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateAnswer } from "@/lib/game/normalize";
import type { CurrentRoundView } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { BigWord } from "./word";

interface Props {
  round: CurrentRoundView;
  submitting: boolean;
  preparing: boolean;
  prepareError: string | null;
  submitError: string | null;
  onRetryPrepare: () => void;
  onSubmit: (answer: string) => void;
}

export function RoundScreen({ round, submitting, preparing, prepareError, submitError, onRetryPrepare, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const ready = round.ready;
  const error = localError ?? submitError;

  useEffect(() => {
    setValue("");
    setLocalError(null);
  }, [round.number]);

  useEffect(() => {
    if (ready) inputRef.current?.focus();
  }, [ready, round.number]);

  useEffect(() => {
    if (submitError) setShakeKey((k) => k + 1);
  }, [submitError]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || submitting) return;
    const check = validateAnswer(value, [round.wordA, round.wordB]);
    if (!check.ok) {
      setLocalError(check.error);
      setShakeKey((k) => k + 1);
      return;
    }
    setLocalError(null);
    onSubmit(check.word);
  }

  return (
    <div key={round.number} className="flex flex-1 flex-col gap-8 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center gap-3 text-center">
        <BigWord word={round.wordA} />
        <span className="text-3xl font-black text-muted-foreground" aria-label="and">
          ↔
        </span>
        <BigWord word={round.wordB} />
      </div>

      <div className="space-y-1 text-center">
        <p className="text-lg font-medium">What word connects these two?</p>
        {round.number === 1 && <p className="text-sm text-muted-foreground">Match the AI&rsquo;s word to win.</p>}
        {round.number > 1 && <p className="text-sm text-muted-foreground">Same meaning counts. Synonyms can connect.</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div key={shakeKey} className={cn(shakeKey > 0 && error && "animate-shake")}>
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setLocalError(null);
            }}
            disabled={!ready || submitting}
            placeholder={ready ? "type one word" : "AI is choosing…"}
            aria-label="Your word"
            aria-invalid={error ? true : undefined}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="go"
            maxLength={40}
            className="h-16 rounded-2xl border-2 text-center text-2xl font-bold md:text-2xl"
          />
        </div>
        <Button
          type="submit"
          disabled={!ready || submitting || !value.trim()}
          className="h-16 rounded-2xl text-2xl font-black tracking-widest"
        >
          {submitting ? "…" : ready ? "GO" : "THINKING…"}
        </Button>
        <div className="min-h-6 text-center text-sm" aria-live="polite">
          {error && <p className="text-destructive">{error}</p>}
          {!ready && prepareError && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-destructive">{prepareError}</p>
              <Button variant="outline" onClick={onRetryPrepare} disabled={preparing} type="button" className="h-10 rounded-xl px-5 font-bold">
                {preparing ? "RETRYING…" : "TRY AGAIN"}
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
