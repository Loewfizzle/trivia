// PULSE — player view. A canvas highway (render.js) under a light DOM HUD.
// Timing: everything runs on the audio output clock (clock.js). Each phone plays its own copy of the
// song, judges its own taps and publishes its stats every ~500 ms; nothing waits on the network.
import { h, clear, vibrate } from '../../ui/dom.js';
import { avatar, fmtNum, leaderboard } from '../../ui/components.js';
import { createFinal } from '../../ui/final.js';
import { toast } from '../../ui/toast.js';
import { dbRef, set, serverTimestamp, serverNow } from '../../firebase.js';
import { colorHex } from '../../config.js';
import { getContext, isUnlocked, onResume } from '../../audio/engine.js';
import { settings } from '../../audio/settings.js';
import { sfx } from '../../audio/sfx.js';
import { createRenderer } from './render.js';
import { heard, ctxAtServer, playSong, tone, calibrationMs, isCalibrated, outputChanged, LANE_FREQ } from './clock.js';
import { openCalibration, isCalibrating } from './calibrate.js';
import { loadMap, songBuffer, prefetchSong } from './songs.js';
import { createJudge, tap, expire, resume, accuracy, multiplier, emptyStats, scoreEcho, standings, matchStats } from './logic.js';
import { echoPlan, echoOn } from './director.js';

const GHOST = { name: 'GHOST', color: 'violet', avatar: 'ghost' };
const SPEED = { easy: 6.5, normal: 8, hard: 9.5 };
const DIFF_LABEL = { easy: 'EASY', normal: 'NORMAL', hard: 'HARD' };
const PUBLISH_MS = 500;
const MILESTONES = [25, 50, 100, 150, 200, 300, 400, 500];

let calibSkipped = false; // "skip for now" lasts for this page session

