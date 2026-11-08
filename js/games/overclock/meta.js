// OVERCLOCK — THE THIN META (docs/cartridge.md D1): what the console reads before a match. PURE + tiny (in the boot graph). THE TIMINGS ARE
// THE OWNER's (Nov 4) — never change them; tests/overclock-oc1.test.mjs pins every one.
export const CHALLENGE_MS = 30_000;
export const READY_MS = 3_200;
export const STANDINGS_MS = 8_000;          // the round's ranking, then the race (ROUND_STAGE_MS before the end it becomes the leaderboard)
export const MODES = { quick: 6, standard: 12, marathon: 24 };
export const DEFAULT_SETTINGS = { mode: 'quick' };

// the EVENING station (OC1 — docs/overclock.md); audio/music/overclock.mp3 stays, unused
export const MUSIC = 'mood:evening';
export const SOLO = true;
export const BANNER_NAME = 'OVERCLOCK';
// NIGHT only (the OVERDRIVE skin) — a DAY skin later = ['day', 'night']
export const LOOKS = ['night'];
// FRIENDS B — the END SCREEN in OVERDRIVE's molten orange (the console frame's main tube); the body's fanfare is the winner sound (B2:
// the console's sting skipped — no double sound)
export const ACCENT = '#ff6a1a';
export const OWN_VICTORY_SOUND = true;

export const OPTIONS = [
  { key: 'mode', label: 'MODE', type: 'list', choices: [
    { value: 'quick', label: `QUICK · ${MODES.quick}`, sub: 'Six different challenges · about 4 min' },
    { value: 'standard', label: `STANDARD · ${MODES.standard}`, sub: 'Twelve different challenges' },
    { value: 'marathon', label: `MARATHON · ${MODES.marathon}`, sub: 'Every challenge, plus a few repeats' },
  ] },
];

export function estimateMinutes(s) {
  const n = MODES[s.mode] || MODES.quick;
  return Math.round((n * (CHALLENGE_MS * 0.8 + READY_MS + STANDINGS_MS + 1500)) / 60000);
}

/** no chat for a participant the whole match, until the podium (the owner, Nov 5); no CHAT_CHIPS */
export function chatLocked(game) {
  return !!game && game.phase !== 'final';
}
