// THE PODIUM's FRAME (SHELL 2.0 A — review-6.md D8, agreed with the Overclock chat): the CONSOLE owns the end-of-match screen's frame — the
// kicker + the WINNER line, the XP box (profile/callouts.js) with the end-of-round moment's order after it ("already yours" / the next unlock,
// THE CARD REVEAL), and ONE button: BACK TO THE ROOM, THE NEON TUBE's main, RIGHT UNDER THE XP BOX (docs/harbor/refs/shell/podium-back.png —
// in view without scrolling at 390). No other rematch / lobby buttons here: the rematch vote + NEW GAME live in the room's dock.
// A game draws its own BODY inside the frame by exporting finalScene(el, game, state) from its module (OVERCLOCK's "OVERCLOCKED", the
// tube-sign name, the 2-1-3 podium, award chips, SOLO's NEW PERSONAL BEST); without it, the console's default podium rise (3rd, 2nd, 1st).
// The full leaderboard follows the button.
import { levelOf } from '../core/levels.js';
import { fitName } from './fit.js';
import { h, vibrate, reducedMotion } from './dom.js';
import { avatar, countUp, leaderboard, burst } from './components.js';
import { colorHex } from '../config.js';
import { isHost, state, setState } from '../store.js';
import { backToLobby } from '../host.js';
import { toast } from './toast.js';
import { sfx } from '../audio/sfx.js';
import { rankBadge } from './emblems.js';
import { pubOf } from '../profile/public.js';
import { metaOf } from '../games/registry.js';

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
  // THE BODY: the game's own scene (finalScene) — or the console's podium
  const mod = g && metaOf(g.id);   // (the cartridge — loaded: its match just ended here)
  let body = null;
  if (mod && typeof mod.finalScene === 'function') {
    body = h('div.final-body', { dataset: { game: g.id } });
    try { mod.finalScene(body, g, state); } catch (e) { console.warn('[final] finalScene', e); body = null; }
  }
  const podium = h('div.podium');
  const places = [rows[1], rows[0], rows[2]];
  const delays = { 1: 2400, 2: 1300, 3: 500 };
  places.forEach((r, i) => {
    if (!r) { podium.append(h('div.pod.pod-empty')); return; }
    const p = players[r.uid] || GHOST;
    const place = i === 1 ? 1 : i === 0 ? 2 : 3;
    const scoreEl = h('div.pod-score', '0');
    // (THE VAULT 1B — the winner's FULL CARD on a tap, when they wear an approved one)
    const pub = place === 1 ? pubOf(p) : null, cd = pub && pub.cd;
    const openCard = cd ? () => import('../vault/full.js').then(F => F.openFullCard(cd, { name: p.name, lv: pub.x != null ? levelOf(pub.x) : 1, avatar: p.avatar, color: p.color, at: pub.at, pub })).catch(() => {}) : null;
    podium.append(h(`div.pod.pod-${place}`, { style: { '--c': colorHex(p.color), '--d': `${delays[place]}ms` } },
      h('div.pod-who', openCard ? { role: 'button', tabindex: '0', 'aria-label': `${p.name}'s card`, onclick: openCard, onkeydown: e => { if (e.key === 'Enter') openCard(); } } : {}, avatar(p.avatar, p.color, place === 1 ? 64 : 46), fitName(h('div.pod-name', p.name, rankBadge(pubOf(p), { tag: false })), { min: 10 }),
        h('div.pod-score-wrap', scoreEl, scoreLabel ? h('small', scoreLabel) : null)),
      h('div.pod-block', h('span', String(r.rank)))));
    setTimeout(() => cancelers.push(countUp(scoreEl, 0, r.score, 1000)), delays[place] + 200);
  });
  const winner = rows[0] && (players[rows[0].uid] || GHOST);
  const tied = rows.filter(r => r.rank === 1).length > 1;
  // (SHELL 2.0 B1 — THE SOLO LANE: a room of one — no winner, no placing: SOLO RUN + the score; a game's own finalScene shows its solo body)
  const solo = !!(g && Object.keys(g.participants || {}).length === 1);
  const word = solo ? 'SOLO RUN' : tied ? 'DEADLOCK' : 'WINNER';
  // ONE button for everyone: the host's tap brings the whole room back (THE WALK BACK OUT); a guest's walks them back alone (the others
  // stay on the podium — the same as ☰ → QUIT TO THE ROOM)
  const back = h('button.btn.btn-primary.btn-block.final-back', { type: 'button', onclick: () => {
    if (back.classList.contains('is-busy')) return;
    if (isHost()) { back.classList.add('is-busy'); Promise.resolve(backToLobby()).catch(err => { back.classList.remove('is-busy'); toast('Couldn’t go back', 'err', { sub: String((err && err.message) || err) }); }); return; }
    if (state.game && state.game.matchId) setState({ quit: state.game.matchId });
  } }, h('span', 'BACK TO THE ROOM'));
  const actions = h('div.final-actions', back);
  let hostShown = null;
  function refresh() { hostShown = isHost(); back.dataset.host = hostShown ? '1' : '0'; }
  refresh();
  const el = h('div.panel-full.final', solo ? { class: 'is-solo' } : null,
    h('div.sheet-kicker', kicker),
    h('div.winner', h('div.winner-title', { 'data-text': word, class: tied ? 'is-tied' : null }, word),
      h('div.winner-name', solo ? `${winner ? winner.name : ''}${rows[0] && rows[0].score != null ? ` · ${rows[0].score}` : ''}`.toUpperCase() : tied ? 'SHARED VICTORY' : winnerLine(winner ? winner.name : ''))),
    body || podium,
    rcSlot,
    actions,
    extra,
    leaderboard(rows, players, { me, presence, stagger: 60 }));
  const t = setTimeout(() => {
    el.classList.add('crowned');
    sfx('victory');
    if (rows[0] && rows[0].uid === me) vibrate([40, 60, 40, 60, 120]);
    const c = rows[0] && players[rows[0].uid];
    burst(el, [c ? colorHex(c.color) : '#3dff8b', '#f3ff3a', '#ff2bd6', '#00f0ff'], 48);
  }, reducedMotion() ? 0 : 2500);
  return { el, refresh, destroy() { gone = true; clearTimeout(t); cancelers.forEach(c => c()); if (rc) rc.destroy(); } };
}
