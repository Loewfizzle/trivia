// PRISM DROP — THE RISING GHOST ROWS (PD-2, the owner's plan: "incoming junk = RISING GHOST ROWS — ghostly rows creep up from the bottom,
// glowing + shaking as a warning, then go solid; clear in time and they SHATTER"). PURE geometry (no DOM): the bands a board draws, from the
// engine's OWN pending-junk queue + its delay — the attack math, the cancelling + the delays are the engine's, unchanged; this only SHOWS them.
//
// A band = one queued attack (n rows, one gap). It rises from BELOW the board's bottom edge: a fresh attack shows RISE_MIN of its rows at once,
// then slides up as its delay runs out; at the end of the delay it is fully up and HOT (it shakes — the next lock without a clear lands it,
// exactly as before). The engine lands pending[0] first and every later attack pushes in UNDER it, so the newest band is drawn at the bottom
// and the oldest on top — the order the rows will really have. The real stack is never moved: the look draws the bands OVER the bottom rows,
// see-through (board.js#LOOKS — an occupied cell is only tinted, never covered).
export const RISE_MIN = 0.3;          // a fresh attack shows this much of its height at once (never a surprise at full height)
export const GHOST_MAX = 12;          // drawn rows at most (the tag says the whole number)
export const SCHED_LEAD_MS = 3000;    // a SCHEDULED row (SURVIVAL / sudden death) rises over its last 3 s

const ease = k => 1 - (1 - k) * (1 - k);

/**
 * pending: the engine's queue [{ n, g, from, at, t0 }] · clock: the engine's clock (ms)
 * sched:   a scheduled row coming in `inMs` ({ gap, inMs }) — it can't be cancelled, so it is drawn on top (it lands first)
 * → bands from the BOTTOM up: [{ n, gap, from, prog (0..1 of the delay), rows (rows shown — fractional while rising), hot, kind }]
 */
export function ghostBands(pending = [], clock = 0, { sched = null, max = GHOST_MAX } = {}) {
  const out = [];
  let room = max;
  const add = b => {
    if (room <= 0) return;
    const rows = Math.min(b.rows, room);
    room -= rows;
    out.push({ ...b, rows });
  };
  for (let i = pending.length - 1; i >= 0; i--) {
    const q = pending[i];
    if (!q || !(q.n > 0)) continue;
    const t0 = q.t0 ?? q.at;
    const span = Math.max(0, q.at - t0);
    const prog = span > 0 ? Math.max(0, Math.min(1, (clock - t0) / span)) : 1;
    add({ n: q.n, gap: q.g | 0, from: q.from || null, prog, rows: q.n * (RISE_MIN + (1 - RISE_MIN) * ease(prog)), hot: prog >= 1, kind: 'junk' });
  }
  if (sched && sched.inMs <= SCHED_LEAD_MS) {
    const prog = Math.max(0, Math.min(1, 1 - sched.inMs / SCHED_LEAD_MS));
    add({ n: 1, gap: sched.gap | 0, from: null, prog, rows: RISE_MIN + (1 - RISE_MIN) * ease(prog), hot: prog >= 0.85, kind: 'sched' });
  }
  return out;
}

/** the incoming tag: "INCOMING 3 · EVE" (the sender with the most rows; "+1" for each other sender) — null when nothing is queued */
export function incomingTag(pending = [], nameOf = u => u) {
  const by = new Map();
  let total = 0;
  for (const q of pending) {
    if (!q || !(q.n > 0)) continue;
    total += q.n;
    const k = q.from || '';
    by.set(k, (by.get(k) || 0) + q.n);
  }
  if (!total) return null;
  const senders = [...by.entries()].filter(([k]) => k).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  const who = senders.length ? `${String(nameOf(senders[0][0]) || '').toUpperCase()}${senders.length > 1 ? ` +${senders.length - 1}` : ''}` : '';
  return `INCOMING ${total}${who ? ` · ${who}` : ''}`;
}
