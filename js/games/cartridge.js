// LOBBY 2.0 B — THE CARTRIDGE PLUG (the owner, Nov 1: "the 2.0 lobby is the NINTENDO CONSOLE, the mini games are the CARTRIDGES"): the ONE
// contract a game plugs into, written down as data + checked (tests/cartridge.test.mjs + the harbor's `cartridge` group run checkCartridge on
// every registered game). The console (the room in the city, host.js, app.js, the chat, the podium, /api) reads a game ONLY through this —
// never its id (tests grep the console for game ids). The full text: docs/cartridge.md. PURE (no DOM): the node tests import it.
//
// A cartridge = js/games/<id>/ (logic + director + index + view — docs/match-kit.md), registered in games/registry.js + config.js GAMES
// (`playable` = the one switch). Its index.js exports:
export const REQUIRED = Object.freeze({
  start: 'function',            // start({ code, matchId, settings, participants, now, used }) → Promise<game | null> — `now` = the moment the MATCH
                                //   begins (after the walk inside — core/room-show.js#START_MS); `used` = rooms/{CODE}/meta/used (OC1 — docs/cartridge.md)
  prepare: 'function',          // prepare(game, { code, host }) — idempotent, every host tick (asset / question top-ups, private host duties)
  step: 'function',             // step(game, { code, now, live, online }) → patch | { lobby: true } | null — the PURE director
  livePaths: 'function',        // livePaths(game) → { name: 'path/under/room' } — the player-written data to mirror into state.live
  createView: 'function',       // lazyView(() => import('./view.js'), gameSheets('<id>')) — { mount(el, state), update(state), unmount() }
  DEFAULT_SETTINGS: 'object',   // the options sheet's defaults
  OPTIONS: 'array',             // [{ key, label, type, choices, hint?, when?(onlineCount) }]
  estimateMinutes: 'function',  // estimateMinutes(settings, _, { players }?) → minutes (the options sheet's EST. MATCH LENGTH) — or a word (HE3: HOLD'EM's CASH → 'OPEN'); HE10: the connected count rides the optional third argument
  finalRanks: 'function',       // finalRanks(game) → [{ uid, rank }] — GAME NIGHT's points, THE WINNER's BANNER, the night's champion
});
export const OPTIONAL = Object.freeze({
  MUSIC: 'any',                 // its music id / playlist (audio/music.js) — null = no music (the song is the music)
  musicFor: 'function',         // musicFor(game) → [track, fallback] — a track that changes during the match
  FINAL_MUSIC: 'string',        // its podium music (default: the victory playlist)
  MIN_PLAYERS: 'number',        // more than the app-wide minimum (DOUBLE AGENT: 4)
  SOLO: 'boolean',              // true = one player may start it (THE SOLO LANE — SHELL 2.0 B1) — the console's minimum drops to 1
  SOLO_RUNS: 'array',           // PD-6: [{ mode, label, sub }] — THE GAME CARD's solo tubes (the first the MAIN); none = PLAY NOW
  nightBonus: 'function',       // nightBonus(game) → { uid: points } — game-night points that aren't a placing (PRISM DROP's Call the Winner)
  sealed: 'function',           // THE SEAL (kit/seal.js): sealed(game) → { name: 'node/{m}/{key}' } — the round's secrets
  chatLocked: 'function',       // chatLocked(game, uid, live) → true while this player is actively playing (no chat) — the chat asks the game
  CHAT_CHIPS: 'array',          // its own quick replies (≤ 4 short strings) on the chat's chips row while it runs
  BANNER_NAME: 'string',        // its name on THE WINNER's BANNER PLANE (default: config.js GAMES name)
  rematchSettings: 'function',  // rematchSettings(settings, lastGame) → the settings a REMATCH uses (default: the same)
  preload: 'function',          // preload({ settings, host }) — called on EVERY phone at the game start (the ~5 s start, 3 s for a rematch — THE PRELOAD BUDGET below): fetch its
                                //   pools / sounds / fonts so the view is ready when the push through the door ends (its view module +
                                //   stylesheets are warmed by the console itself). Everything a game needs loads ONLY when it is played.
  finalScene: 'function',       // SHELL 2.0 A — finalScene(el, game, state): the game draws its own BODY inside the console's podium frame
                                //   (ui/final.js — the console keeps the XP box, the moment + the card reveal, BACK TO THE ROOM)
  daily: 'object',              // THE DAILY PLUG-IN (ships OFF — THE DAILY MODULE switches the dailies on): see DAILY below
  LOOKS: 'array',               // OC1 — its looks (default both); ONE = always that look, the setting shows LOCKED (lookLockOf; docs/cartridge.md)
  OWN_VICTORY_SOUND: 'boolean', // FRIENDS B (B2) — true = its body plays its OWN winner sound: the console's podium sting is skipped (OVERCLOCK's fanfare)
  ACCENT: 'string',             // FRIENDS B — the END SCREEN's colour (the console frame's main tube): a #hex; missing = THE NEON TUBE's pink
});
/** what host.js passes to start() (tested) */
export const START_ARGS = Object.freeze(['code', 'matchId', 'settings', 'participants', 'now', 'used']);
export const LOOK_VALUES = Object.freeze(['day', 'night']);
// THE DAILY PLUG-IN's shape (OVERCLOCK + the WORDLE-type + COAST CLEAR offer it; THE DAILY MODULE seeds, unlocks, streaks + ranks it):
//   daily = { on: false,                                        — the game never switches itself on
//             create({ date: 'YYYY-MM-DD', uid, now, daySet }) → game — today's puzzle for ONE player: the same content for everyone that
//                                                                 day — daySet = THE SERVER-PICKED, SEALED day set (a server secret, never
//                                                                 computable from the date — OC5 added the slot), never a party-only part (DUMB LUCK)
//             resumeKey(date, uid) → string }                     — one try a day: a refresh / an app switch resumes, never restarts
export const DAILY = Object.freeze({ on: 'boolean', create: 'function', resumeKey: 'function' });

