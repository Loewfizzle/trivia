// SHELL 2.0 B2 — THE GIFT TOOL (the owner, Nov 4 5:47 pm): /admin → GIFTS — a GIFTABLE 1-of-1 card + a player's NAME TAG → GIVE. Server-only:
// owner-only (the admin gate in api/admin.js), audited there, and a gift card belongs to ONE profile EVER — `gifts/{card}` = { pid, at, by }
// is taken in a transaction FIRST (a second give of the same card is refused, whoever asks; nothing ever clears it). The grant: the card into
// the player's items (pstats/{pid}/it), EQUIPPED (profiles/{pid}/cd), and a reveal waiting in THE GIFT QUEUE (below). The owner's own card (OWNER_GIFTS) is never
// giftable — it is granted on /api/profile 'me' to ADMIN_PIDS (api/profile.js), like the dev cards.
import { ref, val } from './fb.js';
import { ApiError } from './http.js';
import { publicProfile, encodeKey, isPid } from './profiles.js';
import { nameKey } from '../../js/core/names.js';
import { parseTag } from '../../js/core/harbor-radio.js';
import { GIFTABLE, isGiftable, isOwnerGift } from '../../js/core/gift-cards.js';
import { ITEM } from '../../js/core/items.js';
import './catalog.js';   // (the names: registered into ITEM — the owner's tool shows them)

// THE CARD PASS — THE GIFT QUEUE (the owner, Nov 7 2:34 pm): every gift waits in a LINE — `ppriv/{pid}/gq/{pushKey}` = { id, at, s? }
// (push keys sort by time: the order given). The phone's boot check ('giftCheck') gets the line; the reveal plays ONE CARD AT A TIME
// ("GIFT 1 OF 5") and marks each one seen as it closes ('giftSeen' { k } → s = when) — a refresh mid-line resumes at the next unseen,
// numbered in the same line ("GIFT 3 OF 5"); once every one is seen the line is cleared. The old ONE slot (`ppriv/{pid}/gift`, before
// the queue — a second gift replaced the first's reveal) MIGRATES into the line on the next check. Server-only (ppriv has no client
// rule): no rules change.
const qPath = pid => `ppriv/${pid}/gq`;
function lineOf(q) {
  return Object.entries(q || {}).filter(([, g]) => g && g.id).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, g]) => ({ k, id: String(g.id), at: g.at || 0, s: g.s || 0 }));
}

/** the waiting line: { gifts: [{ k, id, at }] (unseen, in order), done: n seen already in this line } (+ the old slot migrated) */
export async function giftQueue(pid) {
  const old = await val(`ppriv/${pid}/gift`);
  if (old && old.id) {
    // (MIGRATE: the old single slot → the line FIRST — it is older than any queued gift: '-0old' sorts before every push key; then the slot goes)
    const k = '-0old';
    await ref('/').update({ [`${qPath(pid)}/${k}`]: { id: String(old.id), at: old.at || 0 }, [`ppriv/${pid}/gift`]: null });
  }
  const line = lineOf(await val(qPath(pid)));
  const todo = line.filter(g => !g.s);
  return { gifts: todo.map(({ k, id, at }) => ({ k, id, at })), done: line.length - todo.length };
}

/** one gift's reveal seen → stamped; the last one seen clears the whole line. No k (an old phone's call) = the first unseen. */
export async function giftSeen(pid, k, now = Date.now()) {
  const line = lineOf(await val(qPath(pid)));
  const g = k ? line.find(x => x.k === String(k)) : line.find(x => !x.s);
  if (g && !g.s) await ref(`${qPath(pid)}/${g.k}/s`).set(now);
  const left = line.filter(x => !x.s && (!g || x.k !== g.k)).length;
  if (!left) await ref(qPath(pid)).remove();
  if (!k) await ref(`ppriv/${pid}/gift`).remove();   // (an old phone that saw the old slot)
  return { ok: true, left };
}

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
    [`${qPath(pid)}/${ref(qPath(pid)).push().key}`]: { id: card, at: now },   // (THE GIFT QUEUE: the reveal waits in line for their next open)
  });
  return { gift: { id: card, name: (ITEM[card] || {}).name || card, who: `${prof.n}#${prof.t}`, pid, at: now } };
}
