// FREEFALL — THE END SCREEN's BODY in the cartridge (F4A · F4B — docs/freefall.md "THE END SCREEN"; HIGH RISE's final.js is the pattern):
// the BODY inside the console's podium frame (ui/final.js owns the frame: its header slot — THE LOGO, put there by view.js —, the XP box,
// THE UNIVERSAL FOOTER: PLAY AGAIN · SHARE | HOME · a match: REMATCH · ROOM | SHARE). ONE builder with the test page's card (endscreen.js):
// F5B — THE FINAL SHAPE (the owner, Nov 27 — docs/freefall.md "THE END SCREENS"): SOLO = the logo · SOLO (the frame's header — view.js) ·
// the CAUSE · THE FLOOR NUMBER + FLOORS · "YOUR BEST · n · AVG n" (a NEW BEST: the AVG on its own line) · THE END-SCREEN BOARD (the
// console's shared block — ui/end-board.js, FREEFALL's END_BOARD: the world's top 3 / YOUR TABLE) · the universal foot. A MATCH = the logo
// · MATCH · the cause · the number + FLOORS · YOUR BEST · AVG · the match's TOP 3 (the same block) + "YOU · 5TH · 49 FLOORS" from 4th down ·
// REMATCH · ROOM | SHARE. No WOULD COUNT line (it took room; the server's answer is kept on the body's `data-would` for the checks), no
// stats line, no per-player cause line. Everything from THE JUDGE's own row (director.js), then the SERVER's answer for this match
// (profile/queue.js's outcome — counting ON: NEW BEST / YOUR BEST + AVG). /api down = just the floor.
// THE SHARE CARD is DRAWN + ENCODED while the end screen is read (share.js — the picture alone at the tap). No pills, no emoji, no dev text.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { END_WORDS, gameStandings } from './logic.js';
import { endCard } from './endscreen.js';
import { BEST_KEY, cleanBest } from './best.js';
import { BOARD, SRV_BEST_KEY } from './lines.js';

const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* fine */ } } };
// (F5B — SHARE = THE PICTURE ONLY: the card is drawn + encoded at the end screen; the TAP must reach the share sheet in its own turn — so
//  the share module, once the end screen has loaded it, is called DIRECTLY: no import's promise between the tap and navigator.share)
let SH = null;
const shareMod = () => lazyImport(import('./share.js'), './share.js').then(m => (SH = m));
const warmShare = (game, state) => shareMod().then(m => (typeof m.warmShare === 'function' ? m.warmShare(game, state) : null)).catch(() => {});
/** SHARE (index.js#shareRun — the console's universal footer): the picture alone, in the tap's own turn */
export const shareNow = (game, state) => (SH ? SH.shareRun(game, state) : shareMod().then(m => m.shareRun(game, state)));

/** the server's answer for this match (profile/queue.js — it REPLAYED the run): THE SWITCH OFF = WOULD COUNT (kept on the body's data only);
 *  counting ON = NEW BEST / YOUR BEST + THE AVERAGE (JAYWALK's JT2: from 5 counted runs, a dash under that) */
function serverAnswer(el, EC, game, code) {
  lazyImport(import('../../profile/queue.js'), '../../profile/queue.js').then(Q => {
    const k = Q.matchKey(code, game.matchId);
    const show = o => {
      if (!o || !el.isConnected) return;
      if (o.would) { el.dataset.would = String(o.would.floor); el.dataset.wouldSkip = o.would.skip ? '1' : ''; return; }
      const pb = (o.pbs || []).find(x => x.b === BOARD), cur = (o.bests || {})[BOARD], av = o.av && BOARD in o.av ? o.av[BOARD] : undefined;
      if (pb) { ls.set(SRV_BEST_KEY, cleanBest(pb.v)); EC.best(cleanBest(pb.v), pb.prev != null && cleanBest(pb.prev) > 0, cleanBest(pb.prev), av); }   // (NEW BEST only of a best that was BEATEN — a first counted run is YOUR BEST)
      else if (cur != null) { ls.set(SRV_BEST_KEY, cleanBest(cur)); EC.best(cleanBest(cur), false, 0, av); }
    };
    show(Q.outcomeFor(k));
    const off = Q.onOutcome((kk, o) => { if (kk === k) show(o); });
    const iv = setInterval(() => { if (!el.isConnected) { clearInterval(iv); off(); } }, 3000);
  }).catch(() => {});
}

export function finalScene(el, game, state) {
  const solo = !game || game.mode === 'solo', uid = state && state.uid, code = state && state.code;
  el.classList.add('ff-fin'); el.dataset.mode = solo ? 'solo' : 'match';
  // (a MATCH: the console's own list of every place is replaced by the shared block's TOP 3 — ui/end-board.js, mounted by the frame)
  if (!solo) el.dataset.podium = 'all';
  const mine = !!(game && game.participants && game.participants[uid]);
  if (!mine) return;   // (a watcher — a late joiner: nothing of their own; the frame's block shows the match)
  warmShare(game, state);
  const r = ((game && game.results) || {})[uid] || {}, floor = Math.max(0, Math.floor(Number(r.f) || 0)), made = r.w === 'made';
  const EC = endCard({ stats: false });
  EC.set({ words: (game.unproven && !solo) || r.bad ? 'NOT COUNTED' : END_WORDS[r.w] || (solo ? 'THE RUN IS OVER' : 'NO RUN'), made, floor });
  el.replaceChildren(EC.el);
  const c = !solo && (game.calls || {})[uid];
  if (c) el.append(h('div.ff-fin-call', c.ok ? `YOUR CALL WAS RIGHT · +${c.bonus} POINTS` : 'YOUR CALL MISSED'));
  // YOUR BEST as this phone knows it (the server's last answer once counting is ON — else its own); the server's answer puts it right
  EC.best(cleanBest(ls.get(SRV_BEST_KEY)) || cleanBest(ls.get(BEST_KEY)), false, 0);
  if (!solo) {
    // (the winner's moment: the console's own sting is off for this game — a match plays it here, once the crown lands; a draw: none)
    const first = gameStandings(game).filter(x => x.rank === 1);
    if (first.length === 1) setTimeout(() => { if (el.isConnected) lazyImport(import('../../audio/progress-sfx.js'), '../../audio/progress-sfx.js').then(m => m.pgSfx('victory')).catch(() => {}); }, 2500);
  }
  if (!code || game.unproven || (solo && !(floor > 0))) return;
  serverAnswer(el, EC, game, code);
}
