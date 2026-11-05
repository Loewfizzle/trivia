// THE VAULT 2B — THE TWO DEVELOPER CARDS (the owner, Nov 3 12:14 pm: "BUILD BOTH" — THE SWITCHBOARD + THE SOURCE). PURE, ids only (their
// names live on the server: api/_lib/catalog.js). ONE OF ONE · DEV: a tier ABOVE legendary in look (their own tag, laser + Nº 0001) —
// legendary in every rule (the prominence rule, the laser); never earnable, in no reward table; the SERVER grants them to the owner's
// profile (ADMIN_PIDS) on /api/profile 'me' and refuses them to anyone else on 'style'.
export const DEV_CARDS = Object.freeze(['card-dev-switchboard', 'card-dev-source']);
export const isDevCard = id => DEV_CARDS.includes(id);
// SHELL 2.0 B2 — THE GIFT TIER: the gift cards are 1-of-1 too (core/gift-cards.js) — the rainbow gem + "1 OF 1" + their art always shown;
// only the dev cards carry THE DEVELOPER · Nº on the plate
import { isGiftCard, GIFT_CARDS } from './gift-cards.js';
export const isOneOfOne = id => isDevCard(id) || isGiftCard(id);
export const ONE_OF_ONE_CARDS = Object.freeze([...DEV_CARDS, ...GIFT_CARDS]);
/** the tag a dev card wears instead of its tier — on the FULL CARD + in CUSTOMIZE only, in the owner's short form "1 OF 1 · DEV" (no # — his ADD-ON, 7:16 pm), bold (THE VAULT 2C — his
 *  lab FIX + the Nov 3 6:04 pm decision: the STRIP carries no words, only THE DEV GEM — js/vault/gems.js) */
export const ONE_OF_ONE = '1 OF 1';   // (LOBBY 2.0 B — the owner, Nov 4 7:12 am: "1 OF 1 · DEV" cut off FOUNDER on THE SWITCHBOARD → just "1 OF 1")
