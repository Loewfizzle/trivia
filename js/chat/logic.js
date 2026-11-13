// Room chat — pure rules (no DOM, no Firebase): when chat is locked in each game, profanity masking,
// text cleanup, relative times, the typing line, unread counting. Unit-tested in tests/chat.test.mjs.

export const MAX_LEN = 300;
export const KEEP = 100;           // messages kept per room (the host prunes older ones)
export const RATE_MS = 800;        // the rules' minimum gap between one player's messages
export const CLIENT_GAP_MS = 900;  // the client waits a little longer, so the rules never have to say no
export const TYPING_IDLE_MS = 4000;
export const TYPING_STALE_MS = 6500;

/**
 * Is chat locked for uid right now? Only during their own active play: spectators, eliminated players,
 * and anyone who has finished the current round/hole can always chat. `live` is state.live (only
 * trusted when it belongs to the current step — pass null otherwise, which locks to be safe).
 */
// LOBBY 2.0 B — THE CARTRIDGE PLUG (docs/cartridge.md): a game says it itself — its index.js exports chatLocked(game, uid, live); the chat
// passes it here (lock). The switch below is the ten HIDDEN games' (frozen until each comes back — then its case moves into its cartridge).
export function chatLocked(game, uid, live, lock = null) {
  if (!game || !uid || !game.participants || !game.participants[uid]) return false;
  if (typeof lock === 'function') return !!lock(game, uid, live);
  const mine = name => (live && live[name] ? live[name][uid] : undefined);
  switch (game.id) {
    case 'cipher': {
      if (game.phase !== 'play') return false;
      const b = mine('boards');
      return !(b && (b.solved || b.done));
    }
    case 'signal':
      if (game.out && game.out[uid] !== undefined) return false; // eliminated: chat any time
      return game.phase === 'question';
    case 'bluff':
      return game.phase === 'write' || game.phase === 'vote';
    case 'pulse':
      return game.phase === 'song' || game.phase === 'echo';
    case 'agent':
      // DOUBLE AGENT: no chat while files are read or clues are given; SAME ROOM talks out loud (no chat until the scores)
      if (game.phase === 'briefing' || game.phase === 'clues') return true;
      return game.settings && game.settings.mode === 'room' && ['debate', 'vote', 'unmask', 'last'].includes(game.phase);
    case 'slip': {
      // SLIPSTREAM: locked while you ride; out of lives = watch and talk
      if (game.phase !== 'count' && game.phase !== 'play') return false;
      if (game.out && game.out[uid]) return false;
      const n = mine('riders');
      return !(n && n.st === 'out');
    }
    case 'gridlock': {
      // GRIDLOCK: locked while it is your move — placing (until READY), your Classic turn, aiming (until locked in)
      if (game.out && game.out[uid]) return false;
      if (game.phase === 'place') return !mine('ready');
      if (game.phase === 'turn') return game.cur === uid;
      if (game.phase === 'aim') return !mine('shots');
      return false;
    }
    case 'golf': {
      if (game.phase !== 'play') return false;
      const n = mine('nodes');
      return !(n && n.h === game.hi && n.f != null); // holed out: watch and talk
    }
    case 'stakes': {
      // HIGH STAKES (APP FIXES — Grok 5.2): locked while you still have to BET (phase 'bet') or ANSWER (phase 'q') — your lock flag
      // (hslock/…/{uid}/{b|a}) opens it
      if (game.phase !== 'bet' && game.phase !== 'q') return false;
      const l = mine('lock');
      return !(l && l[game.phase === 'bet' ? 'b' : 'a']);
    }
    case 'rum': {
      // RUMRUNNER (APP FIXES — Grok 5.2): locked through the day until you're DONE (rrpub/…/{uid}.done)
      if (game.phase !== 'day') return false;
      const n = mine('pub');
      return !(n && n.done);
    }
    default:
      return false;
  }
}

/** One line of plain text: no control characters, single spaces, ≤ 300 characters. */
export function cleanText(t) {
  return String(t ?? '')
    .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_LEN);
}

