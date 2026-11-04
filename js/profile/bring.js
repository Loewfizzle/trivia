// BRING YOUR CARD (THE VAULT 1A Group 0 — the owner, Nov 2 9:40–9:49 pm: the Home Screen app opened as a STRANGER — iOS gives a Home
// Screen web app its own storage). ONE CARD WORKS ON ALL YOUR DEVICES AT ONCE: the key LINKS a device to the profile; the other device
// stays signed in; NEW KEY is never needed for it. Lazy (the title + the membership card import it when they need it).
//   shouldOffer()        a device with NOTHING saved (no key, no profile — the Home Screen app, a new phone, another browser, www vs the
//                        bare domain) that hasn't said "I'M NEW"
//   offerChip(host)      the title's quiet pill "ALREADY A MEMBER? BRING YOUR CARD" (a browser tab); openBring({ lead }) the sheet — the
//                        Home Screen app (standalone) LEADS with it on its first open
//   saveBox()            the membership card's BOLD "SAVE YOUR KEY SOMEWHERE SAFE" + COPY · SHARE · I SAVED IT (quiets the reminder)
//   openElsewhere()      "USE THIS CARD ON ANOTHER DEVICE": the key big + COPY + SHARE + the steps (Add to Home Screen included)
// Profiles are polish: everything here works with /api down except the restore itself (which says so).
import { h } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { loadKey, loadMe, loadNotes, saveNotes } from '../identity.js';

