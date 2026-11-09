# The match kit (`js/games/kit/`, `css/kit.css`, `tests/integration/kit/harness.mjs`)

The shared pieces every real-time match needs, pulled out of PRISM DROP, SLIPSTREAM and GRIDLOCK (which now use them).
A new game is its pure rules + its one distinctive screen; everything below comes for free.

## In the page (`import { … } from '../kit/index.js'`)
| piece | what | how |
| --- | --- | --- |
| `createAnnouncer(lane, { prefix, holdMs, fit })` | the announcement lane: max one visible, a short queue, a log for tests; `fit: true` puts `--len` (the first line's letters) on each element so the css sizes it to the lane (PRISM DROP's callouts) | `ann.announce('FINAL TWO', 'world')`, kinds → `is-<kind>`; a `
` = a second, smaller line |
| `createCards(overlay, { prefix })` | full-screen title cards (VICTORY, YOU'RE OUT…), one at a time | `cards.card(title, sub, ms, kind)`; `cards.showing(kind)` |
| `showCall({ … })` | Call the Winner: an eliminated player picks who wins within `CALL_MS`; refresh-safe; writes `{ w, at }` to `path` | `candidates` (≥ 2), `line(uid)`, `intro(n)`, `ended()`, `onState(msg)`, `sfx()`, `ring: true` = a countdown RING (20 ticks + the seconds, opacity only) beside the title in place of the bar (PD-2) |
| `reportPanel({ title, head, rows, calls, player })` | the stats table under the podium + the calls list | rows: `{ uid, name, color, me, cells[] }`; `ordinal(n)` |
| `createTiers({ apply })` | quality tiers 2/1/0 from frame pacing (p75 > 19.5 ms steps down; 8 s of headroom steps up, never to a tier that failed) | per frame: `tiers.sample(now, workMs)`, `tiers.tick(now[, frameTimes])`; `get/set/fps/work` |
| `installTestHook(name, api)` / `removeTestHook` | `window.__<game>` for the E2E, only on `?emu` / localhost (`always: true` to force) | mount / unmount |

Styling: elements carry `mk-*` classes (css/kit.css; theme with `--mk-accent`, `--mk-accent-2`, `--mk-grad`, `--mk-dim`, `--mk-ink` on
the game root, which should also have class `mk-root`). A game that passes a `prefix` ('sl', 'pd', 'gl') gets `${prefix}-*` classes
instead and keeps its own CSS — that is how the three existing games adopted the kit with zero visual change.

**What a game EXPORTS + what the console GIVES it (the room, the game start, the city pause, the banner, the rematch vote, the chat's lock, the
DAILY plug-in): `docs/cartridge.md` (LOBBY 2.0 B — js/games/cartridge.js, checked by tests/cartridge.test.mjs).**

Not in the kit (already shared elsewhere): the podium + WINNER reveal (`ui/final.js#createFinal`), room playlists + Call the Winner
bonus (`core/playlist.js`), synced song playback (`audio/synced-songs.js`), toasts, `h()`, avatars, chips.

## THE PODIUM's FRAME (SHELL 2.0 A — `ui/final.js#createFinal`; review-6.md D8, agreed with the Overclock chat)
The CONSOLE owns the end-of-match screen's frame: the kicker + the WINNER line, the BODY, the XP box (`profile/callouts.js`) with the end-of-round
moment + THE CARD REVEAL after it (in their order), then ONE button — **BACK TO THE ROOM**, THE NEON TUBE's main, right under the XP box (in view
at 390; the host's tap brings the room back, a guest's walks them back alone) — then the results list. No REMATCH / lobby buttons on the podium:
the rematch vote + NEW GAME live in the room's dock. **A game's own body:** export `finalScene(el, game, state)` from its module (cartridge.js
OPTIONAL) and draw into `el` (OVERCLOCK's "OVERCLOCKED", a tube-sign name, its podium, award chips, SOLO's NEW PERSONAL BEST); without it the
console's podium rise. **The results rows** (every `leaderboard()` — the podium + a game's standings) are each player's SLIM CARD
(`ui/strip-board.js`): the place number beside the strip, the score over its top-right, ONE shared effect surface, every strip calm.

## THE READY HELPER, THE ROOM's LOOK + COLOUR-BLIND (SHELL 2.0 B1, Nov 5 — docs/cartridge.md "THE CONTRACT")
- **"Everyone tapped"**: `js/games/kit/ready.js#readyState({ taps, players, online, since, now, minMs = 1500, maxMs })` → `{ ready, n, of, waiting, why }`.
  PURE (call it in the director): only CONNECTED players count, the screen holds at least `minMs`, a DROPPED player never blocks, `maxMs`
  moves on anyway, a match where nobody is connected goes after `minMs`. `now` / `since` = the server clock.
- **The night's memory**: `js/games/kit/night.js` — `markUsed(gameId, keys)` in a step's `$room`, `usedOf(state.meta, gameId)` to read
  (`rooms/{CODE}/meta/used/{gameId}/{key}`: survives rematches + new games, gone with the room).
- **THE GAME LOOK** (`js/games/kit/look.js` — SHELL 2.0 B2; B1's sun / moon tube above PLAY is gone, the owner: "more confusing than
  helpful"): ☰ → Settings → **GAME LOOK: AUTO · DAY · NIGHT** (AUTO = the real sun, the default), in the room AND in a game, PER DEVICE (a
  multiplayer match too — it only changes your own screen), **NO LOCK**: a change mid-game re-themes your screen at once. While ANY match
  is on screen the console sets `body[data-look="day" | "night"]` (app.js#paintLook — the `ns-look` event + a minute's sun re-read). A game
  draws NO switch of its own: it READS the look LIVE (`body[data-look="day"] .xx-…` in its css; `document.body.dataset.look` in a canvas,
  re-read each frame or on the `ns-look` event). **A ONE-LOOK GAME** (OC1 — its meta's `LOOKS: ['night']`, OVERCLOCK) is painted in that
  look whatever the setting says, and the setting row says `NIGHT · LOCKED` while it's on screen (docs/cartridge.md `LOOKS`).
- **COLOUR-BLIND**: right + close are the shared tokens `--good` (green) and `--close` (gold) from css/base.css — EVERY game reads them,
  never its own greens / golds for right / close. SETTINGS → "Colour-blind colours" (per device + on the profile — `ui/colorblind.js`)
  sets `body[data-cb]`, which swaps them to BLUE + ORANGE. **Right / close are never shown by colour alone**: a shape or a mark too
  (✓ / ✕, a ring, a word), so a phone in the sun or a colour-blind player still reads them. OVERCLOCK's right / close lines read the tokens
  since B1; the hidden games come over when each comes back.
- **The kit's reserved pieces** (OVERCLOCK pass 1 builds them, prefix `gk-`): `numpad.js` · `keyboard.js` · `tach.js` · `slam.js` ·
  `answer.js` (docs/cartridge.md D9).

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
