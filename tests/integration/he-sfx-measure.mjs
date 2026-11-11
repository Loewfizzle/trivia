// HOLD'EM (HE5) — THE SOUNDS, MEASURED (not guessed): each audio/holdem/*.mp3 decoded by Chromium → its lead-in silence (the MP3 encoder's
// delay + any quiet before the first transient), its length, its peak; then THE BUSIEST MOMENT (a bet + a sweep + a pot award + your turn,
// overlapped through HE5's gain table + the soft limiter — js/games/holdem/sfx.js#GAIN / LIMITER) rendered offline → its peak (no clip ≤ 1.0).
//   node tests/integration/he-sfx-measure.mjs "<browser>"     (E2E_BASE = a local server; default http://localhost:5173)
import puppeteer from './kit/puppeteer.mjs';
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true });
const page = await browser.newPage();
await page.goto(`${BASE}/tests/integration/fake-firebase.js`);
const out = await page.evaluate(async (over) => {
  const M = await import('/js/games/holdem/sfx.js');
  const { GAIN, FILES } = M;
  const LIMITER = over || M.LIMITER;
  const TRIM = over ? 10 ** ((0.6 * (over.threshold - over.threshold / over.ratio)) / 20) : M.TRIM;
  const ctx = new OfflineAudioContext(1, 44100, 44100);
  const bufs = {};
  const rows = [];
  for (const name of FILES) {
    const a = await (await fetch(`/audio/holdem/${name}.mp3`)).arrayBuffer();
    const b = await ctx.decodeAudioData(a);
    bufs[name] = b;
    const d = b.getChannelData(0);
    let peak = 0; for (const v of d) peak = Math.max(peak, Math.abs(v));
    const thr = peak * 0.02;               // −34 dB under its own peak = the first sound
    let i = 0; while (i < d.length && Math.abs(d[i]) < thr) i++;
    rows.push({ name, lead: +(i / b.sampleRate).toFixed(4), dur: +b.duration.toFixed(3), peak: +peak.toFixed(3) });
  }
  // THE BUSIEST MOMENT: your-turn + chip-raise + all-in + pot-win + hand-win + chip-bet, all within 150 ms, through the gains + the limiter
  async function render(useLimiter, at = { 'your-turn': 0, 'chip-raise': 0.02, 'all-in': 0.05, 'pot-win': 0.08, 'hand-win': 0.08, 'chip-bet': 0.12, showdown: 0.0 }) {
    const oc = new OfflineAudioContext(1, 44100 * 4, 44100);
    const comp = oc.createDynamicsCompressor(), trim = oc.createGain();
    Object.entries(LIMITER).forEach(([k, v]) => { comp[k].value = v; });
    trim.gain.value = TRIM;
    comp.connect(trim); trim.connect(oc.destination);
    for (const [n, t] of Object.entries(at)) {
      const s = oc.createBufferSource(), g = oc.createGain();
      s.buffer = bufs[n]; g.gain.value = GAIN[n];
      s.connect(g); g.connect(useLimiter ? comp : oc.destination); s.start(t);
    }
    const r = await oc.startRendering();
    let peak = 0; for (const v of r.getChannelData(0)) peak = Math.max(peak, Math.abs(v));
    return +peak.toFixed(3);
  }
  // a kept sting alone (under the threshold) must come out at its own level: out peak / (gain × in peak) ≈ 1
  const solo = n => render(true, { [n]: 0.5 }).then(p => +(p / (GAIN[n] * rows.find(r => r.name === n).peak)).toFixed(3));
  return { rows, busyRaw: await render(false), busyLimited: await render(true), unity: { 'your-turn': await solo('your-turn'), knockout: await solo('knockout'), 'timer-tick': await solo('timer-tick') }, chipRaise: await render(true, { 'chip-raise': 0 }) };
}, process.env.LIM ? JSON.parse(process.env.LIM) : null);
console.table(out.rows);
console.log(`THE BUSIEST MOMENT (7 sounds within 150 ms): peak ${out.busyRaw} without the limiter → ${out.busyLimited} with it (≤ 1.0 = no clip)`);
console.log(`a kept sting alone = its normal level (out ÷ in): ${JSON.stringify(out.unity)} · chip-raise alone (2.2 ×): peak ${out.chipRaise}`);
if (out.busyLimited > 1) process.exitCode = 1;
await browser.close();
