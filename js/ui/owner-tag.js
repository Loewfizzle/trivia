// CITY PART 2 — THE OWNER'S LISTS SHOW THE NAME TAG (the owner, Nov 20 — mockup Downloads\NEON\city-h-refs\whos-on-tags.png): ONE helper for the
// tag "#4821" in bold white mono at the top of a row's right-hand column (above its status line; nothing drawn on the card) — so two accounts
// with the same name are told apart at a glance. OWNER-ONLY lists only (WHO'S ON, a room's players, STATS' most active, SECOND ACCOUNTS); the tag
// comes from the server ONLY for an owner's request — never on a public screen (THE BOARD, SCORES, the player page, rooms, shares: "never tag
// digits" stands). docs/profiles.md "THE OWNER'S NAME TAG".
import { h } from './dom.js';
import { fmtTag } from '../core/names.js';

/** the tag's node | null (no tag in the row — a public row never has one) */
export const ownerTag = t => (t == null || t === '' ? null : h('b.ow-tag', { 'aria-label': `tag ${fmtTag(t)}` }, fmtTag(t)));
