// Room chat — UI: the chat sheet (bottom sheet, keyboard-aware) and the in-game chat
// button (unread badge; a quiet lock while you're actively playing). All message text is rendered with
// textContent (never HTML) and links are just text. The list updates incrementally: one element per
// message, created once, never a full re-render.
import { openSheet } from '../ui/sheet.js';
import { h, vibrate } from '../ui/dom.js';
import { colorHex } from '../config.js';
import { state, subscribe, isHost } from '../store.js';
import { serverNow } from '../firebase.js';
import { sfx } from '../audio/sfx.js';
import { chat, onChat, send, retry, discard, typingPing, stopTyping, markRead, locked } from './chat.js';
import { maskProfanity, relTime, typingLine, typists, MAX_LEN, continues } from './logic.js';
import { rankBadge } from '../ui/emblems.js';
import { pubOf } from '../profile/public.js';

const ICON = {
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="11" width="12" height="9" rx="1"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/></svg>',
  send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg>',
};
const filterOn = () => !!(state.meta && state.meta.settings && state.meta.settings.chat && state.meta.settings.chat.filter);
const shown = t => (filterOn() ? maskProfanity(t) : t);
const playerOf = uid => state.players[uid];
const nameOf = m => (playerOf(m.u) && playerOf(m.u).name) || m.n || 'PLAYER';
const colorOf = m => colorHex((playerOf(m.u) && playerOf(m.u).color) || 'cyan');
const typingNames = () => typists(chat.typing, state.uid, serverNow()).map(u => (playerOf(u) && playerOf(u).name) || 'Someone');

// ---------------------------------------------------------------- in-game chat button
let fab = null;
export function installChatFab() {
  if (fab) return;
  const badge = h('span.cf-badge');
  fab = h('button.chat-fab', { type: 'button', dataset: { sfx: 'none' }, onclick: () => { if (!locked()) { sfx('tap'); openChat(); } } },
    h('span.cf-icon', { html: ICON.chat }), h('span.cf-lock', { html: ICON.lock }), badge);
  document.body.append(fab);
  let was = '';
  const paint = () => {
    const show = !!(state.code && state.meta && state.meta.status === 'playing' && state.game && state.quit !== state.game.matchId);   // (a phone that quit the game has the lobby's chat strip)
    const lock = show && locked();
    const s = `${show}|${lock}|${chat.unread}`;
    if (s === was) return;
    was = s;
    // (SHELL 2.0 A — THE CHAT LOCK: a game that locks chat HIDES the button for that stretch — never a greyed button; the room's chat opens
    //  between games / rounds as before)
    fab.hidden = !show || lock;
    document.body.classList.toggle('chat-fab-on', show && !lock); // timers make room for the button (chat.css)
    fab.classList.toggle('is-locked', lock);
    fab.setAttribute('aria-disabled', String(lock));
    fab.setAttribute('aria-label', lock ? `Chat — opens between rounds${chat.unread ? ` (${chat.unread} unread)` : ''}` : `Open chat${chat.unread ? ` (${chat.unread} unread)` : ''}`);
    badge.textContent = chat.unread ? String(Math.min(99, chat.unread)) : '';
    badge.hidden = !chat.unread;
  };
  subscribe(paint);
  onChat(paint);
  paint();
}

// ---------------------------------------------------------------- the chat sheet
let open = null; // { close }
export const isChatOpen = () => !!open;

/** LOBBY 2.0 A — the quick replies (the console's) + a game's own chips (THE CARTRIDGE PLUG: setGameChips(['NICE ROLL', …]) while it runs) */
export const QUICK = Object.freeze(['GG', 'NO WAY', 'REMATCH?', '🔥', '😂', '👏']);
let gameChips = [];
export function setGameChips(list) { gameChips = Array.isArray(list) ? list.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim().slice(0, 24)).slice(0, 4) : []; }

