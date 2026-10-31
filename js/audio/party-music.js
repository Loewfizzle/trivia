// CITY 2.0 — THE PARTY SONG IN SYNC (NIGHT-C Group 1; the owner, Oct 30 12:36 am — DECIDED: "the same party song on every phone").
// On a party night (and the preview panel's PARTY / &force=dance) the City 2.0 PARTY deck plays as ONE timeline every phone computes the
// same way (core/party-deck.js — the scene hands it over through the city clock: cityClock().partyLine() + partyDeck(), the SAME timeline
// its dance breaks are planned on), on the SERVER clock — so every phone hears the same song at the same moment, a break starts on the
// song each phone actually hears, and a phone joining mid-song lands at its place. Like the lobby's synced song (lobby-music.js):
//   · THIS PHONE's OWN PLAYER follows the timeline too: the mood provider (app.js) starts the timeline's song AT ITS PLACE (partyCue) —
//     so the music is right even before the synced player has decoded, on THE DIRECT PATH (a dead graph) and with the context locked;
//   · THE SYNCED PLAYER (synced-songs.js: decoded buffers, sample-accurate on the server clock) takes over — riding along while this phone's
//     own player is already on the timeline's song at its place (rideDecision: it takes the NEXT song), crossfading in otherwise;
//   · A LEGENDARY's TAPE STOP (the TR-3B: music.js#bendMusic works on this phone's own element) — the scene's musicHold(): the song goes
//     back to this phone's own player at its place for the legend (the tape's release lands where the song WOULD be: setMusicClocked),
//     the synced player takes over again at the next song. The dips + the low-pass reach the synced voices (onMusicDuck, musicInput).
// THE PARKED DATABASE holds: serverNow() is the saved offset while parked — no socket is opened for this. A sped-up preview (&speed) can't
// be in sync: this phone's own player then plays the deck as before. MUSIC OFF: nothing plays; the breaks still follow the same timeline.
import { createSyncedSongs, speakerLead } from './synced-songs.js';
import { musicUrl } from './music-url.js';
import { getMusicBus, getContext, clockFrozen } from './engine.js';
import { serverNow } from '../firebase.js';
import { cityClock, isCity2 } from '../core/city.js';
import { XF_MS } from '../core/playlist.js';
import { deckWindow, deckSongAt, deckSpec, EPOCH_ANCHOR } from '../core/party-deck.js';
import { moodNow, moodData } from './mood.js';
import { rideDecision, JOIN_FADE_S } from '../core/lobby-song.js';
import { nowPlaying, handoffFade, musicInput, onMusicDuck, musicDuckLevel, setMusicClocked } from './music.js';

// (the party's songs must agree to the beat, so this phone's own player only RIDES along when it is within PARTY_RIDE_S of the timeline —
// the lobby's 2.5 s is for a room's background song; the synced player is the exact one, so almost always it joins: the same song a hair
// off → a short PARTY_JOIN_S fade, another song → the lobby's JOIN_FADE_S crossfade)
export const PARTY_RIDE_S = 0.05, PARTY_JOIN_S = 0.35;
// (SKY-A — the owner's iPhone, Oct 30 8:21 am: "play × AbortError c2-party3.mp3 (start)" — on a synced night this phone's own player started
// the timeline's song, then the synced player took it over mid-load: a wasted download + an error in the log. Now the synced player CLAIMS
// the song while it loads: this phone's own player starts nothing — unless the synced one can't (a dead graph, a legendary's hold, its song
// failed to load) or hasn't sounded PARTY_WAIT_MS after the graph could play (a stuck load: the own player covers, as before))
export const PARTY_WAIT_MS = 8000;
let pendingAt = 0;
let player = null, playingId = null, handed = false, outGain = null, offMs = null, clocked = false, last = null, rideKey = '', rideOn = false;
const urlFor = id => musicUrl(id);
onMusicDuck((lv, s) => { try { if (outGain) outGain.gain.setTargetAtTime(lv, outGain.context.currentTime, Math.max(0.02, s / 3)); } catch { /* gone */ } });

