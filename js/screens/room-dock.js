// LOBBY 2.0 A — THE ROOM DOCK (the owner's approved mock lobby-room.png, Nov 3 9:09–9:15 pm): THE FLANK restyled, not new colours — the
// title's own dock (title-dock.js#createDock: the same rings, glass + tube icons, the same lighting from the sign) with the room's words:
//   [ INVITE ring ]  [ glass pill: YOU · GUESTS · GAMES · CHAT ]  [ PLAY ring ]
// the JOIN ring → INVITE (the same silver-white ring; EVERYONE may invite); the HOST ring → PLAY (the same hot-pink ring) for the HOST
// only — a guest sees it greyed, WAITING FOR <HOST> (it changes hands with a host change); YOU = your emblem (the profile + CUSTOMIZE);
// GUESTS = gold tube people + a YELLOW DOT when someone joined since you last opened it (no number); GAMES = the cyan grid; CHAT = the pink
// tube bubble + its unread dot; tiny labels under the icons. Behaviour: room-city.js (handlers passed in).
import { h } from '../ui/dom.js';
import { createDock, ICON } from './title-dock.js';

const tube = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><g class="t">${d}</g><g class="c">${d}</g></svg>`;
export const RICON = {
  guests: tube('<circle cx="8.6" cy="8.4" r="2.7"/><path d="M3.6 18.6c.8-3.2 2.6-4.9 5-4.9s4.2 1.7 5 4.9"/><circle cx="16.4" cy="9.2" r="2.3"/><path d="M15 13.9c.5-.1 1-.2 1.4-.2 2.1 0 3.6 1.5 4.3 4.3"/>'),
  chat: tube('<path d="M4.4 6.2c0-1.1.9-2 2-2h11.2c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2h-6.9l-4.3 3.6v-3.6h0c-1.1 0-2-.9-2-2z"/><path d="M8.6 10h.01M12 10h.01M15.4 10h.01"/>'),
};

/** on = { invite, play, you, guests, games, chat, note } → the dock (the same API as createDock: el, els, light, all, ringOn, …) + set(view) */
export function createRoomDock(on) {
  const d = createDock({ join: on.invite, host: on.play, board: () => {}, games: on.games, you: on.you,
    code: { input() {}, paste() {}, focus() {}, blur() {}, keydown() {} }, go() {}, panelDown() {}, panelUp() {}, note: on.note || (() => {}) });
  const E = d.els;
  E.door.setAttribute('aria-label', 'The room');
  E.door.classList.add('rdk-dock');
  // the rings' words
  E.joinTab.querySelector('.nd-host-label').textContent = 'INVITE';
  E.joinTab.setAttribute('aria-label', 'Invite friends — share the hush word');
  E.joinTab.removeAttribute('aria-expanded');
  E.joinTab.classList.add('rdk-invite');
  const hl = E.host.querySelector('.nd-host-label');
  hl.replaceChildren(h('span.rdk-w1', 'PLAY'), h('span.rdk-w2'));
  E.host.classList.add('rdk-play');
  // the pill: YOU · GUESTS · GAMES · CHAT, a tiny label under each icon
  const tab = (cls, aria, icon, label, onclick) => h(`button.nd-tab.rdk-tab.${cls}`, { type: 'button', 'aria-label': aria, onclick },
    h('span.nd-tab-ic', { html: icon }), h('span.rdk-lbl', { 'aria-hidden': 'true' }, label), h('i.rdk-dot', { 'aria-hidden': 'true', hidden: true }));
  E.youTab = tab('nd-tab-you.rdk-you', 'Your card', ICON.guest, 'YOU', on.you);
  E.guestsTab = tab('rdk-guests', 'The guest list', RICON.guests, 'GUESTS', on.guests);
  E.gamesTab = tab('nd-tab-games.rdk-games', 'The games', ICON.games, 'GAMES', on.games);
  E.chatTab = tab('rdk-chat', 'The room chat', RICON.chat, 'CHAT', on.chat);
  const glass = [...E.pill.children].filter(c => !c.classList.contains('nd-tab'));
  E.pill.replaceChildren(...glass, E.youTab, E.guestsTab, E.gamesTab, E.chatTab);
  E.pill.classList.add('rdk-pill');
  // (the sign lights the tabs: the old three slots → GUESTS · GAMES · YOU; CHAT follows GAMES)
  E.boardTab = E.guestsTab;
  const light0 = d.light;
  d.light = (i, lit) => { light0(i, lit); if (i === 1 && E.chatTab) E.chatTab.classList.toggle('is-lit', !!lit); };
  d.tabs = () => [E.guestsTab, E.gamesTab, E.youTab];

  let last = '';
  /** v = { host (am I the host), hostName, guestsDot, chatDot, chatN, you (an element: the emblem), youAria } */
  d.set = v => {
    const k = `${v.host ? 1 : 0}|${v.hostName || ''}|${v.guestsDot ? 1 : 0}|${v.chatDot ? 1 : 0}|${v.chatN || 0}`;
    if (v.you && v.youSig !== E.youSig) { E.youSig = v.youSig; E.youTab.querySelector('.nd-tab-ic').replaceChildren(v.you); if (v.youAria) E.youTab.setAttribute('aria-label', v.youAria); }
    if (k === last) return; last = k;
    E.host.classList.toggle('rdk-wait', !v.host);
    E.host.setAttribute('aria-label', v.host ? 'Play — pick the game and start' : `Waiting for ${v.hostName || 'the host'} to start`);
    E.host.setAttribute('aria-disabled', String(!v.host));
    hl.querySelector('.rdk-w1').textContent = v.host ? 'PLAY' : 'WAITING';
    hl.querySelector('.rdk-w2').textContent = v.host ? '' : `FOR ${String(v.hostName || 'THE HOST').toUpperCase().slice(0, 12)}`;
    E.guestsTab.querySelector('.rdk-dot').hidden = !v.guestsDot;
    E.guestsTab.setAttribute('aria-label', v.guestsDot ? 'The guest list — someone new joined' : 'The guest list');
    E.chatTab.querySelector('.rdk-dot').hidden = !v.chatDot;
    E.chatTab.setAttribute('aria-label', v.chatN ? `The room chat (${v.chatN} unread)` : 'The room chat');
  };
  return d;
}
