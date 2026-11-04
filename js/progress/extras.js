// PROGRESSION B on the profile: YOUR BIRTHDAY + CALL IN A FAVOR.
//   BIRTHDAY   month + day (NEVER the year), optional, changeable ONCE A YEAR (the server keeps it private: ppriv/{pid}/bd). On the day the
//              player's own city skywrites "HAPPY BDAY <NAME>" (title.js#birthdaySky) + MANY HAPPY RETURNS; their room too once LOBBY 2.0
//   A FAVOR    only when they hold one (pstats/fv — the 100-night streak's reward): pick ONE of the crew's jacks → PREVIEW · JUST ME plays
//              it on their own city now (nothing spent); FOR YOUR ROOM spends the token through the server (api/_lib/favors.js) — DORMANT
//              until LOBBY 2.0 makes the lobby the live city (FAVOR_ROOMS_LIVE)
import { h } from '../ui/dom.js';
import { api } from '../profile/api.js';
import { BDAY_MONTHS, bdayLabel } from '../core/birthday.js';
import { favorJacks } from '../core/harbor-radio.js';

/** LOBBY 2.0 flips this: a favor fired for a room is SEEN only once the lobby is the live city — until then the button stays asleep */
export const FAVOR_ROOMS_LIVE = false;
/** the phone's own copy of the birthday (the title's skywrite reads it — no socket, no /api on the title) */
export const rememberBirthday = bd => { try { if (bd && bd.m) localStorage.setItem('nd:bd', JSON.stringify({ m: bd.m, d: bd.d })); else localStorage.removeItem('nd:bd'); } catch { /* private mode */ } };
export const storedBirthday = () => { try { const v = JSON.parse(localStorage.getItem('nd:bd') || 'null'); return v && v.m ? v : null; } catch { return null; } };
const toastOf = (m, k) => import('../ui/toast.js').then(t => t.toast(m, k)).catch(() => {});
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function birthdayPanel(data, o = {}) {
  const pv = data.priv || {};
  const now = o.now || Date.now();
  if (!o.preview) rememberBirthday(pv.bd || null);
  const body = h('div.sg-bd');
  const sec = h('section.pg-panel.sg-bd-sec', h('div.pg-prof-h', h('span', 'YOUR BIRTHDAY'), h('em', 'month + day — never the year')), body);
  const paint = () => {
    const bd = pv.bd, locked = pv.bdAt && pv.bdAt > now;
    if (bd && !o.editing) {
      body.replaceChildren(h('div.sg-bd-row', h('b.sg-bd-day', bdayLabel(bd)),
        locked ? h('span.sg-bd-note', `Changes once a year — next after ${MON[new Date(pv.bdAt).getMonth()]} ${new Date(pv.bdAt).getFullYear()}`)
          : h('button.btn.btn-ghost.btn-sm', { type: 'button', onclick: () => { o.editing = true; paint(); } }, 'CHANGE')));
      return;
    }
    const m = h('select.input.sg-bd-m', { 'aria-label': 'Month' }, h('option', { value: '' }, 'MONTH'), ...BDAY_MONTHS.map((x, i) => h('option', { value: String(i + 1) }, x)));
    const d = h('select.input.sg-bd-d', { 'aria-label': 'Day' }, h('option', { value: '' }, 'DAY'), ...Array.from({ length: 31 }, (_, i) => h('option', { value: String(i + 1) }, String(i + 1))));
    if (bd) { m.value = String(bd.m); d.value = String(bd.d); }
    const save = h('button.btn.btn-primary.btn-sm', { type: 'button' }, 'SAVE');
    save.addEventListener('click', async () => {
      if (!m.value || !d.value) { toastOf('PICK A MONTH AND A DAY', 'warn'); return; }
      save.disabled = true;
      try {
        // (a ?preview= page never writes: the sample member's birthday changes on the page only)
        const r = o.preview ? { bd: { m: Number(m.value), d: Number(d.value) }, until: now + 365 * 864e5 } : await api('profile', { action: 'birthday', m: Number(m.value), d: Number(d.value) });
        pv.bd = r.bd; pv.bdAt = r.until || 0; data.priv = pv; o.editing = false; rememberBirthday(r.bd); paint();
        toastOf('BIRTHDAY SAVED', 'ok');
      } catch (e) {
        save.disabled = false;
        toastOf(e.code === 'once_a_year' ? 'A BIRTHDAY CHANGES ONCE A YEAR' : e.code === 'bad_day' ? 'THAT DATE DOESN’T EXIST' : 'COULDN’T SAVE IT — TRY AGAIN', 'err');
      }
    });
    body.replaceChildren(h('p.sg-bd-note', 'Once a year you can change it.'), h('div.sg-bd-row', m, d, save));
  };
  paint();
  return sec;
}

