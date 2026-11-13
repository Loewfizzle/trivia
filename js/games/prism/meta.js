// PRISM DROP — THE THIN META (docs/cartridge.md): what the console reads at boot. PURE + tiny; logic.js + index.js take these from here.
export const MODES = ['battle', 'rush', 'survival'];
export const DEFAULT_SETTINGS = { mode: 'battle' };
export const MIN_PLAYERS = 2;
// (PD-2 — THE SOLO LANE: one player may start SCORE RUSH or SURVIVAL; BATTLE needs 2 — cleanSettings(s, players))
export const SOLO = true;
export const SOLO_MODES = ['rush', 'survival'];
// (PD-6: the card's solo tubes — THE DROP stays a daily)
export const SOLO_RUNS = [{ mode: 'rush', label: 'SCORE RUSH', sub: 'ONE SONG' }, { mode: 'survival', label: 'SURVIVAL', sub: 'UNTIL YOU TOP OUT' }];

export const MUSIC = null;                 // (the songs are the music)
export const BANNER_NAME = 'PRISM DROP';
// (PD-1: the podium frame's tube in PRISM's spectral cyan)
export const ACCENT = '#8fd8ff';

/** players (optional): one player never plays BATTLE (→ SCORE RUSH) */
export function cleanSettings(s = {}, players = 0) {
  let mode = MODES.includes(s.mode) ? s.mode : DEFAULT_SETTINGS.mode;
  if (players === 1 && !SOLO_MODES.includes(mode)) mode = SOLO_MODES[0];
  return { mode };
}

export const OPTIONS = [
  { key: 'mode', label: 'MODE', type: 'list', choices: [
    { value: 'battle', label: 'BATTLE', sub: 'Clear lines to attack your friends — last one standing wins', when: n => n >= 2 },
    { value: 'rush', label: 'SCORE RUSH', sub: 'No attacks — one song, highest score wins' },
    { value: 'survival', label: 'SURVIVAL', sub: 'Junk rises for everyone, faster and faster — last one standing wins' },
  ] },
];

export function estimateMinutes(settings, songMinutes = 3.2) {
  const m = cleanSettings(settings).mode;
  return m === 'rush' ? Math.round(songMinutes + 1) : m === 'survival' ? 3 : 5;
}

/** THE CARTRIDGE PLUG — the chat's lock: shut while your board is in play (count + play), open once you're out or watching */
export function chatLocked(game, uid, live) {
  if (game.phase !== 'count' && game.phase !== 'play') return false;
  if (game.out && game.out[uid]) return false;
  const n = live && live.boards ? live.boards[uid] : undefined;
  return !(n && n.st === 'out');
}
