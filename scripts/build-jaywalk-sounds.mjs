// JAYWALK J1 — THE MATCH MOMENTS' SOUNDS (docs/jaywalk.md "THE MATCH MOMENTS"): the owner's delivered WAVs (24-bit stereo — Downloads\grok\
// jaywalk\sfx8 + sfx6; the originals are only READ) → audio/jaywalk/<id>.mp3, encoded like the other JAYWALK sounds (MP3, mono). The build
// machine has no ffmpeg / lame: the encoder is the PURE-JS one HIGH RISE's sounds used (scripts/build-highrise-sounds.mjs) — a build tool
// only, installed OUTSIDE the repo, never in package.json, never shipped:
//   (once, anywhere outside the repo)   npm i @breezystack/lamejs@1.2.7
//   node scripts/build-jaywalk-sounds.mjs --lame <…/@breezystack/lamejs/dist/lamejs.js> [--kbps 96] [--j1 | --j2 | --jt1]
// The level is NOT changed here (no gain, no normalising): every cue's level is its row's gain in sounds.js, set by measurement (THE MIX).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

const argv = process.argv.slice(2), arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const ROOT = fileURLToPath(new URL('..', import.meta.url)), OUT = join(ROOT, 'audio', 'jaywalk'), KBPS = Number(arg('--kbps')) || 96;
const SRC = join(homedir(), 'Downloads', 'grok', 'jaywalk');
/** the picks (the owner, J1): id ← the delivered file */
export const J1_SOUNDS = Object.freeze([
  { id: 'out-drop', from: join(SRC, 'sfx8', 'out-drop-1.wav'), credit: 'out-drop-1' },
  { id: 'h2h-siren', from: join(SRC, 'sfx8', 'head-to-head-siren.wav'), credit: 'head-to-head-siren' },
  { id: 'last-standing', from: join(SRC, 'sfx6', 'last-standing.wav'), credit: 'last-standing' },
]);
/** J2 — THE BLACKBIRD's RUNWAYS (the owner's picks, Nov 21): the crackle's two new takes, the repeat tell's tick, the burning trail's fire */
export const J2_SOUNDS = Object.freeze([
  { id: 'radio-static-2', from: join(SRC, 'sfx9', 'radio-static_2.wav'), credit: 'radio-static_2' },
  { id: 'radio-static-3', from: join(SRC, 'sfx9', 'radio-static_3.wav'), credit: 'radio-static_3' },
  { id: 'runway-tick', from: join(SRC, 'sfx9', 'runway-tick.wav'), credit: 'runway-tick' },
  { id: 'afterburner-flicker', from: join(SRC, 'sfx10', 'afterburner-flicker.wav'), credit: 'Big Branching Fire #1' },
]);
/** JT1 — THE SEASONS (the owner, Nov 22 — all CC0; the delivery's sfx11 + sfx12): a leaf pile's crunch + the New Year's fireworks */
export const JT1_SOUNDS = Object.freeze([
  { id: 'leaf-crunch', from: join(SRC, 'sfx11', 'leaf-crunch.wav'), credit: 'Feet in Leaves #1 — Joseph SARDIN (BigSoundBank), CC0' },
  { id: 'firework-pops', from: join(SRC, 'sfx11', 'firework-pops.wav'), credit: 'Firework during New Years Eve @ Groningen.wav — JelleGeus (freesound 179987), CC0' },
  { id: 'firework-crackle', from: join(SRC, 'sfx12', 'firework-crackle.wav'), credit: 'Fireworks #1 — Joseph SARDIN (BigSoundBank), CC0' },
  { id: 'firework-volley', from: join(SRC, 'sfx12', 'firework-volley.wav'), credit: 'Fireworks #2 — Pierre SIBANARCO (BigSoundBank), CC0' },
]);
const PICK = argv.includes('--jt1') ? JT1_SOUNDS : argv.includes('--j2') ? J2_SOUNDS : argv.includes('--j1') ? J1_SOUNDS : [...J1_SOUNDS, ...J2_SOUNDS, ...JT1_SOUNDS];   // (--jt1 / --j2 / --j1: one set only — the others' files stay as they are)
const lamePath = arg('--lame') || process.env.LAMEJS;
if (!lamePath || !existsSync(lamePath)) { console.error('give the encoder: --lame <path to @breezystack/lamejs/dist/lamejs.js> (npm i @breezystack/lamejs, outside the repo)'); process.exit(1); }
const { Mp3Encoder } = await import(pathToFileURL(resolve(lamePath)).href);

/** a PCM WAV (16 / 24-bit, any channels; plain or EXTENSIBLE) → { rate, mono: Float32Array } (the channels averaged) */
function readWav(buf) {
  if (buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WAVE') throw new Error('not a WAV');
  let at = 12, fmt = null, data = null;
  while (at + 8 <= buf.length) {
    const id = buf.toString('latin1', at, at + 4), size = buf.readUInt32LE(at + 4);
    if (id === 'fmt ') fmt = { tag: buf.readUInt16LE(at + 8), ch: buf.readUInt16LE(at + 10), rate: buf.readUInt32LE(at + 12), bits: buf.readUInt16LE(at + 22) };
    else if (id === 'data') data = buf.subarray(at + 8, at + 8 + size);
    at += 8 + size + (size & 1);
  }
  if (!fmt || !data || !(fmt.tag === 1 || fmt.tag === 0xfffe) || !(fmt.bits === 16 || fmt.bits === 24)) throw new Error('only 16 / 24-bit PCM');
  const bps = fmt.bits / 8, frames = Math.floor(data.length / (bps * fmt.ch)), mono = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let s = 0;
    for (let c = 0; c < fmt.ch; c++) { const o = (i * fmt.ch + c) * bps; s += bps === 2 ? data.readInt16LE(o) / 32768 : data.readIntLE(o, 3) / 8388608; }
    mono[i] = s / fmt.ch;
  }
  return { rate: fmt.rate, mono };
}
const db = v => (v > 0 ? (20 * Math.log10(v)).toFixed(1) : '-inf');
console.log('| id | from | WAV | MP3 | seconds | RMS dBFS | peak dBFS |');
console.log('| --- | --- | --- | --- | --- | --- | --- |');
for (const S of PICK) {
  const raw = readFileSync(S.from), { rate, mono } = readWav(raw);
  const pcm = new Int16Array(mono.length);
  let sq = 0, pk = 0;
  for (let i = 0; i < mono.length; i++) { const v = Math.max(-1, Math.min(1, mono[i])); pcm[i] = Math.round(v * 32767); sq += v * v; pk = Math.max(pk, Math.abs(v)); }
  const enc = new Mp3Encoder(1, rate, KBPS), parts = [];
  for (let i = 0; i < pcm.length; i += 1152) { const b = enc.encodeBuffer(pcm.subarray(i, i + 1152)); if (b.length) parts.push(Buffer.from(b)); }
  const end = enc.flush(); if (end.length) parts.push(Buffer.from(end));
  const mp3 = Buffer.concat(parts);
  writeFileSync(join(OUT, `${S.id}.mp3`), mp3);
  console.log(`| ${S.id} | ${S.from.replace(SRC, '…')} | ${(raw.length / 1024).toFixed(0)} KB | ${(mp3.length / 1024).toFixed(1)} KB | ${(mono.length / rate).toFixed(2)} | ${db(Math.sqrt(sq / mono.length))} | ${db(pk)} |`);
}
