// THE MP3 SLICE (PURE; the TR-3B's tape stop — docs/audio.md#the-tape-stop-in-web-audio).
// A song's bytes → the frames that cover `from` … `from + len` seconds of it, placed EXACTLY in song time. MPEG-1 / MPEG-2 Layer III
// (every file in audio/music: CBR, a 44–45 byte ID3v2 tag, one Xing/Info frame; 44.1 / 48 kHz — tests/mp3-slice.test.mjs walks them all).
// The walk is cheap (one header per frame, ~11 k frames in a 4 MB file: well under a millisecond); it never trusts the bitrate alone, so
// a VBR file would place as well. The decoder (decodeAudioData) syncs to the first header in the slice; its first frame may come out
// imperfect (the bit reservoir refers back into the frame before), so the slice starts `lead` frames before the asked time and the
// caller plays from `from` − startS into it.
//   sliceAt(bytes, from, len, lead = 2) → { bytes (Uint8Array, a view), startS (the slice's first frame's song time), endS, frames,
//                                          sr, spf, offset, length, atEnd (the file's last frame is in it) } | null (not an MP3)
//   frameTable(bytes) → { first, sr, spf, frames: [offsets…] }   (the whole file's frame starts, for tests + tools)
const BR = { 3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], 2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160] };
const SR = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

/** the ID3v2 tag's size at the file's start (0 without one) */
export function id3Size(b) {
  if (b.length < 10 || b[0] !== 0x49 || b[1] !== 0x44 || b[2] !== 0x33) return 0;
  return 10 + ((b[6] & 0x7f) << 21 | (b[7] & 0x7f) << 14 | (b[8] & 0x7f) << 7 | (b[9] & 0x7f)) + ((b[5] & 0x10) ? 10 : 0);
}
/** a Layer III frame header at i → { len, sr, spf, mpeg1, mode } | null */
export function frameHeader(b, i) {
  if (i + 4 > b.length || b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0) return null;
  const ver = (b[i + 1] >> 3) & 3, layer = (b[i + 1] >> 1) & 3, bri = b[i + 2] >> 4, sri = (b[i + 2] >> 2) & 3, pad = (b[i + 2] >> 1) & 1;
  if (ver === 1 || layer !== 1 || bri === 0 || bri === 15 || sri === 3) return null;
  const mpeg1 = ver === 3, br = (mpeg1 ? BR[3] : BR[2])[bri] * 1000, sr = SR[ver][sri];
  const spf = mpeg1 ? 1152 : 576, len = Math.floor(spf / 8 * br / sr) + pad;
  return { len, sr, spf, mpeg1, mode: (b[i + 3] >> 6) & 3, br };
}
// a Xing / Info frame (the encoder's header: no audio in it — decoders skip it)
function isXing(b, i, h) {
  const off = i + 4 + (h.mpeg1 ? (h.mode === 3 ? 17 : 32) : (h.mode === 3 ? 9 : 17));
  if (off + 4 > b.length) return false;
  const t = String.fromCharCode(b[off], b[off + 1], b[off + 2], b[off + 3]);
  return t === 'Xing' || t === 'Info';
}
// the first real header (after the tag; a few stray bytes tolerated)
function firstFrame(b) {
  let i = id3Size(b);
  for (let tries = 0; i + 4 <= b.length && tries < 4096; tries++, i++) {
    const h = frameHeader(b, i);
    if (!h) continue;
    // (a header must be followed by another one: a false sync inside the tag never is)
    const n = frameHeader(b, i + h.len);
    if (n || i + h.len >= b.length) return { i, h };
  }
  return null;
}

/** every frame's start offset (the Xing frame skipped) + the stream's rate */
export function frameTable(bytes) {
  const b = bytes;
  const f = firstFrame(b);
  if (!f) return null;
  let i = f.i, h = f.h;
  if (isXing(b, i, h)) { i += h.len; h = frameHeader(b, i); if (!h) return null; }
  const frames = [], sr = h.sr, spf = h.spf;
  while (h && i + 4 <= b.length) {
    frames.push(i);
    i += h.len;
    h = frameHeader(b, i);
    if (!h) { let k = 0; while (!h && k < 8 && i + k + 4 <= b.length) { k++; h = frameHeader(b, i + k); } if (h) i += k; }   // (a stray byte between frames)
  }
  return { first: f.i, sr, spf, frames };
}

/** the frames covering `from` … `from + len` s (with `lead` frames before) → the slice (see the top) */
export function sliceAt(bytes, from, len, lead = 2) {
  const t = frameTable(bytes);
  if (!t || !t.frames.length) return null;
  const { sr, spf, frames } = t, fs = spf / sr;
  const i0 = Math.max(0, Math.min(frames.length - 1, Math.floor(Math.max(0, from) / fs) - lead));
  const i1 = Math.min(frames.length, Math.ceil((Math.max(0, from) + Math.max(0.1, len)) / fs) + 1);
  const offset = frames[i0], end = i1 >= frames.length ? bytes.length : frames[i1];
  return { bytes: bytes.subarray(offset, end), startS: i0 * fs, endS: i1 * fs, frames: i1 - i0, sr, spf, offset, length: end - offset, atEnd: i1 >= frames.length, songS: frames.length * fs };
}