// SKY-B — MUSIC AS RADIO STATIONS (the owner, decided): EVERY City 2.0 mood deck plays on the server clock like the party's — each MUSIC
// MOOD (MORNING / DAY / EVENING / LATE NIGHT / PARTY, + AUTO following the city's day) is a STATION: everyone tuned to it hears the same
// song at the same moment; joining lands MID-SONG with a short fade-in; changing the mood = changing station (a crossfade). A station is
// that mood's deck on its own seeded timeline from the epoch (core/party-deck.js — the same shuffle cycles, the same window); the PARTY on a
// party night keeps the EVENING's timeline (8 pm — the dance breaks are planned on it). &force=no-stations = each phone its own shuffle again.
const stationMemo = new Map();
function stationDeck(mood) {
  const d = moodData();
  if (!d) return null;
  let m = stationMemo.get(mood);
  if (!m || m.src !== d) { m = { src: d, deck: deckSpec(d, mood) }; stationMemo.set(mood, m); }
  return m.deck;
}
export const STATION_JOIN_S = 1.2;
// (the panel's SKIP on a station: THIS phone steps off it — its own shuffle — until the mood changes or the page reloads)
let leftMood = null;
export function leaveStation() { const m = moodNow(); if (leftMood === m) return false; leftMood = m; return true; }   // (tuning in mid-song: the song fades up over this — "a short fade-in")
/** the station a mood is on → { tl: { anchor, seed, kind: 'station', mood }, deck } or null (no songs for it) */
export function stationOf(mood) {
  const deck = stationDeck(mood);
  return deck ? { tl: { anchor: EPOCH_ANCHOR, seed: `station|${mood}`, kind: 'station', mood }, deck } : null;
}

/** the timeline now: { tl, deck, cityMs, off (city ms − server ms) } or null (a sped-up preview, no songs yet, City 1.0) — the PARTY's
 *  evening timeline on a party night (from its 8 pm anchor), else the mood's STATION */
function timeline() {
  if (!isCity2()) return null;
  const cc = cityClock();
  if (!cc) return null;
  if (cc.speed && cc.speed() !== 1) return null;
  const cityMs = cc.now(), off = cityMs - serverNow(), mood = moodNow();
  // (the night's deck = the PARTY station's songs: the same deck from the very first tick — a page never starts on the station's song + jumps)
  let tl = mood === 'party' && cc.partyLine ? cc.partyLine() : null, deck = tl ? (cc.partyDeck && cc.partyDeck()) || stationDeck('party') : null;
  if (tl && cityMs / 1000 < tl.anchor) tl = null;          // (before its first song — the evening's 8 pm: the party's station meanwhile)
  if (!tl || !deck) {
    if (cc.stationsOff && cc.stationsOff()) return null;
    if (leftMood != null) { if (leftMood === mood) return null; leftMood = null; }
    const st = stationOf(mood);
    if (!st) return null;
    tl = st.tl; deck = st.deck;
  }
  // (the offset is 0 on a live phone — the city runs on the server clock; a preview's &when= keeps one constant — sticky, so a 1 ms
  // read-to-read wobble never re-keys the player; a panel time jump moves it → the songs are placed again)
  if (offMs == null || Math.abs(off - offMs) > 400) offMs = off;
  return { tl, deck, cityMs, off: offMs };
}

/** SKY-A — does the SYNCED player claim the party song here right now (app.js's mood provider then starts nothing on this phone's own
 *  player)? true while the timeline runs, the graph lives, no legendary holds the music, its song hasn't failed and it hasn't been waiting
 *  PARTY_WAIT_MS since the graph could play. Never while this phone's own player already sounds (it plays on until the hand-off). */
export function partyClaims() {
  const T = timeline();
  if (!T) { pendingAt = 0; return false; }
  const ac = getContext(), cc = cityClock();
  if (ac && (ac.state === 'closed' || clockFrozen())) return false;
  if (cc && cc.musicHold && cc.musicHold()) return false;
  if (player && player.now()) return true;
  if (nowPlaying()) return false;
  if (player && last && player.failed && player.failed(last.cur)) return false;
  if (ac && ac.state === 'running') { if (!pendingAt) pendingAt = performance.now(); if (performance.now() - pendingAt > PARTY_WAIT_MS) return false; }
  return true;
}

/** THIS PHONE's OWN PLAYER on the timeline (app.js's mood provider): the song to start now + where in it (s) — { id, at } or null (no
 *  party timeline). `prev`: the song that just ended here — never started again at its very end (the next one instead). */
export function partyCue(prev = null) {
  const T = timeline();
  if (!T) return null;
  // (+ the element's start: a quarter second to load + begin; MODELS: + the SPEAKER DELAY setting, as the synced player. NOT the reported
  // output latency: it pushed this player ~40 ms off the timeline — past PARTY_RIDE_S with the element's jitter — and broke the first
  // tap's hand-over to the synced player, which already schedules by what is heard)
  const t = T.cityMs / 1000 + 0.25 + speakerLead();
  let s = deckSongAt(T.deck, T.tl.anchor, T.tl.seed, t);
  if (!s) return null;
  if (s.id === prev || s.t1 - t < 6) s = deckSongAt(T.deck, T.tl.anchor, T.tl.seed, s.t1 + 0.01) || s;
  return { id: s.id, at: Math.max(0, t - s.t0) };
}

/** Every tick (app.js, 250 ms) on City 2.0's menu screens with mood music on + the PARTY mood: → true while the synced player plays the
 *  party song here (this phone's own player then rests). hold: a legendary wants the song on this phone's own player (the tape stop). */
