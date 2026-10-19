// MOOD MUSIC in a lobby: everyone in the room hears the SAME song at the same moment.
// The host keeps a running queue in rooms/{code}/meta/lm = { m: queue id, t0: first song's start (server ms), songs: [ids],
// sd: [durations ms], bag: { mood, left: [...] } }. About 40 s before the last song ends, the host appends the next one
// from ITS mood at that moment (so a mood change waits for the song to finish), never repeating a song in a mood until all
// have played (the room's bag). A new host just carries on from the queue. Every phone plays the queue with the synced-songs
// player on the server clock (late joiners land in the right spot). Before the first tap nothing can play; with the room
// rules not yet published (no queue appears) the lobby falls back to this phone's own mood shuffle.
import { createSyncedSongs } from './synced-songs.js';
import { getMusicBus } from './engine.js';
import { serverNow, dbRef, update, firebaseReady } from '../firebase.js';
import { songStarts, XF_MS } from '../core/playlist.js';
import { moodNow, songsFor, durOf, loadMoodMusic } from './mood.js';

let player = null, playingId = null, lastHostWrite = 0;
const urlFor = id => new URL(`../../audio/music/${id}.mp3`, import.meta.url).href;

function pick(lm, mood) {
  const ids = songsFor(mood);
  if (!ids.length) return null;
  const last = lm && lm.songs && lm.songs[lm.songs.length - 1];
  let left = lm && lm.bag && lm.bag.mood === mood ? (lm.bag.left || []).filter(x => ids.includes(x)) : [];
  if (!left.length) {
    left = ids.slice();
    for (let k = left.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [left[k], left[j]] = [left[j], left[k]]; }
    if (left.length > 1 && left[0] === last) [left[0], left[1]] = [left[1], left[0]];
  }
  return { id: left[0], bag: { mood, left: left.slice(1) } };
}

/** Host duty (called from the lobby while this phone is the host): start or extend the room's queue. */
function hostDuty(st, now) {
  if (now - lastHostWrite < 1500) return;
  const lm = st.meta.lm;
  const starts = lm && lm.songs && lm.songs.length ? songStarts({ songStartAt: lm.t0, songs: lm.songs, sd: lm.sd }) : [];
  const end = starts.length ? starts[starts.length - 1] + lm.sd[lm.sd.length - 1] : 0;
  const mood = moodNow();
  if (!lm || !starts.length || now > end - 1500) {
    const p = pick(null, mood);
    if (!p) return;
    lastHostWrite = now;
    update(dbRef(`rooms/${st.code}/meta/lm`), { m: `lm${Math.round(now)}`, t0: Math.round(now + 1500), songs: [p.id], sd: [Math.round(durOf(p.id) * 1000)], bag: p.bag }).catch(() => {});
  } else if (now > end - 40_000 && lm.songs.length < 150) {
    const p = pick(lm, mood);
    if (!p) return;
    lastHostWrite = now;
    update(dbRef(`rooms/${st.code}/meta/lm`), { songs: [...lm.songs, p.id], sd: [...lm.sd, Math.round(durOf(p.id) * 1000)], bag: p.bag }).catch(() => {});
  }
}

/** Every phone, each tick while in a lobby with mood music on. Returns true while the room's queue is playing here. */
export function lobbyMusicTick(st, active) {
  if (!active) { stopLobbyMusic(); return false; }
  loadMoodMusic();
  const now = serverNow();
  if (st.meta.hostId === st.uid) hostDuty(st, now);
  const lm = st.meta.lm;
  if (!lm || !lm.songs || !lm.songs.length || !lm.t0) return false;
  const game = { matchId: lm.m, songs: lm.songs, sd: lm.sd, songStartAt: lm.t0 };
  const starts = songStarts(game);
  if (now > starts[starts.length - 1] + lm.sd[lm.sd.length - 1]) return false;   // the queue ran out (a new one is coming)
  if (!player || playingId !== lm.m) {
    if (player) player.stop();
    player = createSyncedSongs({ urlFor, label: 'lobby song', connect: ctx => { const g = ctx.createGain(); g.gain.value = 1; g.connect(getMusicBus()); return g; } });
    playingId = lm.m;
  }
  player.setGame(game);
  player.tick();
  return true;
}

export function stopLobbyMusic() { if (player) { player.stop(); player = null; playingId = null; } }
export function lobbyMusicDebug() { return player ? { id: playingId, ...player.debug() } : null; }
void firebaseReady; void XF_MS;
