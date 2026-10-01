# Same Mind

samemind.io

Think the same. Don't cheat. A mobile-first daily word-convergence game against an AI.

You and the AI each pick a word connecting two endpoints. Different words become the next round's endpoints; matching words win. From round 2 onward, equivalent meanings also connect. Max 8 rounds.

Choose **Daily** for one free shared puzzle each UTC day, or **Unlimited** for as many random starting pairs as you want. **Your Scores** keeps Daily and Unlimited results separate, with games played, win percentage, best round count, average winning rounds, and recent results.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Supabase · OpenAI · Vercel

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

With no env vars set, the app runs with an in-memory store, deterministic mock AI, and a limited mock answer judge (dev only; production requires real services). The mock judge recognizes a small set of spelling/plural/synonym examples. General LLM correction and semantic comparison require `OPENAI_API_KEY`. In-memory games and counts reset when the server restarts; Supabase persists them.

### With local Supabase

```bash
npx supabase start          # applies supabase/migrations
# put the printed API URL + service_role key in .env.local:
#   SUPABASE_URL=http://127.0.0.1:54321
#   SUPABASE_SERVICE_ROLE_KEY=...
npm run dev
```

## Environment

See `.env.example`. All variables are server-only.

| Var | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | AI player (required in production) |
| `OPENAI_MODEL` | Default `gpt-4.1-mini` |
| `OPENAI_TEMPERATURE` | Default `0.2`; `none` to omit |
| `CONNECT_TWO_SYSTEM_PROMPT` | Override the AI system prompt (`src/server/ai/prompt.ts`) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Persistence (required in production) |

## Deploy (Vercel + Supabase)

1. Create a Supabase project and run `supabase/migrations/*.sql` (or `npx supabase db push`).
2. Import the repo in Vercel and set the env vars above.

## Architecture

- `src/lib/game/` — pure rules: normalization, engine, daily pair selection, share text, client view projection.
- `src/server/ai/` — `AiPlayer` commits an independent answer before submission. A separate `AnswerJudge` corrects the player's submitted word and compares later guesses with the already committed AI answer using structured JSON. The AI player never sees the current player guess.
- `src/server/store/` — `GameStore` interface; Supabase (`submit_judged_answer` RPC with row locks, atomic global counts, and score aggregation) and in-memory implementations.
- `src/server/game-service.ts` — start / prepare (AI answers before the player can submit) / submit.
- `src/app/api/` — route handlers. Anonymous identity via `x-player-id` header (UUID persisted in `localStorage`).
- `src/components/game/` — mode picker, round, reveal, result and score screens.

The client never receives the current round's AI answer, and the server owns round number, game state, canonical words and win condition. If AI generation or judging fails, the round stays unanswered, no attempt is counted, and the player can retry.

Daily puzzle: `puzzle # = days since 2026-10-01 + 1`, pair chosen deterministically from `src/lib/game/pairs.ts`; the server's UTC date controls the puzzle for everyone. Client-supplied dates are ignored. One daily game per anonymous browser identity per date; a completed puzzle opens its saved result. Clearing browser identity or using a different browser creates a new anonymous player.

First-round guesses are corrected to single canonical words by an LLM. Equivalent existing board words reuse the existing entry. Every new accepted first guess starts at 1; matching canonical guesses from other players increment that count. Daily boards are grouped by puzzle date, Unlimited boards by starting pair. Counts are updated in the submission transaction so concurrent retries cannot count twice. Existing first-round submissions are backfilled by the migration. Boards are only sent after the player has submitted their first guess.

First-round wins use the corrected word's exact match with the AI. Later rounds accept spelling variants, inflections and synonyms expressing the same concept in context; related but distinct concepts stay mismatches. Both revealed words remain visible even when a semantic match wins.

Sharing calls `navigator.share({ title, text, url })` directly from the tap, before analytics. On HTTPS Safari this requests the iPhone's native share sheet. If a containing iframe blocks Web Share, the result screen offers **Open game to share** in a separate tab. Unsupported browsers fall back to clipboard; **Copy result** is also available, with selectable text if clipboard access is denied. Cancelling the sheet is not treated as an error. Physical iOS sharing still needs verification on an iPhone.

## Scripts

`npm run lint` · `npm run typecheck` · `npm test` · `npm run build`

To run the Supabase contracts as well as unit tests, set `SUPABASE_TEST_URL` and `SUPABASE_TEST_SERVICE_ROLE_KEY` to a migrated local Supabase instance before `npm test`. Contract tests create isolated test games in that database.
