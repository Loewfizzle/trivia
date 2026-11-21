// JAYWALK H6B — THE MIX's MEASURE (docs/jaywalk.md "THE MIX"): every JAYWALK cue + the city's flyer sounds the game plays, MEASURED in
// Chromium's own audio engine (an OfflineAudioContext — no speaker, no server beyond the page's own files; NEVER THE LIVE SITE): each
// file decoded as the game decodes it, played through the game's own chain — its gain (sounds.js / flyers.js#MIX) → THE SOFT LIMITER
// (sfx.js#LIMITER, the JAYWALK set) → the trim — and its loudness read at the SFX bus's door: integrated LUFS (ITU-R BS.1770-4:
// K-weighting, 400 ms blocks, the −70 LUFS + −10 LU gates; a sound shorter than a block = its whole length) + its sample peak (dBFS).
// "out" = at the default Effects slider (0.7 → −6.2 dB — docs/audio.md); the music at its default sits at ≈ −34 LUFS out.
//   node tests/integration/jaywalk-mix.mjs "<chromium>" [--md]      (needs scripts/serve.mjs on :5173; --md prints the pass log's table)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { SOUNDS } from '../../js/games/jaywalk/sounds.js';

const BASE = process.env.E2E_BASE || 'http://localhost:5173', MD = process.argv.includes('--md');
const b = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.goto(guardUrl(`${BASE}/jaywalk-lab.html?emu`, 'jaywalk-mix'), { waitUntil: 'load' });   // (the lab: its import map resolves three for flyers.js; no server call)
const rows = await p.evaluate(async (SOUNDS) => {
  const S = await import('/js/games/jaywalk/sfx.js'), F = await import('/js/games/jaywalk/flyers.js');
  const SR = 48000;
  const dec = async url => { const r = await fetch(url); if (!r.ok) return null; const a = await r.arrayBuffer(); return new OfflineAudioContext(2, 1, SR).decodeAudioData(a); };
  // BS.1770 K-weighting at 48 kHz: the shelf, then the high-pass (the standard's own coefficients)
  const biq = (x, b0, b1, b2, a1, a2) => { const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; } return y; };
  const K = x => biq(biq(x, 1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585), 1, -2, 1, -1.99004745483398, 0.99007225036621);
  function lufs(buf) {
    const ch = []; for (let c = 0; c < buf.numberOfChannels; c++) ch.push(K(buf.getChannelData(c)));
    const n = buf.length, B = Math.round(0.4 * SR), H = Math.round(0.1 * SR), ms = [];
    const pow = (a, z) => { let s = 0; for (const x of ch) { let q = 0; for (let i = a; i < z; i++) q += x[i] * x[i]; s += q / (z - a); } return s; };
    if (n <= B) ms.push(pow(0, n)); else for (let a = 0; a + B <= n; a += H) ms.push(pow(a, a + B));
    const L = v => -0.691 + 10 * Math.log10(Math.max(v, 1e-12));
    let g = ms.filter(v => L(v) > -70); if (!g.length) return { i: -99, m: -99 };
    const mean = g.reduce((s, v) => s + v, 0) / g.length; g = g.filter(v => L(v) > L(mean) - 10);
    return { i: L(g.reduce((s, v) => s + v, 0) / g.length), m: L(Math.max(...ms)) };
  }
  const peak = buf => { let m = 0; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > m) m = v; } } return 20 * Math.log10(Math.max(m, 1e-9)); };
  /** play `buf` through the game's chain: gain → (the limiter → the trim) — `secs` long (a loop is held for it) */
  async function through(buf, { gain = 1, rate = 1, loop = false, at = 0, limiter = false, secs = 0 }) {
    const dur = secs || Math.min(8, (buf.duration - at) / rate + 0.3), ctx = new OfflineAudioContext(2, Math.ceil(dur * SR), SR);
    const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = buf; src.playbackRate.value = rate; src.loop = loop; g.gain.value = gain; src.connect(g);
    let tail = g;
    if (limiter) { const comp = ctx.createDynamicsCompressor(), trim = ctx.createGain(); for (const [k, v] of Object.entries(S.LIMITER)) comp[k].value = v; trim.gain.value = S.TRIM; g.connect(comp); comp.connect(trim); tail = trim; }
    tail.connect(ctx.destination); src.start(0, at);
    return ctx.startRendering();
  }
  const out = [];
  for (const s of SOUNDS) {
    const buf = await dec(`/audio/jaywalk/${s.id}.${s.ext || 'mp3'}?v=${S.JW_SFX_REV}`);
    if (!buf) { out.push({ id: s.id, miss: true }); continue; }
    const r = await through(buf, { gain: s.gain, loop: !!s.loop, limiter: true, secs: s.loop ? 4 : 0 }), raw = lufs(buf), L = lufs(r);
    out.push({ set: 'jaywalk', id: s.id, d: +buf.duration.toFixed(2), gain: s.gain, raw: +raw.i.toFixed(1), rawPk: +peak(buf).toFixed(1), bus: +L.i.toFixed(1), mom: +L.m.toFixed(1), pk: +peak(r).toFixed(1) });
  }
  for (const [id, m] of Object.entries(F.MIX)) {
    const buf = await dec(`/audio/city/${m.file || m.f || id.replace(/@.*/, '')}.mp3`);   // (J2: a row's `file` — the runways' own, ../jaywalk/…)
    if (!buf) { out.push({ id, miss: true }); continue; }
    const r = await through(buf, { gain: m.gain, rate: m.rate || 1, loop: !!m.loop, at: m.loop ? 0.08 : m.at || 0, secs: m.loop ? 4 : Math.min(6, (buf.duration - (m.at || 0)) / (m.rate || 1)) }), raw = lufs(buf), L = lufs(r);
    out.push({ set: 'city', id, d: +buf.duration.toFixed(2), gain: m.gain, rate: m.rate || 1, raw: +raw.i.toFixed(1), rawPk: +peak(buf).toFixed(1), bus: +L.i.toFixed(1), mom: +L.m.toFixed(1), pk: +peak(r).toFixed(1), what: m.what || '' });
  }
  return { out, duck: F.DUCK };
}, SOUNDS.filter(s => s.play));
await b.close();
const OUT_DB = -6.2;
let bad = 0;
if (MD) console.log('| cue | file\'s own (LUFS · peak dBFS) | gain | into the SFX bus (LUFS · loudest 0.4 s · peak dBFS) | out at the default slider (LUFS) |\n| --- | --- | --- | --- | --- |');
for (const r of rows.out) {
  if (r.miss) { console.log('MISSING', r.id); bad++; continue; }
  const clip = r.pk > -0.3;
  if (clip) bad++;
  if (MD) console.log(`| ${r.set === 'city' ? 'city · ' : ''}${r.id}${r.rate && r.rate !== 1 ? ` (rate ${r.rate})` : ''} | ${r.raw} · ${r.rawPk} | ${r.gain} | ${r.bus} · ${r.mom} · ${r.pk}${clip ? ' **CLIPS**' : ''} | ${(r.bus + OUT_DB).toFixed(1)} |`);
  else console.log(`${clip ? 'CLIP' : 'ok  '} ${(r.set + ' ' + r.id).padEnd(34)} ${String(r.d).padStart(5)} s  raw ${String(r.raw).padStart(6)} LUFS pk ${String(r.rawPk).padStart(6)}  × ${String(r.gain).padEnd(5)} → bus ${String(r.bus).padStart(6)} LUFS (loudest ${String(r.mom).padStart(6)}) pk ${String(r.pk).padStart(6)} dBFS · out ${(r.bus + OUT_DB).toFixed(1)}`);
}
console.log(MD ? '' : `\nthe music ducks: ${JSON.stringify(rows.duck)}`);
// J1 — THE SIREN UNDER THE TRAIN WARNING: HEAD TO HEAD's siren is quieter (integrated AND its loudest 0.4 s) than the crossing bell and every
// horn — a train warning always cuts through it; the out sound sits under your own hit (it repeats through a match)
{
  const by = id => rows.out.find(r => r.id === id && r.set !== 'city'), sir = by('h2h-siren'), out = by('out-drop'), hit = by('hit');
  for (const w of ['train-bell', 'train-horn', 'horn', 'truck-horn']) { const r = by(w), under = !!(sir && r && sir.bus < r.bus && sir.mom < r.mom); if (!under) bad++; console.log(`${under ? 'ok  ' : 'LOUD'} the siren under the ${w}: ${sir && sir.bus} / ${sir && sir.mom} < ${r && r.bus} / ${r && r.mom}`); }
  const soft = !!(out && hit && out.bus < hit.bus); if (!soft) bad++; console.log(`${soft ? 'ok  ' : 'LOUD'} the out sound under your own hit: ${out && out.bus} < ${hit && hit.bus}`);
}
// J2 — THE RUNWAYS' SOUNDS (THE SOUND RULE — the rule itself: tests/jaywalk-runway-sound.test.mjs): the crackle's three takes level-matched
// (within 2 LU integrated, 3.5 LU at their loudest 0.4 s — short takes of different shapes); THE REPEAT TELL's tick never louder than the crackle (both measures); the trail's
// fire flicker UNDER the boom (both measures)
{
  const by = id => rows.out.find(r => r.id === id && r.set === 'city'), takes = ['radio-static_1', 'radio-static_2', 'radio-static_3'].map(by), tick = by('runway-tick'), fl = by('afterburner-flicker'), boom = by('sonic-boom');
  const lo = Math.min(...takes.map(t => t.bus)), hi = Math.max(...takes.map(t => t.bus)), loM = Math.min(...takes.map(t => t.mom)), hiM = Math.max(...takes.map(t => t.mom));
  const even = hi - lo <= 2 && hiM - loM <= 3.5; if (!even) bad++; console.log(`${even ? 'ok  ' : 'ODD '} the crackle's three takes level-matched: ${takes.map(t => `${t.bus} / ${t.mom}`).join(' · ')}`);
  const soft = takes.every(t => tick.bus < t.bus && tick.mom < t.mom); if (!soft) bad++; console.log(`${soft ? 'ok  ' : 'LOUD'} the runway tick under every crackle: ${tick.bus} / ${tick.mom}`);
  const under = fl.bus < boom.bus && fl.mom < boom.mom; if (!under) bad++; console.log(`${under ? 'ok  ' : 'LOUD'} the trail's flicker under the boom: ${fl.bus} / ${fl.mom} < ${boom.bus} / ${boom.mom}`);
}
console.log(bad ? `${bad} cue(s) CLIP or are missing` : `${rows.out.length} cues — none clips (every peak under −0.3 dBFS at the SFX bus)`);
process.exit(bad ? 1 : 0);
