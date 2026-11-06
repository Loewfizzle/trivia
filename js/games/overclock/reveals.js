// OVERCLOCK — the older reveal panels (OC1–OC4): EMPTY now. OC3 moved MISSING LINK, CLOSEST CALL + UNSCRAMBLE into answers.js (their own
// dressing), OC3B SPELLCHECK, HIGHER OR LOWER, TIMELINE + SORT IT, OC4 COMPASS — the last one. The hooks stay for answers.js#buildAnswer.
const REVEAL = {};
/** Challenge types that show an older reveal panel (none left) */
export const hasReveal = type => !!REVEAL[type];
/** the older reveal for this challenge (none left — answers.js draws every one) */
export function buildReveal(game, spec, ctx) {
  const type = game.order[game.ci];
  return REVEAL[type] ? REVEAL[type](spec, game, ctx.boards, ctx.uids, ctx) : null;
}
