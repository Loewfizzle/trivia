import { h } from './dom.js';

// THE MESSAGE (SHELL 2.0 A — the owner's approved look, docs/harbor/refs/shell/shell-look.png's left half; was the toast pills):
//   toast('Copied', 'ok' | 'warn' | 'err' | 'info', ms | { ms, sub })
// ONE AT A TIME (THE SPEED PASS — the owner's 3:45 pm screenshot: two contradictory toasts stacked): a newer message replaces the older (it
// fades out where it was). ABOVE THE DOCK on the title + the room (never on the sign); in a game, under the corner buttons (a game's controls
// own the bottom). Dark glass, a short neon tube on its left edge — CYAN info · GREEN done · AMBER heads-up · RED problem; a bold first line +
// an optional small second line; an ×. Sentence case: an ALL-CAPS line (older callers, a game's frozen strings) is set in sentence case here.
let host = null;
const LABEL = { ok: 'Done', warn: 'Heads up', err: 'Problem', info: 'Note' };

/** an ALL-CAPS line → sentence case (the first letter + after a sentence's end; a word of 2+ capitals inside quotes is kept) */
export function sentenceCase(s) {
  const t = String(s == null ? '' : s);
  if (/[a-z]/.test(t) || !/[A-Z]{2}/.test(t)) return t;   // (already mixed case, or no words to lower)
  return t.toLowerCase().replace(/(^\s*|[.!?]\s+|—\s+|·\s+)([a-z])/g, (m, a, c) => a + c.toUpperCase()).replace(/\bi\b/g, 'I');
}

function dockBottom() {
  // (read once per message, never in a frame loop: where the dock's top is → the message sits 12 px above it)
  const dock = document.body.classList.contains('nd-on') ? document.querySelector('.nd-actions') : null;
  if (!dock) return null;
  const r = dock.getBoundingClientRect();
  if (!r.height || r.top <= 0) return null;
  return Math.max(16, Math.round(window.innerHeight - r.top + 10));
}

/** FRIENDS B — B6 ("Host signal lost — You are now the host" landed over OVERCLOCK's header + tach mid-race): in a game the message sits
 *  UNDER the screen's header — its .game-head + anything the game marks [data-msg-under] (OVERCLOCK's tach, PRISM DROP's top line) — 8 px
 *  below the lowest, never past a third of the screen. Read once per message, never in a frame loop; null = the default spot under the corners */
function gameTop() {
  if (document.body.classList.contains('nd-on')) return null;
  const scr = [...document.querySelectorAll('#stage > .screen.screen-in')].pop();
  if (!scr) return null;
  let low = 0;
  for (const e of scr.querySelectorAll('.game-head, [data-msg-under]')) { const r = e.getBoundingClientRect(); if (r.height && r.bottom > 0 && r.top < window.innerHeight / 2) low = Math.max(low, r.bottom); }
  return low ? Math.round(Math.min(low + 8, window.innerHeight / 3)) : null;
}

export function toast(msg, kind = 'info', opts = 2600) {
  const { ms = 2600, sub = null } = typeof opts === 'number' ? { ms: opts } : (opts || {});
  if (!host) { host = h('div.sh-msgs', { role: 'status', 'aria-live': 'polite' }); document.body.append(host); }
  const b = dockBottom();
  if (b != null) host.style.setProperty('--msg-b', `${b}px`); else host.style.removeProperty('--msg-b');
  const gt = b == null ? gameTop() : null;
  if (gt != null) host.style.setProperty('--msg-t', `${gt}px`); else host.style.removeProperty('--msg-t');
  for (const old of host.children) if (!old.classList.contains('is-out')) { old.classList.add('is-out', 'is-replaced'); setTimeout(() => old.remove(), 260); }
  const k = LABEL[kind] ? kind : 'info';
  let gone = false, t = 0;
  const out = () => { if (gone) return; gone = true; clearTimeout(t); el.classList.add('is-out'); setTimeout(() => el.remove(), 260); };
  const el = h(`div.sh-msg.sh-msg-${k}`, { dataset: { kind: k } },
    h('i.sh-msg-tube', { 'aria-hidden': 'true' }),
    h('div.sh-msg-t', h('b', sentenceCase(msg)), sub ? h('span', sentenceCase(sub)) : null),
    h('button.sh-msg-x', { type: 'button', 'aria-label': `Dismiss ${LABEL[k].toLowerCase()}`, onclick: out }, h('span', { 'aria-hidden': 'true' }, '×')));
  host.append(el);
  t = setTimeout(out, ms);
  return { close: out, el };
}
