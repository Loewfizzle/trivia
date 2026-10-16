// NEON PAR course table: what the lobby, director and rules need at startup (names, zones, pars, modes).
// The hole geometry (holes/*.js) and the physics load only with the golf view. tests/golf-game.test.mjs
// checks that this table matches the hole files.
export const MAX_STROKES = 6;
export const COURSE = [ // hole number - 1
  { id: 'first-light', name: 'FIRST LIGHT', zone: 'rooftops', par: 2 },
  { id: 'dogleg', name: 'DOGLEG', zone: 'rooftops', par: 3 },
  { id: 'leap', name: 'THE LEAP', zone: 'rooftops', par: 3 },
  { id: 'portal-hop', name: 'PORTAL HOP', zone: 'cyber', par: 3 },
  { id: 'laser-gate', name: 'LASER GATE', zone: 'cyber', par: 3 },
  { id: 'bit-rot', name: 'BIT ROT', zone: 'cyber', par: 3 },
  { id: 'bumper-alley', name: 'BUMPER ALLEY', zone: 'arcade', par: 3 },
  { id: 'ferry', name: 'THE FERRY', zone: 'arcade', par: 3 },
  { id: 'overdrive', name: 'OVERDRIVE', zone: 'arcade', par: 4 },
];
export const ZONES = {
  rooftops: { name: 'ROOFTOPS', kicker: 'ZONE 1', music: 'golf-rooftops' },
  cyber: { name: 'CYBERSPACE', kicker: 'ZONE 2', music: 'golf-cyber' },
  arcade: { name: 'NEON ARCADE', kicker: 'ZONE 3', music: 'golf-arcade' },
};
// Hole numbers (1-based) played in each mode
export const MODES = { full: [1, 2, 3, 4, 5, 6, 7, 8, 9], quick6: [1, 3, 4, 5, 7, 9], quick3: [1, 4, 7] };
export const courseHole = n => COURSE[n - 1];
