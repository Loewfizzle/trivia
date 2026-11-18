// LOBBY 2.0 A — THE ROOM DOCK (the owner's approved mock lobby-room.png, Nov 3 9:09–9:15 pm): THE FLANK restyled, not new colours — the
// title's own dock (title-dock.js#createDock: the same rings, glass + tube icons, the same lighting from the sign) with the room's words:
//   [ LEAVE ring ]  [ glass pill: YOU · GUESTS · GAMES · BOARD · CHAT ]  [ PLAY ring ]   (FIXES R2: + BOARD — the owner's nephew)
// the JOIN ring → LEAVE (CITY H1 — the owner: JOIN outside a room, LEAVE inside — a door-out icon, the same silver-white ring → THE LEAVE SHEET;
// INVITE moved to the top of the GUESTS sheet, the GUESTS tab glows + its dot while you're alone); the HOST ring → PLAY (the same hot-pink ring) for the HOST
// only — a guest sees it greyed, WAITING FOR <HOST> (it changes hands with a host change); YOU = your emblem (the profile + CUSTOMIZE);
// GUESTS = gold tube people + a YELLOW DOT when someone joined since you last opened it (no number); GAMES = the cyan grid; CHAT = the pink
// tube bubble + its unread dot; tiny labels under the icons. Behaviour: room-city.js (handlers passed in).
import { h } from '../ui/dom.js';
import { createDock, ICON } from './title-dock.js';
// (CITY H1: the LEAVE ring's door-out — an open door, an arrow out of it)
const DOOR_OUT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 4.2H6.6c-.8 0-1.4.6-1.4 1.4v12.8c0 .8.6 1.4 1.4 1.4H13"/><path d="M10.4 12h10M17 8.4l3.6 3.6-3.6 3.6"/></svg>';

