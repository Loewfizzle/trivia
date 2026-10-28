// BNAME (Oct 28) — THE HOUSE NICKNAMES, PURE. THE BOARD never shows another player's typed name in public: every row reads a
// stable 1920s-speakeasy nickname ("Dapper Fox #0421") instead, picked from the row's opaque board id (an HMAC of the profile
// id the server makes — api/_lib/lb.js#boardId), so the same player wears the same nickname every week, on every phone. Your
// own row swaps in your real name on your own device (js/board/view.js). 16 × 13 = 208 nicknames; the number tells two of the
// same apart. Every word is checked by the board-name filter (tests/nicknames.test.mjs) and none of them looks like a first name.
export const NICK_ADJ = ['Dapper', 'Velvet', 'Lucky', 'Silver', 'Golden', 'Midnight', 'Smooth', 'Sly', 'Swanky', 'Jazzy', 'Ritzy',
  'Snappy', 'Copper', 'Ivory', 'Scarlet', 'Moonlit'];
export const NICK_NOUN = ['Fox', 'Ace', 'Gin', 'Rook', 'Magpie', 'Jaguar', 'Crow', 'Tiger', 'Hound', 'Dandy', 'Fedora', 'Martini', 'Raven'];

/** Whether a string is a board row id (16 lowercase hex). */
export const isBoardId = id => /^[0-9a-f]{16}$/.test(String(id || ''));

/** The house nickname of a board id → { n: 'Dapper Fox', t: '0421' } (t fills the tag's slot on the row). */
export function houseNick(id) {
  const s = isBoardId(id) ? id : '0000000000000000';
  const a = parseInt(s.slice(0, 4), 16), b = parseInt(s.slice(4, 8), 16), c = parseInt(s.slice(8, 12), 16);
  return { n: `${NICK_ADJ[a % NICK_ADJ.length]} ${NICK_NOUN[b % NICK_NOUN.length]}`, t: String(c % 10000).padStart(4, '0') };
}

/** Matches a profile needs (all games together, the server's own count) before it is listed on any public board. */
export const BOARD_MIN_MATCHES = 3;
