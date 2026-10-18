// Match kit — the shared pieces every real-time match view needs (see docs/match-kit.md):
//   moments  announcer lane (one visible, queued) + title cards
//   call     Call the Winner panel (locked pick, refresh-safe)
//   results  the report table under the podium + the calls list, ordinal()
//   tiers    quality tiers from frame pacing
//   hook     window.__<game> test hooks
// The podium itself is ui/final.js#createFinal; playlists/songs are core/playlist.js + audio/synced-songs.js.
export { createAnnouncer, createCards } from './moments.js';
export { showCall } from './call.js';
export { reportPanel, callsList, ordinal } from './results.js';
export { createTiers } from './tiers.js';
export { installTestHook, removeTestHook, testMode } from './hook.js';
