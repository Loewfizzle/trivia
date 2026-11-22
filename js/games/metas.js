// THE ONE META MODULE (CITY PART 1 — docs/cartridge.md "THE ONE META MODULE"): every PLAYABLE game's thin meta, ONE ROW each — the only
// game data at boot (registry.js reads META). A game's own meta.js re-exports its row (its cartridge, core + the server import it there).
// A NEW GAME = A ROW here + its one-line meta.js — never a new boot module. PURE, no imports. Each row's long notes: docs/cartridge.md.
const OC_MODES = { quick: 6, standard: 12, marathon: 24 }, OC_CH = 30_000, OC_READY = 3_200, OC_ST = 8_000;
const PR_MODES = ['battle', 'rush', 'survival'], PR_DEF = { mode: 'battle' }, PR_SOLO = ['rush', 'survival'];
const prClean = (s = {}, players = 0) => { let mode = PR_MODES.includes(s.mode) ? s.mode : PR_DEF.mode; if (players === 1 && !PR_SOLO.includes(mode)) mode = PR_SOLO[0]; return { mode }; };
const HE_MODES = ['tournament', 'cash'], HE_SPEEDS = ['turbo', 'standard', 'deep'], HE_DEF = { mode: 'tournament', speed: 'turbo' }, HE_END = 3;
const heClean = (s = {}) => ({ mode: HE_MODES.includes(s.mode) ? s.mode : HE_DEF.mode, speed: HE_SPEEDS.includes(s.speed) ? s.speed : HE_DEF.speed });
const HE_LENGTHS = { turbo: { 2: 11, 4: 15, 6: 19, 8: 20 }, standard: { 2: 31, 4: 41, 6: 46, 8: 54 }, deep: { 2: 42, 4: 67, 6: 95, 8: 111 } };
// (JAYWALK + HIGH RISE: shut while your run is live (count + play), open once it ended (its `e`) or you watch)
const runLocked = (game, uid, live) => { if (game.phase !== 'count' && game.phase !== 'play') return false; if (!game.participants || !game.participants[uid]) return false; const r = live && live.runs ? live.runs[uid] : undefined; return !(r && r.e); };

