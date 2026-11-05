// SHELL 2.0 B2 — THE GIFT TOOL (the owner, Nov 4 5:47 pm): /admin → GIFTS — a GIFTABLE 1-of-1 card + a player's NAME TAG → GIVE. Server-only:
// owner-only (the admin gate in api/admin.js), audited there, and a gift card belongs to ONE profile EVER — `gifts/{card}` = { pid, at, by }
// is taken in a transaction FIRST (a second give of the same card is refused, whoever asks; nothing ever clears it). The grant: the card into
// the player's items (pstats/{pid}/it), EQUIPPED (profiles/{pid}/cd), and a reveal waiting (ppriv/{pid}/gift — the phone's next 'me' shows
// "A gift from the house" + the card flipping in, then /api/profile 'giftSeen' clears it). The owner's own card (OWNER_GIFTS) is never
// giftable — it is granted on /api/profile 'me' to ADMIN_PIDS (api/profile.js), like the dev cards.
import { ref, val } from './fb.js';
import { ApiError } from './http.js';
import { publicProfile, encodeKey, isPid } from './profiles.js';
import { nameKey } from '../../js/core/names.js';
import { parseTag } from '../../js/core/harbor-radio.js';
import { GIFTABLE, isGiftable, isOwnerGift } from '../../js/core/gift-cards.js';
import { ITEM } from '../../js/core/items.js';
import './catalog.js';   // (the names: registered into ITEM — the owner's tool shows them)

/** THE GIFTS list for /admin: every giftable card, its name + who has it (or null) */
export async function giftList() {
  const got = (await val('gifts')) || {};
  const out = [];
  for (const id of GIFTABLE) {
    const g = got[id] || null, p = g && g.pid ? await publicProfile(g.pid).catch(() => null) : null;
    out.push({ id, name: (ITEM[id] || {}).name || id, given: g ? { at: g.at || 0, who: p ? `${p.n}#${p.t}` : '(a removed profile)' } : null });
  }
  return { gifts: out };
}

/** GIVE: { card, tag: "NAME#1234" } → { gift: { id, name, who, at } } — or a refusal */
export async function giftGive(by, body, now = Date.now()) {
  const card = String(body.card || '');
  if (isOwnerGift(card)) throw new ApiError(403, 'not_giftable', 'That card is yours — it is never given.');
  if (!isGiftable(card)) throw new ApiError(400, 'bad_card', 'Pick a gift card.');
  const t = parseTag(body.tag);
  if (!t) throw new ApiError(400, 'bad_tag', 'Type a name tag like MIKE#4821.');
  const pid = await val(`tags/${encodeKey(nameKey(t.name))}/${t.tag}`);
  if (!isPid(pid)) throw new ApiError(404, 'no_tag', 'No player with that name tag.');
  const prof = await publicProfile(pid);
  if (!prof) throw new ApiError(404, 'no_tag', 'No player with that name tag.');
  // ONE PROFILE EVER: the lock first (a transaction — two GIVE taps at once can't both win)
  const lock = await ref(`gifts/${card}`).transaction(cur => (cur ? undefined : { pid, at: now, by }));
  if (!lock.committed) {
    const g = lock.snapshot.val() || {}, p = g.pid ? await publicProfile(g.pid).catch(() => null) : null;
    throw new ApiError(409, 'taken', `That card already belongs to ${p ? `${p.n}#${p.t}` : 'someone'} — a gift card is one of one.`);
  }
  await ref('/').update({
    [`pstats/${pid}/it/${card}`]: now,
    [`profiles/${pid}/cd`]: card, [`profiles/${pid}/f`]: null,   // (equipped: it's on their card from the first look)
    [`ppriv/${pid}/gift`]: { id: card, at: now },                // (the reveal waits for their next open)
  });
  return { gift: { id: card, name: (ITEM[card] || {}).name || card, who: `${prof.n}#${prof.t}`, pid, at: now } };
}
