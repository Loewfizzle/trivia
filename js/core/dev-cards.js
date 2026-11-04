// THE VAULT 2B — THE TWO DEVELOPER CARDS (the owner, Nov 3 12:14 pm: "BUILD BOTH" — THE SWITCHBOARD + THE SOURCE). PURE, ids only (their
// names live on the server: api/_lib/catalog.js). ONE OF ONE · DEV: a tier ABOVE legendary in look (their own tag, laser + Nº 0001) —
// legendary in every rule (the prominence rule, the laser); never earnable, in no reward table; the SERVER grants them to the owner's
// profile (ADMIN_PIDS) on /api/profile 'me' and refuses them to anyone else on 'style'.
export const DEV_CARDS = Object.freeze(['card-dev-switchboard', 'card-dev-source']);
export const isDevCard = id => DEV_CARDS.includes(id);
/** the tag a dev card wears instead of its tier — on the FULL CARD + in CUSTOMIZE only, in the owner's short form, bold (THE VAULT 2C — his
 *  lab FIX + the Nov 3 6:04 pm decision: the STRIP carries no words, only THE DEV GEM — js/vault/gems.js) */
export const ONE_OF_ONE = '#1 OF #1 · DEV';
