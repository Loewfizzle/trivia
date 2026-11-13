// OVERCLOCK — SHARE YOUR RUN (PLAY NOW's add-on, Nov 13 noon): a solo run's card on the same frame (js/games/kit/share-run.js): the score as
// the hero + "POINTS", the result line (7 OF 10 CHALLENGES RIGHT), the mode, the name. Lazy (index.js#shareRun — the first SHARE).
import { runCard, shareRunCard } from '../kit/share-run.js';
import { totals } from './logic.js';
import { ACCENT } from './meta.js';
import { fmtNum } from '../../ui/components.js';

/** PURE: the card's inputs from the match's PUBLIC fields — the mode, this player's total, the challenges they got right, their display name */
export function ocRunCard(game, { uid, name, look }) {
  const res = (game && game.results) || {}, n = Array.isArray(game && game.order) ? game.order.length : Object.keys(res).length;
  const right = Object.values(res).filter(r => r && r[uid] && (r[uid].ok === true || (r[uid].pts || 0) > 0)).length;
  const score = (totals(game || {})[uid]) || 0, mode = game && game.settings && game.settings.mode;
  return runCard({ game: 'overclock', title: 'OVERCLOCK', mode: mode === 'standard' ? 'STANDARD' : mode === 'marathon' ? 'MARATHON' : 'QUICK', name, big: fmtNum(score), bigUnit: 'POINTS',
    result: `${right} OF ${n} CHALLENGE${n === 1 ? '' : 'S'} RIGHT`, look, accent: ACCENT });
}
/** the middle: the score, big, in the game's orange */
export function drawScoreMiddle(c, box, card) {
  const day = card.look === 'day', cx = box.x + box.w / 2;
  c.save(); c.textAlign = 'center';
  c.font = 'italic 900 230px "Barlow Condensed", "Chakra Petch", system-ui, sans-serif';
  c.fillStyle = card.accent; if (!day) { c.shadowColor = card.accent; c.shadowBlur = 40; }
  c.fillText(card.big || '0', cx, box.y + box.h * 0.58);
  c.shadowBlur = 0; c.font = '800 54px "Orbitron", "Chakra Petch", system-ui, sans-serif'; try { c.letterSpacing = '14px'; } catch { /* fine */ }
  c.fillStyle = day ? '#2f3653' : '#ffe2cc'; c.fillText(card.bigUnit || 'POINTS', cx + 7, box.y + box.h * 0.58 + 90);
  c.restore();
}
export function shareRun(game, state) {
  const uid = state && state.uid, me = (state && state.players && state.players[uid]) || {};
  const look = typeof document !== 'undefined' && document.body.dataset.look === 'day' ? 'day' : 'night';
  return shareRunCard(ocRunCard(game, { uid, name: me.name, look }), drawScoreMiddle);
}
