// HIGH RISE — THE SOUNDS SHIP COMPRESSED (S2 FIX — the owner; docs/highrise.md "THE SOUNDS"): audio/highrise/<id>.wav → <id>.mp3.
// The build machine has no ffmpeg / lame (CLAUDE.md memory): the encoder is a PURE-JS one from npm, used ONLY here, as a build tool —
// never a dependency of the site, never in package.json, never shipped:
//   (once, anywhere outside the repo)   npm i @breezystack/lamejs
//   node scripts/build-highrise-sounds.mjs --lame <…/node_modules/@breezystack/lamejs/dist/lamejs.js> [--from <dir of the WAVs>] [--kbps 128] [--keep]
// The WAVs are scripts/build-highrise-assets.py's (16-bit 44.1 kHz MONO, from the owner's delivery — it writes them into audio/highrise/);
// this turns each into a 44.1 kHz mono CBR MP3 at the SAME level (no gain, no normalising) and REMOVES the WAV (--keep leaves it).
// An MP3 starts with the encoder's own lead-in (~25–50 ms of near-silence): the game skips it at play (sfx.js#leadOf — a drop's sound
// stays ON the tap). Prints each file's size + its WAV's RMS / peak (the pass log's "same loudness" check is made against these).
import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const argv = process.argv.slice(2), arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const ROOT = fileURLToPath(new URL('..', import.meta.url)), OUT = join(ROOT, 'audio', 'highrise');
const FROM = resolve(arg('--from') || OUT), KBPS = Number(arg('--kbps')) || 128, KEEP = argv.includes('--keep');
const lamePath = arg('--lame') || process.env.LAMEJS;
if (!lamePath || !existsSync(lamePath)) { console.error('give the encoder: --lame <path to @breezystack/lamejs/dist/lamejs.js> (npm i @breezystack/lamejs, outside the repo)'); process.exit(1); }
const { Mp3Encoder } = await import(pathToFileURL(resolve(lamePath)).href);

/** a 16-bit PCM WAV → { rate, channels, pcm: Int16Array (interleaved) } */
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

let total = 0, was = 0;
const files = readdirSync(FROM).filter(f => f.endsWith('.wav')).sort();
if (!files.length) { console.error(`no WAV in ${FROM}`); process.exit(1); }
console.log('| file | WAV | MP3 | seconds | RMS dBFS | peak dBFS |');
console.log('| --- | --- | --- | --- | --- | --- |');
for (const f of files) {
  const src = readFileSync(join(FROM, f)), w = readWav(src);
  if (w.channels !== 1) throw new Error(`${f}: mono only (build-highrise-assets.py makes them mono)`);
  const enc = new Mp3Encoder(1, w.rate, KBPS), parts = [];
  for (let i = 0; i < w.pcm.length; i += 1152) { const b = enc.encodeBuffer(w.pcm.subarray(i, i + 1152)); if (b.length) parts.push(Buffer.from(b)); }
  const end = enc.flush(); if (end.length) parts.push(Buffer.from(end));
  const mp3 = Buffer.concat(parts), name = f.replace(/\.wav$/, '.mp3');
  writeFileSync(join(OUT, name), mp3);
  let sq = 0, peak = 0;
  for (let i = 0; i < w.pcm.length; i++) { const v = w.pcm[i] / 32768; sq += v * v; if (Math.abs(v) > peak) peak = Math.abs(v); }
  const db = x => (20 * Math.log10(Math.max(1e-9, x))).toFixed(1);
  console.log(`| ${name} | ${(src.length / 1024).toFixed(0)} KB | ${(mp3.length / 1024).toFixed(1)} KB | ${(w.pcm.length / w.rate).toFixed(2)} | ${db(Math.sqrt(sq / w.pcm.length))} | ${db(peak)} |`);
  total += mp3.length; was += src.length;
  if (!KEEP && resolve(FROM) === resolve(OUT)) unlinkSync(join(FROM, f));
}
console.log(`\n${files.length} sounds: ${(was / 1024).toFixed(0)} KB of WAV → ${(total / 1024).toFixed(0)} KB of MP3 (${KBPS} kbps mono)`);
// the credits keep their sources + licences; one line says what ships
const credits = join(OUT, 'CREDITS.md'), NOTE = '> The files SHIP AS MP3 (`<id>.mp3`, 44.1 kHz mono — encoded from the WAVs named below by `scripts/build-highrise-sounds.mjs`, same level, nothing else changed); the sources + the licences are unchanged.';
if (existsSync(credits)) { const t = readFileSync(credits, 'utf8'); if (!t.includes('SHIP AS MP3')) { const lines = t.split('\n'), at = lines.findIndex((l, i) => i > 0 && l.trim() === ''); lines.splice(at < 0 ? 1 : at, 0, '', NOTE); writeFileSync(credits, lines.join('\n')); console.log('CREDITS.md: + the MP3 line'); } }