// ---------------------------------------------------------------- profanity (whole words only)
// Roots with the endings they commonly take. Matching is whole-word, so "Scunthorpe", "assassin",
// "class", "cocktail", "Dickens" and "therapist" are never touched.
const WORDS = [
  'fuck(?:s|ed|er|ers|ing|in|face|wit|head)?', 'motherfuck(?:er|ers|ing|in)?', 'f+u+c+k+', 'fck', 'fcking', 'wtf', 'stfu',
  'shit(?:s|ty|ted|ting|head|heads|show)?', 'bullshit', 'horseshit', 'dipshit',
  'bitch(?:es|y|ing)?', 'son of a bitch',
  'cunts?', 'twats?', 'wank(?:er|ers|ing)?', 'bollocks',
  'ass(?:es)?', 'asshole(?:s)?', 'arsehole(?:s)?', 'dumbass', 'jackass', 'asshat',
  'bastards?', 'dickheads?', 'cocksucker(?:s)?', 'pussy', 'pussies',
  'sluts?', 'slutty', 'whores?', 'piss(?:ed)?',
  'fag(?:s|got|gots)?', 'nigg(?:er|ers|a|as)', 'retard(?:s|ed)?', 'spics?', 'kikes?', 'trann(?:y|ies)',
];
// (left out on purpose — too often innocent: "dick" (Moby-Dick, Philip K. Dick), "chink" (in the armor), "cock")
// A hyphen or apostrophe inside a word keeps it one word ("Moby-Dick", "Hell's").
// (LOAD FIX 4 — Grok's boot audit #5: NO LOOKBEHIND — Safari has it only from 16.4, and this regex is built at the module's top inside the
//  city's graph (core/harbor-radio.js): on iOS 16.0–16.3 the city couldn't load at all. The word's left edge is CAPTURED instead (the start,
//  or one character that can't be part of a word) and handed back unchanged — the same matches: chat.test.mjs + safari-floor.test.mjs)
const RE = new RegExp(`(^|[^\\p{L}\\p{N}_'’-])(${WORDS.join('|')})(?![\\p{L}\\p{N}_'’-])`, 'giu');

/** Does the text contain a word the filter would mask? (also used to keep crude trivia answers out) */
export const hasProfanity = text => { RE.lastIndex = 0; const hit = RE.test(String(text)); RE.lastIndex = 0; return hit; };

/** "what the fuck" -> "what the f***" (keeps the first letter and the length). */
export function maskProfanity(text) {
  return String(text).replace(RE, (m, edge, w) => edge + w[0] + w.slice(1).replace(/[^\s]/g, '*'));
}

// ---------------------------------------------------------------- presentation helpers
export function relTime(ms) {
  const s = Math.max(0, ms / 1000);
  if (s < 45) return 'now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

/** names: other players currently typing. */
export function typingLine(names) {
  if (!names.length) return '';
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return `${names.length} people are typing…`;
}

/** Who's typing right now (fresh entries only, never me). typing: { uid: serverTime } */
export function typists(typing, me, now) {
  return Object.entries(typing || {}).filter(([u, at]) => u !== me && typeof at === 'number' && now - at < TYPING_STALE_MS).map(([u]) => u);
}

/** Messages from other players newer than lastRead (system lines don't count). */
export function unreadCount(msgs, me, lastRead) {
  let n = 0;
  for (const m of msgs) if (m.u && m.u !== me && m.at > lastRead) n++;
  return n;
}

/** Same sender within 3 minutes of their previous line → drawn as one group. */
export const continues = (prev, m) => !!(prev && m.u && prev.u === m.u && !prev.s && m.at - prev.at < 180_000);
// THE CHAT FALSE ALARM (the owner's /admin errors, Nov 13): no chat write once this phone is out of the room. PURE: may this phone write to room
// `code`'s chat now? — the room it's in, still one of its players, not removed by the host, not leaving (`gone` = room.js#leftRoom through the
// `globalThis.__nsRoomGone` hub: a leave in flight keeps the player row in the state until exitRoom). A host line also needs `host`.
export function canChat(st, code, { gone = false, host = false } = {}) {
  if (!st || !code || gone || st.code !== code || !st.uid) return false;
  if (!st.players || !st.players[st.uid]) return false;
  if (st.kicked && st.kicked[st.uid]) return false;
  return !host || !!(st.meta && st.meta.hostId === st.uid);
}
