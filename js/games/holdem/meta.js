// HOLD'EM — its thin meta = its ROW in js/games/metas.js (THE ONE META MODULE, CITY PART 1 — docs/cartridge.md): the cartridge, core + the
// server import it here; the boot reads the row (registry.js). Its notes: docs/cartridge.md "THE ONE META MODULE".
import { META } from '../metas.js';
export const { MODES, SPEED_KEYS, DEFAULT_SETTINGS, MIN_PLAYERS, MAX_PLAYERS, MUSIC, BANNER_NAME, ACCENT, LOOKS, OWN_VICTORY_SOUND, CHAT_CHIPS, chatLocked, END_HANDS, endGameLine, cleanSettings, OPTIONS, LENGTHS, estimateMinutes } = META.holdem;
