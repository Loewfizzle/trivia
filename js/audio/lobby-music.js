// MOOD MUSIC in a lobby: everyone in the room hears the SAME song at the same moment.
// The host keeps a running queue in rooms/{code}/meta/lm = { m: queue id, t0: first song's start (server ms), songs: [ids],
// sd: [durations ms], bag: { mood, left: [...] } }. About 40 s before the last song ends, the host appends the next one
// from ITS mood at that moment (so a mood change waits for the song to finish), never repeating a song in a mood until all
// have played (the room's bag). A new host just carries on from the queue. Every phone plays the queue with the synced-songs
// player on the server clock (late joiners land in the right spot). Before the first tap nothing can play; with the room
// rules not yet published (no queue appears) the lobby falls back to this phone's own mood shuffle.
// THE SONG DOESN'T CHANGE (Oct 20 2026): a new room's queue starts with the song the host is already hearing, at its place
// (seedQueue: t0 = server now − position). A phone whose own player is already on the room's current song at the right spot
// keeps playing it (rideDecision) — nothing restarts — and the synced player takes over from the NEXT song, crossfading in
// on the server clock. A phone on a different song crossfades into the room's song (~1.8 s) once it is decoded.
import { createSyncedSongs } from './synced-songs.js';
import { getMusicBus } from './engine.js';
import { serverNow, dbRef, update, firebaseReady } from '../firebase.js';
import { songStarts, XF_MS } from '../core/playlist.js';
import { moodNow, songsFor, durOf, loadMoodMusic } from './mood.js';
import { nowPlaying, handoffFade } from './music.js';
import { rideDecision, seedQueue, JOIN_FADE_S } from '../core/lobby-song.js';

export { rideDecision, seedQueue };

/** For createRoom: the queue to write with the new room (null: today's behaviour — the room picks a song). */
export function hostSeed(now) {
  try { return seedQueue(nowPlaying(), now, moodNow(), durOf); } catch { return null; }
}

let player = null, playingId = null, lastHostWrite = 0, handed = false;
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
export function lobbyMusicTick(st, active, inLobby = active) {
  // the host keeps the room's queue going even if its own setting is CLASSIC (the others still hear the room song)
  if (inLobby && st.meta && st.meta.hostId === st.uid && songsFor('late').length) hostDuty(st, serverNow());
  if (inLobby) loadMoodMusic();
  if (!active) { stopLobbyMusic(); return false; }
  const now = serverNow();
  const lm = st.meta.lm;
  if (!lm || !lm.songs || !lm.songs.length || !lm.t0) return false;
  const game = { matchId: lm.m, songs: lm.songs, sd: lm.sd, songStartAt: lm.t0 };
  const starts = songStarts(game);
  if (now > starts[starts.length - 1] + lm.sd[lm.sd.length - 1]) return false;   // the queue ran out (a new one is coming)
  if (!player || playingId !== lm.m) {
    if (player) player.stop();
    player = createSyncedSongs({ urlFor, label: 'lobby song', joinFade: JOIN_FADE_S, connect: ctx => { const g = ctx.createGain(); g.gain.value = 1; g.connect(getMusicBus()); return g; } });
    playingId = lm.m;
  }
  // already on the room's song here (the host who opened the room, a joiner on the same song): keep it — the synced player
  // only takes the songs after it, and this phone's own player hands over when the next one starts
  const d = rideDecision(nowPlaying(), lm, now);
  if (d.riding) player.setMinIndex(d.cur + 1);
  player.setGame(game);
  player.tick();
  if (d.riding) { handed = false; return false; }
  // the room's song is sounding here: this phone's own player fades out (a crossfade: long into a next song, ~1.8 s on joining)
  if (player.playing()) { if (!handed) { handed = true; handoffFade(d.cur > 0 && d.expected < XF_MS / 1000 ? XF_MS / 1000 : JOIN_FADE_S); } return true; }
  return false;
}

/** The room's song sounding on this phone right now: { id, at } or null (the title's beat follows it in a lobby). */
export function lobbyNow() { const n = player ? player.now() : null; return n ? { id: n.id, at: n.at } : null; }

export function stopLobbyMusic() { handed = false; if (player) { player.stop(); player = null; playingId = null; } }
export function lobbyMusicDebug() { return player ? { id: playingId, ...player.debug() } : null; }
void firebaseReady;
