// PRISM DROP — THE END OF THE MATCH (PD-1 — THE CONSOLE'S PODIUM, docs/cartridge.md D8). The console owns the FRAME (ui/final.js#createFinal:
// the winner line, BACK TO THE ROOM, the XP box, the card reveal, the results list from 4th, the winner's sting); PRISM draws ONLY its BODY:
//   finalScene(el, game, state) — PRISM's moment (the winner's final board, frozen, with one short line: BATTLE = KOs + lines sent; SCORE RUSH
//   = points + lines + the best combo) + the TOP 3 as the console's slim cards (leaderboard() → ui/strip-board.js). A name opens THE PLAYER
//   PAGE (profile/player-page.js#openPlayer) — the podium only, never during live play. Today's look (PD-3 / PD-4 restyle it).
// 60 fps: nothing here animates but the frame's own pieces; the board is drawn once.
import { h } from '../../ui/dom.js';
import { createFinal } from '../../ui/final.js';
import { leaderboard, fmtNum } from '../../ui/components.js';
import { colorHex } from '../../config.js';
import { standings } from './logic.js';
import { drawMini } from './board.js';

const GHOST = { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
const rushOf = game => !!(game && game.settings && game.settings.mode === 'rush');
const survOf = game => !!(game && game.settings && game.settings.mode === 'survival');   // (PD-2)
const soloOf = game => !!(game && Object.keys(game.participants || {}).length === 1);
const mmss = ms => { const s = Math.max(0, Math.round((ms || 0) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/** the line under a player on the podium */
export function noteFor(game, uid) {
  const r = (game.results && game.results[uid]) || {};
  if (rushOf(game)) return `${r.ln || 0} LINES · LV ${r.lv || 1} · COMBO ${r.mc || 0}`;
  if (survOf(game)) return `SURVIVED ${mmss(r.t)} · ${r.ln || 0} LINES`;
  return `${r.ko || 0} KO · ${r.se || 0} SENT`;
}
/** the rows the frame + the body share (the score each mode ranks by) */
export function finalRows(game) {
  const rush = rushOf(game), surv = survOf(game);
  // (SURVIVAL: the seconds survived — scoreText "2:31" for the frame's solo line)
  return standings(game).map(r => ({ ...r, score: rush || surv ? r.score : ((game.results && game.results[r.uid] && game.results[r.uid].ko) || 0),
    ...(surv ? { scoreText: mmss(((game.results && game.results[r.uid]) || {}).t) } : {}), note: noteFor(game, r.uid) }));
}

/** the winner's one line: BATTLE = KOs + lines sent · SCORE RUSH = points + lines + the best combo */
export function momentLine(game, uid) {
  const r = (game.results && game.results[uid]) || {};
  if (rushOf(game)) return [`${fmtNum(r.sc || 0)} POINTS`, `${r.ln || 0} LINES`, r.mc ? `BEST COMBO ×${r.mc}` : null].filter(Boolean).join(' · ');
  if (survOf(game)) return `SURVIVED ${mmss(r.t)} · ${r.ln || 0} LINE${r.ln === 1 ? '' : 'S'}`;
  const ko = r.ko || 0, se = r.se || 0;
  return `${ko} KNOCKOUT${ko === 1 ? '' : 'S'} · ${se} LINE${se === 1 ? '' : 'S'} SENT`;
}

/** THE BODY (the console calls it inside its podium frame — ui/final.js) */
export function finalScene(el, game, state) {
  const players = (state && state.players) || {};
  const me = state && state.uid;
  const p = uid => players[uid] || (game.names && game.names[uid] ? { ...GHOST, name: game.names[uid] } : GHOST);
  const rows = finalRows(game);
  el.classList.add('pd-fs');
  if (!rows.length) { el.dataset.podium = 'none'; return; }
  const top = rows[0];
  const w = p(top.uid);
  // PRISM's moment: the winner's last board, frozen (their published board — the live node the match left; missing = the line alone)
  const node = state && state.live && state.live.boards && state.live.boards[top.uid];
  const str = (node && node.b) || '';
  const moment = h('div.pd-fs-moment', { style: { '--c': colorHex(w.color) } });
  if (str) {
    const c = h('canvas.pd-fs-board', { 'aria-hidden': 'true' });
    drawMini(c, str, null, { cell: 8, look: document.body.dataset.look === 'day' ? 'crayon' : 'neon' });   // (PD-3: the night look's tubes; PD-4: the day's crayon)
    moment.append(h('div.pd-fs-frame', c));
  }
  moment.append(h('div.pd-fs-line',
    h('small', soloOf(game) ? 'YOUR LAST BOARD' : 'THE WINNING BOARD'),
    h('b', w.name),
    h('span', momentLine(game, top.uid))));
  // the top 3 as the console's slim cards (the frame's list starts at 4th); a name → THE PLAYER PAGE
  const pick = rows.slice(0, 3);
  const list = leaderboard(pick, players, { me, stagger: 90 });
  list.classList.add('pd-fs-top');
  list.addEventListener('click', e => {
    const li = e.target.closest('li');
    const r = li && pick[[...list.children].indexOf(li)];
    const who = r && players[r.uid];
    if (!who || !who.pid) return;
    import('../../profile/player-page.js').then(m => m.openPlayer({ pid: who.pid, row: { n: who.name, a: who.avatar, c: who.color } })).catch(() => {});
  });
  [...list.children].forEach((li, i) => { const who = players[pick[i].uid]; if (who && who.pid) { li.classList.add('is-open'); li.setAttribute('role', 'button'); li.setAttribute('aria-label', `${who.name} — their card`); } });
  el.append(moment, list);
}

/** the console's podium frame (ui/final.js) with PRISM's rows → its body comes from finalScene (index.js) */
export function buildFinal({ game, st, me }) {
  const rush = rushOf(game), surv = survOf(game);
  const finalView = createFinal({
    rows: finalRows(game), players: st.players, me, presence: st.presence, scoreLabel: rush ? 'PTS' : surv ? 'TIME' : 'KO',
    kicker: rush ? 'SCORE RUSH · FINAL' : surv ? 'SURVIVAL · FINAL' : 'BATTLE · FINAL',
    winnerLine: nm => (rush ? `${nm} TOPS THE SONG` : surv ? `${nm} OUTLASTED EVERYONE` : `${nm} IS THE LAST ONE STANDING`),
  });
  return { finalView, wrap: h('div.pd-final', finalView.el) };
}