export function partyMusicTick(active, hold = false) {
  const T = active ? timeline() : null;
  if (clocked !== !!T) { clocked = !!T; try { setMusicClocked(clocked); } catch { /* tests */ } }
  // (a DEAD GRAPH — iOS after the lock screen: the context frozen or closed — can't play the synced voices: the song goes back to this
  // phone's own player, which takes THE DIRECT PATH (music.js) at the timeline's place; the synced player comes back once the graph runs)
  const ac = getContext(), dead = !!ac && (ac.state === 'closed' || clockFrozen());
  if (!T || hold || dead) { stopPartyMusic(hold || dead ? 0.25 : 0.6); return false; }
  const w = deckWindow(T.deck, T.tl.anchor, T.tl.seed, T.cityMs / 1000);
  // (SKY-B: the key is the deck's window only — when the server clock's offset settles (the first seconds after a load) the start moves and
  // the synced player RE-PLACES its voices (a quick fade, the decoded song kept); a new key re-created the player + decoded the song again:
  // a second of silence + a second "start" right after a station began)
  const game = { matchId: w.id, songs: w.songs, sd: w.sd, songStartAt: Math.round(w.startMs - T.off) };
  if (!player || playingId !== game.matchId) {
    if (player) player.stop();
    player = createSyncedSongs({ urlFor, label: T.tl.kind === 'station' ? `${T.tl.mood} station` : 'party song', joinFade: T.tl.kind === 'station' ? STATION_JOIN_S : PARTY_JOIN_S, connect: ctx => {
      outGain = ctx.createGain(); outGain.gain.value = musicDuckLevel(); outGain.connect(musicInput() || getMusicBus()); return outGain; } });
    playingId = game.matchId;
  }
  const now = serverNow(), lm = { t0: game.songStartAt, songs: game.songs, sd: game.sd }, np = nowPlaying();
  const d0 = rideDecision(np, lm, now), same = !!(np && np.id === game.songs[d0.cur]);
  // (THE RIDE is decided ONCE a song — sticky, so an element's jitter never flips it back + forth — and never once the synced player
  // sounds: from then on it keeps the song, this phone's own player resting)
  const key = `${game.matchId}|${d0.cur}`;
  if (rideKey !== key) { rideKey = key; rideOn = !handed && d0.riding && Math.abs(np.at - d0.expected) <= PARTY_RIDE_S; }
  const d = { ...d0, riding: rideOn && !handed && d0.riding };
  if (d.riding) player.setMinIndex(d.cur + 1);
  player.setGame(game);
  player.tick();
  last = { cur: d.cur, expected: d.expected, riding: d.riding, kind: T.tl.kind, id: game.songs[d.cur] };
  if (d.riding) { handed = false; return false; }
  if (player.now()) pendingAt = 0;
  if (player.now() || (handed && player.playing())) { if (!handed) { handed = true; handoffFade(d.cur > 0 && d.expected < XF_MS / 1000 ? XF_MS / 1000 : same ? PARTY_JOIN_S : JOIN_FADE_S); } return true; }
  // (SKY-A: still loading — the synced player claims the song: this phone's own player starts nothing meanwhile)
  return partyClaims();
}

/** the party song sounding from the synced player right now: { id, at } or null (the beat follows it like the lobby's) */
export function partyNow() { const n = player ? player.now() : null; return n ? { id: n.id, at: n.at } : null; }
export function stopPartyMusic(fade) { handed = false; rideKey = ''; rideOn = false; pendingAt = 0; if (player) { player.stop(fade); player = null; playingId = null; } }
/** the &debug=1 readout + the tests: what the party's music is doing — { kind (night / party / dance), song (the timeline's now), at (s
 *  into it), riding (this phone's own player on it), synced (the synced player sounding), player (its debug) } or null */
export function partyMusicDebug() {
  const T = timeline();
  if (!T) return null;
  const s = deckSongAt(T.deck, T.tl.anchor, T.tl.seed, T.cityMs / 1000);
  const ac = getContext(), lat = ac ? { out: Math.round((ac.outputLatency || 0) * 1000), base: Math.round((ac.baseLatency || 0) * 1000), ts: !!ac.getOutputTimestamp } : null;
  return { lat, speaker: Math.round(speakerLead() * 1000), kind: T.tl.kind, station: T.tl.kind === 'station' ? T.tl.mood : null, song: s ? s.id : null, at: s ? +(T.cityMs / 1000 - s.t0).toFixed(2) : null, dur: s ? s.dur : null, left: s ? +(s.t1 - T.cityMs / 1000).toFixed(1) : null,
    riding: !!(last && last.riding), synced: !!(player && player.now()), claims: partyClaims(), heard: partyNow(), own: (() => { const n = nowPlaying(); return n ? { id: n.id, at: n.at } : null; })(), player: player ? player.debug() : null };
}