// SHELL 2.0 B1 — THE CONTRACT (agreed with the Overclock chat — review-6.md D1 D2 D3 D8 D9 D12; docs/cartridge.md):
// D1 THE THIN META + LAZY LOGIC: these keys live in the game's js/games/<id>/meta.js — PURE + tiny (no imports), what the console reads
//   BEFORE a match (the registry imports only the metas at boot); index.js re-exports them (`export * from './meta.js'`) and everything
//   else (start, prepare, step, livePaths, finalRanks, finalScene, sealed, rematchSettings, daily.create, feats, createView) loads with the
//   cartridge (games/registry.js#loadGame — the host's start, every phone's walk inside, a refresh mid-match).
export const META_KEYS = Object.freeze(['DEFAULT_SETTINGS', 'OPTIONS', 'estimateMinutes', 'MUSIC', 'FINAL_MUSIC', 'MIN_PLAYERS', 'SOLO', 'SOLO_RUNS', 'BANNER_NAME', 'CHAT_CHIPS', 'chatLocked', 'NO_INTERCOM', 'LOOKS', 'OWN_VICTORY_SOUND', 'ACCENT']);
// THE PRELOAD BUDGET: a game's preload() runs on EVERY phone during the start's ~5 s (the lit sign + the walk inside) — at most ~1.5 MB
//   (its sounds, its fonts, its FIRST content pool); the rest lazy. The start never waits past its 5 s for it: the game shows when its own
//   pieces are ready (its view says LOADING itself, never the console).
export const PRELOAD_BUDGET = 1.5 * 1024 * 1024;
// FEATS (D3 / the solo lane): a result row may carry the player's FEATS — small numbers the SERVER replays for unlocks (maxStreak,
//   longShotWin, soloScore…) — core/match-report.js reads them per game, with bounds; a client never writes an unlock.
// THE KIT (D9): js/games/kit/ — OC1's numpad · keyboard · tach · slam · answer (gk-, skinned by --gk-*; docs/cartridge.md). Built HERE (SHELL 2.0 B1): ready.js (THE READY HELPER —
//   "everyone tapped") + night.js (THE ROOM-NIGHT PATH: rooms/{CODE}/meta/used/{gameId}/{key}).
export const KIT_PREFIX = 'gk-';

const kindOf = v => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);

/** a game module against the contract → a list of problems ([] = it plugs in). o.marks = core/marks.js MARKS (its tube logo for the sign
 *  at the game start + the city's signs), o.game = its config.js GAMES row */
