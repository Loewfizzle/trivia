// THE CARTRIDGE PLUG — what the CONSOLE reads of a game at boot (one place — never a game's id). FIXES R2 (THE REVIEW B2 T5): the contract's
// tables + the checker moved to js/games/contract.js (out of the boot graph); docs/cartridge.md is the full text. PURE (no DOM).
export const LOOK_VALUES = Object.freeze(['day', 'night']);
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
/** FIXES R2 — THE REVIEW B2 T3: a start()'s game against THE GAME FRAME the console reads (id · matchId · participants · phase — docs/cartridge.md)
 *  → its problems ([] = it may start). host.js#startGameNow takes the COULD NOT START path on any — never a broken match on every phone. */
export function frameProblems(g, id, matchId) {
  if (!g || typeof g !== 'object') return ['start() gave no game'];
  const out = [];
  if (g.id !== id) out.push(`its id is ${JSON.stringify(g.id)}, not ${id}`);
  if (g.matchId !== matchId) out.push('its matchId is not the one host.js passed');
  if (!g.participants || typeof g.participants !== 'object' || !Object.keys(g.participants).length) out.push('no participants');
  if (typeof g.phase !== 'string' || !g.phase) out.push('no phase');
  return out;
}
