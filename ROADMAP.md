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
| 3 | **LAST SIGNAL** | Trivia battle royale. HP + 2 shields each. Answer correctly + fast to strike your locked target; wrong/silent breaks a shield, then burns HP. Damage escalates every 5 questions. Eliminated players spectate; the UI decays as players fall. | alarm red | ✅ Stage 2 |
| 4 | **OVERCLOCK** | Gauntlet of 30-second mind challenges (unscramble, memory sequence, odd one out, quick math, pattern lock, trivia lightning), identical for everyone from a shared seed. Live leaderboard between rounds; final challenge ×2. Standard (12) and Marathon (24). | amber / magenta high energy | ✅ Stage 2 |

## Stages

### ✅ Stage 1 — foundation + hub + lobby + multiplayer core + CIPHER BREACH (complete)
- [x] Repo, static no-build setup, Vercel config, Firebase modular SDK from gstatic CDN
- [x] Design system: tokens, chamfered buttons, panels, player chips + hex avatars, timer bar, toasts, leaderboard, segmented control, bottom sheet, glitch transitions, ACCESS GRANTED join effect, particle bursts
- [x] Title screen, HOST / JOIN, invite links `/?room=ABCD`, Web Share + clipboard fallback
- [x] Profile: callsign, 8 neon colors (auto de-duplicated per room), 12 avatars
- [x] Lobby: live list with connection status, host game picker, kick, 2–8 players
- [x] Presence, seamless rejoin, host migration (offline or frozen heartbeat), pure host-authoritative director
- [x] Server-time timers, Screen Wake Lock, stale-room cleanup (> 6 h idle), multi-tab testing slots, emulator mode
- [x] CIPHER BREACH complete; open-licensed word lists; security rules + unit / rules / E2E tests

### ✅ Stage 2 — audio + LAST SIGNAL + OVERCLOCK (complete)
- [x] Audio engine: one AudioContext, music + SFX buses, soft limiter, iOS unlock on first tap, pause in background, `audioSession = 'ambient'`
- [x] Music: lazy-loaded 128 kbps MP3s (`audio/music/`), 1.5 s crossfades, seamless loop crossfade, never restarts a shared track, victory track on podiums (falls back to the game track), silent if a file is missing
- [x] Synthesized SFX (sine/triangle, filtered, reverb/delay, C-maj7 / A-min-pentatonic palette) for UI, Cipher tiles, countdown ticks, hits, shields, eliminations, Overclock, victory; light haptics
- [x] Settings sheet (gear on every screen): music / effects volume, mute, haptics, room code + leave
- [x] Trivia layer: Open Trivia DB (medium/hard, session token, ≥5 s between calls, batched) → The Trivia API → bundled 333-question fallback bank; entity decoding, de-duplication, obfuscated bank stored in the room so any host can continue it
- [x] LAST SIGNAL: targeting, speed-scaled strikes (10–30), shields/burn, ×1.25 escalation every 5 Qs, simultaneous resolution, eliminations + FLATLINE moment + spectators, progressive decay, 35-Q cap, host options (HP 75/100/150, categories)
- [x] OVERCLOCK: 6 seeded challenge types, rules cards on first appearance, partial credit + speed bonus, ×2 final, live progress strip, standings with rank changes, Standard / Marathon, resume mid-challenge
- [x] Shared podium/winner component; lobby unlocks both cards with per-game option sheets
- [x] Tests: 57 unit/simulation, 16 security-rule, 3 end-to-end browser suites (Cipher, Signal with host loss + audio crossfades, Overclock with identical-challenge check + mid-challenge refresh); screenshot review at 390×844 and 412×915

### ⏳ Stage 3 — NEURAL BLUFF + final polish
- [ ] Custom-written question bank (obscure true facts + answers + accepted alternates)
- [ ] Write fake → shuffle → vote → reveal flow; filter fakes that match the truth
- [ ] Neural Bluff identity (cold propaganda), its music track is already in `audio/music/neural-bluff.mp3`
- [ ] Final polish: extra animations, session-long win tracker across games, accessibility pass, sound/haptics tuning from real-phone feedback
