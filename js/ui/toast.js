import { h } from './dom.js';

let host;
// toast('Copied!', 'ok' | 'warn' | 'err' | 'info', ms)
// ONE AT A TIME (THE SPEED PASS — the owner's 3:45 pm screenshot: two contradictory toasts stacked): a newer toast replaces the older —
// the old one fades out at once (the same 0.3 s exit), never two messages on screen together.
export function toast(msg, kind = 'info', ms = 2600) {
  if (!host) { host = h('div.toasts', { role: 'status', 'aria-live': 'polite' }); document.body.append(host); }
  for (const old of host.children) if (!old.classList.contains('out')) { old.classList.add('out', 'is-replaced'); setTimeout(() => old.remove(), 300); }
  const el = h(`div.toast.toast-${kind}`, h('span.toast-glyph', kind === 'ok' ? '✓' : kind === 'info' ? 'i' : '!'), h('span', msg));
  host.append(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
}
