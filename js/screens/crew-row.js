// LOBBY FIXES — THE PLAYER CARD (the owner, Nov 4 2:46–2:57 pm: on HIS phone a tap on a player — in the line AND in GUESTS — opened the
// RADIO panel with a "THEIR CARD" crew sheet; he could not see ANY player's card). Now a player tap ALWAYS opens THAT PLAYER's card
// (room-city.js#openPlayerCard), on top; for the owner (the radio loaded on a server yes — body.rd-owner) this small CREW row sits at the
// bottom of the card. The switch itself is the server's (radioCrewPeek / radioCrewSet — the role checked per action); the radio panel
// never opens from a player tap.
import { h } from '../ui/dom.js';
import { api } from '../profile/api.js';
import { state } from '../store.js';

/** the owner's CREW switch for one room player → an element (fills itself in) */
export function crewRow(uid) {
  let pk = null, busy = false, err = '';
  const note = h('small.cr-note', '…');
  const word = h('span.cr-w', '…');
  const sw = h('button.cr-sw', { type: 'button', role: 'switch', 'aria-checked': 'false', 'aria-label': 'The crew', disabled: true, onclick: toggle }, h('i.cr-knob'), word);
  const el = h('div.cr-row', { dataset: { uid } }, h('div.cr-t', h('b', 'THE CREW'), note), sw);
  const can = () => !!(pk && pk.pid && !pk.owner);
  function paint() {
    const on = !!(pk && pk.on);
    sw.setAttribute('aria-checked', String(on));
    sw.classList.toggle('is-on', on);
    sw.disabled = busy || !can();
    word.textContent = !pk ? '…' : on ? 'ON' : 'OFF';
    note.textContent = err || (!pk ? 'Checking…' : pk.owner ? 'That’s you — the owner' : !pk.pid ? (pk.why || 'Needs a profile first') : pk.n10 >= pk.cap && !on ? `The crew is full (${pk.cap})` : 'A radio for the room they’re in');
  }
  async function toggle() {
    if (!can() || busy) return;
    busy = true; paint();
    try { const r = await api('admin', { action: 'radioCrewSet', uid, on: !pk.on, room: state.code || null }); pk.on = r.on; err = ''; } catch (e) { err = e.message || 'Couldn’t reach the server'; }
    busy = false; paint();
  }
  paint();
  api('admin', { action: 'radioCrewPeek', uid }).then(r => { pk = r || { pid: null }; paint(); }).catch(e => { pk = { pid: null, why: e.message }; paint(); });
  return el;
}

/** the owner's phone: the radio loaded on the server's yes (harbor/radio.js adds body.rd-owner) */
export const isOwnerPhone = () => document.body.classList.contains('rd-owner');