const DISMISS = 'nd:byc';
/** the Home Screen app (iOS: navigator.standalone; everyone else: the display mode) */
export const standalone = () => { try { return !!((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone); } catch { return false; } };
/** nothing on this device to be a member with: no key + no profile */
export const nothingSaved = () => !loadKey() && !loadMe();
export function shouldOffer() { if (!nothingSaved()) return false; try { return localStorage.getItem(DISMISS) == null; } catch { return true; } }
export function dismissOffer(why = 'new') { try { localStorage.setItem(DISMISS, why); } catch { /* fine */ } }
/** the last sheet / chip this page (tests) */
export const last = { opened: 0, restored: null, shared: null };

let cssP = null;
export function bringCss() {
  if (cssP) return cssP;
  cssP = new Promise(res => {
    if (document.querySelector('link[data-byc]')) { res(); return; }
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/bring.css'; l.dataset.byc = '1';
    l.onload = () => res(); l.onerror = () => res(); document.head.append(l); setTimeout(res, 2500);
  });
  return cssP;
}

const notesSaved = () => !!(loadNotes() || {}).saved;
function markSaved() { saveNotes({ ...(loadNotes() || {}), saved: true }); }
export const canShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

/** COPY the key (a select-and-copy fallback where the clipboard is refused) */
export async function copyKey(k = loadKey(), sel = null) {
  if (!k) return false;
  try { await navigator.clipboard.writeText(k); toast('KEY COPIED — NOW PASTE IT SOMEWHERE SAFE', 'ok'); markSaved(); return true; }
  catch { if (sel) { try { const r = document.createRange(); r.selectNodeContents(sel); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch { /* fine */ } } toast('SELECT THE KEY AND COPY IT', 'info'); return false; }
}
/** SHARE the key through the phone's own share sheet (Notes · Mail · Messages · a password manager) */
export async function shareKey(k = loadKey()) {
  if (!k || !canShare()) return false;
  try {
    await navigator.share({ title: 'My NEON SPEAKEASY key', text: `My NEON SPEAKEASY membership key — it brings my card to any device:\n${k}\nhttps://neonspeakeasy.com` });
    last.shared = Date.now(); markSaved(); toast('SAVED — YOUR CARD CAN ALWAYS COME BACK', 'ok'); return true;
  } catch (e) { if (e && e.name !== 'AbortError') toast('COULDN’T OPEN THE SHARE SHEET — COPY IT INSTEAD', 'info'); return false; }
}

function keyActions(k, sel, { onSaved } = {}) {
  const saved = h('button.byc-btn.byc-ghost.byc-glass', { type: 'button', 'data-act': 'saved', onclick: () => { markSaved(); paintSaved(); toast('NICE — YOUR CARD IS SAFE', 'ok'); onSaved && onSaved(); } }, 'I SAVED IT');
  const paintSaved = () => { if (notesSaved()) { saved.textContent = 'SAVED ✓'; saved.classList.add('is-on'); } };
  paintSaved();
  // (THE VAULT 1B — the owner asked why SHARE: it opens the phone's share sheet → Notes · Mail · Messages · a password manager in two taps;
  //  the line under the buttons says who it's for)
  return h('div.byc-keyacts', h('div.byc-acts',
    h('button.byc-btn.byc-glass', { type: 'button', 'data-act': 'copy', onclick: async () => { await copyKey(k, sel); paintSaved(); onSaved && notesSaved() && onSaved(); } }, 'COPY'),
    canShare() ? h('button.byc-btn.byc-glass', { type: 'button', 'data-act': 'share', onclick: async () => { await shareKey(k); paintSaved(); onSaved && notesSaved() && onSaved(); } }, 'SHARE') : null,
    saved),
    h('p.byc-self', 'Send it to yourself — anyone with your key can use your card.'));
}

/** THE MEMBERSHIP CARD's bold line: SAVE YOUR KEY SOMEWHERE SAFE (quiet once saved — a small "saved ✓" with the buttons still there) */
export function saveBox() {
  bringCss();
  const k = loadKey();
  if (!k) return h('div.byc-save.is-none');
  const box = h('div.byc-save', { class: notesSaved() ? 'is-saved' : '' });
  const paint = () => {
    box.classList.toggle('is-saved', notesSaved());
    box.replaceChildren(
      h('b.byc-save-h', notesSaved() ? 'YOUR KEY IS SAVED ✓' : 'SAVE YOUR KEY SOMEWHERE SAFE'),
      h('p.byc-save-p', notesSaved() ? 'Keep it where you’ll find it — it’s the only way your card comes back on a new device.' : 'Email it to yourself, put it in Notes or a password manager. Lose it and your card can’t come back.'),
      keyActions(k, null, { onSaved: paint }));
  };
  paint();
  return box;
}

function sheetOf(cls, label, ...kids) {
  let sheet;
  const close = () => { if (!sheet.isConnected) return; sheet.classList.add('out'); setTimeout(() => sheet.remove(), 260); };
  const x = h('button.byc-x', { type: 'button', 'aria-label': 'Close', onclick: close }, '✕');
  sheet = h(`div.modal.byc-modal.${cls}`, { onclick: e => { if (e.target === sheet) close(); } },
    h('div.sheet.byc-sheet', { role: 'dialog', 'aria-label': label }, x, ...kids));
  document.body.append(sheet);
  return { sheet, close };
}

/** "USE THIS CARD ON ANOTHER DEVICE" — the key big + COPY + SHARE + the steps; this device stays signed in */
export async function openElsewhere() {
  await bringCss();
  const k = loadKey();
  if (!k) { toast('NO KEY ON THIS DEVICE YET — FINISH A MATCH FIRST', 'info'); return; }
  const big = h('div.byc-key', k);
  const { close } = sheetOf('byc-else', 'Use this card on another device',
    h('div.byc-k', 'ONE CARD · ALL YOUR DEVICES'),
    h('h2.byc-h', 'USE THIS CARD ON ANOTHER DEVICE'),
    h('p.byc-p', 'Your card works on all your devices at once. This device stays signed in — you don’t need NEW KEY.'),
    big,
    keyActions(k, big),
    h('ol.byc-steps',
      h('li', 'On the other device, open ', h('b', 'neonspeakeasy.com'), ' — or its Home Screen app.'),
      h('li', 'Tap ', h('b', 'ALREADY A MEMBER? BRING YOUR CARD'), ' (or ☰ → your card → Have a key…).'),
      h('li', 'Paste this key. Your name, level, streak + everything you’ve earned come with it.')),
    h('p.byc-note', h('b', 'On iPhone, '), 'Add to Home Screen (Share → Add to Home Screen) makes an app with its own storage — bring your card there once, the same way.'));
  return close;
}

/** ALREADY A MEMBER? BRING YOUR CARD — paste your key → restored (+ "this device joins it"); the ✕ closes it */
export async function openBring({ lead = false, onDone = null } = {}) {
  if (document.querySelector('.byc-bring')) return null;
  await bringCss();
  last.opened = Date.now();
  const input = h('input.input.byc-in', { type: 'text', placeholder: 'NEON-XXXX-XXXX-XXXX', autocapitalize: 'characters', autocomplete: 'off', autocorrect: 'off', spellcheck: false, 'aria-label': 'Your key', maxLength: 24 });
  const err = h('p.byc-err', { role: 'alert', hidden: true });
  const go = h('button.byc-btn.byc-go', { type: 'button', 'data-act': 'bring' }, 'BRING MY CARD');
  const app = standalone();
  const { sheet, close } = sheetOf('byc-bring', 'Already a member? Bring your card',
    h('div.byc-k', 'ALREADY A MEMBER?'),
    h('h2.byc-h', 'BRING YOUR CARD'),
    h('p.byc-p', app ? 'This Home Screen app keeps its own storage, so it starts empty — your card isn’t lost. Paste your key and this app joins it.' : 'Paste your key and this device joins your card. Your card works on all your devices at once — the others stay signed in.'),
    input, err, go,
    h('p.byc-help', h('b', 'Where’s my key? '), 'On a device you already play on: open your membership card → ', h('b', 'USE THIS CARD ON ANOTHER DEVICE'), ' → COPY. Or wherever you saved it.'));
  // (THE VAULT 2A — I'M NEW HERE removed with its welcome line: the owner, Nov 3 11:47 am — "no point, the ✕ already does it")
  if (lead) sheet.classList.add('is-lead');
  const run = async () => {
    if (go.classList.contains('is-busy')) return;
    err.hidden = true; go.classList.add('is-busy'); go.textContent = 'CHECKING…';
    try {
      const { restoreKey } = await import('./me.js');
      const r = await restoreKey(input.value, { onRetry: () => { go.textContent = 'WAKING THE SERVER…'; } });
      last.restored = r.pid;
      dismissOffer('done');
      document.querySelectorAll('.byc-chip').forEach(c => c.remove());
      toast(`WELCOME BACK, ${String(r.profile.n || '').toUpperCase()} — THIS DEVICE JOINED YOUR CARD`, 'ok', 4200);
      import('../audio/sfx.js').then(m => m.sfx('join')).catch(() => {});
      close(); onDone && onDone(r);
    } catch (e) {
      err.textContent = (e && e.message) || 'THAT KEY DIDN’T WORK';
      err.hidden = false;
      if (e && e.status >= 400 && e.status < 500) import('../audio/sfx.js').then(m => m.sfx('invalid')).catch(() => {});
    } finally { go.classList.remove('is-busy'); if (go.isConnected) go.textContent = 'BRING MY CARD'; }
  };
  go.addEventListener('click', run);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  if (!lead) setTimeout(() => input.focus(), 120);
  return close;
}

/** the title's quiet pill over the dock (a browser tab with nothing saved) → the sheet; ✕ = I'm new */
export function offerChip(host) {
  bringCss();
  const chip = h('div.byc-chip',
    h('button.byc-chip-go', { type: 'button', 'data-act': 'chip', onclick: () => openBring() }, h('span', 'ALREADY A MEMBER?'), h('b', 'BRING YOUR CARD ›')),
    h('button.byc-chip-x', { type: 'button', 'aria-label': 'I’m new — hide this', onclick: () => { dismissOffer('new'); chip.remove(); } }, '✕'));
  host.append(chip);
  return chip;
}
