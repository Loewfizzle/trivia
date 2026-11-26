// /freefall-play — FREEFALL, THE TEST PAGE (F2 — docs/freefall.md "THE TEST PAGE"; HIGH RISE's play.js): the real game's NIGHT LOOK + SOLO,
// on the live site, on a phone. UNLISTED: open to anyone with the link (the owner + his brother), noindex nofollow, linked from nowhere.
// **NOTHING COUNTS UNTIL GO-LIVE** (the owner, Nov 25): the run is the pure engine in this tab — no XP, no streak, no server best, no
// boards, no cards, no share card: ZERO server calls, ZERO database writes; nothing from /api, the profile, progression, the report,
// share or the cards. YOUR BEST = THIS PHONE only (`ff:play:best`). Its only requests: this page's own static files (its modules, the
// walls, JAYWALK's skyline, the sounds), three.js from the page's import map, the fonts. tests/freefall-play.test.mjs +
// tests/integration/freefall-play.mjs prove it.
// HIDING THE APP HOLDS A SOLO RUN (the owner — HIGH RISE's HOLD, engine.js#hold): back = a 3 · 2 · 1, then on. A match does not hold.
import { h } from '../../ui/dom.js';
import { MODE_IDS, SEED_MAX } from './tuning.js';
import { BEST_KEY, cleanBest } from './best.js';
import { createStage } from './stage.js';

const app = document.getElementById('app');
const Q = new URLSearchParams(location.search);
// (ZERO server calls: the shared audio engine reports a cut only on a link that says &debug=1 — the page drops that flag from its own
//  address before the engine is ever installed)
if (Q.has('debug')) { try { Q.delete('debug'); history.replaceState(null, '', `${location.pathname}${Q.toString() ? `?${Q}` : ''}`); } catch { /* fine */ } }
// THE DOOR (HIGH RISE's): NOTHING COUNTS — and nothing is even ASKED. A shared module may call the server from wherever it runs (the
// audio engine COUNTS a leave once, site-wide — one anonymous beacon to /api/log; the skew wrapper asks /api/time if a module fails to
// link): on THIS page every request to /api/ stops here, before it leaves the phone.
const toApi = u => { try { return new URL(String((u && u.url) || u), location.href).pathname.startsWith('/api/'); } catch { return false; } };
const pageFetch = window.fetch.bind(window), pageBeacon = navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : null;
window.fetch = (u, o) => (toApi(u) ? Promise.reject(new TypeError('this page never calls the server')) : pageFetch(u, o));
if (pageBeacon) navigator.sendBeacon = (u, d) => (toApi(u) ? true : pageBeacon(u, d));

/** `?seed=` — the SAME tower on every run (a random one without it) · `?mode=` — match / daily (their finish + cap, no hold; the page itself is SOLO) */
const FIXED = (Q.get('seed') || '').replace(/[^!-~]/g, '').slice(0, SEED_MAX);
const MODE = MODE_IDS.includes(Q.get('mode')) ? Q.get('mode') : 'solo';
/** `?floor=N` (THE LOOK CHECK — HIGH RISE's): the first drag plays N floors at once through the real engine (a gap every time) — the run
 *  goes on LIVE from floor N (THE OFFICES from 40, THE SPEAKEASY 80, UNDER THE HARBOR 120, THE DEEP 160, THE TRENCH's moving red from
 *  201). Not a run: it never moves YOUR BEST. Nothing counts here anyway. */
const FROM = Math.max(0, Math.min(600, Math.floor(Number(Q.get('floor')) || 0)));
/** `?look=day|night` (F3 — THE LOOK CHECK): that look for this visit; without it the page is AUTO — the phone's clock, then the site's sun rule */
const LOOK = Q.get('look') === 'day' || Q.get('look') === 'night' ? Q.get('look') : null;
// (`?pano=0.5` — THE LOOK CHECK: the rooftop's panorama turned half a picture round, so its join (u = 0 / 1) is in the middle of the screen)
const readBest = () => { try { return cleanBest(localStorage.getItem(BEST_KEY)); } catch { return 0; } };
const writeBest = n => { try { localStorage.setItem(BEST_KEY, String(n)); } catch { /* a private window forgets: fine */ } };

// THE PAGE = THE STAGE (stage.js — the run loop, the scene, the HUD, the sounds) with the page's own pieces on (`page`): the SOUNDS
// list, the note; YOUR BEST = this phone's (`ff:play:best`)
try {
  createStage(app, { page: true, hook: '__ffPlay', seed: FIXED, mode: MODE, from: FROM, look: LOOK, skyShift: Math.max(-1, Math.min(1, Number(Q.get('pano')) || 0)), fps: Q.get('fps') === '1', tier: /^[012]$/.test(Q.get('tier') || '') ? Number(Q.get('tier')) : null, dpr: Number(Q.get('dpr')) || 0, best: { read: readBest, write: writeBest } });
} catch (e) { app.replaceChildren(h('p.ff-wait', `Can’t open the game: ${(e && e.message) || e}`)); }
