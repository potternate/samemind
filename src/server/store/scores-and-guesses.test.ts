import { describe, expect, it } from "vitest";
import { firstGuessBoardKey } from "@/lib/game/first-guesses";
import { MemoryStore } from "./memory-store";
import { SupabaseStore } from "./supabase-store";
import type { GameStore, NewGameInput } from "./types";

const stores: { name: string; create: () => GameStore }[] = [{ name: "memory", create: () => new MemoryStore() }];
const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
if (url && key) stores.push({ name: "supabase", create: () => new SupabaseStore(url, key) });

for (const factory of stores) {
  describe(`${factory.name} scores and global guesses`, () => {
    const newInput = (): NewGameInput => ({
      playerId: crypto.randomUUID(), mode: "unlimited", puzzleDate: null, puzzleNumber: null,
      wordA: crypto.randomUUID(), wordB: "ocean",
    });

    async function submit(store: GameStore, input: NewGameInput, answer: string, aiAnswer: string) {
      const game = await store.createGame(input);
      const [round] = await store.getRounds(game.id);
      await store.setAiAnswer(round.id, aiAnswer);
      await store.submitAnswer({ gameId: game.id, playerId: input.playerId, roundNumber: 1, answer, maxRounds: 1 });
      return game;
    }

    it("separates modes, ignores unfinished games and restricts scores to their owner", async () => {
      const store = factory.create();
      const input = newInput();
      await submit(store, input, "water", "water");
      await submit(store, input, "beach", "boat");
      await submit(store, { ...input, mode: "daily", puzzleDate: "2026-10-01", puzzleNumber: 1 }, "fire", "fire");
      await store.createGame(input);
      await submit(store, newInput(), "water", "water");
      const scores = await store.getPlayerScores(input.playerId, "2026-10-01");
      expect(scores.daily).toEqual({ played: 1, wins: 1, winRate: 100, bestRounds: 1, averageRounds: 1 });
      expect(scores.unlimited).toEqual({ played: 2, wins: 1, winRate: 50, bestRounds: 1, averageRounds: 1 });
      expect(scores.dailyGame?.status).toBe("won");
      expect(scores.recent).toHaveLength(3);
      expect((await store.getPlayerScores(crypto.randomUUID(), "2026-10-01")).recent).toEqual([]);
    });

    it("counts shared first guesses once even with duplicate submits", async () => {
      const store = factory.create();
      const input = newInput();
      const game = await store.createGame(input);
      const [round] = await store.getRounds(game.id);
      await store.setAiAnswer(round.id, "water");
      const submission = { gameId: game.id, playerId: input.playerId, roundNumber: 1, answer: "boat", maxRounds: 8 };
      const results = await Promise.all([store.submitAnswer(submission), store.submitAnswer(submission), store.submitAnswer(submission)]);
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      expect(await store.getFirstGuesses(firstGuessBoardKey(game))).toEqual({ attempts: 1, guesses: [{ word: "boat", count: 1 }] });
      await submit(store, { ...input, playerId: crypto.randomUUID() }, "boat", "water");
      expect(await store.getFirstGuesses(firstGuessBoardKey(game))).toEqual({ attempts: 2, guesses: [{ word: "boat", count: 2 }] });
    });

    it("uses semantic judgments only after round one", async () => {
      const store = factory.create();
      const input = newInput();
      const game = await store.createGame(input);
      let [round] = await store.getRounds(game.id);
      await store.setAiAnswer(round.id, "water");
      const first = await store.submitAnswer({
        gameId: game.id, playerId: input.playerId, roundNumber: 1, answer: "beach", maxRounds: 8, semanticMatched: true,
      });
      expect(first).toMatchObject({ ok: true, matched: false, status: "active" });
      [, round] = await store.getRounds(game.id);
      await store.setAiAnswer(round.id, "ship");
      const second = await store.submitAnswer({
        gameId: game.id, playerId: input.playerId, roundNumber: 2, answer: "boat", maxRounds: 8, semanticMatched: true,
      });
      expect(second).toMatchObject({ ok: true, matched: true, status: "won", aiAnswer: "ship" });
      expect((await store.getFirstGuesses(firstGuessBoardKey(game))).attempts).toBe(1);
      expect((await store.getPlayerScores(input.playerId, "2026-10-01")).unlimited.bestRounds).toBe(2);
    });
  });
}