// (CITY PART 2 — THE END NEON: NEON = the end screen's coloured neon, ONE row per game — name: [[word, colour, its outer glow]…] (the game's
//  sign colours) · mode: '· SOLO / · MATCH' softer · line: the RESULT line (the accent) · day: paint inks where the end stands on a light ground
//  — ui/fin-neon.js reads it; docs/match-kit.md "THE END NEON")
export const META = Object.freeze({
  // OVERCLOCK — THE TIMINGS ARE THE OWNER's (Nov 4): never change them (tests/overclock-oc1.test.mjs pins every one)
  overclock: Object.freeze({
    CHALLENGE_MS: OC_CH, READY_MS: OC_READY, STANDINGS_MS: OC_ST, MODES: OC_MODES, DEFAULT_SETTINGS: { mode: 'quick' },
    MUSIC: 'mood:evening', SOLO: true, BANNER_NAME: 'OVERCLOCK', LOOKS: ['night'], ACCENT: '#ff6a1a', OWN_VICTORY_SOUND: true, NEON: { name: [['OVERCLOCK', '#ff6a1a', '#ff3d00']], mode: ['#ffc29a', '#ff7a2a'], line: ['#ff6a1a', '#ff3d00'] },
    OPTIONS: [{ key: 'mode', label: 'MODE', type: 'list', choices: [
      { value: 'quick', label: `QUICK · ${OC_MODES.quick}`, sub: 'Six different challenges · about 4 min' },
      { value: 'standard', label: `STANDARD · ${OC_MODES.standard}`, sub: 'Twelve different challenges' },
      { value: 'marathon', label: `MARATHON · ${OC_MODES.marathon}`, sub: 'Every challenge, plus a few repeats' },
    ] }],
    estimateMinutes: s => Math.round(((OC_MODES[s.mode] || OC_MODES.quick) * (OC_CH * 0.8 + OC_READY + OC_ST + 1500)) / 60000),
    chatLocked: game => !!game && game.phase !== 'final',   // (no chat the whole match, until the podium — the owner, Nov 5)
  }),
  prism: Object.freeze({
    MODES: PR_MODES, DEFAULT_SETTINGS: PR_DEF, MIN_PLAYERS: 2, SOLO: true, SOLO_MODES: PR_SOLO,
    SOLO_RUNS: [{ mode: 'rush', label: 'SCORE RUSH', sub: 'ONE SONG' }, { mode: 'survival', label: 'SURVIVAL', sub: 'UNTIL YOU TOP OUT' }],
    MUSIC: null, BANNER_NAME: 'PRISM DROP', ACCENT: '#8fd8ff', NEON: { name: [['PRISM DROP', '#8fd8ff', '#2aa8ff']], mode: ['#cfe3ff', '#6a9cff'], line: ['#8fd8ff', '#2aa8ff'], modes: { rush: 'SCORE RUSH', battle: 'BATTLE', survival: 'SURVIVAL' }, day: { name: ['#1d5aa6'], mode: '#4a5670', line: '#1d5aa6', gold: '#7a4f00' } }, cleanSettings: prClean,
    OPTIONS: [{ key: 'mode', label: 'MODE', type: 'list', choices: [
      { value: 'battle', label: 'BATTLE', sub: 'Clear lines to attack your friends — last one standing wins', when: n => n >= 2 },
      { value: 'rush', label: 'SCORE RUSH', sub: 'No attacks — one song, highest score wins' },
      { value: 'survival', label: 'SURVIVAL', sub: 'Junk rises for everyone, faster and faster — last one standing wins' },
    ] }],
    estimateMinutes: (settings, songMinutes = 3.2) => { const m = prClean(settings).mode; return m === 'rush' ? Math.round(songMinutes + 1) : m === 'survival' ? 3 : 5; },
    chatLocked: (game, uid, live) => { if (game.phase !== 'count' && game.phase !== 'play') return false; if (game.out && game.out[uid]) return false; const n = live && live.boards ? live.boards[uid] : undefined; return !(n && n.st === 'out'); },
  }),
  // HOLD'EM — PLAY CHIPS ONLY: no money words anywhere ("CASH" is only the mode's name)
  holdem: Object.freeze({
    MODES: HE_MODES, SPEED_KEYS: HE_SPEEDS, DEFAULT_SETTINGS: HE_DEF, MIN_PLAYERS: 2, MAX_PLAYERS: 8,
    MUSIC: 'mood:late', BANNER_NAME: "HOLD'EM", ACCENT: '#f2c14e', NEON: { name: [["HOLD'EM", '#ff5a64', '#ff1f3d']], mode: ['#ffb6ba', '#ff5a64'], line: ['#ff5a64', '#ff1f3d'], modes: { cash: 'CASH', tournament: 'TOURNAMENT' } }, LOOKS: ['night'], OWN_VICTORY_SOUND: true,
    CHAT_CHIPS: ['NICE HAND', 'NO WAY', 'WELL PLAYED', 'UNLUCKY'], chatLocked: () => false, END_HANDS: HE_END,
    endGameLine: node => {
      const get = k => { try { return JSON.parse(node && node.m && node.m[k]); } catch { return null; } };
      if (!node || !node.m || get('ended')) return null;
      if (get('mode') === 'cash') return 'Ends the session · the ledger · XP from 10 hands';
      return (Number(get('hands')) || 0) >= HE_END ? 'Places by chip count · XP for everyone' : `Under ${HE_END} hands — NO RESULT for anyone`;
    },
    cleanSettings: heClean,
    OPTIONS: [
      { key: 'mode', label: 'MODE', type: 'list', choices: [
        { value: 'tournament', label: 'TOURNAMENT', sub: 'Everyone starts even · the blinds climb · last one with chips wins' },
        { value: 'cash', label: 'CASH', sub: 'Play chips · fixed blinds · rebuy at zero · the host ends it' },
      ] },
      { key: 'speed', label: 'SPEED', hint: 'TOURNAMENT ONLY', type: 'list', choices: [
        { value: 'turbo', label: 'TURBO', sub: 'The blinds climb every 90 seconds · 10–20 min' },
        { value: 'standard', label: 'STANDARD', sub: 'Every 6 minutes · 30–55 min' },
        { value: 'deep', label: 'DEEP', sub: 'Every 15 minutes, bigger stacks · 40 min – 2 h' },
      ] },
    ],
    LENGTHS: HE_LENGTHS,
    estimateMinutes: (settings, _, { players } = {}) => {
      const s = heClean(settings);
      if (s.mode === 'cash') return 'OPEN';
      const row = HE_LENGTHS[s.speed], n = Number(players) || 7, at = n <= 2 ? 2 : n <= 4 ? 4 : n <= 6 ? 6 : 8;
      return players ? row[at] : { turbo: 20, standard: 50, deep: 100 }[s.speed];
    },
  }),
  // JAYWALK — ONE LIFE EVERYWHERE (no options); both looks (body[data-look])
  jaywalk: Object.freeze({
    DEFAULT_SETTINGS: {}, SOLO: true, MUSIC: 'mood:evening', BANNER_NAME: 'JAYWALK', LOOKS: ['day', 'night'], OWN_VICTORY_SOUND: true, ACCENT: '#ff4fc4', NEON: { name: [['JAYWALK', '#ff4fc4', '#ff2bb0']], mode: ['#ffb8e8', '#e85fc0'], line: ['#ff4fc4', '#ff2bb0'] },
    cleanSettings: () => ({}), OPTIONS: [], estimateMinutes: () => 3, chatLocked: runLocked,
    scoreLine: s => `${Math.floor(Math.max(0, Number(s) || 0) / 1e5)} LANES`,   // (the daily's score as a line — core/daily-best.js#jwScore)
  }),
  highrise: Object.freeze({
    DEFAULT_SETTINGS: {}, SOLO: true, MUSIC: 'mood:evening', BANNER_NAME: 'HIGH RISE', LOOKS: ['day', 'night'], OWN_VICTORY_SOUND: true, ACCENT: '#ff4fd8', NEON: { name: [['HIGH', '#ff4fd8', '#ff2bd6'], ['RISE', '#36c9ff', '#0096ff']], mode: ['#c9b6ff', '#9e7eff'], line: ['#ff4fd8', '#ff2bd6'] },
    cleanSettings: () => ({}), OPTIONS: [], estimateMinutes: () => 3, chatLocked: runLocked,
    scoreLine: s => { const f = Math.floor(Math.max(0, Number(s) || 0) / 1e8); return `${f} ${f === 1 ? 'FLOOR' : 'FLOORS'}`; },   // (DAILY A — held.js#hrScore)
  }),
});
