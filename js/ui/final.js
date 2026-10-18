// Shared end-of-match screen: podium rise (3rd, 2nd, 1st), glitch WINNER reveal,
// full leaderboard, and BACK TO LOBBY for whoever is host *right now*.
import { h, vibrate, reducedMotion } from './dom.js';
import { avatar, countUp, leaderboard, burst } from './components.js';
import { colorHex } from '../config.js';
import { isHost, state } from '../store.js';
import { backToLobby, rematch } from '../host.js';
import { toast } from './toast.js';
import { sfx } from '../audio/sfx.js';
import { rankBadge } from './emblems.js';
import { pubOf } from '../profile/public.js';

const GHOST = { name: 'GHOST', color: 'cyan', avatar: 'ghost' };

/**
 * rows: [{ uid, rank, score, note? }] sorted best-first.
 * winnerLine(name): subtitle for a single winner.
 * scoreLabel: small caption under podium scores (e.g. 'HP').
 */
export function createFinal({ rows, players, me, presence, winnerLine, scoreLabel = '', kicker = 'MATCH COMPLETE', extra = null }) {
  const cancelers = [];
  // the global boards: personal bests, world ranks, XP, rank-ups (js/profile/callouts.js) — loaded on demand, never in the way
  const rcSlot = h('div.rc-slot');
  let rc = null, gone = false;
  const g = state.game;
  if (state.code && g && g.matchId && g.participants && g.participants[me]) {
    import('../profile/callouts.js').then(m => { if (gone) return; rc = m.attachCallouts(state.code, g); rcSlot.append(rc.el); }).catch(() => {});
  }
  const podium = h('div.podium');
  const places = [rows[1], rows[0], rows[2]];
  const delays = { 1: 2400, 2: 1300, 3: 500 };
  places.forEach((r, i) => {
    if (!r) { podium.append(h('div.pod.pod-empty')); return; }
    const p = players[r.uid] || GHOST;
    const place = i === 1 ? 1 : i === 0 ? 2 : 3;
    const scoreEl = h('div.pod-score', '0');
    podium.append(h(`div.pod.pod-${place}`, { style: { '--c': colorHex(p.color), '--d': `${delays[place]}ms` } },
      h('div.pod-who', avatar(p.avatar, p.color, place === 1 ? 64 : 46), h('div.pod-name', p.name, rankBadge(pubOf(p), { tag: false })),
        h('div.pod-score-wrap', scoreEl, scoreLabel ? h('small', scoreLabel) : null)),
      h('div.pod-block', h('span', String(r.rank)))));
    setTimeout(() => cancelers.push(countUp(scoreEl, 0, r.score, 1000)), delays[place] + 200);
  });
  const winner = rows[0] && (players[rows[0].uid] || GHOST);
  const tied = rows.filter(r => r.rank === 1).length > 1;
  const word = tied ? 'DEADLOCK' : 'WINNER';
  const actions = h('div.final-actions');
  let hostShown = null;
  function refresh() {
    const host = isHost();
    if (hostShown === host) return;
    hostShown = host;
    actions.replaceChildren(...(host
      ? [
        h('button.btn.btn-primary.btn-xl.btn-block', { type: 'button', onclick: e => {
          const btn = e.currentTarget;
          if (btn.classList.contains('is-busy')) return;
          btn.classList.add('is-busy');
          rematch()
            .catch(err => { toast(`REMATCH FAILED — ${String((err && err.message) || err).toUpperCase()}`, 'err'); return false; })
            .then(ok => { if (!ok) btn.classList.remove('is-busy'); });
        } }, h('span', 'REMATCH')),
        h('button.btn.btn-ghost.btn-block', { type: 'button', onclick: () => backToLobby() }, h('span', 'BACK TO LOBBY')),
      ]
      : [h('div.wait-note', 'WAITING FOR THE HOST — REMATCH OR LOBBY…')]));
  }
  refresh();
  const el = h('div.panel-full.final',
    h('div.sheet-kicker', kicker),
    h('div.winner', h('div.winner-title', { 'data-text': word, class: tied ? 'is-tied' : null }, word),
      h('div.winner-name', tied ? 'SHARED VICTORY' : winnerLine(winner ? winner.name : ''))),
    podium,
    rcSlot,
    leaderboard(rows, players, { me, presence, stagger: 60 }),
    extra,
    actions);
  const t = setTimeout(() => {
    el.classList.add('crowned');
    sfx('victory');
    if (rows[0] && rows[0].uid === me) vibrate([40, 60, 40, 60, 120]);
    const c = rows[0] && players[rows[0].uid];
    burst(el, [c ? colorHex(c.color) : '#3dff8b', '#f3ff3a', '#ff2bd6', '#00f0ff'], 48);
  }, reducedMotion() ? 0 : 2500);
  return { el, refresh, destroy() { gone = true; clearTimeout(t); cancelers.forEach(c => c()); if (rc) rc.destroy(); } };
}
