// FRIENDS A — THE KEY IN THE PHONE'S PASSWORDS (the owner, Nov 7 9:58 pm — account backup (a)): SAVE TO PASSWORDS beside YOUR KEY is a REAL
// login form the browser recognises — username = the player's NAME#1234, password = the restore key (autocomplete "username" /
// "current-password"), a real submit — so iPhone Safari offers "Save Password" (iCloud Keychain) and Chrome its password manager; RESTORE YOUR
// ACCOUNT's key field is a "current-password" field, so a new phone AUTOFILLS it. The key goes NOWHERE new: the form posts nowhere (the submit
// is handled here — method POST, so even a failed script never puts the key in a URL); the server still stores only its HMAC.
import { h } from '../ui/dom.js';
import { tubeButton } from '../ui/components.js';

/** the SAVE TO PASSWORDS form: { user: 'NAME#1234', key, onSaved() } → <form> (it becomes a short note once submitted) */
export function saveToPasswordsForm({ user, key, onSaved = null }) {
  const form = h('form.pf-kc', { method: 'post', action: '#', autocomplete: 'on', 'aria-label': 'Save your key to this phone’s passwords' },
    h('label.pf-kc-l', h('span', 'SAVES AS'),
      h('input.pf-kc-user', { type: 'text', name: 'username', autocomplete: 'username', value: user, readOnly: false, tabIndex: -1, 'aria-label': 'Your name tag', spellcheck: false, autocapitalize: 'off' })),
    h('input.pf-kc-pass', { type: 'password', name: 'password', autocomplete: 'current-password', value: key, tabIndex: -1, 'aria-hidden': 'true' }),
    tubeButton('SAVE TO PASSWORDS', { kind: 'secondary', size: 'sm', block: true, cls: 'pf-kc-go', attrs: { type: 'submit' } }));
  // (tubeButton sets type=button first; the form's submit needs type=submit)
  form.querySelector('.pf-kc-go').type = 'submit';
  form.addEventListener('submit', async e => {
    e.preventDefault();
    // Chrome / Android: the Credential Management API stores it directly (the browser asks); Safari has no PasswordCredential — it offers
    // "Save Password" from the submitted form itself (the form leaving the page after its submit is the signal both engines read)
    try { if (window.PasswordCredential && navigator.credentials && navigator.credentials.store) await navigator.credentials.store(new window.PasswordCredential({ id: user, password: key, name: user })); } catch { /* the form's own prompt */ }
    const note = h('p.pf-kc-done', h('b', 'SAVED TO THIS PHONE’S PASSWORDS?'), ' If it asked, tap ', h('b', 'Save Password'), '. On a new phone, RESTORE YOUR ACCOUNT fills it in for you.');
    setTimeout(() => { form.replaceWith(note); if (onSaved) onSaved(); }, 60);
  });
  return form;
}

/** a restore key field that a password manager fills: [the hidden username, the key (type password + SHOW)] — o: { cls, label } */
export function keyFields({ cls = 'pf-key-in', label = 'Your key' } = {}) {
  const user = h('input.pf-kc-hu', { type: 'text', name: 'username', autocomplete: 'username', tabIndex: -1, 'aria-hidden': 'true' });
  const input = h(`input.input.${cls}`, { type: 'password', name: 'password', placeholder: 'NEON-XXXX-XXXX-XXXX', autocapitalize: 'characters', autocomplete: 'current-password', autocorrect: 'off', spellcheck: false, 'aria-label': label, maxLength: 24 });
  const show = h('button.pf-kc-show', { type: 'button', 'aria-label': 'Show the key', 'aria-pressed': 'false', onclick: () => { const on = input.type === 'password'; input.type = on ? 'text' : 'password'; show.textContent = on ? 'HIDE' : 'SHOW'; show.setAttribute('aria-pressed', String(on)); } }, 'SHOW');
  const wrap = h('div.pf-kc-field', user, input, show);
  return { wrap, input };
}
/** wraps restore fields + their button in a real form (Enter / the keyboard's Go submits; the submit runs `run`) */
export function keyForm(kids, run) {
  const f = h('form.pf-kc-form', { method: 'post', action: '#', autocomplete: 'on' }, ...kids);
  f.addEventListener('submit', e => { e.preventDefault(); run(); });
  return f;
}
