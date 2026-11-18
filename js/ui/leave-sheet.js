// CITY H1 — THE LEAVE SHEET (the owner, Nov 17–18): ONE standard sheet for every way out of a room — the room dock's LEAVE ring, ☰'s LEAVE
// (in a game: at the very top), the guest list's foot, a SOLO game's QUIT — BACK TO THE CITY. "LEAVE <ROOM WORD>?" · LEAVE (the danger tube) ·
// STAY; the host leaving reads "HOST GOES TO <NAME>" (room.js#leaveRoom's hand-off — core/room-logic.js#nextHost, the same pick). It replaces
// every "TAP AGAIN TO LEAVE". Lazy (never in the boot graph). docs/title.md "THE LEAVE SHEET".
import { h } from './dom.js';
import { openSheet } from './sheet.js';
import { tubeButton } from './components.js';
import { state } from '../store.js';
import { nextHost } from '../core/room-logic.js';

/** PURE (tests): the sheet's words — o = { word, solo, inGame, host, heir (a name | null), alone } → { title, kicker, note, go } */
export function leaveWords(o = {}) {
  const word = String(o.word || '').toUpperCase();
  if (o.solo) return { title: 'BACK TO THE CITY?', kicker: 'QUIT', note: o.inGame ? 'This run ends here.' : '', go: 'LEAVE' };
  const note = o.host && o.heir ? `HOST GOES TO ${String(o.heir).toUpperCase()}` : o.host && o.alone ? 'THE ROOM CLOSES' : o.inGame ? 'The others keep playing.' : '';
  return { title: word ? `LEAVE ${word}?` : 'LEAVE THE ROOM?', kicker: o.inGame ? 'THE GAME + THE ROOM' : 'THE ROOM', note, go: 'LEAVE' };
}

let open = null;
/** the sheet → LEAVE runs onLeave() (the caller's own way out), STAY closes it. { solo, inGame, onLeave } */
export function openLeave({ solo = false, inGame = false, onLeave } = {}) {
  if (open) return open;
  const P = state.players || {}, me = state.uid, host = !!(state.meta && state.meta.hostId === me);
  const others = Object.keys(P).filter(u => u !== me);
  const hid = host && !solo && others.length ? nextHost({ players: P, presence: state.presence, exclude: me }) : null;
  const w = leaveWords({ word: state.code, solo, inGame, host, heir: hid && P[hid] ? P[hid].name : null, alone: !others.length });
  let gone = false;
  const go = tubeButton(w.go, { kind: 'danger', block: true, cls: 'lv-go', onClick: () => { if (gone) return; gone = true; s.close(); Promise.resolve().then(onLeave).catch(() => {}); } });
  const stay = tubeButton('STAY', { block: true, cls: 'lv-stay', onClick: () => s.close() });
  const s = openSheet({ title: w.title, kicker: w.kicker, cls: 'lv-sheet', label: w.title, onClose: () => { open = null; },
    body: [w.note ? h('p.lv-note', w.note) : null, h('div.lv-row', stay, go)] });
  open = s;
  return s;
}
