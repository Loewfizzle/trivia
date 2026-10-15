// Playable game modules by id. Each module exports:
//   start({ code, matchId, settings, participants, now }) -> Promise<game | null>
//   prepare(game)            -> idempotent; preload assets the game needs (called often)
//   nextStep(game, ctx)      -> pure director step (see cipher/director.js)
//   pickWord / helpers the director needs
//   createView(actions)      -> { mount(el, state), update(state), unmount() }
//   DEFAULT_SETTINGS, settingsForm(...)  (lobby options sheet)
import * as cipher from './cipher/index.js';

export const GAME_MODULES = { cipher };
