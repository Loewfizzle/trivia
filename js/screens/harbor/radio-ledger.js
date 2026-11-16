// CITY CONTROLS A — THE LEDGER (the radio's right face; mockup 3): NIXIE tubes (IN THE CITY now · ROOMS OPEN · GAMES ON); TODAY on a ledger
// page (visitors — an estimate until Vercel Analytics: a visible city says hello every ~2 min —, new players, matches played, the legendaries
// spotted (a dash until PROGRESSION 2.0 counts them), the longest streak alive, ERRORS FROM PHONES in red → /admin's list); THIS WEEK as a
// bar chart (visits · games); THE CREW (CC-B: the hand-picked friends — emblem, name tag, when added, what they last fired · REMOVE (a second tap
// confirms) · ADD BY NAME TAG; cap 10; no profile = can't be added). The server's radioLedger (the owner only; from /admin's STATS + the server).
// (FIXES R2 — the owner: THE FOUNDER WINDOW is switched ONLY at the foot of /admin now — the radio's FOUNDER WINDOW paper is gone; the server's
//  radioFounder action, who may flip it + its audit are unchanged — api/_lib/founder.js.)
import { h } from '../../ui/dom.js';
import { avatar } from '../../ui/components.js';
import { jackDef } from '../../core/harbor-radio.js';
import { pushPaper } from './radio-push.js';
import { nowPlayingText } from '../../audio/now-playing.js';
import { openSheet } from '../../ui/sheet.js';
import { lazyImport } from '../../ui/lazy-import.js';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
let memo = null;   // { at, data } — 30 s

function nixie(n, d = 3) { return h('span.rd-nixie', ...String(Math.max(0, Math.min(10 ** d - 1, n | 0))).padStart(d, '0').split('').map(c => h('span', c))); }