const tube = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><g class="t">${d}</g><g class="c">${d}</g></svg>`;
export const RICON = {
  guests: tube('<circle cx="8.6" cy="8.4" r="2.7"/><path d="M3.6 18.6c.8-3.2 2.6-4.9 5-4.9s4.2 1.7 5 4.9"/><circle cx="16.4" cy="9.2" r="2.3"/><path d="M15 13.9c.5-.1 1-.2 1.4-.2 2.1 0 3.6 1.5 4.3 4.3"/>'),
  chat: tube('<path d="M4.4 6.2c0-1.1.9-2 2-2h11.2c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2h-6.9l-4.3 3.6v-3.6h0c-1.1 0-2-.9-2-2z"/><path d="M8.6 10h.01M12 10h.01M15.4 10h.01"/>'),
  // (SHELL 2.0 B1 — THE LOOK SWITCH's three states: a sun · a moon · AUTO = half a sun (its rays on the left) + half a moon)
};

/** on = { leave, play, you, guests, games, chat, note } → the dock (the same API as createDock: el, els, light, all, ringOn, …) + set(view) */
export function createRoomDock(on) {
  const d = createDock({ join: on.leave, host: on.play, board: () => {}, games: on.games, you: on.you,
    code: { input() {}, paste() {}, focus() {}, blur() {}, keydown() {} }, go() {}, panelDown() {}, panelUp() {}, note: on.note || (() => {}) });
  const E = d.els;
  E.door.setAttribute('aria-label', 'The room');
  E.door.classList.add('rdk-dock');
  // the rings' words
  E.joinTab.querySelector('.nd-host-label').replaceChildren(h('span.rdk-lv-ic', { html: DOOR_OUT }), h('span.rdk-lv-w', 'LEAVE'));
  E.joinTab.setAttribute('aria-label', 'Leave the room');
  E.joinTab.removeAttribute('aria-expanded');
  E.joinTab.classList.add('rdk-leave');
  const hl = E.host.querySelector('.nd-host-label');
  hl.replaceChildren(h('span.rdk-w1', 'PLAY'), h('span.rdk-w2'));
  E.host.classList.add('rdk-play');
  // (LOBBY 2.0 B — THE REMATCH VOTE (the owner's mock, TIDIED Nov 4 9:25 am): the voters' BOLD DOTS in ONE neat row right ABOVE the ring —
  //  one per guest in their colour, lit when they voted, a faint empty ring when not; right-aligned with the ring so the row never reaches
  //  the pill or the screen's edge — and the "3 of 7 want a rematch" pill just above the row; the same on every phone. Never animated)
  E.pips = h('span.rdk-pips', { 'aria-hidden': 'true' });
  E.votes = h('span.rdk-votes', { role: 'status', hidden: true });
  // DM2 — THE ROOM WINS: the HOST sees "2 PLAYERS ARE MID-DAILY" right above PLAY before starting (who only — never a run; api/daily.js `room`)
  E.mid = h('span.rdk-mid', { role: 'status', hidden: true }, h('span.rdk-mid-ic', { 'aria-hidden': 'true', html: ICON.daily }), h('span.rdk-mid-t'));
  E.host.append(E.pips, E.votes, E.mid);
  // (SHELL 2.0 B2: B1's LOOK SWITCH above PLAY is gone — the owner: "more confusing than helpful" → ☰ → Settings → Game look)
  // the pill: YOU · GUESTS · GAMES · CHAT, a tiny label under each icon
  // (THE FIRST TAP, Nov 13: the dock's own pointer-up path — title-dock.js hands its pressTap over on the dock it returns; an older title-dock
  //  without it → the plain click, as before)
  const wire = (el, fn) => (typeof d.pressTap === 'function' ? d.pressTap(el, fn) : (el.onclick = fn, el));
  const tab = (cls, aria, icon, label, onclick) => wire(h(`button.nd-tab.rdk-tab.${cls}`, { type: 'button', 'aria-label': aria },
    h('span.nd-tab-ic', { html: icon }), h('span.rdk-lbl', { 'aria-hidden': 'true' }, label), h('i.rdk-dot', { 'aria-hidden': 'true', hidden: true })), onclick);
  E.youTab = tab('nd-tab-you.rdk-you', 'Your card', ICON.guest, 'YOU', on.you);
  E.guestsTab = tab('rdk-guests', 'The guest list', RICON.guests, 'GUESTS', on.guests);
  E.gamesTab = tab('nd-tab-games.rdk-games', 'The games', ICON.games, 'GAMES', on.games);
  E.chatTab = tab('rdk-chat', 'The room chat', RICON.chat, 'CHAT', on.chat);
  // (FIXES R2 — THE BOARD IN A ROOM: a 5th tab — THE BOARD as it opens outside a room. The icons + labels keep their size, every tab its
  //  44 × 44: the tabs 52 → 44 pt wide, the pill's padding + the ring gaps tighter — css/title.css .rdk-five)
  E.bdTab = tab('nd-tab-board.rdk-board', 'The Board', ICON.board, 'BOARD', on.board || (() => {}));
  E.bdTab.classList.add('is-lit');   // (the room's tabs are lit — the title's sign wave lights its own board tab, not this one)
  const glass = [...E.pill.children].filter(c => !c.classList.contains('nd-tab'));
  E.pill.replaceChildren(...glass, E.youTab, E.guestsTab, E.gamesTab, E.bdTab, E.chatTab);
  E.pill.classList.add('rdk-pill', 'rdk-five');
  // (the sign lights the tabs: the old three slots → GUESTS · GAMES · YOU; CHAT follows GAMES)
  E.boardTab = E.guestsTab;
  const light0 = d.light;
  d.light = (i, lit) => { light0(i, lit); if (i === 1 && E.chatTab) E.chatTab.classList.toggle('is-lit', !!lit); if (i === 0 && E.bdTab) E.bdTab.classList.toggle('is-lit', !!lit); };   // (FIXES R2: BOARD lights with GUESTS)
  d.tabs = () => [E.guestsTab, E.gamesTab, E.youTab];

  let last = '';
  /** v = { host (am I the host), hostName, guestsDot, chatDot, chatN, you (an element: the emblem), youAria, invitePulse + newGame (LOBBY FIXES),
   *        rm?: { on, voted (mine), n (votes), total (everyone), pips: [{ col (hex), on }] } — THE REMATCH VOTE } */
  d.set = v => {
    const rm = v.rm && v.rm.on ? v.rm : null;
    // (LOBBY FIXES — AFTER THE MATCH, change-game.png v2 APPROVED: the host's GAMES tab glows cyan and BREATHES (opacity + scale) until it is
    //  tapped or a game starts; v.newGame = 'breathe' | 'calm' | null. CITY H1 — the owner: its word stays GAMES (was NEW GAME — the labels' air))
    const ng = v.newGame || null;
    if ((E.gamesTab.dataset.ng || '') !== (ng || '')) {
      E.gamesTab.dataset.ng = ng || '';
      E.gamesTab.classList.toggle('rdk-newgame', !!ng); E.gamesTab.classList.toggle('rdk-breathe', ng === 'breathe');
      E.gamesTab.querySelector('.rdk-lbl').textContent = 'GAMES';
      E.gamesTab.setAttribute('aria-label', ng ? 'New game — pick another game' : 'The games');
    }
    // (DM2: the host's MID-DAILY line — before START only; the rematch pill takes the spot after a match)
    const midN = v.host && !rm ? v.mid || 0 : 0;
    if ((E.mid.dataset.n || '0') !== String(midN)) { E.mid.dataset.n = String(midN); E.mid.hidden = !midN; E.mid.querySelector('.rdk-mid-t').textContent = midN ? `${midN} ${midN === 1 ? 'PLAYER IS' : 'PLAYERS ARE'} MID-DAILY` : ''; }
    const k = `${v.host ? 1 : 0}|${v.hostName || ''}|${v.guestsDot ? 1 : 0}${v.alone ? 1 : 0}|${v.chatDot ? 1 : 0}|${v.chatN || 0}|${rm ? `${rm.voted ? 1 : 0}${rm.n}/${rm.total}:${rm.pips.map(p => `${p.col}${p.on ? 1 : 0}`).join(',')}` : ''}`;
    // (LOBBY FIXES — AFTER HOST → CITY H1: the GUESTS tab glows + its dot while you're alone, until you invite someone or a guest arrives — the
    //  old INVITE ring's breathe; opacity + scale only, CSS)
    if (E.guestsTab.classList.contains('rdk-alone') !== !!v.alone) E.guestsTab.classList.toggle('rdk-alone', !!v.alone);
    if (v.you && v.youSig !== E.youSig) { E.youSig = v.youSig; E.youTab.querySelector('.nd-tab-ic').replaceChildren(v.you); if (v.youAria) E.youTab.setAttribute('aria-label', v.youAria); }
    if (k === last) return; last = k;
    E.host.classList.toggle('rdk-wait', !v.host && !rm);
    E.host.classList.toggle('rdk-rm', !!rm);
    E.host.classList.toggle('rdk-voted', !!(rm && rm.voted && !v.host));
    if (rm) {
      E.host.setAttribute('aria-label', v.host ? `Rematch — the same game, the same settings, everyone in (${rm.n} of ${rm.total} want one)` : rm.voted ? 'You voted for a rematch — tap to take it back' : 'Vote for a rematch');
      E.host.setAttribute('aria-disabled', 'false');
      hl.querySelector('.rdk-w1').replaceChildren(h('span', 'RE'), h('span', 'MATCH'));   // (CITY H1: RE / MATCH, two lines, bigger)
      hl.querySelector('.rdk-w2').textContent = v.host ? '' : rm.voted ? '✓ VOTED' : 'VOTE';
    } else {
      E.host.setAttribute('aria-label', v.host ? 'Play — pick the game and start' : `Waiting for ${v.hostName || 'the host'} to start`);
      E.host.setAttribute('aria-disabled', String(!v.host));
      hl.querySelector('.rdk-w1').textContent = v.host ? 'PLAY' : 'WAITING';
      hl.querySelector('.rdk-w2').textContent = v.host ? '' : 'FOR HOST';   // (THE SPEED PASS — the owner, Nov 4 6:28 pm: "WAITING FOR LOEWFIZZLE" didn't fit: WAITING / FOR HOST, never the name)
    }
    // (LOBBY FIXES — change-game.png v2: ONE small pill right above the ring = ONLY the lit voters' dots (their colours) + "want a rematch" —
    //  no empty dots, no count; nothing until someone votes)
    const lit = rm ? rm.pips.filter(p => p.on) : [];
    E.pips.replaceChildren(); E.pips.hidden = true;
    E.votes.hidden = !lit.length;
    E.votes.replaceChildren(...(lit.length ? [h('span.rdk-vdots', ...lit.map(p => h('i.rdk-pip.is-on', { style: { '--c': p.col } }))), h('span.rdk-vw', 'want a rematch')] : []));
    E.votes.setAttribute('aria-label', lit.length ? `${lit.length} want${lit.length === 1 ? 's' : ''} a rematch` : '');
    E.guestsTab.querySelector('.rdk-dot').hidden = !v.guestsDot && !v.alone;
    E.guestsTab.setAttribute('aria-label', v.guestsDot ? 'The guest list — someone new joined' : v.alone ? 'The guest list — invite someone' : 'The guest list');
    E.chatTab.querySelector('.rdk-dot').hidden = !v.chatDot;
    E.chatTab.setAttribute('aria-label', v.chatN ? `The room chat (${v.chatN} unread)` : 'The room chat');
  };
  return d;
}
