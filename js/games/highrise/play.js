// /highrise-play — HIGH RISE, THE TEST PAGE (S2 — docs/highrise.md "THE TEST PAGE"): the real game's NIGHT LOOK + SOLO, on the live site,
// on a phone. UNLISTED: open to anyone with the link, noindex nofollow, linked from nowhere.
// **NOTHING COUNTS UNTIL GO-LIVE** (the owner, Nov 18): the run is the pure engine in this tab — no XP, no streak, no server best, no
// YOUR TABLE, no cards, no share card: ZERO server calls, ZERO database writes; nothing from /api, the profile, progression, the report,
// share or the cards. YOUR BEST = THIS PHONE only (`hi:play:best`). Its only requests: this page's own static files (its modules, the
// plates, the reflection map, the sounds), three.js from the page's import map, the fonts. tests/highrise-play.test.mjs +
// tests/integration/highrise-play.mjs prove it.
// HIDING THE APP = NO PAUSE (the owner — JAYWALK's rule): the run is on the clock; back from a hidden tab THE FUSE has ended it (TOO SLOW).
import { h } from '../../ui/dom.js';
import { MODE_IDS, SEED_MAX } from './tuning.js';
import { BEST_KEY, cleanBest } from './best.js';
import { createStage } from './stage.js';
import { lazyImport } from '../../ui/lazy-import.js';

const app = document.getElementById('app');
const Q = new URLSearchParams(location.search);
// (ZERO server calls: the shared audio engine reports a cut only from the owner's phone inside the app, or on a link that says &debug=1 —
//  the page drops that flag from its own address before the engine is ever installed)
if (Q.has('debug')) { try { Q.delete('debug'); history.replaceState(null, '', `${location.pathname}${Q.toString() ? `?${Q}` : ''}`); } catch { /* fine */ } }
// THE DOOR: NOTHING COUNTS — and nothing is even ASKED. A shared module may one day call the server from wherever it runs (today: the
// audio engine COUNTS a leave once, site-wide — one anonymous beacon to /api/log; the skew wrapper asks /api/time if a module fails to
// link): on THIS page every request to /api/ stops here, before it leaves the phone.
const toApi = u => { try { return new URL(String((u && u.url) || u), location.href).pathname.startsWith('/api/'); } catch { return false; } };
const pageFetch = window.fetch.bind(window), pageBeacon = navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : null;
window.fetch = (u, o) => (toApi(u) ? Promise.reject(new TypeError('this page never calls the server')) : pageFetch(u, o));
if (pageBeacon) navigator.sendBeacon = (u, d) => (toApi(u) ? true : pageBeacon(u, d));

/** `?seed=` — the SAME slabs on every run (a random one without it) · `?mode=` — match / daily (their finish + cap; the page itself is SOLO) */
const FIXED = (Q.get('seed') || '').replace(/[^!-~]/g, '').slice(0, SEED_MAX);
const MODE = MODE_IDS.includes(Q.get('mode')) ? Q.get('mode') : 'solo';
/** `?look=day|night` — that look for this visit (nothing stored); else this phone's choice: AUTO (the real sun) · DAY · NIGHT */
const LOOK_Q = Q.get('look') === 'day' || Q.get('look') === 'night' ? Q.get('look') : null;
/** `?floor=N` (S3 — THE TEST PAGE's LOOK CHECK, the JAYWALK lab's `?lane=N`): the START tap plays N clean drops at once — the run
 *  goes on LIVE from floor N (the flyby from ~30, the UFO from ~80, THE MOTHERSHIP + floor 200 from ~190: minutes of near-perfect play
 *  otherwise). Real drops through the real engine (REPLAY = LIVE holds) — but not a run: it never moves YOUR BEST. Nothing counts here anyway. */
const FROM = Math.max(0, Math.min(400, Math.floor(Number(Q.get('floor')) || 0)));
const readBest = () => { try { return cleanBest(localStorage.getItem(BEST_KEY)); } catch { return 0; } };
const writeBest = n => { try { localStorage.setItem(BEST_KEY, String(n)); } catch { /* a private window forgets: fine */ } };


// THE PAGE = THE STAGE (stage.js — the run loop, the scene, the HUD, the sounds: the SAME module the cartridge mounts) with the page's own
// pieces on (`page`): the look switch, the SOUNDS list, the note, its own end card + PLAY AGAIN; YOUR BEST = this phone's (`hi:play:best`)
function mount() {
  const S = createStage(app, { page: true, hook: '__hiPlay', seed: FIXED, mode: MODE, look: LOOK_Q, from: FROM, fps: Q.get('fps') === '1', trace: Q.get('trace') === '1', lean: Q.get('lean') || '', sim: Math.max(0, Math.min(7, Math.floor(Number(Q.get('rivals')) || 0))), tier: /^[012]$/.test(Q.get('tier') || '') ? Number(Q.get('tier')) : null, best: { read: readBest, write: writeBest } });
  // S5 — `?poster=1` (JAYWALK's lab's): THE POSTER for THE B1 BILLBOARD — the staged moment in the real night scene, the board drawn over it
  //  (poster.js, lazy; the build: scripts/build-highrise-billboard.mjs — `&seed=poster2&floor=78&look=night`). Nothing counts here either.
  if (Q.get('poster') === '1') lazyImport(import('./poster.js'), './poster.js').then(M => M.runPoster(S, app)).catch(e => console.warn('[poster]', e));
}

try { mount(); }
catch (e) { app.replaceChildren(h('p.hi-wait', `Can’t open the game: ${(e && e.message) || e}`)); }
