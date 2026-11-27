// PRISM DROP — THE END OF THE MATCH (PD-1 — THE CONSOLE'S PODIUM, docs/cartridge.md D8). The console owns the FRAME (ui/final.js#createFinal:
// the winner line, BACK TO THE ROOM, the XP box, the card reveal, the results list from 4th, the winner's sting); PRISM draws ONLY its BODY:
//   finalScene(el, game, state) — PRISM's moment (the winner's final board, frozen, with one short line: BATTLE = KOs + lines sent; SCORE RUSH
//   = points + lines + the best combo) + the TOP 3 as the console's slim cards (leaderboard() → ui/strip-board.js). A name opens THE PLAYER
//   PAGE (profile/player-page.js#openPlayer) — the podium only, never during live play. Today's look (PD-3 / PD-4 restyle it).
// 60 fps: nothing here animates but the frame's own pieces; the board is drawn once.
import { h } from '../../ui/dom.js';
import { createFinal } from '../../ui/final.js';
import { endMode } from '../../ui/fin-neon.js';
import { leaderboard, fmtNum } from '../../ui/components.js';
import { colorHex } from '../../config.js';
import { standings } from './logic.js';
import { drawMini } from './board.js';
import { skinOf, phoneOf } from './skins.js';
import { settings } from '../../audio/settings.js';
import { lazyImport } from '../../ui/lazy-import.js';

