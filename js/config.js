// Global constants. Change APP_NAME here to rebrand the whole site.
export const APP_NAME = 'NEON DISTRICT';
export const APP_TAGLINE = 'four minds // one signal';
export const APP_VERSION = '1.1.0';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const NAME_MAX = 12;

// Room codes: 4 letters, no confusing glyphs (no I, O — and no digits at all).
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const CODE_LENGTH = 4;

// Host migration: a host that is offline (or silent during a game) this long is replaced.
export const HOST_TIMEOUT_MS = 10_000;
// Extra wait per rank so the 2nd candidate only claims if the 1st one is also stuck.
export const HOST_CANDIDATE_STAGGER_MS = 4_000;
export const HOST_BEAT_MS = 2_000;
// Director (host game loop) tick.
export const DIRECTOR_TICK_MS = 250;

// A room closes after an hour without a game: meta/activeAt is stamped when a game starts / ends (and every
// 10 min while one runs), so a lobby nobody plays in goes stale. Phones coming back to it land on the title.
export const ROOM_IDLE_MS = 60 * 60 * 1000;
// The lobby shows a countdown (and the host a KEEP OPEN button) this long before it closes.
export const ROOM_IDLE_WARN_MS = 10 * 60 * 1000;
// Rooms idle longer than this are deleted when someone creates a room (the rules allow it after ROOM_IDLE_MS).
export const ROOM_TTL_MS = ROOM_IDLE_MS;

export const COLORS = [
  { id: 'cyan', hex: '#00f0ff' },
  { id: 'magenta', hex: '#ff2bd6' },
  { id: 'yellow', hex: '#f3ff3a' },
  { id: 'green', hex: '#3dff8b' },
  { id: 'orange', hex: '#ff8c1a' },
  { id: 'violet', hex: '#a66bff' },
  { id: 'red', hex: '#ff3355' },
  { id: 'blue', hex: '#3d7bff' },
];
export const colorHex = id => (COLORS.find(c => c.id === id) || COLORS[0]).hex;

// Stroke icons on a 24x24 grid (fill none, stroke currentColor).
export const AVATARS = {
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7l1-8z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  diamond: 'M12 2l9 10-9 10-9-10z M12 7l4.5 5-4.5 5-4.5-5z',
  hex: 'M12 2l8.66 5v10L12 22l-8.66-5V7z M12 8v8',
  ghost: 'M5 21V10a7 7 0 0 1 14 0v11l-3-2-2 2-2-2-2 2-2-2zM9.5 10h.01M14.5 10h.01',
  crown: 'M3 19h18M3 16 2 6l6 5 4-7 4 7 6-5-1 10z',
  star: 'M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z',
  cube: 'M12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10',
  alien: 'M12 2c5 0 8 3.5 8 8 0 5-5 12-8 12S4 15 4 10c0-4.5 3-8 8-8zM7 10.5l3.5 2M17 10.5l-3.5 2',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8zM12 12h.01',
  wave: 'M2 12h3l2-6 4 12 3-9 2 3h6',
};
export const AVATAR_IDS = Object.keys(AVATARS);

// Game registry metadata (UI + availability). Logic lives in js/games/<id>/.
export const GAMES = [ // lobby order
  { id: 'slip', name: 'SLIPSTREAM', theme: 'slip', tag: 'SURVIVAL RIDE', blurb: 'One seeded course, everyone at once. Dive, fly, flip. Last rider riding wins.', playable: true },
  { id: 'prism', name: 'PRISM DROP', theme: 'prism', tag: 'FALLING-BLOCK BATTLE', blurb: 'Clear lines to the beat. Bury your rivals in junk — or race the song.', playable: true },
  { id: 'overclock', name: 'OVERCLOCK', theme: 'overclock', tag: 'MIND GAUNTLET', blurb: 'Rapid 30-second brain spikes. Live leaderboard.', playable: true },
  { id: 'golf', name: 'NEON PAR', theme: 'golf', tag: 'MINI GOLF', blurb: 'Nine neon holes at once. Ghost balls, power-ups, sabotage.', playable: true },
  { id: 'agent', name: 'DOUBLE AGENT', theme: 'agent', tag: 'SOCIAL DEDUCTION · 4–8', blurb: 'One of you doesn’t know the word. Find the leak.', playable: true },
  { id: 'pulse', name: 'PULSE', theme: 'pulse', tag: 'RHYTHM RUN', blurb: 'The road is the beat. Hit every note, chase the combo.', playable: true },
  { id: 'cipher', name: 'CIPHER BREACH', theme: 'cipher', tag: 'WORD RACE', blurb: 'Same hidden word. Everyone races. Watch their boards light up.', playable: true },
  { id: 'signal', name: 'LAST SIGNAL', theme: 'signal', tag: 'TRIVIA ROYALE', blurb: '100 HP. Answer fast, strike a rival. Last one standing.', playable: true },
  { id: 'bluff', name: 'NEURAL BLUFF', theme: 'bluff', tag: 'BLUFF TRIVIA', blurb: 'Fake the truth. Spot the truth. The Ministry is watching.', playable: true },
];
