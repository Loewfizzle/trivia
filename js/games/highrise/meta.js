// HIGH RISE — THE THIN META (docs/highrise.md "THE CARTRIDGE"; docs/cartridge.md D1). PURE, no imports; at boot since THE GO-LIVE.
export const DEFAULT_SETTINGS = {};
export const SOLO = true;
// (index.js#musicFor picks by look; this = the podium's + the fallback)
export const MUSIC = 'mood:evening';
export const BANNER_NAME = 'HIGH RISE';
export const LOOKS = ['day', 'night'];
export const OWN_VICTORY_SOUND = true;
export const ACCENT = '#ff4fd8';
export const cleanSettings = () => ({});
export const OPTIONS = [];
export const estimateMinutes = () => 3;
/** the chat's lock: shut while you drop slabs, open once your run ended (its `e`) or you watch */
export function chatLocked(game, uid, live) {
  if (game.phase !== 'count' && game.phase !== 'play') return false;
  if (!game.participants || !game.participants[uid]) return false;
  const r = live && live.runs ? live.runs[uid] : undefined;
  return !(r && r.e);
}
