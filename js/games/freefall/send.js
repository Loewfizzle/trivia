// FREEFALL — SHARE = THE PICTURE ONLY (F5B — the owner, Nov 27: docs/freefall.md "SHARE = THE PICTURE ONLY"). On the owner's iPhone SHARE
// gave Messages a TEXT line + a link card and NO picture: the test page shared `{ title, text, url }`, and the cartridge uploaded the card
// AT THE TAP (a network wait — iOS Safari drops the tap's permission, so the share fell back). Now, on BOTH:
//   · the card is DRAWN + ENCODED when the end screen appears (`warm()`) — a PNG file kept on the phone, the canvas freed;
//   · the tap calls `navigator.share({ files: [png] })` IN ITS OWN TURN (nothing awaited before it) — the payload is EXACTLY ONE image
//     file: no text, no title, no url, ever (`payloadOf`);
//   · files can't be shared here (a desktop, an old phone) or the sheet refused → THE PICTURE IS SHOWN to save (press and hold) — never a
//     text fallback, never a link.
// A tap that comes before the PNG is ready waits for it (≤ a second or two) and then tries; a share the phone refuses then = the picture.
// DOM + the shared sheet only: nothing here asks a server, stores or counts anything (the test page loads it).
import { lazyImport } from '../../ui/lazy-import.js';

/** the picture's file name */
export const PIC_NAME = 'neon-speakeasy-freefall.png';
/** THE PAYLOAD: exactly one PNG file — nothing else (tests/freefall-share.test.mjs) */
export const payloadOf = file => ({ files: [file] });
/** can this phone share this file through its own share sheet? */
export function canSendFile(file) { try { return !!(file && typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(payloadOf(file))); } catch { return false; } }
/** the share sheet (and the app it hands the picture to) is not "the player came back" — the queued catch-up reload waits (the site's hub:
 *  ui/lazy-import.js#reloadAtReturn reads it — THE STALE-MODULE RULE: a hub, never an import) */
const hold = () => { try { globalThis.__nsShareAt = Date.now(); } catch { /* fine */ } };

/** a canvas → { blob, file } (a PNG) — the canvas is freed after (5.8 MB a card) → null: this phone can't */
export function pngOf(cv) {
  return new Promise(res => {
    try { cv.toBlob(b => res(b), 'image/png'); } catch { res(null); }
  }).then(blob => {
    try { cv.width = cv.height = 0; } catch { /* fine */ }
    if (!blob) return null;
    let file = null;
    try { file = new File([blob], PIC_NAME, { type: 'image/png' }); } catch { /* an old WebView: no File — the picture is shown */ }
    return { blob, file };
  }, () => null);
}

/** the picture in THE SHEET: press and hold saves it on a phone (no words over it, no link) → 'shown' | 'failed' */
export async function showPicture({ blob } = {}) {
  if (!blob) return 'failed';
  try {
    const [{ openSheet }, { h }] = await Promise.all([lazyImport(import('../../ui/sheet.js'), '../../ui/sheet.js'), lazyImport(import('../../ui/dom.js'), '../../ui/dom.js')]);
    const url = URL.createObjectURL(blob);
    openSheet({ title: 'YOUR CARD', cls: 'shr-sheet', label: 'Your share card', body: [h('img.shr-img', { src: url, alt: 'Your share card', draggable: 'false' }), h('p.shr-hold', 'PRESS AND HOLD TO SAVE')], onClose: () => setTimeout(() => URL.revokeObjectURL(url), 1500) });
    return 'shown';
  } catch (e) { console.warn('[freefall share] show', e); return 'failed'; }
}

/**
 * SEND A READY PICTURE — `navigator.share` is called SYNCHRONOUSLY here (the caller is the tap): → a promise of 'shared' | 'none' (the
 * player closed the sheet) | 'shown' (the picture to save) | 'failed'
 */
export function sendPicture(r) {
  if (!r || !r.blob) return Promise.resolve('failed');
  if (canSendFile(r.file)) {
    let p = null;
    hold();
    try { p = navigator.share(payloadOf(r.file)); } catch { p = null; }
    if (p && typeof p.then === 'function') return p.then(() => 'shared', e => (e && e.name === 'AbortError' ? 'none' : showPicture(r))).finally(hold);
  }
  return showPicture(r);
}

/**
 * prepPicture(make) → { warm(), ready() → bool, send() → promise } — `make()` (async → a canvas, or null) runs at warm(): the PNG is kept, so
 * the tap reaches the share sheet with nothing left to wait for. ONE send at a time (a double tap = 'busy'); a failed build is tried again.
 */
export function prepPicture(make) {
  let p = null, got = null, busy = false;
  const build = () => (p ||= Promise.resolve().then(make).then(cv => (cv ? pngOf(cv) : null)).catch(e => { console.warn('[freefall share] build', e); return null; }).then(r => { if (r) got = r; else p = null; return r; }));
  const done = x => { busy = false; return x; };
  return {
    warm() { build(); },
    ready: () => !!got,
    send() {
      if (busy) return Promise.resolve('busy');
      busy = true;
      if (got) return sendPicture(got).then(done, () => done('failed'));   // (ready: the share sheet in this very turn)
      return build().then(r => (r ? sendPicture(r) : 'failed')).then(done, () => done('failed'));
    },
  };
}
