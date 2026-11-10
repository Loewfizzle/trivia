// HOLD'EM — THE POTS (HE1, pure). Every chip a seat put in this hand (`total`) is layered into a main pot +
// side pots: one layer per distinct all-in level among the players still in, each open only to the players who
// reached it. Folded chips count in every layer they reached but a folded seat can't win any.

/** seats: [{ id, total, status }] → [{ amount, ids: [eligible ids] }] (main pot first). */
export function buildPots(seats) {
  const live = seats.filter(s => s.status === 'in' || s.status === 'allin');
  const levels = [...new Set(live.map(s => s.total).filter(t => t > 0))].sort((a, b) => a - b);
  const pots = [];
  let prev = 0, placed = 0;
  for (const L of levels) {
    let amount = 0;
    for (const s of seats) amount += Math.min(s.total, L) - Math.min(s.total, prev);
    if (amount > 0) pots.push({ amount, ids: live.filter(s => s.total >= L).map(s => s.id) });
    placed += amount;
    prev = L;
  }
  // chips above the top live level (only a folded seat can leave them) go to the top pot
  const all = seats.reduce((n, s) => n + s.total, 0);
  if (all > placed) {
    if (pots.length) pots[pots.length - 1].amount += all - placed;
    else pots.push({ amount: all - placed, ids: live.map(s => s.id) });
  }
  return pots;
}

/**
 * Split `amount` between `winners` (already in order from the first seat left of the button):
 * equal shares in whole chips, the odd chips one each from the first winner on.
 */
export function splitPot(amount, winners) {
  const n = winners.length, share = Math.floor(amount / n);
  let odd = amount - share * n;
  return winners.map(id => ({ id, amount: share + (odd-- > 0 ? 1 : 0) }));
}
