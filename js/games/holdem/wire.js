// HOLD'EM — THE LEAN WIRE (HE3, pure — the server + every phone share it). The public table at rooms/{CODE}/holdem is no longer ONE
// JSON string (~5 KB re-sent to every phone on every move): it is a tree of small PARTS, each one value as its own JSON string (a string,
// so Firebase never drops a null or an empty array the engine reads), and the dealer writes ONLY the parts that changed — a fold, a call,
// a raise ≈ a few hundred bytes (docs/holdem.md "THE LEAN WIRE").
//
//   rooms/{CODE}/holdem = { seq, at,
//     m/{key}   every top-level field of the public view (id, mode, due, places, ledger …)   — not table / players / ev
//     t/{key}   every table field (street, board, bet, turn, deadline, pots, result …)      — not seats
//     s/{i}/{f} one seat's field (i = its index in table.seats) — a call writes its stack, bet, total, acted: never the whole seat
//     p/{uid}   one player's match numbers (seat, buy-ins, hands, won, KOs, left)
//     e/{n}     one recent event (numbered n — the animation feed) }
//
//   toWire(pub)            → { 'm/id': '"h…"', 't/street': '"flop"', 's/0/stack': '1480', … }   (flat paths → JSON strings)
//   wireDiff(prev, next)   → only the changed paths (+ null for a part that went away)
//   nestWire(flat)         → the same parts as a nested object (a whole-node write)
//   fromWire(node)         → the public view again (null when the node has no parts) — what a phone renders from
/** The public view → its flat parts. */
export function toWire(pub) {
  const out = {};
  if (!pub) return out;
  for (const [k, v] of Object.entries(pub)) {
    if (v === undefined || k === 'seq') continue;                // (the node's own `seq` carries it)
    if (k === 'table') {
      for (const [tk, tv] of Object.entries(v || {})) {
        if (tv === undefined) continue;
        if (tk === 'seats') (tv || []).forEach((x, i) => { for (const [f, fv] of Object.entries(x || {})) if (fv !== undefined) out[`s/${i}/${f}`] = JSON.stringify(fv); });
        else out[`t/${tk}`] = JSON.stringify(tv);
      }
    } else if (k === 'players') {
      for (const [id, p] of Object.entries(v || {})) out[`p/${id}`] = JSON.stringify(p);
    } else if (k === 'ev') {
      for (const e of v || []) out[`e/${e.n}`] = JSON.stringify(e);
    } else out[`m/${k}`] = JSON.stringify(v);
  }
  return out;
}

/** Only what changed between two public views (prev null = everything). A part that went away → null (Firebase deletes it). */
export function wireDiff(prev, next) {
  const a = toWire(prev), b = toWire(next), out = {};
  for (const [k, v] of Object.entries(b)) if (a[k] !== v) out[k] = v;
  for (const k of Object.keys(a)) if (!(k in b)) out[k] = null;
  return out;
}

/** Flat parts → a nested object (for a whole-node write). */
export function nestWire(flat) {
  const out = {};
  for (const [path, v] of Object.entries(flat)) {
    if (v == null) continue;
    const parts = path.split('/');
    let o = out;
    for (const k of parts.slice(0, -1)) o = (o[k] ||= {});
    o[parts.at(-1)] = v;
  }
  return out;
}

const parse = v => { try { return JSON.parse(v); } catch { return undefined; } };
// (Firebase hands a node whose keys are small integers back as an ARRAY — seats 0–7, the first events — so read both shapes)
const entries = x => (x && typeof x === 'object' ? Object.entries(x).filter(([, v]) => typeof v === 'string') : []);

/** A phone's copy of rooms/{CODE}/holdem → the public view (the shape publicOf made), or null. */
export function fromWire(node) {
  if (!node || typeof node !== 'object' || !node.m) return null;
  const pub = {};
  for (const [k, v] of entries(node.m)) { const x = parse(v); if (x !== undefined) pub[k] = x; }
  const table = {};
  for (const [k, v] of entries(node.t)) { const x = parse(v); if (x !== undefined) table[k] = x; }
  const seats = node.s && typeof node.s === 'object' ? Object.entries(node.s).filter(([, x]) => x && typeof x === 'object') : [];
  table.seats = seats.sort((a, b) => Number(a[0]) - Number(b[0])).map(([, x]) => {
    const seat = {};
    for (const [f, v] of entries(x)) { const y = parse(v); if (y !== undefined) seat[f] = y; }
    return seat;
  });
  pub.table = table;
  pub.players = {};
  for (const [id, v] of entries(node.p)) { const x = parse(v); if (x) pub.players[id] = x; }
  pub.ev = entries(node.e).map(([, v]) => parse(v)).filter(Boolean).sort((a, b) => a.n - b.n);
  if (node.seq != null) pub.seq = Number(node.seq);
  return pub;
}

/** Bytes of a JSON payload (the wire cost of a write: what every listening phone downloads, give or take the protocol). */
export const wireBytes = obj => new TextEncoder().encode(JSON.stringify(obj)).length;
