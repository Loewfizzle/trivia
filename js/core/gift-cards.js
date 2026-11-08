// SHELL 2.0 B2 — THE GIFT CARDS (the owner, Nov 4 3:52–5:47 pm + Nov 5 12:51 pm). PURE, ids only (their names live on the server:
// api/_lib/catalog.js). THE GIFT TIER: 1-OF-1 cards like the dev cards — the rainbow 1 OF 1 gem + "1 OF 1" on the full card, legendary in
// every rule (the prominence rule, the laser); never earnable, in no reward table; a gift card belongs to ONE profile EVER (the server's
// gifts/{card} lock — api/_lib/gifts.js). Cards only (gift emblems were dropped, Nov 4 5:30 pm).
//   THE GIFT TOOL (/admin → GIFTS): the owner picks a GIFTABLE card + a player's name tag → GIVE — server-granted, audited, refused once
//   the card belongs to anyone. OWNER_GIFTS (the owner's own card, Nov 5): granted by the server to the owner's profile
//   (ADMIN_PIDS) on /api/profile 'me', like the dev cards — NEVER offered in GIFTS, refused to anyone else.
export const GIFT_CARDS = Object.freeze([
  // the nephew's five (the owner picks one in THE LAB — + the parent's OK)
  'card-gift-playerone', 'card-gift-halloffame', 'card-gift-enforcer', 'card-gift-linebacker', 'card-gift-underlights',
  // CAMBRIA (the shiba) — two
  'card-gift-sunsetstrip', 'card-gift-goldenhour',
  // the ADD-ON (Nov 5 12:51 pm): Liam's three + the owner's own
  'card-gift-goldenboot', 'card-gift-youngbuck', 'card-gift-icecold', 'card-gift-anarchist',
  // BUZZED LIGHTYEAR (Nov 6 — the owner's friend; the owner GIVES it in /admin → GIFTS)
  'card-gift-buzzed',
  // THE CARD PASS (Nov 7) — seven more: the noir dispatcher card; the lawyer's two (the punk stencil card, the gig-poster card); the buddy's two wasteland cards
  // (the terminal card, the sunset card); the Mostar friend's two (the flag card, the Old Bridge card) — the owner GIVES each in /admin → GIFTS
  'card-gift-dispatcher', 'card-gift-outoforder', 'card-gift-notguilty', 'card-gift-wastelander', 'card-gift-survivor', 'card-gift-zadomovinu', 'card-gift-starimost',
]);
export const OWNER_GIFTS = Object.freeze(['card-gift-anarchist']);
export const GIFTABLE = Object.freeze(GIFT_CARDS.filter(id => !OWNER_GIFTS.includes(id)));
export const isGiftCard = id => GIFT_CARDS.includes(id);
export const isOwnerGift = id => OWNER_GIFTS.includes(id);
/** a gift card the owner may GIVE (not his own one) */
export const isGiftable = id => GIFTABLE.includes(id);