/** THE VAULT 2C — the ACCOUNT's birthday: the big panel only until it's set; then ONE LINE ("Birthday · Mar 4 — change again in Oct"),
 *  CHANGE when it may (the panel opens in its place) */
export function birthdayRow(data, o = {}) {
  const pv = data.priv || {}, now = o.now || Date.now();
  if (!pv.bd) return birthdayPanel(data, o);
  if (!o.preview) rememberBirthday(pv.bd);
  const locked = pv.bdAt && pv.bdAt > now;
  const when = locked ? `change again in ${MON[new Date(pv.bdAt).getMonth()].slice(0, 3)}` : 'change ›';
  const row = h('button.pf-acc-row.pf-bday', { type: 'button', disabled: !!locked, 'aria-label': `Your birthday, ${bdayLabel(pv.bd)}${locked ? ` — ${when}` : ' — change it'}`, onclick: () => { if (locked) return; row.replaceWith(birthdayPanel(data, { ...o, editing: true })); } },
    h('b', 'Birthday'), h('span', `${bdayLabel(pv.bd)} — ${when}`));
  return row;
}

export { favorJacks };

export function favorPanel(data, o = {}) {
  const fv = (data.stats && data.stats.fv) || 0;
  if (!fv) return null;
  const go = h('button.btn.btn-primary.btn-sm', { type: 'button', onclick: () => openFavor(data, o) }, 'CALL IT IN');
  return h('section.pg-panel.sg-fv-sec', h('div.pg-prof-h', h('span', fv > 1 ? `A FAVOR × ${fv}` : 'A FAVOR'), h('em', 'one moment, for your room')),
    h('div.sg-bd-row', h('span.sg-bd-note', 'Fireworks, the UFO, your words in the sky — one moment for everyone in your room.'), go));
}

/** the favor's sheet: pick a jack (+ words) → PREVIEW · JUST ME (nothing spent) / FOR YOUR ROOM (asleep until LOBBY 2.0) */
export function openFavor(data, o = {}) {
  let pick = null;
  const words = h('input.input.sg-fv-words', { type: 'text', maxlength: '32', placeholder: 'YOUR WORDS', autocomplete: 'off', 'aria-label': 'Words for the sky' });
  const wordsRow = h('div.sg-fv-wrow', words);
  wordsRow.hidden = true;
  const chips = h('div.sg-fv-jacks', ...favorJacks().map(j => {
    const b = h('button.chip.sg-fv-j', { type: 'button', dataset: { j: j.id } }, j.label);
    b.addEventListener('click', () => { pick = j; chips.querySelectorAll('.sg-fv-j').forEach(x => x.classList.toggle('is-on', x === b)); wordsRow.hidden = j.card !== 'words'; prev.disabled = false; });
    return b;
  }));
  const prev = h('button.btn.btn-primary', { type: 'button', disabled: true }, 'PREVIEW · JUST ME');
  const room = h('button.btn.btn-ghost', { type: 'button', disabled: !FAVOR_ROOMS_LIVE }, FAVOR_ROOMS_LIVE ? 'CALL IT IN FOR YOUR ROOM' : 'FOR YOUR ROOM · WHEN LOBBIES OPEN');
  const close = () => { sheet.remove(); };
  const sheet = h('div.modal.sg-fv', { role: 'dialog', 'aria-label': 'Call in a favor', onclick: e => { if (e.target === sheet) close(); } },
    h('div.sheet', h('h3', 'CALL IN A FAVOR'), h('p.sg-bd-note', 'Pick one moment. The preview plays it on your own city — your favor stays yours.'), chips, wordsRow,
      h('div.sg-fv-go', prev, room, h('button.btn.btn-text', { type: 'button', onclick: close }, 'CLOSE'))));
  prev.addEventListener('click', () => {
    if (!pick) return;
    // (the city plays it as a JUST ME moment the next time it's on screen — the title reads the handoff: title.js#localMomentHandoff)
    try { sessionStorage.setItem('nd:local-moment', JSON.stringify({ jack: pick.id, text: pick.card === 'words' ? (words.value || 'THANK YOU').toUpperCase().slice(0, 32) : null, colour: 'ff6fd0', at: Date.now() })); } catch { /* fine */ }
    close();
    if (o.toCity) o.toCity(); else location.assign('/');
  });
  room.addEventListener('click', async () => {
    if (!pick || !FAVOR_ROOMS_LIVE) return;
    room.disabled = true;
    try { await api('profile', { action: 'favor', jack: pick.id, room: o.room, text: words.value || null, colour: 'ff6fd0' }); toastOf('FAVOR CALLED IN', 'ok'); close(); }
    catch (e) { room.disabled = false; toastOf(e.body && e.body.message ? e.body.message.toUpperCase() : 'THE RADIO SAID NO — YOUR FAVOR IS STILL YOURS', 'err'); }
  });
  document.body.append(sheet);
  return sheet;
}
