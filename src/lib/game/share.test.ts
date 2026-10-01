import { describe, expect, it } from "vitest";
import { buildShareText } from "./share";
import type { GameView } from "./types";

const base: GameView = {
  id: "g",
  mode: "daily",
  puzzleNumber: 142,
  status: "won",
  maxRounds: 8,
  startPair: { a: "pizza", b: "ocean", emojiA: "🍕", emojiB: "🌊" },
  rounds: [
    { number: 1, wordA: "pizza", wordB: "ocean", playerAnswer: "beach", aiAnswer: "boat", matched: false },
    { number: 2, wordA: "beach", wordB: "boat", playerAnswer: "water", aiAnswer: "water", matched: true },
  ],
  current: null,
};

describe("buildShareText", () => {
  it("masks guessed words", () => {
    const text = buildShareText(base, "https://example.com");
    expect(text).toBe(["SAME MIND #142", "🍕 → 🌊", "⬜ → ⬜", "🟩 → 🟩", "2 ROUNDS", "https://example.com"].join("\n"));
    expect(text).not.toMatch(/beach|boat|water/);
  });

  it("marks losses and practice games", () => {
    const text = buildShareText({ ...base, mode: "practice", puzzleNumber: null, status: "lost" });
    expect(text.split("\n")[0]).toBe("SAME MIND · PRACTICE");
    expect(text).toMatch(/X\/8$/);
  });
});
