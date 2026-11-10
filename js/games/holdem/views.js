// HOLD'EM — THE PRIVACY VIEWS (HE1, pure). The server (HE2) keeps the whole table; a phone only ever gets these.
//   publicView(state)        — everything ANY phone may see: never the deck, never a hole card before it is
//                              legally shown (the showdown, or the winner's SHOW). `held` says a seat has cards.
//   seatView(state, seatId)  — publicView + that seat's own two cards (`mine`).
// tests/holdem-sim.test.mjs deep-scans publicView after every action of thousands of hands for a leak.

export function publicView(state) {
  const { deck, seats, ...rest } = state;
  const v = JSON.parse(JSON.stringify(rest));
  v.seats = seats.map(({ cards, ...x }) => {
    const out = { ...JSON.parse(JSON.stringify(x)), held: cards.length > 0 && (x.status === 'in' || x.status === 'allin') };
    if (x.shown) out.cards = cards.slice();
    return out;
  });
  v.deckLeft = deck ? deck.length : 0;
  return v;
}

export function seatView(state, seatId) {
  const v = publicView(state);
  const me = state.seats.find(x => x.id === String(seatId));
  v.me = me ? me.id : null;
  v.mine = me && me.cards.length ? me.cards.slice() : [];
  return v;
}
