# NEURAL ARCADE — Roadmap

> Working title. The name lives in one constant: `APP_NAME` in `js/config.js` (also update `<title>`/meta in `index.html`).

One web app, four games, 2–8 players, each on their own phone — same room or different cities.
A host creates a room (4-letter code), friends join, the host picks a game. After a match everyone
returns to the same lobby and the host can pick another game without anyone rejoining.

Hosted at **trivia.loewfizzle.com** (Vercel, static, deployed from GitHub `Loewfizzle/trivia`).
Backend: Firebase Realtime Database + Anonymous Auth. Target match length 5–10 min, host-adjustable.

## The games

| # | Game | Style | Identity | Status |
|---|------|-------|----------|--------|
| 1 | **CIPHER BREACH** | Competitive Wordle race. Same hidden word for everyone; opponents' boards shown live as color-only tiles. Points for solving, speed, fewer guesses. Word length grows over rounds. | terminal green / cyan | ✅ Stage 1 |
| 2 | **NEURAL BLUFF** | Bluffing trivia (Fibbage/Balderdash). Obscure true-fact question; everyone writes a convincing fake; fakes + truth shuffled; vote for the real one. Points for finding the truth and for fooling others. Custom question bank. | cold dystopian propaganda | ⏳ Stage 3 |
| 3 | **LAST SIGNAL** | Trivia battle royale. 100 HP each. Answer correctly + fast to strike a chosen rival; wrong answers cost shields/HP. Eliminated players spectate. UI glitches/degrades as players fall. Questions from Open Trivia DB / The Trivia API, MEDIUM + HARD only. | alarm red | ⏳ Stage 2 |
| 4 | **OVERCLOCK** | Gauntlet of rapid 30-second mind challenges in random order (unscramble, memory sequence, odd-one-out, quick math, trivia lightning…). Live leaderboard between rounds. Standard ~10 min + ~20 min "Marathon". | yellow / magenta high energy | ⏳ Stage 2 |

## Stages

### ✅ Stage 1 — foundation + hub + lobby + multiplayer core + CIPHER BREACH (complete)
- [x] Repo, static no-build setup, Vercel config, Firebase modular SDK from gstatic CDN
- [x] Design system: tokens, chamfered buttons, panels, player chips + hex avatars, timer bar, toasts, leaderboard, segmented control, bottom sheet, glitch transitions, ACCESS GRANTED join effect, particle bursts
- [x] Title screen (animated glitch logo), HOST / JOIN, invite links `/?room=ABCD`, Web Share + clipboard fallback
- [x] Profile: callsign, 8 neon colors (auto de-duplicated per room), 12 avatars
- [x] Lobby: live list with connection status ("SIGNAL LOST"), host game picker (4 cards, 3 locked), kick, 2–8 players
- [x] Presence via `onDisconnect`; disconnected players stay as "signal lost"
- [x] Seamless rejoin after refresh / app switch / lost signal (room + score + mid-round board)
- [x] Host migration: offline > 10 s, or frozen (heartbeat stale) during a game → next player in join order takes over; enforced by security rules
- [x] Host-authoritative director written as a pure function of DB state, so any client can take over mid-game
- [x] Server-time-offset timers, Screen Wake Lock, stale-room cleanup (> 6 h idle)
- [x] Multi-player testing from one computer (`?slot=2`, `?slot=3`…), localhost emulator mode (`?emu`)
- [x] CIPHER BREACH: 3/5/8 rounds, escalating 5→7 letters, 6 guesses, 60–180 s timer, dictionary check + shake, correct duplicate-letter coloring, keyboard letter states, live opponent mini-boards, scoring (solve + speed + unused guesses), reveal → round results → standings → podium + winner reveal → back to lobby
- [x] Open-licensed word lists (ENABLE + SCOWL + Norvig frequency), offensive-word filter, obfuscated secret
- [x] Security rules + tests (unit, rules-emulator, full 3-browser E2E)

### ⏳ Stage 2 — LAST SIGNAL + OVERCLOCK
- [ ] Shared trivia fetcher (Open Trivia DB + The Trivia API), MEDIUM/HARD only, HTML-entity decoding, dedupe, session token, offline fallback bank
- [ ] LAST SIGNAL: HP/shields model, target picker, strike resolution by the director, elimination + spectator mode, progressive UI glitch/degradation, last-one-standing finale
- [ ] OVERCLOCK: challenge framework (each challenge = generator + validator + view), 6+ challenge types, 30 s rounds, between-round live leaderboard, Standard (~10 min) and Marathon (~20 min)
- [ ] Unlock their lobby cards (`playable: true` in `GAMES`), add theme CSS files

### ⏳ Stage 3 — NEURAL BLUFF + polish
- [ ] Custom-written question bank (obscure true facts + answers + accepted alternates)
- [ ] Write fake → shuffle → vote → reveal flow; filter fakes that match the truth
- [ ] Sound effects (WebAudio, tiny synthesized cues, mute toggle), richer haptics
- [ ] Extra animations, session-long win tracker across games, accessibility pass