export function checkCartridge(id, mod, o = {}) {
  const out = [];
  if (!mod) return [`${id}: no module registered (games/registry.js)`];
  for (const [k, t] of Object.entries(REQUIRED)) if (kindOf(mod[k]) !== t) out.push(`${id}: ${k} must be a ${t} (is ${kindOf(mod[k])})`);
  for (const [k, t] of Object.entries(OPTIONAL)) if (k in mod && mod[k] != null && t !== 'any' && kindOf(mod[k]) !== t) out.push(`${id}: ${k} (optional) must be a ${t}`);
  if (!('MUSIC' in mod) && typeof mod.musicFor !== 'function') out.push(`${id}: MUSIC (its music id, or null) or musicFor(game)`);
  if (Array.isArray(mod.CHAT_CHIPS) && (mod.CHAT_CHIPS.length > 4 || mod.CHAT_CHIPS.some(c => typeof c !== 'string' || !c.trim() || c.length > 24))) out.push(`${id}: CHAT_CHIPS — at most 4 short strings (≤ 24)`);
  if (typeof mod.BANNER_NAME === 'string' && (mod.BANNER_NAME.length < 2 || mod.BANNER_NAME.length > 14)) out.push(`${id}: BANNER_NAME — 2–14 letters (it shares a 24-letter banner panel with a name)`);
  if (mod.daily != null) {
    for (const [k, t] of Object.entries(DAILY)) if (kindOf(mod.daily[k]) !== t) out.push(`${id}: daily.${k} must be a ${t}`);
    if (mod.daily.on === true) out.push(`${id}: daily.on — the daily ships OFF (THE DAILY MODULE switches the dailies on together)`);
  }
  if (Array.isArray(mod.OPTIONS)) for (const op of mod.OPTIONS) if (!op || !op.key || !(op.key in (mod.DEFAULT_SETTINGS || {}))) out.push(`${id}: OPTIONS row "${op && op.key}" has no DEFAULT_SETTINGS value`);
  if (mod.ACCENT != null && !/^#[0-9a-f]{6}$/i.test(String(mod.ACCENT))) out.push(`${id}: ACCENT — a #rrggbb colour (the end screen's frame)`);
  const sr = mod.SOLO_RUNS;   // (PD-6: a SOLO game's card tubes, 1–3; each mode one ONE player can play)
  if (Array.isArray(sr) && (mod.SOLO !== true || !sr.length || sr.length > 3 || sr.some(r => !r || typeof r.mode !== 'string' || typeof r.label !== 'string' || !r.label.trim() || r.label.length > 16 || (r.sub != null && String(r.sub).length > 24) || (typeof mod.cleanSettings === 'function' && mod.cleanSettings({ ...mod.DEFAULT_SETTINGS, mode: r.mode }, 1).mode !== r.mode)))) out.push(`${id}: SOLO_RUNS — SOLO only, 1–3 { mode (one-player), label ≤ 16, sub? ≤ 24 }`);
  if (mod.LOOKS != null && (!Array.isArray(mod.LOOKS) || !mod.LOOKS.length || mod.LOOKS.some(l => !LOOK_VALUES.includes(l)) || new Set(mod.LOOKS).size !== mod.LOOKS.length)) out.push(`${id}: LOOKS — one or both of 'day' / 'night', each once`);
  if (o.marks && !o.marks[id]) out.push(`${id}: no tube mark in core/marks.js (the sign at the game start + the city's signs)`);
  if (o.game && (!o.game.name || !o.game.theme)) out.push(`${id}: its config.js GAMES row needs a name + a theme`);
  return out;
}

// ---- what the console reads (one place — never a game's id)
/** the fewest players that may start it */
export const minPlayersOf = (mod, appMin) => (mod && mod.SOLO === true ? 1 : Math.max(appMin, (mod && mod.MIN_PLAYERS) || 0));
/** its quick replies while it runs */
export const chipsOf = mod => (mod && Array.isArray(mod.CHAT_CHIPS) ? mod.CHAT_CHIPS.slice(0, 4) : []);
/** its looks (missing = both) */
export const looksOf = mod => (mod && Array.isArray(mod.LOOKS) && mod.LOOKS.length ? mod.LOOKS.filter(l => LOOK_VALUES.includes(l)) : [...LOOK_VALUES]);
/** ONE look → that look (always), else null */
export const lookLockOf = mod => { const l = looksOf(mod); return l.length === 1 ? l[0] : null; };
/** the settings a REMATCH starts with */
export const rematchSettingsOf = (mod, settings, last) => (mod && typeof mod.rematchSettings === 'function' ? mod.rematchSettings(settings, last) || settings : settings);