export function createView() {
  let root, st;
  const els = {};
  let R = null;            // renderer
  let raf = 0;
  let overlayKey = '';
  let final = null;
  const disposers = [];
  // per-song state
  let song = null;         // { si, id, map, buffer, J, player, notes, period, beats, energy, origin, ended }
  let loadingSi = -1;
  let board = { k: -1, ready: false, ...emptyStats(), e: 0, er: 0 };
  let lastPub = 0;
  let pubTimer = 0;
  let held = [false, false, false];
  let pointers = new Map();
  // echo state
  let echo = null;         // { si, plan, scheduled: Set, taps: { r: [] }, scored: Set, lit: Set }

  const g = () => st.game;
  const me = () => st.uid;
  const participant = game => !!(game && game.participants && game.participants[me()]);
  const player = uid => st.players[uid] || GHOST;
  const boardsNow = () => (st.liveKey && st.live && st.live.boards) || {};
  const diff = game => (game.settings && game.settings.diff) || 'normal';

  // ------------------------------------------------------------ mount
  function mount(el, state) {
    root = el;
    st = state;
    root.classList.add('pl');
    els.canvas = h('canvas.pl-canvas', { 'aria-label': 'PULSE highway — tap the lanes' });
    els.board = h('div.pl-board');
    els.score = h('div.pl-score', h('b', '0'), h('small', '×1'));
    els.combo = h('div.pl-combo', h('b', ''), h('small', 'COMBO'));
    els.acc = h('div.pl-acc');
    els.hud = h('div.pl-hud', els.board, els.score, els.combo, els.acc);
    els.over = h('div.pl-over');
    root.append(els.canvas, els.hud, els.over);
    R = createRenderer(els.canvas);
    R.onTier = name => { root.dataset.tier = name; };
    root.dataset.tier = R.tierName;
    const onResize = () => R && R.resize();
    window.addEventListener('resize', onResize);
    disposers.push(() => window.removeEventListener('resize', onResize));
    // input: pointerdown with full multi-touch; the canvas has touch-action: none
    const down = e => onPointer(e, true);
    const up = e => onPointer(e, false);
    els.canvas.addEventListener('pointerdown', down);
    els.canvas.addEventListener('pointerup', up);
    els.canvas.addEventListener('pointercancel', up);
    els.canvas.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    disposers.push(() => window.removeEventListener('keydown', onKey), () => window.removeEventListener('keyup', onKey));
    disposers.push(onResume(() => resync()));
    // headphones plugged / Bluetooth connected: the delay changes, so suggest a fresh calibration
    const md = navigator.mediaDevices;
    if (md && md.addEventListener) {
      let lastToast = 0;
      const onDevice = () => {
        if (Date.now() - lastToast < 20_000) return;
        lastToast = Date.now();
        toast('AUDIO DEVICE CHANGED — RECALIBRATE IN ⚙ SETTINGS FOR PERFECT TIMING', 'info', 5000);
      };
      md.addEventListener('devicechange', onDevice);
      disposers.push(() => md.removeEventListener('devicechange', onDevice));
    }
    const onVis = () => { if (document.hidden) pauseAudio(); else resync(); };
    document.addEventListener('visibilitychange', onVis);
    disposers.push(() => document.removeEventListener('visibilitychange', onVis));
    // the live board needs my own score as it changes, but DOM writes are throttled to 4/s
    const boardTimer = setInterval(() => { const game = g(); if (game && game.phase === 'song') renderBoard(game); }, 250);
    disposers.push(() => clearInterval(boardTimer));
    raf = requestAnimationFrame(loop);
    // test hook (emulator test runs only): lets the E2E bot read the clock + chart and tap like a player
    if (/[?&]emu\b/.test(location.search)) {
      window.__pulseView = {
        songTime: () => songTime(), notes: () => song && song.notes, stats: () => song && { ...song.J.st },
        echo: () => echo && { plan: echo.plan }, tier: () => R && R.tierName, geometry: () => R && R.geometry(),
        setTier: n => { if (R) { R.autoTier = false; R.setTier(n); } }, autoTier: () => { if (R) R.autoTier = true; },
      };
    }
    update(state);
  }

  function unmount() {
    cancelAnimationFrame(raf);
    stopSong();
    disposers.forEach(d => { try { d && d(); } catch { /* ignore */ } });
    if (final) final.destroy();
    clearTimeout(pubTimer);
    R && R.destroy();
    R = null;
  }

  // ------------------------------------------------------------ state updates
  function update(state) {
    st = state;
    const game = g();
    if (!game) return;
    root.dataset.phase = game.phase;
    // load the current song as soon as we know it (also on rejoin mid-song)
    if (game.si !== loadingSi && participant(game)) loadSong(game);
    if (participant(game) && board.k !== game.si) resetBoard(game);
    renderBoard(game);
    const key = `${game.matchId}|${game.si}|${game.phase}|${game.songStartAt || ''}|${game.echoStartAt || ''}`;
    if (key !== overlayKey) { overlayKey = key; buildOverlay(game); }
    else if (game.phase === 'final' && final) final.refresh();
    else if (game.phase === 'load') refreshLoad(game);
  }

  function resetBoard(game) {
    const mine = boardsNow()[me()];
    board = mine && mine.k === game.si ? { ready: false, e: 0, er: 0, ...mine } : { k: game.si, ready: false, ...emptyStats(), e: 0, er: 0 };
    board.k = game.si;
  }

  async function loadSong(game) {
    const si = game.si;
    loadingSi = si;
    const meta = game.songs[si];
    stopSong();
    song = null;
    echo = null;
    try {
      const [map, buffer] = await Promise.all([loadMap(meta.id), songBuffer(meta.id)]);
      if (loadingSi !== si || !g() || g().si !== si) return;
      const notes = map.notes[diff(game)] || [];
      const period = (map.beats.at(-1) - map.beats[0]) / (map.beats.length - 1);
      song = { si, id: meta.id, map, buffer, notes, period, J: createJudge(notes), player: null, origin: null, ended: false, nextMilestone: 0 };
      // next song downloads in the background while this one plays
      const next = game.songs[si + 1];
      if (next) prefetchSong(next.id).catch(() => {});
      update(st);
    } catch (e) {
      console.warn('pulse load', e);
      loadingSi = -1;
      setTimeout(() => { if (g() && g().si === si) update(st); }, 1500);
    }
  }

  // Ready = song decoded + sound unlocked + calibrated (or skipped). The host waits for this.
  function maybeReady(game) {
    if (!song || song.si !== game.si || board.ready || !participant(game)) return;
    if (!isUnlocked()) return;
    if (!isCalibrated() && !calibSkipped) return;
    board.ready = true;
    publish(true);
  }

  // ------------------------------------------------------------ song playback
  function ensurePlaying(game) {
    if (!song || song.si !== game.si || !game.songStartAt || song.player || !isUnlocked() || document.hidden) return;
    const now = serverNow();
    if (now > game.songStartAt + song.buffer.duration * 1000) return; // already over
    song.player = playSong(song.buffer, game.songStartAt);
    song.origin = song.player.origin;
    // joining late (refresh / rejoin): restore published stats; notes already gone count as misses
    const t = songTime();
    if (t > 0 && !song.resumed) {
      song.resumed = true;
      const mine = boardsNow()[me()];
      resume(song.J, t - 0.15, mine && mine.k === game.si ? mine : null);
      Object.assign(board, song.J.st);
    }
  }
  function stopSong() { if (song && song.player) { song.player.stop(0.2); song.player = null; } }
  function pauseAudio() { if (song && song.player) { song.player.stop(0.05); song.player = null; } }
  function resync() {
    // back from background / audio resumed: restart the song at the right position; missed notes expire
    const game = g();
    if (!game || game.phase !== 'song' || !song) return;
    pauseAudio();
    ensurePlaying(game);
  }

  /** Song position the player is hearing right now (s), corrected by the device calibration. */
  function songTime(perf = performance.now()) {
    if (!song || song.origin == null) return -99;
    return heard(perf) - song.origin - calibrationMs() / 1000;
  }

  // ------------------------------------------------------------ input
  function onPointer(e, isDown) {
    e.preventDefault();
    if (!R) return;
    if (!isDown) {
      const lane = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      if (lane != null) held[lane] = [...pointers.values()].includes(lane);
      return;
    }
    const lane = R.laneAt(e.clientX, e.clientY);
    if (lane < 0) return;
    pointers.set(e.pointerId, lane);
    held[lane] = true;
    press(lane, e.timeStamp);
  }
  const KEYS = { a: 0, s: 1, d: 2, j: 0, k: 1, l: 2, arrowleft: 0, arrowdown: 1, arrowright: 2, '1': 0, '2': 1, '3': 2 };
  function onKey(e) {
    const lane = KEYS[e.key.toLowerCase()];
    if (lane == null || e.repeat || e.metaKey || e.ctrlKey) return;
    if (document.querySelector('.modal, .pcal')) return;
    e.preventDefault();
    if (e.type === 'keyup') { held[lane] = false; return; }
    held[lane] = true;
    press(lane, e.timeStamp);
  }

  function press(lane, stamp) {
    const game = g();
    if (!game || !participant(game)) return;
    R.press(lane);
    if (game.phase === 'song' && song && song.origin != null) {
      const t = songTime(stamp);
      if (t < -1 || t > song.buffer.duration) return;
      const r = tap(song.J, lane, t);
      if (r.kind === 'perfect' || r.kind === 'great' || r.kind === 'good') {
        R.hit(lane, r.kind);
        if (settings.pulseHits) tone(heard() + 0.005, { freq: LANE_FREQ[lane] * 2, dur: 0.05, gain: 0.08, type: 'triangle', bus: 'sfx' });
        if (song.J.st.c >= (MILESTONES[song.nextMilestone] || Infinity)) { song.nextMilestone++; R.surge(); vibrate(15); }
      }
      paintScore();
    } else if (game.phase === 'echo' && echo) {
      echoTap(game, lane, stamp);
    }
  }

  // ------------------------------------------------------------ frame loop
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const game = g();
    if (!game || !R || isCalibrating()) return; // nothing to draw under the (opaque) calibration overlay
    const f = { now, t: -99, notes: null, done: null, speed: SPEED[diff(game)], energy: 0.35, pulse: 0, down: 0, combo: 0, held };
    if (game.phase === 'load') maybeReady(game);
    if (game.phase === 'song' && song && song.si === game.si) {
      ensurePlaying(game);
      const t = songTime();
      f.t = t; f.notes = song.notes; f.done = song.J.done;
      Object.assign(f, beatInfo(t));
      if (song.origin != null && participant(game)) {
        for (const i of expire(song.J, t)) R.miss(song.notes[i][1]);
        f.combo = song.J.st.c;
        if (now - lastPub > PUBLISH_MS) publish();
        if (!song.ended && t > song.buffer.duration - 0.2) { song.ended = true; publish(true); }
      }
      paintScore();
      countdown(game, now);
    } else if (game.phase === 'echo' && song && game.echoStartAt) {
      echoFrame(game, f);
    } else if (song) {
      Object.assign(f, beatInfo(-99));
    }
    R.frame(f);
  }

  function beatInfo(t) {
    if (!song || t < -50) return { energy: 0.35, pulse: 0, down: 0 };
    const m = song.map;
    const x = (t - m.beats[0]) / song.period;
    const bi = Math.max(0, Math.min(m.energy.length - 1, Math.floor(x)));
    const ph = x - Math.floor(x);
    const pulse = t < 0 ? 0 : Math.exp(-ph * 5);
    const isDown = ((Math.floor(x) - m.downbeat) % 4 + 4) % 4 === 0;
    return { energy: m.energy[bi] ?? 0.4, pulse, down: isDown ? pulse : 0 };
  }

  // ------------------------------------------------------------ publishing (throttled)
  function publish(force = false) {
    const game = g();
    if (!game || !participant(game)) return;
    const now = performance.now();
    if (!force && now - lastPub < PUBLISH_MS) return;
    lastPub = now;
    if (song && song.si === game.si) Object.assign(board, song.J.st);
    const data = {
      k: game.si, ready: !!board.ready,
      s: board.s | 0, c: board.c | 0, mc: board.mc | 0, p: board.p | 0, g: board.g | 0, o: board.o | 0, m: board.m | 0, n: board.n | 0,
      e: board.e | 0, er: board.er | 0, at: serverTimestamp(),
    };
    set(dbRef(`rooms/${st.code}/pulse/${game.matchId}/${me()}`), data).catch(() => {});
  }

  // ------------------------------------------------------------ HUD
  let lastScore = -1, lastCombo = -1, lastMult = 0;
  function paintScore() {
    if (!song) return;
    const s = song.J.st;
    if (s.s !== lastScore) { els.score.firstChild.textContent = fmtNum(s.s); lastScore = s.s; }
    const mult = multiplier(s.c);
    if (mult !== lastMult) { els.score.lastChild.textContent = `×${mult}`; els.score.classList.toggle('is-hot', mult >= 4); lastMult = mult; }
    if (s.c !== lastCombo) {
      els.combo.firstChild.textContent = s.c >= 5 ? String(s.c) : '';
      els.combo.classList.toggle('is-on', s.c >= 5);
      if (s.c >= 5 && s.c % 25 === 0) { els.combo.classList.remove('pop'); void els.combo.offsetWidth; els.combo.classList.add('pop'); }
      lastCombo = s.c;
    }
    const total = s.p + s.g + s.o + s.m;
    els.acc.textContent = total ? `${(accuracy(s) * 100).toFixed(1)}%` : '';
  }

  // compact live leaderboard: rows keyed by uid, positioned with transforms (smooth rank changes)
  const rowEls = new Map();
  function renderBoard(game) {
    const boards = boardsNow();
    const uids = Object.keys(game.participants || {});
    const rows = uids.map(uid => {
      const b = boards[uid];
      const live = uid === me() && song && song.si === game.si && game.phase === 'song' ? song.J.st.s : b && b.k === game.si ? b.s || 0 : 0;
      return { uid, s: live + (game.phase !== 'song' && b && b.k === game.si ? b.e || 0 : 0) };
    }).sort((a, b) => b.s - a.s || (a.uid < b.uid ? -1 : 1));
    let shown = rows.slice(0, 3);
    const mine = rows.findIndex(r => r.uid === me());
    if (mine >= 3) shown = [...rows.slice(0, 2), rows[mine]];
    const keep = new Set(shown.map(r => r.uid));
    for (const [uid, el] of rowEls) if (!keep.has(uid)) { el.remove(); rowEls.delete(uid); }
    shown.forEach((r, i) => {
      let el = rowEls.get(r.uid);
      const p = player(r.uid);
      if (!el) {
        el = h('div.plb-row', { class: r.uid === me() ? 'is-me' : null, style: { '--c': colorHex(p.color) } },
          h('span.plb-rank'), h('span.plb-name', p.name), h('span.plb-score'));
        rowEls.set(r.uid, el);
        els.board.append(el);
      }
      el.style.transform = `translateY(${i * 100}%)`;
      el.children[0].textContent = String(rows.indexOf(r) + 1);
      el.children[2].textContent = fmtNum(r.s);
    });
    els.board.style.height = `${shown.length * 22}px`;
  }

  // ------------------------------------------------------------ overlays
  function buildOverlay(game) {
    clear(els.over);
    els.over.className = `pl-over ov-${game.phase}`;
    if (final) { final.destroy(); final = null; }
    if (!participant(game) && game.phase !== 'final' && game.phase !== 'standings') {
      els.over.append(h('div.pl-spectate', h('b', 'SPECTATING'), h('span', 'You join the next match.')));
    }
    if (game.phase === 'load') buildLoad(game);
    else if (game.phase === 'song') buildIntro(game);
    else if (game.phase === 'echo') buildEchoShell(game);
    else if (game.phase === 'standings') buildStandings(game);
    else if (game.phase === 'final') buildFinal(game);
  }

  function songCard(game, extra) {
    const meta = game.songs[game.si];
    const mins = `${Math.floor(meta.duration / 60)}:${String(Math.round(meta.duration % 60)).padStart(2, '0')}`;
    return h('div.pl-card',
      h('div.pl-card-kicker', game.songs.length > 1 ? `SONG ${game.si + 1} OF ${game.songs.length}` : 'NOW ENTERING'),
      h('div.pl-card-title', { 'data-text': meta.title }, meta.title),
      meta.artist ? h('div.pl-card-artist', meta.artist) : null,
      h('div.pl-card-meta',
        h('span', h('b', String(Math.round(meta.bpm))), ' BPM'),
        h('span', h('b', mins)),
        h('span.pl-diff', { dataset: { d: diff(game) } }, DIFF_LABEL[diff(game)])),
      extra || null);
  }

  function buildLoad(game) {
    els.loadNote = h('div.pl-load-note');
    els.loadAct = h('div.pl-load-act');
    els.over.append(h('div.pl-stage', songCard(game, h('div.pl-load', els.loadNote, els.loadAct))));
    refreshLoad(game);
  }

  function refreshLoad(game) {
    if (!els.loadNote || !participant(game)) return;
    const boards = boardsNow();
    const uids = Object.keys(game.participants || {});
    const ready = uids.filter(u => boards[u] && boards[u].k === game.si && boards[u].ready).length;
    let note, action = null;
    if (!song || song.si !== game.si) note = 'TUNING IN…';
    else if (!isUnlocked()) { note = 'TAP TO ENABLE SOUND'; action = h('button.btn.btn-primary.btn-block', { type: 'button', onclick: () => { const c = getContext(); c && c.resume && c.resume(); } }, h('span', 'ENABLE SOUND')); }
    else if (!isCalibrated() && !calibSkipped) {
      note = 'FIRST TIME ON THIS DEVICE';
      action = h('button.btn.btn-primary.btn-block', { type: 'button', onclick: () => openCalibration({ onDone: ms => { if (ms == null) calibSkipped = true; update(st); } }) }, h('span', 'SYNC MY AUDIO (10 s)'));
    } else note = board.ready ? `READY · WAITING FOR ${uids.length - ready} MORE` : 'READY';
    if (els.loadNote.textContent !== note) els.loadNote.textContent = note;
    const sig = action ? note : '';
    if (els.loadAct.dataset.sig !== sig) { els.loadAct.dataset.sig = sig; els.loadAct.replaceChildren(...(action ? [action] : [])); }
    if (board.ready && outputChanged() && !els.loadAct.dataset.warned) {
      els.loadAct.dataset.warned = '1';
      toast('AUDIO OUTPUT CHANGED? RECALIBRATE PULSE IN SETTINGS ⚙', 'info', 5000);
    }
  }

  function buildIntro(game) {
    els.count = h('div.pl-count');
    els.intro = h('div.pl-stage.is-intro', songCard(game));
    els.over.append(els.intro, els.count);
    els.countShown = '';
  }

  // cinematic card, then 3-2-1 on the song's own beat, with soft ticks scheduled on the audio clock
  function countdown(game, now) {
    if (!els.count || !game.songStartAt) return;
    const left = game.songStartAt - serverNow();
    const spb = (song ? song.period : 60 / game.songs[game.si].bpm) * 1000;
    if (els.intro) els.intro.classList.toggle('is-out', left < spb * 3.6);
    if (!els.ticked && song && left > spb * 3 + 120 && isUnlocked()) {
      els.ticked = true;
      // scheduled sound is never calibration-shifted (only what the player perceives — visuals, taps — is)
      for (let k = 3; k >= 1; k--) tone(ctxAtServer(game.songStartAt - k * spb), { freq: 880, dur: 0.05, gain: 0.18, type: 'triangle' });
    }
    let txt = '';
    if (left <= spb * 3 && left > 0) txt = String(Math.ceil(left / spb));
    else if (left <= 0 && left > -spb) txt = 'GO';
    if (txt !== els.countShown) {
      els.countShown = txt;
      els.count.textContent = txt;
      els.count.classList.remove('tick'); void els.count.offsetWidth; if (txt) els.count.classList.add('tick');
    }
  }

  // ------------------------------------------------------------ Echo
  function buildEchoShell(game) {
    els.echo = h('div.pl-echo');
    els.over.append(els.echo);
    echo = { si: game.si, plan: echoPlan(game), scheduled: new Set(), taps: {}, scored: new Set(), lit: new Set(), shown: '' };
    // carry over rounds already scored (rejoin mid-Echo)
    const mine = boardsNow()[me()];
    if (mine && mine.k === game.si) { board.e = mine.e || 0; board.er = mine.er || 0; }
  }

  function echoFrame(game, f) {
    if (!echo || echo.si !== game.si) buildEchoShell(game);
    const { plan } = echo;
    const el = serverNow() - game.echoStartAt;
    const ri = plan.rounds.findIndex(r => el < r.endAt);
    const r = plan.rounds[ri];
    const bpm = game.songs[game.si].bpm;
    f.energy = 0.5; f.combo = 0;
    if (!r) { setEcho('', ''); return; }
    const pattern = plan.patterns[ri];
    const beatMs = r.beat;
    // audio: schedule this round's pattern + ticks once, on the audio clock
    if (!echo.scheduled.has(ri) && el >= r.cardAt - 50 && isUnlocked()) {
      echo.scheduled.add(ri);
      const at = ms => ctxAtServer(game.echoStartAt + ms);
      if (el < r.patternAt) for (const n of pattern.notes) tone(at(r.patternAt + n.beat * beatMs), { freq: LANE_FREQ[n.lane], dur: 0.22, gain: 0.3 });
      for (let k = 0; k < 4; k++) if (el < r.countAt + k * beatMs) tone(at(r.countAt + k * beatMs), { freq: k === 3 ? 1320 : 990, dur: 0.04, gain: 0.14, type: 'triangle' });
    }
    // visuals: pattern notes ride the highway during "listen" and light their pads as they land
    const tNow = el / 1000;
    if (el >= r.listenAt && el < r.countAt) {
      f.t = tNow;
      f.ghost = pattern.notes.map(n => ({ t: (r.patternAt + n.beat * beatMs) / 1000, lane: n.lane }));
      for (const [k, n] of pattern.notes.entries()) {
        const key = `${ri}:${k}`;
        if (!echo.lit.has(key) && el >= r.patternAt + n.beat * beatMs) { echo.lit.add(key); R.echoLight(n.lane); }
      }
    }
    const ph = ((el - r.listenAt) / beatMs) % 1;
    f.pulse = el >= r.listenAt && el < r.closeAt ? Math.exp(-Math.max(0, ph) * 5) * 0.8 : 0;
    // phase captions
    if (el < r.listenAt) setEcho('card', ri);
    else if (el < r.countAt) setEcho('listen', ri);
    else if (el < r.repeatAt) setEcho('count', ri, String(4 - Math.floor((el - r.countAt) / beatMs)));
    else if (el < r.closeAt) setEcho('repeat', ri);
    else {
      if (!echo.scored.has(ri) && participant(game)) {
        echo.scored.add(ri);
        const taps = echo.taps[ri] || [];
        const res = scoreEcho(pattern, bpm, taps);
        echo.last = res;
        if ((board.er | 0) <= ri) { board.e = (board.e | 0) + res.pts; board.er = ri + 1; publish(true); }
        sfx(res.hits === res.of ? 'solve' : res.hits ? 'correct' : 'roundEnd');
      }
      setEcho('score', ri);
    }
  }

  function setEcho(mode, ri, sub = '') {
    const key = `${mode}|${ri}|${sub}|${echo && echo.last ? echo.last.pts : ''}`;
    if (!echo || echo.shown === key) return;
    echo.shown = key;
    const round = `ECHO ${ri + 1} / ${echo.plan.rounds.length}`;
    let node = null;
    if (mode === 'card') node = h('div.pe-card', h('div.pe-kicker', 'BONUS ROUND'), h('div.pe-title', { 'data-text': 'ECHO' }, 'ECHO'), h('div.pe-sub', `${round} · ${echo.plan.patterns[ri].notes.length} NOTES`), ri === 0 ? h('p.pe-how', 'Listen to the pattern. Then play it back from memory.') : null);
    else if (mode === 'listen') node = h('div.pe-cap', h('b', 'LISTEN'), h('small', round));
    else if (mode === 'count') node = h('div.pe-cap.is-count', h('b', sub), h('small', 'YOUR TURN IN'));
    else if (mode === 'repeat') node = h('div.pe-cap.is-go', h('b', 'YOUR TURN'), h('small', 'PLAY IT BACK'));
    else if (mode === 'score') {
      const r = echo.last;
      node = r ? h('div.pe-score', h('small', round), h('b', `+${fmtNum(r.pts)}`), h('span', `${r.hits} / ${r.of} NOTES · ${r.perfect} PERFECT`)) : h('div.pe-cap', h('small', round));
    }
    els.echo.replaceChildren(...(node ? [node] : []));
  }

  function echoTap(game, lane, stamp) {
    const el = serverNow() - game.echoStartAt;
    const ri = echo.plan.rounds.findIndex(r => el < r.endAt);
    const r = echo.plan.rounds[ri];
    if (!r || el < r.repeatAt - 300 || el > r.closeAt) return;
    // time relative to the start of the repeat window, on the audio clock, calibration-corrected
    const rel = heard(stamp) - calibrationMs() / 1000 - ctxAtServer(game.echoStartAt + r.repeatAt);
    (echo.taps[ri] || (echo.taps[ri] = [])).push({ t: rel, lane });
    R.echoLight(lane);
    tone(heard() + 0.004, { freq: LANE_FREQ[lane], dur: 0.16, gain: 0.22 });
  }

  // ------------------------------------------------------------ standings / final
  function statsLine(s) {
    return `${(s.acc * 100).toFixed(1)}% · MAX ${s.mc}`;
  }

  function buildStandings(game) {
    stopSong();
    const rows = standings(game, game.si);
    const prev = game.si > 0 ? Object.fromEntries(standings(game, game.si - 1).map(r => [r.uid, r])) : {};
    const res = (game.results && game.results[game.si]) || {};
    const ms = matchStats(game);
    els.over.append(h('div.panel-full.pl-standings',
      h('div.sheet-kicker', `AFTER SONG ${game.si + 1} OF ${game.songs.length}`),
      leaderboard(rows.map(r => ({ ...r, prevScore: prev[r.uid] ? prev[r.uid].score : 0, prevRank: prev[r.uid] ? prev[r.uid].rank : null, delta: res[r.uid] ? (res[r.uid].s || 0) + (res[r.uid].e || 0) : 0, note: ms[r.uid] ? statsLine(ms[r.uid]) : '' })), st.players, { me: me(), presence: st.presence }),
      h('div.next-up', 'NEXT: ', h('b', game.songs[game.si + 1] ? game.songs[game.si + 1].title : ''))));
  }

  function buildFinal(game) {
    stopSong();
    const rows = standings(game);
    const ms = matchStats(game);
    const table = h('div.pl-stats',
      h('div.pl-stats-head', h('span', ''), h('span', 'ACC'), h('span', 'MAX'), h('span.j-p', 'PERF'), h('span.j-g', 'GREAT'), h('span.j-o', 'GOOD'), h('span.j-m', 'MISS')),
      rows.map(r => {
        const s = ms[r.uid] || { acc: 0, mc: 0, p: 0, g: 0, o: 0, m: 0 };
        const p = player(r.uid);
        return h('div.pl-stats-row', { class: r.uid === me() ? 'is-me' : null, style: { '--c': colorHex(p.color) } },
          h('span.pl-stats-name', avatar(p.avatar, p.color, 20), p.name),
          h('span', `${(s.acc * 100).toFixed(1)}%`), h('span', String(s.mc)),
          h('span.j-p', String(s.p)), h('span.j-g', String(s.g)), h('span.j-o', String(s.o)), h('span.j-m', String(s.m)));
      }));
    final = createFinal({
      rows: rows.map(r => ({ ...r, note: ms[r.uid] ? statsLine(ms[r.uid]) : '' })),
      players: st.players, me: me(), presence: st.presence, scoreLabel: 'PTS',
      kicker: 'SIGNAL CHAIN COMPLETE', winnerLine: nm => `${nm} OWNED THE ROAD`, extra: table,
    });
    els.over.append(final.el);
  }

  return { mount, update, unmount };
}

