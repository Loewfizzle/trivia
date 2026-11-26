// FREEFALL — THE END SCREEN's BODY in the cartridge (F4A — docs/freefall.md "THE CARTRIDGE"; HIGH RISE's final.js is the pattern): the
// BODY inside the console's podium frame (ui/final.js owns the frame: the XP box, THE FOOT — PLAY AGAIN · BACK TO THE CITY). ONE builder
// with the test page's card (endscreen.js): the CAUSE, THE FLOOR NUMBER, FLOORS, YOUR BEST, the one line — all from THE JUDGE's own row
// (director.js#scoreNode: the host's replay of the proof node), then the SERVER's own answer for this match (it REPLAYED the run itself —
// profile/queue.js's outcome). /api down = just the floor.
// THE SWITCH IS OFF until go-live (api/_lib/freefall.js#FREEFALL_COUNTS): the server judges the run and AWARDS NOTHING — its answer is the
// small line "WOULD COUNT · FLOOR 85 · +12 XP" (the proof the whole pipeline works); YOUR BEST stays this phone's own.
// THE LOGO HEADER, SHARE, YOUR TABLE + the "YOUR BEST · n · AVG n" line = F4B's end screen (the data is wired: `bests` + `avgs` in the
// server's answer, lines.js#avgLine). No pills, no emoji, no dev text.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { END_WORDS } from './logic.js';
import { endCard } from './endscreen.js';
import { BEST_KEY, cleanBest } from './best.js';
import { BOARD, SRV_BEST_KEY, wouldLine } from './lines.js';

const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* fine */ } } };

export function finalScene(el, game, state) {
  const uid = state && state.uid, code = state && state.code;
  const r = ((game && game.results) || {})[uid] || {}, floor = Math.max(0, Math.floor(Number(r.f) || 0)), made = r.w === 'made';
  el.classList.add('ff-fin'); el.dataset.mode = 'solo';
  const EC = endCard({}), would = h('div.ff-fin-would', '');
  EC.set({ words: r.bad ? 'NOT COUNTED' : END_WORDS[r.w] || 'THE RUN IS OVER', made, floor, bounces: r.b, blazes: r.bl, bestRun: r.br });
  el.replaceChildren(EC.el, would);
  // YOUR BEST as this phone knows it (the server's last answer once counting is ON — else its own): the server's answer below puts it right
  const known = cleanBest(ls.get(SRV_BEST_KEY)) || cleanBest(ls.get(BEST_KEY));
  EC.best(known, false, 0);
  if (!code || !(floor > 0)) return;
  lazyImport(import('../../profile/queue.js'), '../../profile/queue.js').then(Q => {
    const k = Q.matchKey(code, game.matchId);
    const show = o => {
      if (!o || !el.isConnected) return;
      // THE SWITCH, OFF: the server judged the run, awarded nothing, and says what it WOULD have
      if (o.would) { would.textContent = wouldLine(o.would); would.classList.toggle('is-off', !!o.would.skip); el.dataset.would = String(o.would.floor); return; }
      // counting ON: NEW BEST / YOUR BEST from the server's own record of this match
      const pb = (o.pbs || []).find(x => x.b === BOARD), cur = (o.bests || {})[BOARD];
      if (pb) { ls.set(SRV_BEST_KEY, cleanBest(pb.v)); EC.best(cleanBest(pb.v), true, cleanBest(pb.prev)); }
      else if (cur != null) { ls.set(SRV_BEST_KEY, cleanBest(cur)); EC.best(cleanBest(cur), false, 0); }
    };
    show(Q.outcomeFor(k));
    const off = Q.onOutcome((kk, o) => { if (kk === k) show(o); });
    const iv = setInterval(() => { if (!el.isConnected) { clearInterval(iv); off(); } }, 3000);
  }).catch(() => {});
}
