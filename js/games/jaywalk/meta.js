// JAYWALK — THE THIN META (H1 — docs/jaywalk.md; docs/cartridge.md D1): what the console reads before a match. PURE + tiny, no imports.
// BEING BUILT: config.js GAMES row `playable: false` + `preview: true` — never offered (THE ONE SWITCH stays off until the fix pass).
export const LIVES = [3, 1];
export const DEFAULT_SETTINGS = { lives: 3 };
// (one player may start it: SOLO ENDLESS — 1 life, no speed-up, no end; PLAY NOW comes by this flag alone once it is playable)
export const SOLO = true;
// the EVENING station (MUSIC BY MOOD: every phone the same song on the server clock) — its own mix: H6
export const MUSIC = 'mood:evening';
export const BANNER_NAME = 'JAYWALK';
// (H3: ONE look until the day look is built — H5 adds 'day' back and the GAME LOOK setting returns by itself; the console paints NIGHT + says
//  NIGHT · LOCKED in Settings while a run is on: docs/cartridge.md LOOKS)
export const LOOKS = ['night'];
// H3 — the solo podium's first button says HOP AGAIN (the console's default: PLAY AGAIN) — ui/final.js reads it
export const AGAIN_LABEL = 'HOP AGAIN';
// H3 — its end screen names how you went OUT: never the console's winner sting over it (its own sound = NEW BEST's, victory.js)
export const OWN_VICTORY_SOUND = true;
// H3 — the end screen's colour (the frame's main tube): the signs' pink
export const ACCENT = '#ff4fc4';

/** players (optional): one player = SOLO ENDLESS, always 1 life */
export function cleanSettings(s = {}, players = 0) {
  const n = Number(s && s.lives);
  return { lives: players === 1 ? 1 : LIVES.includes(n) ? n : DEFAULT_SETTINGS.lives };
}

export const OPTIONS = [
  { key: 'lives', label: 'LIVES', type: 'list', choices: [
    { value: 3, label: '3 LIVES', sub: 'A hit puts you back on your feet — twice' },
    { value: 1, label: '1 LIFE', sub: 'One hit and you are out' },
  ] },
];

/** a match ends at THE MOTHERSHIP (~6 min) */
export const estimateMinutes = () => 6;

/** THE CARTRIDGE PLUG — the chat's lock: shut while you are hopping (count + play), open once your run has ended or you are watching */
export function chatLocked(game, uid, live) {
  if (game.phase !== 'count' && game.phase !== 'play') return false;
  if (!game.participants || !game.participants[uid]) return false;
  const r = live && live.runs ? live.runs[uid] : undefined;
  return !(r && r.e);
}
