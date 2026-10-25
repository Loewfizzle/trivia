// THE MP3 SLICE (core/mp3-slice.js) against the REAL music files: every file walks frame by frame to its end, the slice covering
// `from … from + len` starts `lead` frames before `from` (placed to one frame — 26 ms), covers the length asked, ends on a frame, and is
// the bytes a decoder can sync to (a header at its first byte, the next header exactly one frame on).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { frameTable, sliceAt, frameHeader, id3Size } from '../js/core/mp3-slice.js';

const DIR = new URL('../audio/music/', import.meta.url);
const files = readdirSync(DIR).filter(f => f.endsWith('.mp3'));

test('every music file walks to its end: one stream rate, every byte in a frame, a Xing frame skipped, a sane duration', () => {
  assert.ok(files.length > 50, `${files.length} files`);
  for (const f of files) {
    const b = new Uint8Array(readFileSync(new URL(f, DIR)));
    const t = frameTable(b);
    assert.ok(t && t.frames.length > 100, `${f}: a table`);
    assert.ok([44100, 48000].includes(t.sr) && t.spf === 1152, `${f}: ${t.sr} Hz, ${t.spf} samples a frame`);
    // the frames tile the file: each header's length lands on the next frame (the last reaches the end)
    const last = t.frames[t.frames.length - 1], h = frameHeader(b, last);
    assert.ok(h && last + h.len === b.length, `${f}: the last frame ends the file (${last + h.len} vs ${b.length})`);
    assert.ok(id3Size(b) > 0 && id3Size(b) < 200, `${f}: a small ID3 tag (${id3Size(b)})`);
    const dur = t.frames.length * t.spf / t.sr;
    assert.ok(dur > 10 && dur < 500, `${f}: ${dur.toFixed(1)} s`);
    // the Xing frame is not counted: the first table frame is one frame past the first header
    assert.equal(t.frames[0], t.first + frameHeader(b, t.first).len, `${f}: the Xing frame skipped`);
  }
});

test('a slice is placed to one frame, covers the length asked, starts on a header, ends on a frame; the end of the song clamps', () => {
  const b = new Uint8Array(readFileSync(new URL('c2-party1.mp3', DIR)));
  const fs = 1152 / 44100;
  for (const [from, len] of [[0, 42], [97.3, 42], [12.345, 20], [150.01, 42]]) {
    const s = sliceAt(b, from, len);
    assert.ok(s, 'a slice');
    assert.ok(s.startS <= from && from - s.startS < 3 * fs + 1e-9, `starts just before ${from}: ${s.startS.toFixed(3)}`);
    assert.ok(s.endS - from >= len - 1e-9, `covers ${len} s from ${from}: ${s.startS.toFixed(2)}–${s.endS.toFixed(2)}`);
    assert.ok(s.endS - from < len + 3 * fs + 1e-9, 'not much more than asked');
    const h = frameHeader(s.bytes, 0);
    assert.ok(h && (s.bytes.length === h.len || frameHeader(s.bytes, h.len)), 'a header at the first byte, the next one a frame on');
    assert.equal(s.bytes.length, s.length);
    assert.ok(Math.abs(s.endS - s.startS - s.frames * fs) < 1e-9, 'endS − startS = frames × the frame time');
    assert.ok(s.bytes.byteOffset === s.offset && s.bytes.buffer === b.buffer, 'a view into the file, no copy');
  }
  const end = sliceAt(b, 190, 42);
  assert.ok(end.atEnd && end.endS <= end.songS + 1e-9 && end.endS - 190 < 42, `clamped to the song's end (${end.endS.toFixed(1)} of ${end.songS.toFixed(1)})`);
  assert.equal(end.offset + end.length, b.length, 'the last slice runs to the file\'s last byte');
  assert.equal(sliceAt(new Uint8Array([1, 2, 3, 4, 5]), 0, 10), null, 'not an mp3 → null');
});

test('a CBR estimate would be off by the padding; the walk is exact (the frame starts drift from bitrate × time)', () => {
  const b = new Uint8Array(readFileSync(new URL('c2-late8.mp3', DIR)));   // (the longest file: 419 s)
  const t = frameTable(b), h = frameHeader(b, t.frames[0]);
  const avg = 1152 / 8 * h.br / h.sr;                                    // 365.71 bytes a frame at 112 k / 44.1 k
  const i = t.frames.length - 1, est = t.frames[0] + i * avg, real = t.frames[i];
  assert.ok(Math.abs(est - real) < 2 * avg, `the exact average stays within two frames over the file (${(est - real).toFixed(0)} bytes)`);
  // (the padding bit alternates: a fixed 365 or 366 would be seconds off by the end)
  assert.ok(Math.abs(t.frames[0] + i * 366 - real) > 20 * avg || Math.abs(t.frames[0] + i * 365 - real) > 20 * avg, 'a fixed frame length misplaces the end badly');
});
