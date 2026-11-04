// LOBBY 2.0 B — THE WINNER's BANNER PLANE + THE NIGHT's CHAMPION (the owner, Nov 4 7:56 am — "walk back out + THE BANNER PLANE ✅"; the
// night's champion decided Oct 28). The city's OWN banner plane (screens/harbor/banner.js, through scene.roomBanner) flies the room's lines:
//   · THE WINNER — ~2 s after everyone has walked back out (core/room-show.js#bannerAt: from meta/back on the server clock — the SAME plane
//     at the same place on every phone in the room); the words from core/room-show.js#bannerLines (ten forms taken in turn by the night's game
//     count — ten games a night never repeat a line; ties "SPLIT THE POT" / "TIE GAME"); the winners from night/{matchId} (the room's names).
//     A refresh mid-flight = the plane where it is now (its flight is a function of the time since it started); after it has passed, nothing.
//   · NO TRAFFIC DURING THE LEGENDARIES: a legendary up (or its hold) on this phone → it waits, then flies from then (≤ 60 s — or skips).
//   · THE NIGHT's CHAMPION: a player LEAVING the room after 2+ games → their own city flies "LAST CALL — BEN WINS THE NIGHT"; a player who just
//     closed the app sees "LAST NIGHT'S CHAMPION: BEN" the next time they open the site within ~12 h — once a night a device (localStorage
//     `nd:night`: the room's standing, kept up to date while in it).
//   · Reduced motion: the banner as a STILL CARD in the sky (a glass card with the same words, ~6 s — no plane).
import { h, reducedMotion } from '../ui/dom.js';
import { GAMES } from '../config.js';
import { serverNow } from '../firebase.js';
import { cityClock } from '../core/city.js';
import { bannerAt, bannerLines, winnersOf, champLines } from '../core/room-show.js';
import { nightStandings } from '../core/night.js';

export const PASS_MS = 30000;          // (a banner pass ≈ 30 s: past that, a late phone shows nothing)
const WAIT_TRIES = 30, WAIT_MS = 2000; // (a legendary in the way: try again every 2 s for a minute, then skip)
const NIGHT_KEY = 'nd:night', CHAMP_MS = 12 * 3600e3;

/** a game's name on the banner: its cartridge's BANNER_NAME (docs/cartridge.md), else the GAMES name */
export async function bannerName(id) {
  try { const R = await import('../games/registry.js'); const m = R.GAME_MODULES[id]; if (m && m.BANNER_NAME) return m.BANNER_NAME; } catch { /* the name below */ }
  const g = GAMES.find(x => x.id === id);
  return g ? g.name : String(id || '').toUpperCase();
}

/** fly lines on this phone's city from a server time (startS) — waits for a legendary, then flies from then; → a cancel function */
export function flyBanner(scene, lines, startS, onDone = () => {}) {
  let t = 0, gone = false, tries = 0;
  const go = () => {
    if (gone) return;
    if (!lines.length || (!tries && serverNow() - startS > PASS_MS - 3000)) { onDone('passed'); return; }   // (a phone back after it passed — never a wait that ran long)
    if (reducedMotion()) { stillCard(lines); onDone('card'); return; }
    if (!scene || !scene.roomBanner) { onDone('no-city'); return; }
    const from = tries ? Math.max(startS, serverNow()) : startS;
    const at = cityClock().now() - (serverNow() - from);
    if (scene.roomBanner(lines, { at, passes: 1 })) { onDone('flown'); return; }
    if (++tries > WAIT_TRIES) { onDone('skipped'); return; }
    t = setTimeout(go, WAIT_MS);
  };
  t = setTimeout(go, Math.max(0, startS - serverNow()));
  return () => { gone = true; clearTimeout(t); };
}

// the still card (reduced motion): the words in the sky, a glass card — opacity only
function stillCard(lines) {
  document.querySelectorAll('.rc-bancard').forEach(e => e.remove());
  const el = h('div.rc-bancard', { role: 'status' }, ...lines.map(l => h('b', l)));
  document.body.append(el);
  setTimeout(() => el.remove(), 6500);
}

/** the room's side: THE WINNER's BANNER after each match + the night's standing kept for THE NIGHT's CHAMPION */
export function createRoomBanner({ scene }) {
  const done = new Set();
  let cancel = null, cur = '', nightSig = '';
  const debug = { last: null };
  function update(st) {
    keepNight(st);
    const meta = st.meta, b = meta && meta.back;
    if (!b || meta.status !== 'lobby' || done.has(b.m)) return;
    const e = st.night && st.night[b.m];
    if (!e || cur === b.m) return;          // (the night entry is written at the podium — there before the walk-out; else wait for it)
    cur = b.m;
    const startS = bannerAt(meta, st.players);
    if (startS == null || serverNow() - startS > PASS_MS - 3000) { done.add(b.m); return; }   // (a phone back after it passed: nothing)
    const order = Object.entries(st.night).filter(([, x]) => x && typeof x.at === 'number').sort((x, y) => x[1].at - y[1].at).map(([k]) => k);
    const idx = Math.max(0, order.indexOf(b.m));
    bannerName(b.g).then(G => {
      if (cur !== b.m) return;
      const lines = bannerLines(winnersOf(e).map(w => w.name), G, idx);
      debug.last = { m: b.m, lines, at: startS, idx };
      if (cancel) cancel();
      cancel = flyBanner(scene, lines, startS, how => { done.add(b.m); debug.last = { ...debug.last, how, firedAt: serverNow() }; });
    });
  }
  // THE NIGHT's standing on this device (for the champion banner): the room, its games, its leaders — rewritten when the night changes
  function keepNight(st) {
    const n = st.night || {}, sig = `${st.code}|${Object.keys(n).length}`;
    if (sig === nightSig || !st.code) return;
    nightSig = sig;
    const games = Object.keys(n).length;
    if (games < 1) return;
    const rows = nightStandings(n, st.players || {}), top = rows.filter(r => r.rank === 1 && r.points > 0).map(r => r.name);
    try {
      const was = JSON.parse(localStorage.getItem(NIGHT_KEY) || 'null');
      const shown = was && was.code === st.code && was.games === games ? !!was.shown : false;
      localStorage.setItem(NIGHT_KEY, JSON.stringify({ code: st.code, games, leaders: top, at: Date.now(), shown }));
    } catch { /* private mode: no champion banner */ }
  }
  return { update, debug: () => debug, destroy() { if (cancel) cancel(); cancel = null; } };
}

/** THE NIGHT's CHAMPION on this phone's city: kind 'last-call' (they just LEFT the room) or 'last-night' (opening the site later, ≤ 12 h);
 *  once a night a device; only after 2+ games; never while in a room → the lines flown, or null */
let champLast = null;
export const champDebug = () => champLast;   // (the e2e: what the night's champion banner flew)
export function champBanner(scene, kind, inRoom = false) {
  if (inRoom) return null;
  let rec = null;
  try { rec = JSON.parse(localStorage.getItem(NIGHT_KEY) || 'null'); } catch { return null; }
  if (!rec || rec.shown || rec.games < 2 || !rec.leaders || !rec.leaders.length || Date.now() - rec.at > CHAMP_MS) return null;
  const lines = champLines(rec.leaders, kind);
  try { localStorage.setItem(NIGHT_KEY, JSON.stringify({ ...rec, shown: true })); } catch { /* fine */ }
  champLast = { kind, lines, how: null };
  flyBanner(scene, lines, serverNow() + (kind === 'last-call' ? 1500 : 0), how => { champLast = { ...champLast, how }; });
  return lines;
}
