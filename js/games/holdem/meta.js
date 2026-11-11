// HOLD'EM — THE THIN META (docs/cartridge.md D1): what the console reads before a match. PURE + tiny, no imports. HE3 (Nov 10 2026):
// the owner's decisions — docs/games/plan.md "HE3". PLAY CHIPS ONLY: no money words anywhere ("CASH" is only the mode's name).
export const MODES = ['tournament', 'cash'];
export const SPEED_KEYS = ['turbo', 'standard', 'deep'];
export const DEFAULT_SETTINGS = { mode: 'tournament', speed: 'turbo' };
export const MIN_PLAYERS = 2;               // (no SOLO, no bots in v1)
export const MAX_PLAYERS = 8;

// the LATE station — a card room after dark (MUSIC BY MOOD: every phone the same song on the server clock)
export const MUSIC = 'mood:late';
export const BANNER_NAME = "HOLD'EM";
// NEON CASINO's gold (the podium frame's main tube); HOLD'EM's 3 skins (HE5–HE6) replace day / night: NIGHT only, the setting shows LOCKED
export const ACCENT = '#f2c14e';
export const LOOKS = ['night'];
// HE5 — ONE winner sound: HOLD'EM plays its own CHAMPION at the tournament's end (sfx.js) — the console's podium sting is skipped
export const OWN_VICTORY_SOUND = true;
// the chat stays open the whole match (HE3 — the owner): its quick replies
export const CHAT_CHIPS = ['NICE HAND', 'NO WAY', 'WELL PLAYED', 'UNLUCKY'];
/** never locked — a card table talks */
export const chatLocked = () => false;

export function cleanSettings(s = {}) {
  const mode = MODES.includes(s.mode) ? s.mode : DEFAULT_SETTINGS.mode;
  const speed = SPEED_KEYS.includes(s.speed) ? s.speed : DEFAULT_SETTINGS.speed;
  return { mode, speed };
}

// (SPEED only matters for a TOURNAMENT: the sheet's `when` reads the player count only, so CASH shows it with the hint — and ignores it)
export const OPTIONS = [
  { key: 'mode', label: 'MODE', type: 'list', choices: [
    { value: 'tournament', label: 'TOURNAMENT', sub: 'Everyone starts even · the blinds climb · last one with chips wins' },
    { value: 'cash', label: 'CASH', sub: 'Play chips · fixed blinds · rebuy at zero · the host ends it' },
  ] },
  { key: 'speed', label: 'SPEED', hint: 'TOURNAMENT ONLY', type: 'list', choices: [
    { value: 'turbo', label: 'TURBO', sub: 'The blinds climb every 90 seconds · about 20 min' },
    { value: 'standard', label: 'STANDARD', sub: 'Every 6 minutes · about 50 min' },
    { value: 'deep', label: 'DEEP', sub: 'Every 15 minutes, bigger stacks · about 1 h 40' },
  ] },
];

/** THE LENGTH STUDY's medians at 6–8 players (docs/holdem.md): TURBO ~20, STANDARD ~50, DEEP ~100 min; CASH has no end time — "OPEN" */
export function estimateMinutes(settings) {
  const s = cleanSettings(settings);
  if (s.mode === 'cash') return 'OPEN';
  return { turbo: 20, standard: 50, deep: 100 }[s.speed];
}
