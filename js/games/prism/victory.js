// PRISM DROP — THE END OF THE MATCH (PD-1, split out of view.js): the podium for the final phase.
import { h } from '../../ui/dom.js';
import { createFinal } from '../../ui/final.js';
import { reportPanel, ordinal } from '../kit/index.js';
import { standings, CLEAR_NAME } from './logic.js';

const rushOf = game => !!(game && game.settings && game.settings.mode === 'rush');

/** the line under a player on the podium */
export function noteFor(game, uid) {
  const r = (game.results && game.results[uid]) || {};
  if (rushOf(game)) return `${r.ln || 0} LINES · LV ${r.lv || 1} · COMBO ${r.mc || 0}`;
  return `${r.ko || 0} KO · ${r.se || 0} SENT · ${r.bd || 0} BADGES`;
}

function resultsPanel(game, me, player) {
  const rush = rushOf(game);
  const res = game.results || {};
  return reportPanel({
    prefix: 'pd', title: rush ? 'SONG RESULTS' : 'BATTLE REPORT', calls: game.calls, player, showCalls: !rush,
    head: rush ? ['SCORE', 'LINES', 'LEVEL', 'MAX COMBO'] : ['PLACE', 'KOs', 'BADGES', 'SENT', 'COMBO', 'BEST'],
    rows: standings(game).map(r => {
      const x = res[r.uid] || {};
      const p = player(r.uid);
      const cells = rush
        ? [(x.sc || 0).toLocaleString('en-US'), x.ln || 0, x.lv || 1, x.mc || 0]
        : [ordinal(r.rank), x.ko || 0, x.bd || 0, x.se || 0, x.mc || 0, x.best ? (CLEAR_NAME[x.best] || '').replace('CLEAR', '').trim() || '—' : '—'];
      return { uid: r.uid, name: p.name, color: p.color, me: r.uid === me, cells };
    }),
  });
}

/** the console's podium frame (ui/final.js) with PRISM's rows → { el, refresh, destroy } */
export function buildFinal({ game, st, me, player }) {
  const rush = rushOf(game);
  const rows = standings(game).map(r => ({ ...r, score: rush ? r.score : ((game.results && game.results[r.uid] && game.results[r.uid].ko) || 0), note: noteFor(game, r.uid) }));
  const finalView = createFinal({
    rows, players: st.players, me, presence: st.presence, scoreLabel: rush ? 'PTS' : 'KO',
    kicker: rush ? 'SCORE RUSH · FINAL' : 'BATTLE · FINAL',
    winnerLine: nm => (rush ? `${nm} TOPS THE SONG` : `${nm} IS THE LAST ONE STANDING`),
    extra: resultsPanel(game, me, player),
  });
  return { finalView, wrap: h('div.pd-final', finalView.el) };
}
