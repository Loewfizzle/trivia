// /admin — THE GROUPED LOGS (THE SPEED PASS — the owner, Nov 4 6:07 pm: "/admin is too long, tons of logs"). PURE (unit-tested:
// tests/admin-groups.test.mjs). The errors from phones (errlog — already one entry per message + file + line) and the phones' reports
// (phonelog) fold into ONE ROW PER KIND: an error's message (long numbers folded, so "id 48213" and "id 99120" are one kind), a report's
// kind (TAP · HANG · STALL · BENCH · LOST TAP). Each group: its count, first + last seen, how many came in since MARK SEEN, its entries newest first.

/** an error message's kind: long numbers folded, whitespace squeezed */
export const errorKind = m => String(m || '').replace(/\d{3,}/g, 'N').replace(/\s+/g, ' ').trim().slice(0, 200) || '(no message)';

/** errlog rows ({ sig, m, n, first, last, seen? }) → [{ key, title, n, newN, first, last, items }] — newest group first */
export function groupErrors(list) {
  const by = new Map();
  for (const e of list || []) {
    const key = errorKind(e.m);
    let g = by.get(key);
    if (!g) by.set(key, g = { key, title: key, n: 0, newN: 0, first: Infinity, last: 0, items: [] });
    const n = e.n || 1;
    g.n += n;
    g.newN += Math.max(0, n - (e.seen || 0));
    g.first = Math.min(g.first, e.first || e.last || Infinity);
    g.last = Math.max(g.last, e.last || 0);
    g.items.push(e);
  }
  return finish(by);
}

/** phonelog rows ({ id, kind, at, text, seen? }) → the same groups, one per report kind */
export function groupReports(list) {
  const by = new Map();
  for (const r of list || []) {
    const key = r.kind === 'lost' ? 'LOST TAP' : String(r.kind || 'tap').toUpperCase();   // (CITY FIXES: THE TAP WATCH's own kind)
    let g = by.get(key);
    if (!g) by.set(key, g = { key, title: key, n: 0, newN: 0, first: Infinity, last: 0, items: [] });
    g.n++;
    if (!r.seen) g.newN++;
    g.first = Math.min(g.first, r.at || Infinity);
    g.last = Math.max(g.last, r.at || 0);
    g.items.push(r);
  }
  return finish(by);
}

function finish(by) {
  const out = [...by.values()];
  for (const g of out) { if (g.first === Infinity) g.first = g.last; g.items.sort((a, b) => (b.last || b.at || 0) - (a.last || a.at || 0)); }
  return out.sort((a, b) => b.last - a.last);
}

/** the filter box: a group stays when its title, or any entry's message / text / file, holds the words (case-insensitive) */
export function filterGroups(groups, q) {
  const w = String(q || '').toLowerCase().trim();
  if (!w) return groups;
  return groups.filter(g => g.title.toLowerCase().includes(w) || g.items.some(x => [x.m, x.text, x.s, x.k].some(v => v && String(v).toLowerCase().includes(w))));
}

/** a header's count line: "214 · 3 new" (no "new" part when nothing is) */
export const countLine = groups => {
  const n = groups.reduce((a, g) => a + g.n, 0), nw = groups.reduce((a, g) => a + g.newN, 0);
  return nw ? `${n.toLocaleString('en-US')} · ${nw.toLocaleString('en-US')} new` : n.toLocaleString('en-US');
};
