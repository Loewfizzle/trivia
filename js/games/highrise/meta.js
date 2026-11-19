// HIGH RISE — THE THIN META (S4A — docs/highrise.md "THE CARTRIDGE"; docs/cartridge.md D1): what the console reads before a match. PURE + tiny,
// no imports. HIDDEN: config.js GAMES row `playable: false` + `preview` — THE OWNER'S LIVE TEST only (his phone's PLAY shelf / his room's
// list say HIGH RISE · TEST; nobody else is ever offered it); no meta at boot until its go-live (registry.js#META).
// no options: one tower each, the seed picked after GO
export const DEFAULT_SETTINGS = {};
// (one player may start it: SOLO ENDLESS — PLAY NOW comes by this flag)
export const SOLO = true;
// the EVENING station by night, the day deck by day (index.js#musicFor — JAYWALK's rule); this = the podium's + the fallback
export const MUSIC = 'mood:evening';
export const BANNER_NAME = 'HIGH RISE';
// BOTH looks (S3): the console's GAME LOOK (☰ → Settings: AUTO · DAY · NIGHT) paints `body[data-look]`; the stage reads it LIVE
export const LOOKS = ['day', 'night'];
// its end screen names how the tower ended — never the console's winner sting over it
export const OWN_VICTORY_SOUND = true;
// the end screen's colour (END-SCREEN STANDARD A — the frame's bar): the sign's hot pink (css --hi-accent)
export const ACCENT = '#ff4fd8';

export const cleanSettings = () => ({});

export const OPTIONS = [];

/** a run ends when the tower does — a good player's lasts two to three minutes */
export const estimateMinutes = () => 3;

/** THE CARTRIDGE PLUG — the chat's lock: shut while you are dropping slabs, open once your run has ended (its `e`) or you are watching */
export function chatLocked(game, uid, live) {
  if (game.phase !== 'count' && game.phase !== 'play') return false;
  if (!game.participants || !game.participants[uid]) return false;
  const r = live && live.runs ? live.runs[uid] : undefined;
  return !(r && r.e);
}
