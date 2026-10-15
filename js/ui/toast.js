import { h } from './dom.js';

let host;
// toast('Copied!', 'ok' | 'warn' | 'err' | 'info', ms)
export function toast(msg, kind = 'info', ms = 2600) {
  if (!host) { host = h('div.toasts', { role: 'status', 'aria-live': 'polite' }); document.body.append(host); }
  const el = h(`div.toast.toast-${kind}`, h('span.toast-glyph', kind === 'err' ? '!' : kind === 'ok' ? '✓' : '>'), h('span', msg));
  host.append(el);
  while (host.children.length > 3) host.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
}
