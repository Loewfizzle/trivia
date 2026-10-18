# The match kit (`js/games/kit/`, `css/kit.css`, `tests/integration/kit/harness.mjs`)

The shared pieces every real-time match needs, pulled out of PRISM DROP, SLIPSTREAM and GRIDLOCK (which now use them).
A new game is its pure rules + its one distinctive screen; everything below comes for free.

## In the page (`import { … } from '../kit/index.js'`)
| piece | what | how |
| --- | --- | --- |
| `createAnnouncer(lane, { prefix, holdMs })` | the announcement lane: max one visible, a short queue, a log for tests | `ann.announce('FINAL TWO', 'world')`, kinds → `is-<kind>` |
| `createCards(overlay, { prefix })` | full-screen title cards (VICTORY, YOU'RE OUT…), one at a time | `cards.card(title, sub, ms, kind)`; `cards.showing(kind)` |
| `showCall({ … })` | Call the Winner: an eliminated player picks who wins within `CALL_MS`; refresh-safe; writes `{ w, at }` to `path` | `candidates` (≥ 2), `line(uid)`, `intro(n)`, `ended()`, `onState(msg)`, `sfx()` |
| `reportPanel({ title, head, rows, calls, player })` | the stats table under the podium + the calls list | rows: `{ uid, name, color, me, cells[] }`; `ordinal(n)` |
| `createTiers({ apply })` | quality tiers 2/1/0 from frame pacing (p75 > 19.5 ms steps down; 8 s of headroom steps up, never to a tier that failed) | per frame: `tiers.sample(now, workMs)`, `tiers.tick(now[, frameTimes])`; `get/set/fps/work` |
| `installTestHook(name, api)` / `removeTestHook` | `window.__<game>` for the E2E, only on `?emu` / localhost (`always: true` to force) | mount / unmount |

Styling: elements carry `mk-*` classes (css/kit.css; theme with `--mk-accent`, `--mk-accent-2`, `--mk-grad`, `--mk-dim`, `--mk-ink` on
the game root, which should also have class `mk-root`). A game that passes a `prefix` ('sl', 'pd', 'gl') gets `${prefix}-*` classes
instead and keeps its own CSS — that is how the three existing games adopted the kit with zero visual change.

Not in the kit (already shared elsewhere): the podium + WINNER reveal (`ui/final.js#createFinal`), room playlists + Call the Winner
bonus (`core/playlist.js`), synced song playback (`audio/synced-songs.js`), toasts, `h()`, avatars, chips.

## The E2E harness (`tests/integration/kit/harness.mjs`)
```js
import { createHarness, REVIEW_SIZES } from './kit/harness.mjs';
const H = await createHarness({ name: 'gridlock', slot: 'g', hook: '__gridlock', sizes: REVIEW_SIZES });
const { pages, log, ok, sleep, waitFor, evalIn, game, G, alive, join, shotAll } = H;
let fatal = null;
try {
  const host = await H.joinAll(4);                              // create a room + 3 joiners, uids filled
  await H.startGame(host, 'gridlock', { mode: 'classic' });
  await waitFor(host, s => s.game && s.game.phase === 'turn', 'first turn');
  await shotAll(host, 'gl-02-turn');                            // 390×844, 412×915, 1440×900 (SHOTS=0 skips)
  await H.cleanText(host, 'turn', '.gl');                       // no "null"/"undefined" on screen
  const hi = await H.killHost();                                // the host's phone dies; a new host claims
  await H.refresh(pages[1]);                                    // rejoin
  await H.perfRun(pages[hi], { extra: p => G(p, 'window.__gridlock.stats()') });   // 60 fps median at every tier at CPU× throttling
} catch (e) { fatal = e; }
await H.finish(fatal);                                          // checks n/m, result.json, exit code
```
Also: `H.touch(page, pts)` / `H.press(page, ms)` / `H.tap` (real CDP fingers), `H.line(x0, y0, x1, y1, n)`, `H.hostIdx()`, `H.kill(i)`,
`H.backToLobby(page)`, `H.rematch(page)`, `H.nameOf(uid)`, `H.FAST` (env `FAST=1`: the suite's own two-minute path), `H.code`.
Env: `N`, `SHOTS=0`, `GPU=1`, `CPU=4`, `PERF=0/1`, `E2E_BASE`.

**Fast lane.** Every suite should have a `FAST=1` path that plays one short match with 2 players and no screenshots (≈ 2 min) —
run it after every fix, and the full suite once before committing. Twenty-minute suites re-run for one change are the single
biggest waste in a session.
