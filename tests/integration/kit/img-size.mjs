// THE FIX PASS — a link card's picture size, PNG OR JPEG (THE BEFORE-LAUNCH PASS made the card a JPEG; three E2Es still read only a PNG's
// header and failed "og:image none"). → { w, h, bytes, type } | null
export function imgSize(buf) {
  if (!buf || buf.length < 24) return null;
  if (buf.toString('latin1', 1, 4) === 'PNG') return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), bytes: buf.length, type: 'png' };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    for (let i = 2; i + 9 < buf.length;) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5), bytes: buf.length, type: 'jpeg' };
      i += 2 + len;
    }
  }
  return null;
}
