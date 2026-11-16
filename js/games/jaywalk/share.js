// JAYWALK — SHARE YOUR RUN (H3): a solo run's card on the site's share kit, exactly as the other games (js/games/kit/share-run.js — the
// sign, the game, the middle, the name, the result, the site; drawn ON THE PHONE, built from the result's PUBLIC fields only): the lanes
// as the hero + "LANES", the result line "143 LANES" → "My JAYWALK run — 143 LANES · https://neonspeakeasy.com". Lazy (index.js#shareRun).
import { runCard, shareRunCard } from '../kit/share-run.js';
import { spacedText } from '../../daily/share.js';
import { ACCENT } from './meta.js';

/** PURE: the card's inputs — this player's lanes (the host's replay of their own log), their display name */
export function jwRunCard(game, { uid, name }) {
  const lanes = Math.max(0, Math.floor(Number((((game && game.results) || {})[uid] || {}).l) || 0)), unit = lanes === 1 ? 'LANE' : 'LANES';
  return runCard({ game: 'jaywalk', title: 'JAYWALK', mode: 'SOLO', name, big: lanes.toLocaleString('en-US'), bigUnit: unit, result: `${lanes.toLocaleString('en-US')} ${unit}`, look: 'night', accent: ACCENT });
}
/** the middle: the lanes, big, in the signs' pink */
export function drawLanesMiddle(c, box, card) {
  const cx = box.x + box.w / 2;
  c.save(); c.textAlign = 'center';
  c.font = '900 250px "Orbitron", "Chakra Petch", system-ui, sans-serif';
  c.fillStyle = '#fff3fb'; c.shadowColor = card.accent; c.shadowBlur = 46;
  c.fillText(card.big || '0', cx, box.y + box.h * 0.58);
  c.shadowBlur = 0; c.font = '800 54px "Orbitron", "Chakra Petch", system-ui, sans-serif';
  c.fillStyle = '#ffd6f0'; spacedText(c, card.bigUnit || 'LANES', cx + 7, box.y + box.h * 0.58 + 92, 14);
  c.restore();
}
export function shareRun(game, state) {
  const uid = state && state.uid, me = (state && state.players && state.players[uid]) || {};
  return shareRunCard(jwRunCard(game, { uid, name: me.name }), drawLanesMiddle);
}
