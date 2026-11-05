# Room chat

Deep-dive for the room chat: data, locks per game, system lines, profanity filter, UI.

## Room chat (Stage 6)
- **Data:** `chats/{code}` (see Data model) — kept *outside* `rooms/{code}` because the room's `.read` is open to every
  signed-in user and rules cascade. Members = player node exists and not kicked, so a kick (or leaving) cuts access at
  once. A fresh room clears `chats/{code}`; the last player out / stale cleanup removes it.
- **Own store, lazy code:** `js/chat/*` loads the first time the player is in a room (`app.js`, `lobby.js`, `host.js` use
  dynamic imports — none of it is in the first paint). Chat state is NOT in the app store, so messages never re-render a
  game; the list updates incrementally (one element per message, keyed). E2E measured NEON PAR frame work unchanged.
- **Query:** `orderByChild('at')` + `limitToLast(100)` (`.indexOn: at`). The host prunes older lines (`hostTick`, ≤ every 20 s).
- **Sending:** `send()` = one update writing `m/{pushKey}` + `rate/{uid}` (server time). Client gap 0.9 s → "Slow down"
  hint; the rules' 0.8 s gap rejects anything faster → the line shows NOT SENT · TAP TO RETRY (outbox, same text, new
  key). Offline: Firebase queues the write; the line shows SENDING… until the server confirms.
- **Locks** (`logic.js#chatLocked`, unit-tested): chat opens in the lobby and every break; it is locked only during your
  own active play — Cipher guessing (until solved/out), Last Signal answering (eliminated = always open), Overclock
  challenge (until done), Bluff write/vote, PULSE song/Echo, Neon Par until you hole out, PRISM DROP while your board is live (knocked out = open), DOUBLE AGENT
  briefing + clues (in SAME ROOM mode also debate → last chance: the debate happens out loud), HIGH STAKES while you still have to
  bet (`bet`) or answer (`q`) — your lock flag opens it, RUMRUNNER through the `day` until you're DONE (APP FIXES — Grok 5.2: both fell to
  "open"). Spectators can always chat.
  While locked: the button shows a small lock, the badge keeps counting, no sound/toast/vibration, and an open sheet
  closes when the next round starts. `body.chat-fab-on .timer` leaves room for the button under the gear.
- **System lines** (host, quiet style): joined, left, signal lost (after 6 s offline), reconnected, removed by the host,
  new host (written by the new host), "<GAME> started" (`s-start-{matchId}`), winner (`s-win-{matchId}`, ties summarized).
- **Profanity:** (also keeps crude API trivia out — `sources.js#tooSpecific` uses `hasProfanity`) `meta/settings/chat/filter` (host, gear → FILTER LANGUAGE, default off) masks at render time on every
  phone (past lines too). Whole words with common endings only (`maskProfanity`; tests keep Scunthorpe/assassin/class).
- **UI:** lobby strip (latest 2 lines + typing + a message field → opens the sheet focused, so the keyboard comes up);
  sheet with grouped lines (same sender < 3 min), own lines right/accent, relative times, "New messages" pill when
  scrolled up, typing line, 300-char counter from 260, swipe down / × / backdrop to close (closing blurs → keyboard
  hides). Keyboard: `visualViewport` → `--kb` / `--vh` on the sheet (test hook `window.__fakeVV` + `__chatLayout()`).
  Text is always `textContent` (never HTML); links are plain text. Unread per device: `localStorage na:chat:read:{code}`.
- **Sound:** `sfx('chat')` + a 6 ms vibration for others' lines, only when the sheet is closed, not locked, tab visible.


## LOBBY 2.0 A — TYPING BUBBLES, THE CHAT KEYBOARD, QUICK REPLIES (Nov 3 2026 — docs/harbor/passes/lobby-2a.md)
- **TYPING BUBBLES** (the room in the city — `screens/room-city.js#paintBubbles`): a guest typing → a white "…" bubble (three dots, NO words)
  over their figure on every other phone, from `chats/{code}/typing/{uid}` (≤ 6 s fresh); gone when they stop or send. Full speech bubbles
  stay postponed (the owner).
- **THE CHAT KEYBOARD** (`chat/ui.js` + `css/chat.css`): the sheet keeps ONE size — `clamp(360px, 52dvh, 480px)`, which fits above an iPhone
  keyboard — and SLIDES UP as one piece: `--lift` (the keyboard's height from the visual viewport, minus the safe area) in a transform; never
  a resize, nothing behind it squeezes; the list stays on the newest; the swipe-down moves `--drag`. Only a keyboard taller than the room above
  it caps the height (`max-height` from `--vh`). The test hook stays (`window.__fakeVV` + `__chatLayout()`).
- **QUICK-REPLY CHIPS** above the field: `QUICK` = GG · NO WAY · REMATCH? · 🔥 · 😂 · 👏 (one tap sends — the same rules + the one-a-second rate);
  a game adds its own while it runs: `setGameChips(['NICE ROLL', …])` (≤ 4, ≤ 24 characters; `[]` clears) — THE CARTRIDGE PLUG.
- The room dock's CHAT opens the sheet; its pink dot = `chat.unread`.

## THE CHAT LOCK HIDES (SHELL 2.0 A, Nov 5 — docs/harbor/passes/shell-a.md)
While a game locks chat (`chatLocked` — its cartridge; OVERCLOCK will lock it for the whole match: too fast-paced), the in-game chat button and
the ☰ menu's CHAT row are HIDDEN for that stretch — never a greyed button — and no unread dot shows on ☰. The room's chat opens between games.
The chat sheet itself is THE SHEET (ui/sheet.js) since SHELL 2.0 A: ROOM CHAT small + spaced, the hush word on its line, its keyboard lift on
the sheet's panel (`.sh.chat-sheet .sh-panel`).