export function openChat({ focus = false } = {}) {
  if (open || !state.code || locked()) return;
  chat.open = true;
  markRead();
  const list = h('div.chat-list', { role: 'log', 'aria-live': 'polite', 'aria-label': 'Messages' });
  const pill = h('button.chat-pill', { type: 'button', hidden: true, onclick: () => { scrollEnd(true); } }, 'NEW MESSAGES ↓');
  const typing = h('div.chat-typing', { 'aria-live': 'polite' });
  const input = h('input.chat-input', {
    type: 'text', maxlength: String(MAX_LEN), enterkeyhint: 'send', autocomplete: 'off', autocorrect: 'on', spellcheck: true,
    placeholder: 'Message the room…', 'aria-label': 'Message',
  });
  const counter = h('span.chat-count', { 'aria-live': 'polite' });
  const hint = h('div.chat-hint');
  const sendBtn = h('button.chat-send', { type: 'submit', 'aria-label': 'Send', html: ICON.send, dataset: { sfx: 'none' } });
  const form = h('form.chat-form', { onsubmit: e => { e.preventDefault(); submit(); } }, input, counter, sendBtn);
  // LOBBY 2.0 A — QUICK-REPLY CHIPS above the field (most party chat needs no keyboard): the console's own + a game's (setGameChips)
  const chipRow = h('div.chat-chips', { role: 'group', 'aria-label': 'Quick replies' },
    ...[...QUICK, ...gameChips].map(t => h('button.chat-chip', { type: 'button', dataset: { sfx: 'none' }, onclick: () => { const r = send(t); if (r === 'ok') { sfx('lock'); scrollEnd(true); } else if (r === 'slow') showHint('Slow down — one message a second.'); } }, t)));
  // (SHELL 2.0 A: THE SHEET — ui/sheet.js: the handle, ROOM CHAT small + spaced, the hush word + FILTERED on its line, the × — the sheet's
  //  own swipe closes it; the keyboard's lift (below) moves its panel)
  const shApi = openSheet({ title: 'ROOM CHAT', kicker: `${state.code}${filterOn() ? ' · FILTERED' : ''}`, cls: 'chat-sheet', label: 'Room chat',
    body: [h('div.chat-body', list, pill), typing, hint, chipRow, form], onClose: () => close(true) });
  const sheet = shApi.sheet, head = shApi.head;
  if (focus) input.focus(); // inside the tap's gesture, so the phone keyboard opens

  // ---- incremental message list
  const nodes = new Map(); // key -> element
  let stick = true;
  const atBottom = () => list.scrollHeight - list.scrollTop - list.clientHeight < 48;
  list.addEventListener('scroll', () => { stick = atBottom(); if (stick) pill.hidden = true; }, { passive: true });
  function scrollEnd(force) { if (force || stick) { list.scrollTop = list.scrollHeight; stick = true; pill.hidden = true; } }
  function build(m) {
    if (m.s) return h('div.cm-sys', { dataset: { k: m.k } }, h('span', m.x));
    const mine = m.u === state.uid;
    const text = h('span.cm-text');
    text.textContent = shown(m.t);
    const time = h('span.cm-time', { dataset: { at: String(m.at) } });
    const el = h('div.cm', { class: mine ? 'is-me' : null, dataset: { k: m.k } },
      h('div.cm-head', mine ? null : h('b.cm-name', { style: { color: colorOf(m) } }, nameOf(m), rankBadge(pubOf(playerOf(m.u)))), time),
      h('div.cm-bubble', { style: { '--c': colorOf(m) } }, text),
      h('div.cm-state'));
    el._m = m;
    return el;
  }
  function render() {
    const failed = [...chat.outbox.values()].filter(o => o.status === 'failed').map(o => ({ k: o.k, u: state.uid, t: o.t, at: o.at, failed: true }));
    const items = [...chat.msgs, ...failed];
    const empty = list.querySelector('.chat-empty');
    if (empty) empty.remove();
    const keep = new Set(items.map(m => m.k));
    for (const [k, el] of nodes) if (!keep.has(k)) { el.remove(); nodes.delete(k); }
    const wasBottom = atBottom();
    let added = false, mineAdded = false;
    let prev = null;
    items.forEach((m, i) => {
      let el = nodes.get(m.k);
      if (!el) { el = build(m); nodes.set(m.k, el); added = true; if (m.u === state.uid) mineAdded = true; }
      if (list.children[i] !== el) list.insertBefore(el, list.children[i] || null);
      if (!m.s) {
        el.classList.toggle('is-cont', continues(prev, m));
        const o = chat.outbox.get(m.k);
        const st = m.failed ? 'failed' : o && o.status === 'pending' ? 'pending' : '';
        if (el.dataset.state !== st) {
          el.dataset.state = st;
          const box = el.querySelector('.cm-state');
          box.replaceChildren(st === 'failed'
            ? h('button.cm-retry', { type: 'button', onclick: () => { const r = retry(m.k); if (r === 'slow') showHint('One moment — sending too fast.'); } }, 'NOT SENT · TAP TO RETRY')
            : st === 'pending' ? h('span', 'SENDING…') : '');
          if (st === 'failed') box.append(h('button.cm-discard', { type: 'button', 'aria-label': 'Discard message', onclick: () => discard(m.k) }, '×'));
        }
      }
      prev = m;
    });
    while (list.children.length > items.length) list.lastChild.remove();
    if (!items.length) list.append(h('div.chat-empty', 'No messages yet. Start the trash talk.'));
    times();
    if (added) {
      if (mineAdded || wasBottom || stick) scrollEnd(true);
      else pill.hidden = false;
    }
  }
  function times() {
    const now = serverNow();
    for (const t of list.querySelectorAll('.cm-time')) {
      const el = t.closest('.cm');
      t.textContent = el && el.classList.contains('is-cont') ? '' : relTime(now - Number(t.dataset.at));
    }
  }
  function refilter() { for (const el of nodes.values()) if (el._m) el.querySelector('.cm-text').textContent = shown(el._m.t); }
  function paintTyping() { typing.textContent = typingLine(typingNames()); }

  // ---- composer
  let hintTimer = 0;
  function showHint(t) { hint.textContent = t; hint.classList.add('is-on'); clearTimeout(hintTimer); hintTimer = setTimeout(() => hint.classList.remove('is-on'), 2200); }
  function submit() {
    const r = send(input.value);
    if (r === 'ok') { input.value = ''; paintCount(); sfx('lock'); scrollEnd(true); }
    else if (r === 'slow') showHint('Slow down — one message a second.');
  }
  function paintCount() {
    const n = input.value.length;
    counter.textContent = n >= MAX_LEN - 40 ? `${n}/${MAX_LEN}` : '';
    counter.classList.toggle('is-max', n >= MAX_LEN);
  }
  input.addEventListener('input', () => { paintCount(); if (input.value.trim()) typingPing(); else stopTyping(); });

  // ---- THE CHAT KEYBOARD (LOBBY 2.0 A — docs/chat.md): the sheet keeps ONE size and SLIDES UP as one piece onto the keyboard — a
  // transform by the keyboard's height (the visual viewport), never a resize: nothing behind it squeezes or jumps, the list stays on the
  // newest message. (Only a keyboard taller than the room above it — an iPad's, the emoji pane on a small phone — caps the height to fit.)
  const vv = () => window.__fakeVV || window.visualViewport;
  function layout() {
    const v = vv();
    if (!v) return;
    const kb = Math.max(0, Math.round(window.innerHeight - v.height - (v.offsetTop || 0)));
    sheet.style.setProperty('--kb', `${kb}px`);
    sheet.style.setProperty('--vh', `${Math.round(v.height)}px`);
    sheet.classList.toggle('has-kb', kb > 40);
    scrollEnd(true);
  }
  const v0 = window.visualViewport;
  if (v0) { v0.addEventListener('resize', layout); v0.addEventListener('scroll', layout); }
  window.addEventListener('resize', layout);
  window.__chatLayout = layout; // test hook (fake keyboard)
  layout();

  // ---- wiring
  const offChat = onChat(kind => {
    if (kind === 'msgs' || kind === 'outbox') render();
    if (kind === 'typing') paintTyping();
    if (kind === 'msgs') markRead();
  });
  let filt = filterOn();
  const offStore = subscribe(() => {
    if (!state.code || locked()) { close(); return; } // the next round started: chat steps aside
    if (filterOn() !== filt) { filt = filterOn(); refilter(); }
  });
  const timer = setInterval(() => { times(); paintTyping(); }, 15_000);
  const typingTimer = setInterval(paintTyping, 1500);
  render();
  paintTyping();
  scrollEnd(true);

  function close(fromSheet = false) {
    if (!open) return;
    open = null;
    input.blur();
    stopTyping();
    chat.open = false;
    markRead();
    offChat(); offStore(); clearInterval(timer); clearInterval(typingTimer);
    if (v0) { v0.removeEventListener('resize', layout); v0.removeEventListener('scroll', layout); }
    window.removeEventListener('resize', layout);
    if (!fromSheet) shApi.close();
  }
  open = { close };
  return open;
}
export const closeChat = () => { if (open) open.close(); };

// test hook (emulator runs only)
if (/[?&]emu\b/.test(location.search)) window.__chatUI = { open: () => openChat(), close: closeChat, isOpen: isChatOpen, host: () => isHost(), vibrate };
