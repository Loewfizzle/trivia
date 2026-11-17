// JAYWALK — THE THIN META (H1 — docs/jaywalk.md; docs/cartridge.md D1): what the console reads before a match. PURE + tiny, no imports.
// BEING BUILT: config.js GAMES row `playable: false` + `preview: true` — never offered (THE ONE SWITCH stays off until the fix pass).
// ONE LIFE EVERYWHERE (H4 — the owner, Nov 16): one hit = out, in every mode — the lives option is GONE; the game has no options
export const DEFAULT_SETTINGS = {};
// (one player may start it: SOLO ENDLESS — no speed-up, no end; PLAY NOW comes by this flag alone once it is playable)
export const SOLO = true;
// the EVENING station (MUSIC BY MOOD: every phone the same song on the server clock) — its own mix: H6
export const MUSIC = 'mood:evening';
export const BANNER_NAME = 'JAYWALK';
// (H5B — THE DAY LOOK is built: BOTH looks. The console's GAME LOOK setting (☰ → Settings: AUTO · DAY · NIGHT — per phone, AUTO = the
//  real sun) paints `body[data-look]`; the views read it LIVE. H3's night-only lock is lifted: docs/cartridge.md LOOKS)
export const LOOKS = ['day', 'night'];
// (H4 — the owner: PLAY AGAIN everywhere — the console's own word; H3's AGAIN_LABEL 'HOP AGAIN' is gone)
// H3 — its end screen names how you went OUT: never the console's winner sting over it (its own sound = NEW BEST's, victory.js)
export const OWN_VICTORY_SOUND = true;
// H3 — the end screen's colour (the frame's main tube): the signs' pink
export const ACCENT = '#ff4fc4';

export const cleanSettings = () => ({});

export const OPTIONS = [];

/** a match ends when the last player is out — THE MOTHERSHIP (~6 min) takes whoever is left (rare) */
export const estimateMinutes = () => 3;

/** THE CARTRIDGE PLUG — the chat's lock: shut while you are hopping (count + play), open once your run has ended or you are watching */
export function chatLocked(game, uid, live) {
  if (game.phase !== 'count' && game.phase !== 'play') return false;
  if (!game.participants || !game.participants[uid]) return false;
  const r = live && live.runs ? live.runs[uid] : undefined;
  return !(r && r.e);
}
