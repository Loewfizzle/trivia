// HIGH RISE — THE GROW-BACK TAKES (S4A FIX's add-on — the owner, Nov 19: "the grow-back needs to be more pleasant on the ears — a healing /
// soothing sound"; docs/highrise.md "THE SOUNDS"): the five candidates of his delivery (Downloads\grok\highrise\sfx\grow-back-v2\
// 1-grow-back.wav … 5-grow-back.wav — COPIES ONLY: the originals are read, never written) → grow-back-1.wav … grow-back-5.wav in a
// folder of your choosing, each MIXED TO MONO and brought to THE SAME LOUDNESS (the same RMS — they came 8 dB apart; never over −1 dBFS
// at a peak), ready for scripts/build-highrise-sounds.mjs (which turns them into the MP3s the game ships):
//   node scripts/build-highrise-growback.mjs --from <…\grow-back-v2> --out <a scratch folder> [--rms -20]
//   node scripts/build-highrise-sounds.mjs --lame <…/lamejs.js> --from <that scratch folder> --keep
// The owner picks ONE by ear in the SOUNDS sheet (the test page); the pass after his pick removes the other four.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2), arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const FROM = arg('--from'), OUT = arg('--out'), RMS_DB = Number(arg('--rms')) || -20, PEAK_MAX = Math.pow(10, -1 / 20);
if (!FROM || !OUT || !existsSync(FROM)) { console.error('give --from <the delivery folder> --out <a scratch folder>'); process.exit(1); }
mkdirSync(resolve(OUT), { recursive: true });

function readWav(buf) {
  if (buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WAVE') throw new Error('not a WAV');
  let at = 12, fmt = null, data = null;
  while (at + 8 <= buf.length) {
    const id = buf.toString('latin1', at, at + 4), size = buf.readUInt32LE(at + 4);
    if (id === 'fmt ') fmt = { tag: buf.readUInt16LE(at + 8), channels: buf.readUInt16LE(at + 10), rate: buf.readUInt32LE(at + 12), bits: buf.readUInt16LE(at + 22) };
    else if (id === 'data') data = buf.subarray(at + 8, at + 8 + size);
    at += 8 + size + (size & 1);
  }
  if (!fmt || !data || fmt.tag !== 1 || fmt.bits !== 16) throw new Error('only 16-bit PCM');
  return { rate: fmt.rate, channels: fmt.channels, pcm: new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + (data.length & ~1))) };
}
function writeWav(path, rate, mono) {
  const head = Buffer.alloc(44), body = Buffer.from(mono.buffer, mono.byteOffset, mono.byteLength);
  head.write('RIFF', 0, 'latin1'); head.writeUInt32LE(36 + body.length, 4); head.write('WAVEfmt ', 8, 'latin1'); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22);
  head.writeUInt32LE(rate, 24); head.writeUInt32LE(rate * 2, 28); head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34); head.write('data', 36, 'latin1'); head.writeUInt32LE(body.length, 40);
  writeFileSync(path, Buffer.concat([head, body]));
}
const db = x => (20 * Math.log10(Math.max(1e-9, x))).toFixed(2);
console.log('| take | seconds | RMS in (mono) | gain | RMS out | peak out |');
console.log('| --- | --- | --- | --- | --- | --- |');
for (let n = 1; n <= 5; n++) {
  const w = readWav(readFileSync(join(FROM, `${n}-grow-back.wav`))), frames = Math.floor(w.pcm.length / w.channels), mono = new Float64Array(frames);
  for (let i = 0; i < frames; i++) { let v = 0; for (let c = 0; c < w.channels; c++) v += w.pcm[i * w.channels + c]; mono[i] = v / w.channels / 32768; }
  let sq = 0, peak = 0;
  for (let i = 0; i < frames; i++) { sq += mono[i] * mono[i]; if (Math.abs(mono[i]) > peak) peak = Math.abs(mono[i]); }
  const rms = Math.sqrt(sq / frames);
  let gain = Math.pow(10, RMS_DB / 20) / rms;
  if (peak * gain > PEAK_MAX) gain = PEAK_MAX / peak;   // (never over −1 dBFS at a peak: such a take stays a touch quieter)
  const out = new Int16Array(frames);
  for (let i = 0; i < frames; i++) out[i] = Math.max(-32768, Math.min(32767, Math.round(mono[i] * gain * 32768)));
  writeWav(join(resolve(OUT), `grow-back-${n}.wav`), w.rate, out);
  console.log(`| ${n} | ${(frames / w.rate).toFixed(2)} | ${db(rms)} dBFS | ${db(gain)} dB | ${db(rms * gain)} dBFS | ${db(peak * gain)} dBFS |`);
}
