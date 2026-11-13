// PRISM DROP — SHARE YOUR RUN (PLAY NOW's add-on, Nov 13 noon): a solo run's card (js/games/kit/share-run.js draws the frame): the FINAL
// BOARD — the same published board "YOUR LAST BOARD" draws (victory.js), in the look played (night tubes · the day's crayon) — the mode
// (SCORE RUSH / SURVIVAL), the result (SURVIVED 1:52 · 14 LINES / the points), the name. Lazy (index.js#shareRun — the first SHARE).
import { runCard, shareRunCard } from '../kit/share-run.js';
import { momentLine } from './victory.js';
import { drawMini } from './board.js';
import { W, VISIBLE } from './engine.js';
import { ACCENT } from './meta.js';

/** PURE: the card's inputs from the match's PUBLIC fields — the mode, this player's line, their display name, their published board */
export function prismRunCard(game, { uid, name, board, look }) {
  const mode = game && game.settings && game.settings.mode;
  return runCard({ game: 'prism', title: 'PRISM DROP', mode: mode === 'rush' ? 'SCORE RUSH' : mode === 'survival' ? 'SURVIVAL' : 'BATTLE',
    name, result: momentLine(game, uid), board: board || null, look, accent: ACCENT });
}
/** the middle: the board in a lit frame */
export function drawBoardMiddle(c, box, card) {
  const day = card.look === 'day';
  const ch = box.h - 40, cw = ch * W / VISIBLE, x = box.x + (box.w - cw) / 2, y = box.y + 20;
  c.save();
  c.fillStyle = day ? 'rgba(255,255,255,0.55)' : 'rgba(6,8,22,0.92)';
  c.strokeStyle = day ? 'rgba(40,46,70,0.6)' : 'rgba(143,216,255,0.75)'; c.lineWidth = 4;
  if (!day) { c.shadowColor = '#8fd8ff'; c.shadowBlur = 26; }
  c.beginPath(); c.roundRect(x - 14, y - 14, cw + 28, ch + 28, 22); c.fill(); c.stroke();
  c.restore();
  if (card.board) {
    const t = document.createElement('canvas');
    drawMini(t, card.board, null, { cell: 36, look: day ? 'crayon' : 'neon' });
    c.drawImage(t, x, y, cw, ch);
  } else {
    c.save(); c.textAlign = 'center'; c.font = '700 34px "Chakra Petch", system-ui, sans-serif'; c.fillStyle = day ? '#4a5170' : '#b9c4ff';
    c.fillText('A CLEAN FINISH', x + cw / 2, y + ch / 2); c.restore();
  }
}
/** SHARE: this phone's run (the podium's SHARE — the console asks index.js#shareRun) */
export function shareRun(game, state) {
  const uid = state && state.uid;
  const node = state && state.live && state.live.boards && state.live.boards[uid];
  const me = (state && state.players && state.players[uid]) || {};
  const look = typeof document !== 'undefined' && document.body.dataset.look === 'day' ? 'day' : 'night';
  return shareRunCard(prismRunCard(game, { uid, name: me.name, board: node && node.b, look }), drawBoardMiddle);
}