const GHOST = { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
const rushOf = game => !!(game && game.settings && game.settings.mode === 'rush');
const survOf = game => !!(game && game.settings && game.settings.mode === 'survival');   // (PD-2)
const soloOf = game => !!(game && Object.keys(game.participants || {}).length === 1);
// THE END-BOARD SWITCH-ON (Nov 27): SCORE RUSH's end screen carries THE END-SCREEN BOARD (index.js#END_BOARD — the console's shared block:
// the board prism-rush's TOP 3 solo, the match's TOP 3 in a match) — so the body's own top-3 cards step aside there, and ONE line says
// "YOUR BEST n" (no AVG on this board): the SERVER's best as it last told this phone (a counted room match's outcome — pbs / bests)
const RUSH_BOARD = 'prism-rush', RUSH_BEST = 'pd:rush-best';
const lsGet = k => { try { return Number(localStorage.getItem(k)) || 0; } catch { return 0; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* this page only */ } };
function rushBest(line, game, state) {
  const code = state && state.code, show = (v, isNew = false) => { line.textContent = v > 0 ? (isNew ? `NEW BEST · ${fmtNum(v)}` : `YOUR BEST ${fmtNum(v)}`) : ''; line.classList.toggle('is-new', !!isNew && v > 0); };
  show(lsGet(RUSH_BEST));
  if (!code) return;
  lazyImport(import('../../profile/queue.js'), '../../profile/queue.js').then(Q => {
    const k = Q.matchKey(code, game.matchId);
    const take = o => {
      if (!o || !line.isConnected) return;
      const pb = (o.pbs || []).find(x => x.b === RUSH_BOARD), cur = (o.bests || {})[RUSH_BOARD];
      if (pb) { lsSet(RUSH_BEST, pb.v); show(Number(pb.v) || 0, pb.prev != null); } else if (cur != null) { lsSet(RUSH_BEST, cur); show(Number(cur) || 0); }
    };
    take(Q.outcomeFor(k));
    const off = Q.onOutcome((kk, o) => { if (kk === k) take(o); }), iv = setInterval(() => { if (!line.isConnected) { clearInterval(iv); off(); } }, 3000);
  }).catch(() => {});
}
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
  // (THE DROP B add-on — Ben: a solo podium after a run that ended on an EMPTY board showed no picture at all: the board string is '' when nothing
  //  stands in the well. Now the well is ALWAYS drawn — the published board, or the empty well — both looks; only a match with no node for the
  //  winner at all (a ghost) keeps the line alone)
  if (str || node || soloOf(game)) {
    const c = h('canvas.pd-fs-board', { 'aria-hidden': 'true' });
    // (PD-6 — THE SOLO PODIUM FITS: a solo run on a short screen (Safari with its toolbars) draws the board at 7-pt cells — 140 pt tall, not 160 —
    //  so the board, the slim card + its score line sit above the foot; read once here, never in a frame loop)
    // (THE END-BOARD SWITCH-ON: SCORE RUSH carries THE END-SCREEN BOARD under it — on a short screen a MATCH's winning board drops to 5-pt cells — a solo run keeps PD-6's 7)
    const tall = typeof innerHeight === 'number' && innerHeight >= 760, short = soloOf(game) && !tall, rushEb = rushOf(game) && !tall;
    // (SKINS 1: the board in THE MATCH's skin — the match's counter on this phone's pool for its look (skins.js#skinOf): what the match was played in)
    drawMini(c, str, null, { cell: short ? 7 : rushEb ? 5 : 8, skin: skinOf(game, document.body.dataset.look === 'day' ? 'day' : 'night', phoneOf(settings)) });
    moment.append(h('div.pd-fs-frame', c));
  }
  moment.append(h('div.pd-fs-line',
    h('small', soloOf(game) ? 'YOUR LAST BOARD' : 'THE WINNING BOARD'),
    h('b', w.name),
    h('span', momentLine(game, top.uid))));
  // SCORE RUSH (THE END-BOARD SWITCH-ON): the shared block shows the top 3 — the body keeps its moment + YOUR BEST
  const mine = !!(game.participants && game.participants[me]);
  if (rushOf(game)) { el.dataset.eb = '1'; const best = h('div.pd-fs-best'); if (!(rows.length >= 2 && rows.every(r => r.rank === 1))) el.append(moment); if (mine) { el.append(best); rushBest(best, game, state); } return; }
  // the top 3 as the console's slim cards (the frame's list starts at 4th); a name → THE PLAYER PAGE
  const pick = rows.slice(0, 3);
  const list = leaderboard(pick, players, { me, stagger: 90 });
  list.classList.add('pd-fs-top');
  list.addEventListener('click', e => {
    const li = e.target.closest('li');
    const r = li && pick[[...list.children].indexOf(li)];
    const who = r && players[r.uid];
    if (!who || !who.pid) return;
    lazyImport(import('../../profile/player-page.js'), '../../profile/player-page.js').then(m => m.openPlayer({ pid: who.pid, row: { n: who.name, a: who.avatar, c: who.color } })).catch(() => {});
  });
  [...list.children].forEach((li, i) => { const who = players[pick[i].uid]; if (who && who.pid) { li.classList.add('is-open'); li.setAttribute('role', 'button'); li.setAttribute('aria-label', `${who.name} — their card`); } });
  // (B4: everyone tied — nobody won, so no WINNING BOARD: the top cards alone)
  const tie = rows.length >= 2 && rows.every(r => r.rank === 1);
  el.append(...(tie ? [list] : [moment, list]));
}

/** the console's podium frame (ui/final.js) with PRISM's rows → its body comes from finalScene (index.js) */
export function buildFinal({ game, st, me }) {
  const rush = rushOf(game), surv = survOf(game);
  const finalView = createFinal({
    rows: finalRows(game), players: st.players, me, presence: st.presence, scoreLabel: rush ? 'PTS' : surv ? 'TIME' : 'KO',
    kicker: rush ? 'SCORE RUSH · FINAL' : surv ? 'SURVIVAL · FINAL' : 'BATTLE · FINAL', mode: endMode('prism', rush ? 'rush' : surv ? 'survival' : 'battle', soloOf(game)),   // (CITY PART 2 — THE END NEON's header; J1: its MODE — PRISM DROP · SCORE RUSH)
    winnerLine: nm => (rush ? `${nm} TOPS THE SONG` : surv ? `${nm} OUTLASTED EVERYONE` : `${nm} IS THE LAST ONE STANDING`),
  });
  return { finalView, wrap: h('div.pd-final', finalView.el) };
}
