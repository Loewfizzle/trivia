// FRIENDS B — FACE ID SIGN-IN's screens (the flow: js/profile/passkey.js; the server: api/_lib/passkeys.js; css/board.css "PASSKEYS", prefix pk-).
//   passkeyBlock({ list, onChange })   ACCOUNT's block: FACE ID SIGN-IN — each passkey "iPhone · added Nov 8 · REMOVE" + ADD FACE ID SIGN-IN
//   passkeySignIn({ onDone, cls })     BRING YOUR CARD / RESTORE YOUR ACCOUNT: SIGN IN WITH FACE ID (+ "or paste your key" under it)
// Profiles are polish: no WebAuthn in this browser → the add button is not drawn (the list still shows); /api down → a quiet message.
import { h } from '../ui/dom.js';
import { tubeButton, row } from '../ui/components.js';
import { toast } from '../ui/toast.js';
import { passkeysOk, pkWord, addPasskey, signInWithPasskey, removePasskey } from './passkey.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = t => { const d = new Date(t); return `${MON[d.getMonth()]} ${d.getDate()}`; };
const sfx = n => import('../audio/sfx.js').then(m => m.sfx(n)).catch(() => {});

/** ACCOUNT → FACE ID SIGN-IN (list: me's pk — [{ h, n, at, u }]) */
export function passkeyBlock({ list = [], onChange = null } = {}) {
  const word = pkWord();
  const box = h('div.pk-box', { 'data-pk': String(list.length) });
  const paint = items => {
    box.dataset.pk = String(items.length);
    const rows = items.map(p => row({
      icon: 'faceid', ic: '#9fd8ff', label: p.n, sub: `added ${day(p.at)}${p.u ? ` · used ${day(p.u)}` : ''}`, value: 'REMOVE', chevron: false,
      cls: 'pk-row', confirm: 'TAP AGAIN — IT STOPS SIGNING IN',
      onClick: async () => {
        try { const r = await removePasskey(p.h); paint(r.pk || []); toast('Passkey removed', 'ok', { sub: 'You can delete it from the phone’s Passwords too.' }); onChange && onChange(r.pk || []); }
        catch (e) { toast(e.message || 'COULDN’T REACH THE SERVER', 'err'); }
      },
    }));
    const add = passkeysOk() ? tubeButton(items.length ? 'ADD ANOTHER PASSKEY' : `ADD ${word} SIGN-IN`, { kind: 'secondary', size: 'sm', block: true, cls: 'pk-add', onClick: onAdd }) : null;
    box.replaceChildren(...[
      h('div.pk-h', h('b', `${word} SIGN-IN`), h('span', items.length ? `${items.length} PASSKEY${items.length > 1 ? 'S' : ''}` : 'the fast way in')),
      items.length ? h('div.pk-list', ...rows) : h('p.pk-why', `Save a passkey and a new device brings your card back with ${word === 'PASSKEY' ? 'your fingerprint, face or screen lock' : word} — no key to paste. Your key still works too.`),
      add,
      !passkeysOk() ? h('p.pk-why.is-small', 'This browser can’t save a passkey — open the site in Safari or Chrome.') : null].filter(Boolean));
  };
  async function onAdd(e) {
    const b = e && e.currentTarget;
    if (b && b.classList.contains('is-busy')) return;
    if (b) b.classList.add('is-busy');
    try {
      const r = await addPasskey();
      paint(r.pk || []); sfx('join');
      toast('Passkey saved', 'ok', { sub: 'On a new device: BRING YOUR CARD → SIGN IN WITH ' + (word === 'PASSKEY' ? 'A PASSKEY' : word) + '.' });
      onChange && onChange(r.pk || []);
    } catch (err) {
      if (err && err.code === 'pk_cancel') toast(err.message, 'info');
      else toast(err.message || 'COULDN’T REACH THE SERVER', 'err');
    } finally { if (b) b.classList.remove('is-busy'); }
  }
  paint(list);
  return box;
}

/** SIGN IN WITH FACE ID — for BRING YOUR CARD + RESTORE YOUR ACCOUNT; onDone(r) once this device joined the card. null without WebAuthn. */
export function passkeySignIn({ onDone = null, onError = null, cls = '' } = {}) {
  if (!passkeysOk()) return null;
  const word = pkWord();
  const label = word === 'PASSKEY' ? 'SIGN IN WITH A PASSKEY' : `SIGN IN WITH ${word}`;
  const btn = tubeButton(label, { kind: 'secondary', block: true, cls: `pk-signin${cls ? ` ${cls}` : ''}`, onClick: run });
  btn.prepend(h('i.pk-ic', { 'aria-hidden': 'true', html: FACE }));
  const sub = h('p.pk-sub', word === 'FACE ID' || word === 'TOUCH ID' ? 'If you added it on any of your Apple devices.' : 'With a passkey on this device — or your iPhone: the browser shows a code to scan.');
  async function run() {
    if (btn.classList.contains('is-busy')) return;
    btn.classList.add('is-busy');
    try {
      const r = await signInWithPasskey({ onRetry: () => toast('WAKING THE SERVER — TRYING AGAIN', 'info', 2600) });
      sfx('join');
      onDone && onDone(r);
    } catch (e) {
      if (e && e.code === 'pk_cancel') toast(e.message, 'info');
      else { if (onError) onError(e); else toast(e.message || 'THAT DIDN’T WORK', 'err'); if (e && e.status >= 400 && e.status < 500) sfx('invalid'); }
    } finally { btn.classList.remove('is-busy'); }
  }
  return h('div.pk-signin-wrap', btn, sub, h('div.pk-or', h('span', 'OR PASTE YOUR KEY')));
}

// the Face ID mark: four corner brackets, two eyes, a nose, a smile — a line icon like THE ROW's
export const FACE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M9 9.5v1M15 9.5v1M12 9.5v3.5h-1M9.5 16a3.6 3.6 0 0 0 5 0"/></svg>';
