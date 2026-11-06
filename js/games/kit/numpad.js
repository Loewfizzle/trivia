// THE NUMBER PAD (OC1 — docs/cartridge.md D9, the kit: `gk-`). A game's own 3×4 glass keypad + a big confirm key + the answer field with a
// cursor — so the phone's SYSTEM KEYBOARD NEVER OPENS (no focused input anywhere: the question stays on screen, no autocorrect bar, no
// layout jump). Keys react on POINTERDOWN (a click waits for the finger to lift); a hardware keyboard works through `key(e)`.
// A NEUTRAL BASE: the look comes from CSS custom properties a game's skin sets (css/kit.css "THE KIT PIECES" — --gk-*; OVERCLOCK's
// OVERDRIVE skin in css/overclock.css). Keys ≥ 54 pt tall (--gk-key-h).
//   createNumpad({ extra: '.' | '−' | null, confirm: 'LOCK IT IN', maxLen: 9, placeholder, onChange(v), onSubmit(v), onKey(k) })
//     → { el, field, pad, value, set(v), clear(), lock(on), key(e), destroy() }   (field = the answer display — place it where you like)
//   numpadReduce(value, key, { extra, maxLen }) → the next value (PURE — tests/kit-oc1.test.mjs)
import { h } from '../../ui/dom.js';

export const NP_BACK = '⌫';
export const NP_KEYS = Object.freeze(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'x', '0', NP_BACK]);   // 'x' = the extra key's place
const MINUS = '−';

/** the next value after a key: digits up to maxLen, one '.', a leading '−' that toggles, ⌫ deletes */
export function numpadReduce(value, key, { extra = null, maxLen = 9 } = {}) {
  const v = String(value || '');
  if (key === NP_BACK) return v.slice(0, -1);
  if (key === MINUS || key === '-') {
    if (extra !== MINUS) return v;
    return v.startsWith(MINUS) ? v.slice(1) : MINUS + v;
  }
  if (key === '.') {
    if (extra !== '.' || v.includes('.')) return v;
    const digits = v.replace(MINUS, '').length;
    if (digits >= maxLen) return v;
    return (v === '' || v === MINUS ? `${v}0` : v) + '.';
  }
  if (!/^[0-9]$/.test(key)) return v;
  const body = v.replace(MINUS, '');
  if (body.replace('.', '').length >= maxLen) return v;
  if (body === '0') return (v.startsWith(MINUS) ? MINUS : '') + key;   // no leading zeros ("07" → "7")
  return v + key;
}
/** the value as a number (NaN while it's empty / just "−" / ends on ".") */
export const numpadNumber = v => { const s = String(v || '').replace(MINUS, '-'); return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN; };

export function createNumpad({ extra = null, confirm = 'LOCK IT IN', maxLen = 9, placeholder = '', onChange = null, onSubmit = null, onKey = null } = {}) {
  let value = '', locked = false;
  const text = h('span.gk-np-text');
  const ph = h('span.gk-np-ph', placeholder);
  const caret = h('i.gk-np-caret', { 'aria-hidden': 'true' });
  const field = h('div.gk-np-field', { role: 'status', 'aria-live': 'polite', 'aria-label': 'Your answer' }, h('span.gk-np-val', text, caret), ph);
  const paint = () => { text.textContent = value; field.classList.toggle('is-empty', !value); };
  const press = k => {
    if (locked) return;
    const next = numpadReduce(value, k, { extra, maxLen });
    if (onKey) onKey(k, next !== value);
    if (next === value) { bump(field); return; }
    value = next; paint();
    if (onChange) onChange(value);
  };
  const submit = () => { if (locked || !value || Number.isNaN(numpadNumber(value))) { bump(field); return; } if (onSubmit) onSubmit(value, numpadNumber(value)); };
  const keyBtn = (k, label, cls = '') => {
    const b = h(`button.gk-key.gk-np-key${cls}`, { type: 'button', dataset: { k, sfx: 'none' }, 'aria-label': k === NP_BACK ? 'Delete' : label },
      h('span.gk-key-face'), h('span.gk-key-glow'), h('span.gk-key-label', label));
    b.addEventListener('pointerdown', e => { e.preventDefault(); flash(b); press(k); });
    b.addEventListener('click', e => { if (e.detail === 0) press(k); });   // keyboard / assistive activation
    return b;
  };
  const keys = NP_KEYS.map(k => (k === 'x'
    ? (extra ? keyBtn(extra === '.' ? '.' : MINUS, extra === '.' ? '.' : MINUS, '.is-extra') : h('span.gk-np-gap', { 'aria-hidden': 'true' }))
    : keyBtn(k, k, k === NP_BACK ? '.is-back' : '')));
  const go = h('button.gk-key.gk-go', { type: 'button', dataset: { sfx: 'none' } }, h('span.gk-key-face'), h('span.gk-key-glow'), h('span.gk-key-label', confirm));
  go.addEventListener('pointerdown', e => { e.preventDefault(); flash(go); submit(); });
  go.addEventListener('click', e => { if (e.detail === 0) submit(); });
  const pad = h('div.gk-np', h('div.gk-np-grid', keys), go);
  const el = h('div.gk-numpad', field, pad);
  paint();
  return {
    el, field, pad,
    get value() { return value; },
    set(v) { value = String(v ?? ''); paint(); },
    clear() { value = ''; paint(); },
    lock(on = true) { locked = !!on; el.classList.toggle('is-locked', locked); },
    /** a hardware keyboard (the view routes keydown here): digits, . / -, Backspace, Enter */
    key(e) {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press(NP_BACK);
      else if (e.key === '.' || e.key === ',') press('.');
      else if (e.key === '-') press(MINUS);
      else if (e.key === 'Enter') submit();
      else return false;
      e.preventDefault();
      return true;
    },
    destroy() {},
  };
}

// a press flashes the key's glow layer (opacity only) — re-triggered by toggling the class on the next frame
export function flash(el) {
  el.classList.remove('is-hit');
  requestAnimationFrame(() => el.classList.add('is-hit'));
}
function bump(el) {
  el.classList.remove('is-bump');
  requestAnimationFrame(() => el.classList.add('is-bump'));
}
