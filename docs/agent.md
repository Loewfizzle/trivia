# DOUBLE AGENT (social deduction)

Deep-dive for DOUBLE AGENT: privacy, turns, void, votes, same-room fairness, adding words.

## DOUBLE AGENT (social deduction)
- **Privacy:** `rooms/{code}` is readable by every signed-in user, so nothing secret goes there. `index.js#start` writes a
  random seed to `spy/{code}/key/{matchId}` (host-only rules); `prepare()` (host) loads the seed + bank and writes every
  seated player's card (idempotent per `rk`). The view subscribes to its own card only. A rules test proves another
  player can't read your card or the seed.
- **Turns:** `turnOrder` shuffles from the seed, then swaps the first non-agent to the front (the agent never opens). The
  host validates each clue with `clueProblem` (the client shows the same message first); a blocked, offline or timed-out
  turn writes '' = NO SIGNAL. GRACE_MS (700 ms) lets a last-moment clue land.
- **Void:** an agent whose player node is gone mid-round → `v+1`, the word is burned, a new deal (`rk` changes, so all
  per-round player nodes start fresh). Fewer than 3 present → final.
- **Votes:** most votes are accused; a tie for the last spot = nobody (the agent escapes). With 2 agents the top 2 are
  unmasked. Scoring in `logic.js#scoreRound` (PTS).
- **Same-room fairness:** the agent and normal cards share size, timing, animation (`da-jitter`), sound (`daReveal`) and
  haptic (30 ms); only the text differs. Never give one an effect the other lacks — the E2E measures it.
- **Adding words:** append to a category (or add `[CATEGORY, [words]]`) in `data/agent/words.json`: concrete, well-known,
  family-friendly, one clear meaning, similar to the others in the category, unique across the whole bank, letters and spaces only.
  Run `node --test tests/agent.test.mjs`.

