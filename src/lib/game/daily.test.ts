import { describe, expect, it } from "vitest";
import { DAILY_EPOCH } from "./config";
import { isAcceptablePuzzleDate, pairForPuzzle, puzzleNumberForDate } from "./daily";
import { STARTING_PAIRS } from "./pairs";

describe("daily puzzle", () => {
  it("numbers puzzles from the epoch", () => {
    expect(puzzleNumberForDate(DAILY_EPOCH)).toBe(1);
    expect(puzzleNumberForDate("2026-10-02")).toBe(2);
    expect(puzzleNumberForDate("2027-10-01")).toBe(366);
  });

  it("gives every player the same pair for a date and cycles the pool", () => {
    expect(pairForPuzzle(1)).toBe(STARTING_PAIRS[0]);
    expect(pairForPuzzle(1 + STARTING_PAIRS.length)).toBe(STARTING_PAIRS[0]);
  });

  it("accepts local dates within a day of server time", () => {
    const now = new Date("2026-10-05T12:00:00Z");
    expect(isAcceptablePuzzleDate("2026-10-05", now)).toBe(true);
    expect(isAcceptablePuzzleDate("2026-10-04", now)).toBe(true);
    expect(isAcceptablePuzzleDate("2026-10-06", now)).toBe(true);
    expect(isAcceptablePuzzleDate("2026-10-07", now)).toBe(false);
    expect(isAcceptablePuzzleDate("2026-02-30", now)).toBe(false);
    expect(isAcceptablePuzzleDate("nope", now)).toBe(false);
  });

  it("rejects dates before the first puzzle", () => {
    expect(isAcceptablePuzzleDate("2026-09-30", new Date("2026-10-01T00:30:00Z"))).toBe(false);
  });

  it("has unique starting pairs", () => {
    const keys = STARTING_PAIRS.map((p) => `${p.a}|${p.b}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