export function paint({ api, now }) {
  const holder = h('div.rd-paperwrap', h('section.rd-paper', h('h4', 'TODAY'), h('p.rd-hint', 'Reading the ledger…')));
  // FR7 FIXES C — NOW PLAYING (the owner, Nov 13): what THIS phone is playing, under the NIXIE row — from the audio engine's own state (no poll,
  // no /api); refreshed once a second ONLY while this face is on screen (the timer ends itself once the ledger leaves the page)
  // (FR7 FIXES C2: NOW PLAYING can never stop the ledger — its text never throws, and the 1 s tick is wrapped: an error = "NOW PLAYING · —")
  const npLine = () => { try { return nowPlayingText(); } catch { return 'NOW PLAYING · —'; } };
  const np = h('p.rd-np', { 'aria-live': 'off' }, npLine());
  const npT = setInterval(() => {
    try {
      if (!holder.isConnected) { clearInterval(npT); return; }
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      const t = npLine(); if (np.textContent !== t) np.textContent = t;
    } catch { clearInterval(npT); }
  }, 1000);
  const fill = L => {
    const T = L.today, wk = L.week || [], max = Math.max(1, ...wk.map(x => x.visits + x.games));
    holder.replaceChildren(
      h('div.rd-big3',
        // (PLAY NOW — WHO'S ON: IN THE CITY is a door — a tap → who's online now (the owner's list; ui/whos-on.js — the server refuses anyone else))
        h('button.rd-who', { type: 'button', 'aria-label': `${L.now.here} in the city — who's on`, onclick: () => lazyImport(import('../../ui/whos-on.js'), '../../ui/whos-on.js').then(m => m.openWhosOn({ api, openSheet })).catch(() => {}) },
          nixie(L.now.here), h('small', 'IN THE CITY ›')),
        // (CITY C — ROOMS OPEN + GAMES ON are doors too: the open rooms (the ledger's own list) → a room → its players' slim cards)
        h('button.rd-who', { type: 'button', 'aria-label': `${L.now.rooms} rooms open — the list`, onclick: () => lazyImport(import('../../ui/whos-on.js'), '../../ui/whos-on.js').then(m => m.openRooms({ api, openSheet, rooms: L.rooms })).catch(() => {}) },
          nixie(L.now.rooms), h('small', 'ROOMS OPEN ›')),
        h('button.rd-who', { type: 'button', 'aria-label': `${L.now.games} games on — the list`, onclick: () => lazyImport(import('../../ui/whos-on.js'), '../../ui/whos-on.js').then(m => m.openRooms({ api, openSheet, rooms: L.rooms, playing: true })).catch(() => {}) },
          nixie(L.now.games), h('small', 'GAMES ON ›'))),
      np,
      h('section.rd-paper', h('h4', 'TODAY', h('em', 'since midnight · Eastern')),
        h('div.rd-lg', h('span', 'Visitors', h('small', 'an estimate')), h('b', String(T.visitors))),
        h('div.rd-lg', h('span', 'New players'), h('b', String(T.newPlayers))),
        h('div.rd-lg', h('span', 'Matches played'), h('b', String(T.matches))),
        h('div.rd-lg', h('span', 'Legendaries spotted'), h('b', T.spotted == null ? '—' : String(T.spotted))),   // (CITY C: the real count — api/_lib/sightings.js counts each one)
        h('div.rd-lg', h('span', 'Longest streak alive'), h('b', T.streak ? `${T.streak} night${T.streak > 1 ? 's' : ''}` : '—')),
        h('div.rd-lg', h('span', h('a', { href: '/admin#errors', target: '_blank', rel: 'noopener' }, 'Errors from phones'), h('small', 'last 24 h')), h('b', { class: T.errors ? 'bad' : '' }, String(T.errors)))),
      // (CITY C: THIS WEEK moved to STATS — the ☰ menu's owner sheet; the radio keeps the RIGHT-NOW numbers)
      // (FIXES R2 — the owner's add-on: THE FOUNDER WINDOW lives ONLY at the foot of /admin now — its radio paper removed)
      // THE VAULT 1A — THE CARD LAB (admins only, server-checked): every new card / emblem, moving, at its phone size → APPROVE · FIX · CUT
      h('section.rd-paper', h('h4', 'THE CARD LAB', h('em', 'the vault · mark the new cards')),
        h('div.rd-lg', h('span', h('a', { href: '/lab', target: '_blank', rel: 'noopener' }, 'Open THE CARD LAB'), h('small', 'approve · fix · cut')), h('b', '›'))),
      crewPaper(L),
      crewIcPaper(L),
      pushEl || (pushEl = pushPaper({ api })));
  };
  // THE CREW: who, since when, what they last fired · REMOVE · ADD BY NAME TAG
  const ago = t => { const d = Math.max(0, now() - t), m = Math.round(d / 60e3); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
  let armed = null, addErr = '';
  let pushEl = null;   // (CC-B — A ROOM JUST OPENED: built once, it keeps its own state across the ledger's refills)
  const crewAct = async body => { try { const r = await api('admin', { action: 'radioCrewSet', ...body }); memo = memo ? { ...memo, data: { ...memo.data, crew: r.crew } } : memo; addErr = ''; } catch (e) { addErr = (e && e.message) || 'Couldn’t change the crew.'; } if (memo) fill(memo.data); };
  // FRIENDS A — THE CREW INTERCOM: ONE master switch (server-stored + checked, default OFF): ON = the crew get a hold-to-talk for the room
  // they're in (≤ 15 s, a few a room a night, gone after an hour); OFF = not shown + the server refuses a crew send
  let icBusy = false, icErr = '';
  function crewIcPaper(L) {
    const on = !!(L.crewIc && L.crewIc.on);
    const flip = async () => {
      if (icBusy) return; icBusy = true; icErr = ''; if (memo) fill(memo.data);
      try { const r = await api('admin', { action: 'radioCrewIntercom', on: !on }); memo = memo ? { ...memo, data: { ...memo.data, crewIc: r.crewIc } } : memo; }
      catch (e) { icErr = (e && e.message) || 'Couldn’t change it.'; }
      icBusy = false; if (memo) fill(memo.data);
    };
    return h('section.rd-paper.rd-crewic', h('h4', 'CREW INTERCOM', h('em', on ? 'on · the crew can talk to their room' : 'off · the crew’s mic is hidden')),
      h('div.rd-lg', h('span', 'The crew’s hold-to-talk', h('small', 'their own room only · 15 s a clip · a few a night · gone after an hour')),
        h('button.rd-lever', { type: 'button', role: 'switch', 'aria-checked': String(on), class: on ? 'is-on' : '', disabled: icBusy, 'aria-label': 'Crew intercom', onclick: flip }, h('i.rd-lever-arm'), h('span', on ? 'ON' : 'OFF'))),
      icErr ? h('p.rd-err', { role: 'alert' }, icErr) : null);
  }
  function crewPaper(L) {
    const C = L.crew || [], cap = L.crewCap || 10;
    const inp = h('input.rd-inp', { type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', enterkeyhint: 'done', placeholder: 'MIKE#4821', 'aria-label': 'A name tag', maxlength: '30' });
    const add = () => { const v = inp.value.trim(); if (v) crewAct({ tag: v, on: true }); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
    return h('section.rd-paper.rd-crew', h('h4', 'THE CREW', h('em', `${C.length} of ${cap} · a lobby radio each`)),
      ...(C.length ? C.map(c => h('div.rd-crow', { dataset: { pid: c.pid } },
        c.a ? avatar(c.a, c.c || 'yellow', 30) : h('i.rd-noav'),
        h('div.rd-cwho', h('b', `${c.n}${c.t ? `#${c.t}` : ''}`), h('small', `added ${ago(c.at)} · ${c.last ? `last: ${(jackDef(c.last.jack) || { label: c.last.jack }).label} ${ago(c.last.at)}` : 'nothing fired yet'}`)),
        h('button.rd-crm', { type: 'button', class: armed === c.pid ? 'is-armed' : '', onclick: () => { if (armed !== c.pid) { armed = c.pid; fill(memo.data); setTimeout(() => { if (armed === c.pid) { armed = null; if (memo) fill(memo.data); } }, 4000); return; } armed = null; crewAct({ pid: c.pid, on: false }); } }, armed === c.pid ? 'SURE?' : 'REMOVE'))) : [h('p.rd-hint', 'Nobody yet. Tap a player in a lobby (their card has the CREW switch) or add a name tag.')]),
      h('div.rd-cadd', inp, h('button.rd-done', { type: 'button', onclick: add, disabled: C.length >= cap }, 'ADD')),
      addErr ? h('p.rd-err', { role: 'alert' }, addErr) : null,
      h('p.rd-hint', 'Up to 10. A player needs a profile (after their first match) to join the crew. The crew fires sky moments in the room they’re in — every phone there sees it; tap a player in your room to switch THE CREW on their card.'));
  }
  const go = async () => {
    try { if (!memo || now() - memo.at > 30e3) memo = { at: now(), data: await api('admin', { action: 'radioLedger' }) }; fill(memo.data); }
    catch (e) { holder.replaceChildren(h('section.rd-paper', h('h4', 'THE LEDGER'), h('p', `Couldn’t read the ledger: ${(e && e.message) || 'offline'}`))); }
  };
  go();
  return [holder];
}
