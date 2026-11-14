// THE DROP — THE RULES (PURE — THE DROP A): the run, its schedule, the log + the replay are PRISM DROP's own pure modules (js/games/prism/drop.js
// + drop-judge.js — ONE engine for the phone and the server); this file is the cartridge's door to them + the thin meta's one-source values.
import { DEFAULT_SETTINGS, chatLocked } from './meta.js';
export { DEFAULT_SETTINGS, chatLocked };
export { createDropRun, input, stepTo, replay, scoreOf, dropLine, DROP_END_MS } from '../prism/drop.js';
