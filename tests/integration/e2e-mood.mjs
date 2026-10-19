// MOOD MUSIC end to end (docs/audio.md): the title follows the clock (and the ?when= preview), a mood change waits for the
// song to end, CLASSIC keeps the old playlist, the lobby plays ONE song for everyone on the server clock (late joiner,
// host migration), a game keeps its own music and the lobby comes back after it, the public board waits for a tap.
//   node e2e-mood.mjs "<browser>" [./shots-mood]          (local server with --emu + the emulators)
import { createHarness } from './kit/harness.mjs';

const H = await createHarness({ name: 'mood', slot: 'md', sizes: [] });
const { ok, log, sleep, waitFor, evalIn, openPlayer, browser, finish } = H;
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const tap = p => p.mouse.click(30, 300).catch(() => {});
const md = p => p.evaluate(() => window.__arcade.musicDebug());

try {
  const songs = await (await fetch(`${BASE}/data/mood-music.json`)).json();
  const inMood = (id, m) => !!id && songs.moods[m].includes(String(id).replace(/^m:/, ''));

  // ---- 1. the title follows the preview clock
  const T = await openPlayer(0, 'when=2026-10-20T03:00&tz=America/New_York');
  await T.waitForSelector('.nd-host', { timeout: 20000 });
  await tap(T);
  await waitFor(T, () => { const d = window.__arcade.musicDebug(); return d.list === 'mood' && d.playing; }, 'mood music on the title', 20000);
  let d = await md(T);
  ok(inMood(d.playing, 'late'), `TITLE: 3 am plays LATE NIGHT (${d.playing})`);
  ok(await T.evaluate(() => window.__arcade.mood()) === 'late', 'TITLE: the preview clock decides the mood');

  // ---- 2. a mood change waits for the song to finish
  const first = d.playing;
  await T.evaluate(() => { globalThis.__moodOverride = 'day'; });
  await sleep(1200);
  d = await md(T);
  ok(d.playing === first, 'MOOD CHANGE: the song keeps playing (never cut off)');
  await T.evaluate(() => window.__arcade.musicSeek(44));
  await waitFor(T, () => !!window.__arcade.musicDebug().next, 'the next song chosen near the end', 6000);
  d = await md(T);
  ok(inMood(d.next, 'day'), `MOOD CHANGE: the next song comes from the new mood (${d.next})`);
  await T.evaluate(() => window.__arcade.musicSeek(2.5));
  await waitFor(T, () => { const x = window.__arcade.musicDebug(); return x.playing === x.voices.find(v => v.gain > 0.5)?.id && x.playing !== null; }, 'crossfade', 8000).catch(() => {});
  await sleep(2500);
  d = await md(T);
  ok(inMood(d.playing, 'day') && d.playing !== first, `MOOD CHANGE: it crossfades into ${d.playing} at the end`);
  await T.evaluate(() => { globalThis.__moodOverride = null; });

  // ---- 3. CLASSIC
  await T.evaluate(() => import('/js/audio/settings.js').then(m => m.updateSettings({ menuMusic: 'classic' })));
  await waitFor(T, () => window.__arcade.musicDebug().desired === 'menu', 'classic menu', 6000);
  ok(true, 'CLASSIC: the old menu playlist');
  await T.evaluate(() => import('/js/audio/settings.js').then(m => m.updateSettings({ menuMusic: 'mood' })));
  await waitFor(T, () => window.__arcade.musicDebug().desired === 'mood', 'back to mood', 6000);
  ok(true, 'TIME OF DAY: back to mood music');

  // ---- 4. every mood from the preview switch
  for (const [when, want] of [['2026-10-20T08:30', 'morning'], ['2026-10-20T14:00', 'day'], ['2026-10-20T21:00', 'evening'], ['2026-10-23T21:00', 'party'], ['2026-10-24T01:30', 'party'], ['2026-10-25T01:30', 'party'], ['2026-10-25T21:00', 'evening']]) {
    const p = await openPlayer(7, `when=${when}&tz=America/New_York`);
    await p.waitForSelector('.nd-host', { timeout: 20000 });
    const m = await p.evaluate(() => window.__arcade.mood());
    ok(m === want, `PREVIEW: ${when} → ${m}`);
    await p.close();
  }
  await T.close();

  // ---- 5. the lobby: one song for everyone, on the server clock
  const host = await H.createRoom();
  await tap(host);
  const g1 = await H.join(1);
  await tap(g1);
  const slot = p => p.evaluate(() => { const x = window.__arcade.lobbyMusicDebug(); const s = x && x.slots && x.slots[0]; return s ? { id: s.id, t: s.t, wall: performance.timeOrigin + performance.now(), m: x.id } : null; });
  await waitFor(host, () => { const x = window.__arcade.lobbyMusicDebug(); return x && x.slots && x.slots.length; }, 'host playing the room song', 30000);
  await waitFor(g1, () => { const x = window.__arcade.lobbyMusicDebug(); return x && x.slots && x.slots.length; }, 'guest playing the room song', 30000);
  const [a, b] = await Promise.all([slot(host), slot(g1)]);
  const drift = Math.abs((a.t - a.wall / 1000) - (b.t - b.wall / 1000));
  ok(a.id === b.id, `LOBBY: both phones play the same song (${a.id})`);
  ok(drift < 0.35, `LOBBY: at the same moment (${drift.toFixed(3)} s apart)`);
  ok((await md(host)).playing == null, 'LOBBY: the per-phone player is quiet (the room song plays instead)');
  // a late joiner drops into the song already playing
  const g2 = await H.join(2);
  await tap(g2);
  await waitFor(g2, () => { const x = window.__arcade.lobbyMusicDebug(); return x && x.slots && x.slots.length; }, 'late joiner playing', 30000);
  const [c2, a2] = await Promise.all([slot(g2), slot(host)]);
  ok(c2.id === a2.id && c2.t > 1, `LATE JOINER: lands in the same song, ${c2.t.toFixed(1)} s in`);
  ok(Math.abs((c2.t - c2.wall / 1000) - (a2.t - a2.wall / 1000)) < 0.35, 'LATE JOINER: in step with the room');

  // ---- 6. a game keeps its own music; the lobby song returns after it
  await H.startGame(host, 'cipher', { rounds: 3 });
  await waitFor(g1, () => window.__arcade.musicDebug().desired === 'cipher', 'game music', 20000);
  ok(await g1.waitForFunction(() => window.__arcade.lobbyMusicDebug() === null, { timeout: 4000 }).then(() => true, () => false), 'GAME: its own music; the room song stopped');
  await H.backToLobby(host);
  await waitFor(g1, () => { const x = window.__arcade.lobbyMusicDebug(); return x && x.slots && x.slots.length; }, 'room song after the game', 30000);
  ok(true, 'AFTER THE GAME: the lobby\'s mood music comes back');

  // ---- 7. host migration mid-song: the queue carries on
  const before = await host.evaluate(() => window.__arcade.state.meta.lm.m);
  await H.killHost();
  await sleep(3000);
  const afterM = await g1.evaluate(() => window.__arcade.state.meta.lm.m);
  const s3 = await slot(g1);
  ok(afterM === before && s3 && s3.m === before, 'HOST MIGRATION: the same queue keeps playing (the song finishes, then the new host picks)');

  // ---- 8. the public board starts only after a tap
  const ctx = await browser.createBrowserContext();
  const pb = await ctx.newPage();
  await pb.goto(`${BASE}/board?emu`);
  await pb.waitForFunction(() => window.__board && window.__board.music, { timeout: 15000 });
  await sleep(1500);
  ok(!(await pb.evaluate(() => window.__board.music().playing)), 'PUBLIC BOARD: silent before the first tap');
  ok(!!(await pb.$('.bd-music')), 'PUBLIC BOARD: the music on/off button is there');
  await pb.mouse.click(200, 400);
  await pb.waitForFunction(() => window.__board.music().playing, { timeout: 15000 }).catch(() => {});
  const pbm = await pb.evaluate(() => window.__board.music());
  ok(pbm.playing && pbm.list === 'mood', `PUBLIC BOARD: mood music after the tap (${pbm.playing})`);
  await ctx.close();
} catch (e) {
  log('FAILED', e.message);
  H.errors.push(e.message);
}
await finish();
