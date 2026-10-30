// NIGHT-A2 — THE KICK TABLE: the city's kick listener (js/audio/beat.js#beatKick — the music bus → a 150 Hz low-pass → an AnalyserNode,
// one RMS of its 1024-sample window a frame at 60 fps → core/harbor-beat.js#onsetStep) run over every song of a City 2.0 deck in a real
// browser (decodeAudioData + an OfflineAudioContext with the same biquad), and the lead learner (createLead / leadKick) replayed on its
// strong kicks. Per song: its grid (trusted? agree — the share of the kicks on its beats, measured offline by add-city2-music.py), the
// kicks a bar, the share on the beat / on the off-beat, the learner's state (would it CONFIRM — the safety rule's full punch — and how
// many bars in), and whether the listener even feeds it (beat.js only learns from a grid with agree ≥ 0.5).
//   node kick-table.mjs "<browser>" [--deck party] [--songs c2-party9,c2-party4]      (needs scripts/serve.mjs on :5173)
import { chromium } from 'playwright';
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const exe = argv[0], deck = opt('deck', 'party'), only = opt('songs', ''), shift = opt('shift', '');   // --shift id=beats: a grid's t0 moved (a phase check)
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.goto('http://localhost:5173/tests/integration/avatars-preview.html');
const rows = await page.evaluate(async ({ deck, only, shift }) => {
  const B = await import('/js/core/harbor-beat.js');
  const d = await (await fetch('/data/mood-music.json')).json();
  const ids = Object.keys(d.songs).filter(k => (only ? only.split(',').includes(k) : k.startsWith(`c2-${deck}`))).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  const out = [];
  for (const id of ids) {
    const s = d.songs[id], sh = shift.split(',').map(x => x.split('=')).find(x => x[0] === id), g0 = s.grid && s.grid.bpm > 0 ? s.grid : null;
    const g = g0 && sh ? { ...g0, t0: g0.t0 + Number(sh[1]) * 60 / g0.bpm, trusted: true } : g0;
    const buf = await (await fetch(`/audio/music/${id}.mp3`)).arrayBuffer();
    const sr = 48000, tmp = new OfflineAudioContext(1, 1, sr), dec = await tmp.decodeAudioData(buf);
    const oc = new OfflineAudioContext(1, dec.length, sr), src = oc.createBufferSource(), lp = oc.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 150; lp.Q.value = 0.7; src.buffer = dec; src.connect(lp); lp.connect(oc.destination); src.start();
    const y = (await oc.startRendering()).getChannelData(0);
    const o = B.createOnsets(), W = 1024, LAG = W / 2 / sr;   // (the window's centre: what the analyser's RMS describes)
    const T = g ? 60 / g.bpm : 60 / s.bpm, bars = s.dur / (4 * T);
    let all = 0, strong = 0, on = 0, off = 0, mid = 0; const ph = [];
    const lead = B.createLead(null, 0); let firstOk = null, okBars = 0, lastBar = -1, scatter = 0;
    for (let i = W; i < y.length; i += sr / 60) {
      const k = Math.floor(i); let e = 0; for (let j = k - W; j < k; j++) e += y[j] * y[j]; e = Math.sqrt(e / W);
      const t = k / sr, hit = B.onsetStep(o, e, t);
      if (!hit) continue;
      all++;
      if (hit < 0.6 || !g) continue;
      strong++;
      const x = (t - LAG - (g.t0 || 0)) / T, p = x - Math.round(x);
      ph.push(p);
      if (Math.abs(p) < 0.15) on++; else if (Math.abs(Math.abs(p) - 0.5) < 0.15) mid++; else off++;
      const r = B.leadKick(lead, B.kickErrWide(t, g, LAG), g, t * 1000);
      if (r === 'scatter') scatter++;
      const bar = Math.floor(x / 4);
      if (lead.res != null && Math.abs(lead.res) <= B.SAFE.tol && !lead.fast) { if (firstOk == null) firstOk = bar; if (bar !== lastBar) { okBars++; lastBar = bar; } }
    }
    // (the phase of the on-beat kicks: where the low end sits against the grid — ms; a steady offset is what the lead learns)
    const onP = ph.filter(p => Math.abs(p) < 0.15).sort((a, b) => a - b), med = onP.length ? onP[onP.length >> 1] * T * 1000 : null;
    out.push({ id, bpm: g ? +g.bpm.toFixed(1) : s.bpm, trusted: g ? g.trusted !== false : false, agree: g ? g.agree : null, lock: g ? g.lock : null, fed: !!(g && g.trusted !== false && (g.agree == null || g.agree >= 0.5)),
      perBar: +(all / bars).toFixed(2), strongPerBar: +(strong / bars).toFixed(2), onBeat: strong ? +(on / strong).toFixed(2) : null, offBeat: strong ? +(mid / strong).toFixed(2) : null, other: strong ? +(off / strong).toFixed(2) : null,
      medMs: med == null ? null : Math.round(med), lead: Math.round(lead.v * 1000), confirmBar: firstOk, confirmedBars: okBars, bars: Math.round(bars), scatter });
  }
  return out;
}, { deck, only, shift });
await browser.close();
const cols = ['id', 'bpm', 'trusted', 'agree', 'lock', 'fed', 'perBar', 'strongPerBar', 'onBeat', 'offBeat', 'other', 'medMs', 'lead', 'confirmBar', 'confirmedBars', 'bars', 'scatter'];
console.log(`| ${cols.join(' | ')} |\n| ${cols.map(() => '---').join(' | ')} |`);
for (const r of rows) console.log(`| ${cols.map(c => r[c] == null ? '—' : r[c]).join(' | ')} |`);
