"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/client/api";
import type { GameMode, GameView, Reveal } from "@/lib/game/types";
import type { PlayerScores } from "@/lib/game/scores";
import { GameHeader, gameLabel } from "./header";
import { Landing } from "./landing";
import { ResultScreen } from "./result-screen";
import { RevealScreen } from "./reveal-screen";
import { RoundScreen } from "./round-screen";
import { ScoresScreen } from "./scores-screen";

type Phase = "landing" | "play" | "reveal" | "result" | "scores";

function messageOf(err: unknown): string {
  return err instanceof ApiError ? err.message : "Something went wrong.";
}

export function SameMind() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [game, setGame] = useState<GameView | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [scores, setScores] = useState<PlayerScores | null>(null);
  const [scoresError, setScoresError] = useState<string | null>(null);
  const preparingFor = useRef<string | null>(null);

  const refreshScores = useCallback(async () => {
    try {
      const { scores: next } = await api.getScores();
      setScores(next);
      setScoresError(null);
    } catch (err) {
      setScoresError(messageOf(err));
    }
  }, []);

  useEffect(() => {
    void refreshScores();
    window.addEventListener("focus", refreshScores);
    return () => window.removeEventListener("focus", refreshScores);
  }, [refreshScores]);

  const ensureReady = useCallback(async (g: GameView) => {
    if (g.status !== "active" || !g.current || g.current.ready) return;
    const key = `${g.id}:${g.current.number}`;
    if (preparingFor.current === key) return;
    preparingFor.current = key;
    setPreparing(true);
    setPrepareError(null);
    try {
      const { game: next } = await api.prepare(g.id);
      setGame((previous) => previous?.id === next.id ? next : previous);
    } catch (err) {
      setPrepareError(messageOf(err));
    } finally {
      preparingFor.current = null;
      setPreparing(false);
    }
  }, []);

  const showGame = useCallback(
    (g: GameView) => {
      setGame(g);
      setSubmitError(null);
      setPhase(g.status === "active" ? "play" : "result");
      void ensureReady(g);
      void refreshScores();
    },
    [ensureReady, refreshScores],
  );

  const openGame = useCallback(async (id: string) => {
    try {
      const { game: next } = await api.getGame(id);
      setReveal(null);
      showGame(next);
    } catch (err) {
      setScoresError(messageOf(err));
    }
  }, [showGame]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("game");
    if (id) void openGame(id);
  }, [openGame]);

  const start = useCallback(
    async (mode: GameMode) => {
      setStarting(true);
      setStartError(null);
      try {
        const { game: g } = await api.startGame(mode);
        setReveal(null);
        showGame(g);
      } catch (err) {
        setStartError(messageOf(err));
      } finally {
        setStarting(false);
      }
    },
    [showGame],
  );

  const submit = useCallback(
    async (answer: string) => {
      if (!game?.current || submitting) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const res = await api.submit(game.id, game.current.number, answer);
        setGame(res.game);
        setReveal(res.reveal);
        setPhase("reveal");
        void ensureReady(res.game);
        if (res.game.status !== "active") void refreshScores();
      } catch (err) {
        if (err instanceof ApiError && err.code === "conflict") {
          const { game: fresh } = await api.getGame(game.id).catch(() => ({ game }));
          showGame(fresh);
        } else if (err instanceof ApiError && err.code === "ai_unavailable") {
          setGame({ ...game, current: { ...game.current, ready: false } });
          setPrepareError(err.message);
        } else {
          setSubmitError(messageOf(err));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [game, submitting, ensureReady, showGame, refreshScores],
  );

  const continueFromReveal = useCallback(() => {
    if (!game) return;
    setPhase(game.status === "active" ? "play" : "result");
  }, [game]);

  const goHome = () => {
    setPhase("landing");
    setStartError(null);
    window.history.replaceState(null, "", window.location.pathname);
    void refreshScores();
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {phase === "landing" && (
        <Landing onPlay={start} onScores={() => setPhase("scores")} scores={scores} busy={starting} error={startError} />
      )}

      {phase === "scores" && (
        <ScoresScreen scores={scores} error={scoresError} onHome={goHome} onRetry={refreshScores} onResult={openGame} />
      )}

      {game && (phase === "play" || phase === "reveal") && (
        <>
          <Button variant="ghost" className="mt-3 self-start" onClick={goHome} disabled={submitting}>← HOME</Button>
          <GameHeader
          round={phase === "reveal" && reveal ? reveal.roundNumber : (game.current?.number ?? game.rounds.length)}
          maxRounds={game.maxRounds}
          label={gameLabel(game.mode, game.puzzleNumber)}
          />
        </>
      )}

      {game?.current && phase === "play" && (
        <RoundScreen
          round={game.current}
          submitting={submitting}
          preparing={preparing}
          prepareError={prepareError}
          submitError={submitError}
          onRetryPrepare={() => void ensureReady(game)}
          onSubmit={submit}
        />
      )}

      {game && reveal && phase === "reveal" && (
        <RevealScreen key={reveal.roundNumber} reveal={reveal} firstGuesses={game.firstGuesses} gameOver={game.status !== "active"} onContinue={continueFromReveal} />
      )}

      {game && phase === "result" && (
        <ResultScreen game={game} scores={scores} onScores={() => setPhase("scores")} onHome={goHome} onPlayAgain={() => start("unlimited")} busy={starting} error={startError} />
      )}
    </main>
  );
}
