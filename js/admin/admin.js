// /admin — moderation for the global boards. Signs in with this browser's own anonymous identity (the same profile as
// the app on this browser); every action goes to POST /api/admin, which checks the profile id against ADMIN_PIDS and
// writes an audit entry. Search players, remove a record, reset a board, rename, hide from the boards, the audit log.
import { h } from '../ui/dom.js';
import { toast } from '../ui/toast.js';   // (SHELL 2.0 A: THE MESSAGE — was the page's own .ad-toast)
import { avatar, tubeButton } from '../ui/components.js';
import { emblem, installEmblems } from '../ui/emblems.js';
import { initFirebase, isConfigured } from '../firebase.js';
import { api } from '../profile/api.js';
import { boardDef, fmtValue } from '../core/boards.js';
import { fmtTag, isOffensive } from '../core/names.js';
import { houseNick } from '../core/nicknames.js';
import { levelLabel } from '../core/levels.js';
import { GAMES } from '../config.js';
import { GAME_LIGHT } from '../board/view.js';
import { groupErrors, groupReports, filterGroups, countLine } from './groups.js';

const app = document.getElementById('app');
const gameName = id => (GAMES.find(g => g.id === id) || { name: id }).name;
const when = at => new Date(at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
let current = null;

async function call(action, body = {}) {
  try { return await api('admin', { action, ...body }); } catch (e) { toast(e.message || 'Failed', 'err'); throw e; }
}

// (SHELL 2.0 A: THE NEON TUBE — a small tube; the second tap to confirm turns the button itself red: ui/components.js#confirmTap)
function confirmBtn(label, onConfirm, cls = '') {
  const b = tubeButton(label, { kind: /is-danger/.test(cls) ? 'danger' : 'secondary', size: 'sm', cls: 'ad-btn', confirm: 'TAP AGAIN TO CONFIRM', onClick: async () => {
    b.disabled = true;
    try { await onConfirm(); } finally { b.disabled = false; }
  } });
  return b;
}

function denied(who) {
  app.replaceChildren(h('section.ad-card.ad-denied',
    h('div.ad-kicker', 'NEON SPEAKEASY · ADMIN'),
    h('h1', 'Not authorized'),
    h('p', 'This page only works for the profile ids listed in the ADMIN_PIDS environment variable on Vercel.'),
    who && who.pid ? h('div.ad-pidbox', h('span', 'This browser’s profile id'), h('code', who.pid),
      h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: () => navigator.clipboard.writeText(who.pid).then(() => toast('Copied')) }, 'Copy')) : h('p', 'No profile on this browser yet — open the game once (or restore your key) and come back.'),
    h('ol.ad-steps',
      h('li', 'Copy the id above (open this page in the browser where you play).'),
      h('li', 'Vercel → your project → Settings → Environment Variables → ADMIN_PIDS = that id (several: comma-separated).'),
      h('li', 'Redeploy (Deployments → ⋯ → Redeploy), then reload this page.')),
    h('a.ad-link', { href: '/' }, '‹ Back to the game')));
}

// THE SPEED PASS — /ADMIN, TIDIED (the owner, Nov 4 6:07–6:08 pm: "too long, tons of logs"): EVERY CARD COLLAPSIBLE — a header with its
// count ("Errors from phones  214 · 3 new"), a tap opens / closes it, remembered on this device (localStorage ad:open:<id>), the long cards
// collapsed by default; a JUMP BAR of the cards at the top; the logs GROUPED (js/admin/groups.js) with a filter box + MARK SEEN / CLEAR per
// group. THE DAY CHART card is gone (THE RADIO has it, /daychart stays); there is no LEGENDARIES card here (the radio's own).
const CARDS = [];
const openKey = id => `ad:open:${id}`;
function isOpen(id, dflt) { try { const v = localStorage.getItem(openKey(id)); return v == null ? dflt : v === '1'; } catch { return dflt; } }
function card(id, title, { open: dflt = true, cls = '' } = {}, ...body) {
  const count = h('span.ad-card-c'), chev = h('i.ad-card-chev', { 'aria-hidden': 'true' }, '›');
  const head = h('button.ad-card-h', { type: 'button', 'aria-controls': `${id}-b` }, h('h2', title), count, chev);
  const inner = h('div.ad-card-b', { id: `${id}-b` }, ...body);
  const el = h('section.ad-card', { id, class: cls }, head, inner);
  const set = on => { el.classList.toggle('is-shut', !on); head.setAttribute('aria-expanded', String(on)); inner.hidden = !on; try { localStorage.setItem(openKey(id), on ? '1' : '0'); } catch { /* fine */ } };
  head.addEventListener('click', () => set(el.classList.contains('is-shut')));
  set(isOpen(id, dflt));
  const c = { id, title, el, set, count: t => { count.textContent = t == null ? '' : String(t); } };
  CARDS.push(c);
  return el;
}
const cardOf = id => CARDS.find(c => c.id === id);
function jumpBar() {
  return h('nav.ad-jump', { 'aria-label': 'Cards' }, ...CARDS.map(c => h('button.ad-jump-b', { type: 'button', onclick: () => { c.set(true); c.el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }, c.title)));
}
/** a log card's tools: the filter box + Refresh + Clear all */
function logTools(id, onFilter, onRefresh, clearAll) {
  return h('div.ad-row.ad-logtools',
    h('input.input.ad-filter', { type: 'search', placeholder: 'Filter', 'aria-label': 'Filter', autocomplete: 'off', oninput: e => onFilter(e.target.value) }),
    h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: onRefresh }, 'Refresh'), clearAll);
}

function shell() {
  CARDS.length = 0;
  const q = h('input.input.ad-q', { type: 'search', placeholder: 'Name, Name#1234 or profile id', autocomplete: 'off', onkeydown: e => { if (e.key === 'Enter') search(q.value); } });
  const grid = h('div.ad-grid',
    card('ad-live', 'Live now', { cls: 'ad-live' }, h('div', { id: 'ad-live-b2' }, h('p.ad-dim', 'Loading…'))),
    card('ad-stats', 'Stats', { cls: 'ad-stats', open: false }, h('div', { id: 'ad-stats-b2' })),
    card('ad-search', 'Players', { cls: 'ad-search' },
      h('div.ad-row', q, h('button.btn.btn-primary.btn-sm.ad-btn', { type: 'button', onclick: () => search(q.value) }, 'Search')),
      h('div.ad-results', { id: 'ad-results' }, h('p.ad-dim', 'Search by name to start.'))),
    card('ad-player', 'Player', { cls: 'ad-player' }, h('div', { id: 'ad-player-b2' }, h('p.ad-dim', 'Pick a player.'))),
    card('reports', 'Board reports', { cls: 'ad-errors' },
      h('div.ad-row', h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: flags }, 'Refresh'),
        confirmBtn('Dismiss all', async () => { renderFlags((await call('clearFlag')).flags); toast('Dismissed'); audit(); }, 'is-danger')),
      h('p.ad-dim', 'REPORT on THE BOARD (anyone, no sign-in; limited per device + IP). The public sees the player’s username (a rude one as a house nickname) — never an id or key. OPEN the player to hide them from every board.'),
      h('ol.ad-errs', { id: 'ad-flags' }, h('li.ad-dim', 'Loading…'))),
    card('ad-errors', 'Errors from phones', { cls: 'ad-errors', open: false },
      logTools('ad-errors', v => { logs.errQ = v; paintErrors(); }, errors, confirmBtn('Clear all', async () => { renderErrors((await call('clearErrors')).errors); toast('Cleared'); audit(); }, 'is-danger')),
      h('p.ad-dim', 'Code errors on players’ screens — one row per kind (the message), with its count + first / last seen; tap a row for each place it happened. MARK SEEN resets the “new” count. Quiet for 30 days → removed.'),
      h('ol.ad-errs', { id: 'ad-errs' }, h('li.ad-dim', 'Loading…'))),
    card('ad-reports', 'Reports from phones', { cls: 'ad-errors', open: false },
      logTools('ad-reports', v => { logs.repQ = v; paintReports(); }, reports, confirmBtn('Clear all', async () => { renderReports((await call('clearReports')).reports); toast('Cleared'); audit(); }, 'is-danger')),
      h('p.ad-dim', 'City 2.0 snapshots, one row per kind: SEND REPORT in the &debug=1 strip (TAP), or sent by the page itself when it froze (HANG — the main thread stopped answering; STALL — no frames), BENCH. Newest 40 kept.'),
      h('ol.ad-errs', { id: 'ad-reps' }, h('li.ad-dim', 'Loading…'))),
    // LOBBY FIXES → THE SPEED PASS — TEST PLAYERS, ALL OF THEM: CREATED SINCE (default the very first profile) → review the pre-ticks → PREVIEW → CONFIRM
    card('ad-tp', 'Test players', { cls: 'ad-tp', open: false },
      h('div.ad-row.ad-tp-since', h('label.ad-dim', { for: 'ad-tp-date' }, 'Created since'), h('input.input.ad-tp-date', { id: 'ad-tp-date', type: 'date', onchange: () => { tpTicked.clear(); tpSeeded = false; testPlayers(); } }),
        h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: () => { const d = document.getElementById('ad-tp-date'); d.value = ''; tpTicked.clear(); tpSeeded = false; testPlayers(); } }, 'From the first'),
        h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: () => testPlayers() }, 'Refresh')),
      h('p.ad-dim', 'Every profile made since the date (default: the very first). PRE-TICKED = looks like a test (two of: 0 nights played · a test-ish name · made in a test burst) — review them; nothing is ever removed without CONFIRM. Never pre-ticked: an admin, TESTER#2599, anyone who played on 2+ nights. Their card, items, key, tag + board entries go. Member numbers never move and are never re-used: the counter only rolls back when every number above the new top is going.'),
      h('div.ad-tp-list', { id: 'ad-tp-list' }, h('p.ad-dim', 'Loading…')),
      h('div.ad-tp-out', { id: 'ad-tp-out' })),
    // THE SPEED PASS add-on — THE PROGRESS RESET (api/_lib/reset.js): PREVIEW → type RESET → a two-tap CONFIRM; a backup first, FOUNDING
    // MEMBER first, everyone keeps every item; REPEATABLE (now + at THE SWITCH-OVER); the backups below, each restorable (type RESTORE)
    card('ad-reset', 'Progress reset', { cls: 'ad-reset', open: false },
      h('p.ad-dim', 'Resets EVERY profile’s progress: XP (back to level 1), the rank, streaks (the freezes held stay), weekly goals, achievements, mastery counters, THE BOARD’s records + boards. KEEPS: the profile, its key, name + tag, colour, emblem, MEMBER Nº, FOUNDING MEMBER (stamped on everyone who qualifies FIRST), every card / emblem / finish / glow they own (dev + gift 1-of-1s too), the equipped card. A backup is written first. Repeatable.'),
      h('div.ad-row', h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: resetPreview }, 'Preview')),
      h('div.ad-reset-out', { id: 'ad-reset-out' }),
      h('h3', 'Backups'),
      h('div.ad-reset-bk', { id: 'ad-reset-bk' }, h('p.ad-dim', 'Loading…'))),
    // DM2 — THE DAILIES (owner only — the server checks): THE GO-LIVE SWITCH (a second tap flips it) + THE RESEED (DM2 ADD-ON: server-side —
    // PREVIEW shows the plan, nothing written; RESEED NOW on a second tap: a fresh daily secret from the next 4 am, today + the past untouched)
    card('ad-dailies', 'The dailies', { cls: 'ad-dailies' },
      h('p.ad-dim', 'THE GO-LIVE SWITCH turns every daily on or off for everyone, at once (any time). RESEED gives the dailies a fresh secret from the next 4 am Eastern — run it when the repo goes private (preview first; today’s run and every past result stay as they are).'),
      h('div.ad-row', { id: 'ad-dly-row' }, h('span.ad-dim', 'Loading…')),
      h('div.ad-dly-out', { id: 'ad-dly-out' })),
    // PROGRESSION A — THE OUTAGE BUTTON: a day the site was down breaks nobody's streak (audited; the streak day turns at 4 am Eastern)
    card('ad-outage', 'Streak outage', { cls: 'ad-outage' },
      h('p.ad-dim', 'The site was down? Mark the day: nobody’s streak breaks over it (no freeze used, no day added). The streak day turns at 4 am Eastern.'),
      h('div.ad-row', { id: 'ad-outage-row' }, h('span.ad-dim', 'Loading…'))),
    // SHELL 2.0 B2 — THE GIFT TOOL (api/_lib/gifts.js): a 1-of-1 card → a player's name tag → GIVE (the second tap confirms). Server-granted,
    // equipped, audited; ONE PROFILE EVER — a card that belongs to anyone can't be given again. The owner's own card is never listed.
    card('ad-gifts', 'Gifts', { cls: 'ad-gifts', open: false },
      h('p.ad-dim', 'Give a 1-of-1 card. Pick it, type the player’s name tag (NAME#1234), GIVE — then tap again to confirm. It goes onto their card at once (equipped); their next visit shows “A gift from the house”. A gift card belongs to ONE player, ever — it can’t be given twice or taken back here.'),
      h('div.ad-gift-list', { id: 'ad-gift-list' }, h('p.ad-dim', 'Loading…')),
      h('div.ad-gift-prev', { id: 'ad-gift-prev' }),
      h('div.ad-row.ad-gift-give', h('input.input.ad-gift-tag', { id: 'ad-gift-tag', type: 'text', placeholder: 'NAME#1234', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'The player’s name tag' }),
        tubeButton('GIVE', { kind: 'main', size: 'sm', cls: 'ad-btn ad-gift-go', confirm: 'TAP AGAIN TO GIVE', onClick: giveGift }))),
    card('ad-audit', 'Audit log', { cls: 'ad-audit', open: false }, h('div.ad-row', h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: audit }, 'Refresh')), h('ol.ad-log', { id: 'ad-log' })));
  app.replaceChildren(
    h('header.ad-head', h('div', h('div.ad-kicker', 'NEON SPEAKEASY'), h('h1', 'Admin')), h('div.ad-head-links', h('a.ad-link', { href: '/lab' }, 'The Card Lab ›'), ' ', h('a.ad-link', { href: '/board' }, 'The Board ›'))),
    jumpBar(),
    grid);
  audit();
  outages();
  dailies();
  errors();
  reports();
  flags();
  testPlayers();
  backups();
  gifts();
  loadStats();
  // "live now" keeps itself current while the page is open and visible (the server caches it for 30 s)
  setInterval(() => { if (document.visibilityState === 'visible') loadStats(false, true); }, 30_000);
}

async function search(text) {
  const box = document.getElementById('ad-results');
  box.replaceChildren(h('p.ad-dim', 'Searching…'));
  const { players } = await call('search', { q: text });
  box.replaceChildren(...(players.length ? players.map(p => h('button.ad-hit', { type: 'button', onclick: () => open(p.pid) },
    avatar(p.a, p.c, 28), h('span.ad-hit-n', p.n, h('small', fmtTag(p.t))), emblem(p.r, 18), p.h ? h('span.ad-tag.is-hidden', 'HIDDEN') : null, isOffensive(p.n) ? h('span.ad-tag.is-bad', 'NAME') : null)) : [h('p.ad-dim', 'No one by that name.')]));
}

async function open(pid) {
  current = pid;
  { const c = cardOf('ad-player'); if (c) { c.set(true); c.el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }
  render(await call('player', { pid }));
}

function render(v) {
  const box = document.getElementById('ad-player-b2');
  const p = v.profile;
  const name = h('input.input', { value: p.n, maxLength: 12, 'aria-label': 'New name' });
  const boards = v.boards.slice().sort((a, b) => (a.game + a.b).localeCompare(b.game + b.b));
  box.replaceChildren(
    h('div.ad-who', avatar(p.a, p.c, 46), h('div', h('div.ad-who-n', p.n, h('small', fmtTag(p.t))), h('div.ad-dim', `${levelLabel(p.x || 0)} · ${(p.x || 0).toLocaleString()} XP · ${p.pid}`)), emblem(p.r, 40)),
    h('div.ad-flags',
      v.priv.shown ? h('span.ad-tag', 'SHOWN') : h('span.ad-tag.is-hidden', 'OPTED OUT'),
      v.priv.banned ? h('span.ad-tag.is-bad', 'HIDDEN BY ADMIN') : null,
      isOffensive(p.n) ? h('span.ad-tag.is-bad', 'OFFENSIVE NAME') : null,
      p.bid ? h('span.ad-tag', `ON THE BOARD AS ${(isOffensive(p.n) ? houseNick(p.bid).n : p.n).toUpperCase()}${(p.m || 0) < (p.mm || 3) ? ` · ${p.m || 0}/${p.mm || 3} MATCHES — NOT LISTED YET` : ''}`) : null),
    h('h3', 'Rename'),
    h('div.ad-row', name, h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: async () => { render(await call('rename', { pid: p.pid, name: name.value })); toast('Renamed'); audit(); } }, 'Rename')),
    h('h3', 'Visibility'),
    h('div.ad-row', v.priv.banned
      ? confirmBtn('Return to the boards', async () => { render(await call('hide', { pid: p.pid, on: false })); toast('Back on the boards'); audit(); })
      : confirmBtn('Hide from every board', async () => { render(await call('hide', { pid: p.pid, on: true })); toast('Hidden'); audit(); }, 'is-danger')),
    h('h3', 'Boards'),
    boards.length ? h('div.ad-boards', ...boards.map(b => {
      const def = boardDef(b.b);
      return h('div.ad-board',
        h('div.ad-board-h', h('b', `${gameName(b.game)} · ${def ? def.label : b.b}`), h('code', b.b)),
        h('div.ad-board-v',
          h('span', 'ALL TIME ', h('b', b.all ? fmtValue(def, b.all.v) : '—'), b.all && b.all.rank ? ` #${b.all.rank}` : ''),
          h('span', 'THIS WEEK ', h('b', b.week ? fmtValue(def, b.week.v) : '—'), b.week && b.week.rank ? ` #${b.week.rank}` : '')),
        h('div.ad-row',
          def && def.kind === 'record' ? confirmBtn('Remove all-time', async () => { render(await call('removeRecord', { pid: p.pid, b: b.b, p: 'all' })); audit(); }) : null,
          def && def.kind === 'record' ? confirmBtn('Remove this week', async () => { render(await call('removeRecord', { pid: p.pid, b: b.b, p: 'week' })); audit(); }) : null,
          confirmBtn(def && def.kind === 'record' ? 'Remove both' : 'Reset this board', async () => { render(await call(def && def.kind === 'record' ? 'removeRecord' : 'resetBoard', { pid: p.pid, b: b.b })); audit(); }, 'is-danger')));
    })) : h('p.ad-dim', 'Not on any board.'),
    h('h3', 'Games'),
    h('div.ad-games', ...Object.entries(v.stats.g || {}).map(([g, s]) => h('span', h('b', gameName(g)), ` ${s.p || 0} played · ${s.w || 0} won`))));
}

// ---------------------------------------------------------------- LOBBY FIXES — REMOVE TEST PLAYERS
const TP_ALSO = ['TESTER#2599'];
const tpTicked = new Set();
let tpSeeded = false;
const ymd = ms => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
async function testPlayers() {
  const box = document.getElementById('ad-tp-list'), out = document.getElementById('ad-tp-out'), dIn = document.getElementById('ad-tp-date');
  if (!box) return;
  out.replaceChildren();
  const since = dIn && dIn.value ? new Date(`${dIn.value}T00:00:00`).getTime() : 0;
  const { players, next, first, total } = await call('testPlayers', { since, also: TP_ALSO });
  if (dIn && !dIn.value && first) dIn.value = ymd(first);   // (the default shown: the very first profile's day)
  // (the server's pre-tick seeds the ticks once per list — the owner reviews + changes them; nothing goes without CONFIRM)
  if (!tpSeeded) { tpSeeded = true; for (const p of players) if (p.pre && !p.admin) tpTicked.add(p.pid); }
  { const c = cardOf('ad-tp'); if (c) c.count(`${total ?? players.length} · ${players.filter(p => tpTicked.has(p.pid)).length} ticked`); }
  const row = p => {
    const cb = h('input.ad-tp-cb', { type: 'checkbox', checked: tpTicked.has(p.pid), disabled: p.admin, 'aria-label': `Remove ${p.n}#${p.t}`, onchange: () => { if (cb.checked) tpTicked.add(p.pid); else tpTicked.delete(p.pid); out.replaceChildren(); const c = cardOf('ad-tp'); if (c) c.count(`${total ?? players.length} · ${tpTicked.size} ticked`); } });
    return h('label.ad-tp-row', { dataset: { pid: p.pid }, class: p.pre ? 'is-pre' : '' }, cb,
      h('span.ad-tp-n', p.n, h('small', fmtTag(p.t))),
      h('span.ad-tp-v', p.mn ? `Nº ${String(p.mn).padStart(4, '0')}` : 'no Nº'),
      h('span.ad-tp-v', `${p.m || 0} match${p.m === 1 ? '' : 'es'} · ${p.nights || 0} night${p.nights === 1 ? '' : 's'}`),
      h('span.ad-tp-v.ad-dim', `made ${p.at ? when(p.at) : '—'}`),
      h('span.ad-tp-v.ad-dim', `seen ${p.last ? when(p.last) : '—'}`),
      p.admin ? h('span.ad-tag', 'ADMIN') : null,
      ...(p.why || []).map(w => h('span.ad-tag.is-why', w)));
  };
  box.replaceChildren(...(players.length ? players.map(row) : [h('p.ad-dim', 'No profiles since then.')]),
    h('div.ad-row', h('span.ad-dim', `Member counter: next Nº ${next || '—'}`), h('button.btn.btn-primary.btn-sm.ad-btn', { type: 'button', onclick: tpPreview }, 'Preview removal')));
}
async function tpPreview() {
  const out = document.getElementById('ad-tp-out');
  const pids = [...tpTicked];
  if (!pids.length) { toast('Tick at least one', 'err'); return; }
  const dry = await call('removeTestPlayers', { pids });
  const c = dry.counter, moves = c.to !== c.from;
  out.replaceChildren(h('div.ad-tp-dry',
    h('b', `Removes ${dry.remove.length}: `), dry.remove.map(r => `${r.n}${fmtTag(r.t)}${r.mn ? ` (Nº ${r.mn})` : ''}`).join(', '),
    h('p.ad-dim', moves ? `The member counter rolls back: next Nº ${c.from} → ${c.to}.` : `The member counter stays at ${c.from || '—'} (a number above stays taken or was already a gap — numbers are never re-used).`),
    confirmBtn(`Confirm — remove ${dry.remove.length}`, async () => {
      const r = await call('removeTestPlayers', { pids, confirm: true });
      tpTicked.clear();
      toast(`Removed ${r.remove.length}`);
      testPlayers(); audit();
    }, 'is-danger')));
}

// ---------------------------------------------------------------- SHELL 2.0 B2 — THE GIFT TOOL
let giftPick = null, giftPrev = null;
async function gifts(r) {
  const box = document.getElementById('ad-gift-list'); if (!box) return;
  const { gifts: list } = r || await call('giftList');
  const free = list.filter(g => !g.given).length;
  { const c = cardOf('ad-gifts'); if (c) c.count(`${free} to give · ${list.length - free} given`); }
  if (!giftPick || !list.some(g => g.id === giftPick && !g.given)) giftPick = (list.find(g => !g.given) || {}).id || null;
  box.replaceChildren(...list.map(g => h('label.ad-gift-row', { dataset: { id: g.id }, class: `${g.given ? 'is-given' : ''}${g.id === giftPick ? ' is-on' : ''}` },
    h('input', { type: 'radio', name: 'ad-gift', value: g.id, checked: g.id === giftPick, disabled: !!g.given, onchange: () => { giftPick = g.id; gifts({ gifts: list }); } }),
    h('b', g.name), g.given ? h('span.ad-tag', `GIVEN · ${g.given.who} · ${when(g.given.at)}`) : h('span.ad-tag.is-free', 'FREE'))));
  // the picked card's slim strip, live (its art + motion — the vault's own strip on one surface)
  const prev = document.getElementById('ad-gift-prev');
  if (prev && giftPick && (!giftPrev || giftPrev.id !== giftPick)) {
    if (giftPrev) giftPrev.m.destroy();
    const S = await import('../vault/strip.js'); await S.vaultSheet();
    prev.replaceChildren(); const host = h('div.ad-gift-strip'); prev.append(host);
    giftPrev = { id: giftPick, m: S.mountStrips(host, [{ card: giftPick, name: 'PREVIEW', lv: 1 }]) };
  }
}
async function giveGift() {
  const tag = (document.getElementById('ad-gift-tag') || {}).value || '';
  if (!giftPick) { toast('Pick a card', 'err'); return; }
  if (!/#\s*\d{4}\s*$/.test(tag)) { toast('Type a name tag like MIKE#4821', 'err'); return; }
  const r = await call('giftGive', { card: giftPick, tag });
  toast(`${r.gift.name} is ${r.gift.who}’s now`, 'ok', { sub: 'Equipped — their next visit shows the gift.' });
  document.getElementById('ad-gift-tag').value = '';
  giftPick = null; gifts(r); audit();
}

// ---------------------------------------------------------------- THE SPEED PASS add-on — THE PROGRESS RESET
async function resetPreview() {
  const out = document.getElementById('ad-reset-out');
  const dry = await call('progressReset');
  const typed = h('input.input.ad-typed', { type: 'text', placeholder: 'Type RESET', autocomplete: 'off', autocapitalize: 'characters', spellcheck: false, 'aria-label': 'Type RESET to confirm' });
  out.replaceChildren(h('div.ad-tp-dry',
    h('b', dry.line),
    h('p.ad-dim', 'A backup of everyone’s progress is written first (restorable below). Type RESET, then tap twice.'),
    h('div.ad-row', typed, confirmBtn('Reset everyone’s progress', async () => {
      if (typed.value.trim() !== 'RESET') { toast('Type RESET first', 'err'); return; }
      const r = await call('progressReset', { confirm: true, typed: 'RESET' });
      out.replaceChildren(h('p', h('b', 'Done. '), `${r.line}. Backup ${r.stamp}; ${r.founders} FOUNDING MEMBER card${r.founders === 1 ? '' : 's'} given first.`));
      toast('Progress reset'); backups(); audit(); loadStats(true);
    }, 'is-danger'))));
}
async function backups() {
  const box = document.getElementById('ad-reset-bk');
  if (!box) return;
  const { backups: list } = await call('progressBackups');
  { const c = cardOf('ad-reset'); if (c) c.count(list.length ? `${list.length} backup${list.length === 1 ? '' : 's'}` : ''); }
  box.replaceChildren(...(list.length ? list.map(b => {
    const typed = h('input.input.ad-typed', { type: 'text', placeholder: 'Type RESTORE', autocomplete: 'off', autocapitalize: 'characters', spellcheck: false, 'aria-label': 'Type RESTORE to confirm' });
    return h('div.ad-tp-row.ad-bk-row', h('span.ad-tp-n', when(b.at), h('small', `${b.profiles} profiles · ${b.stamp}`)), typed,
      confirmBtn('Restore', async () => {
        if (typed.value.trim() !== 'RESTORE') { toast('Type RESTORE first', 'err'); return; }
        const r = await call('progressRestore', { stamp: b.stamp, confirm: true, typed: 'RESTORE' });
        toast(`Restored ${r.profiles} profiles`); audit(); loadStats(true);
      }, 'is-danger'));
  }) : [h('p.ad-dim', 'No backups yet — the first reset writes one.')]));
}

async function audit() {
  const box = document.getElementById('ad-log');
  if (!box) return;
  const { log, names } = await call('audit', { limit: 80 });
  { const c = cardOf('ad-audit'); if (c) c.count(log.length ? `${log.length} latest` : '0'); }
  box.replaceChildren(...(log.length ? log.map(l => h('li',
    h('span.ad-when', when(l.at)),
    h('b', l.act),
    h('button.ad-linkbtn', { type: 'button', onclick: () => l.pid && open(l.pid) }, names[l.pid] || l.pid || ''),
    h('span.ad-dim', [l.b, l.p, l.from && `${l.from} → ${l.to}`].filter(Boolean).join(' · ')),
    h('span.ad-dim', `by ${names[l.by] || l.by}`))) : [h('li.ad-dim', 'Nothing yet.')]));
}

// ---------------------------------------------------------------- STATS (js/core/insights.js)
const light = id => (GAME_LIGHT[id] || ['#f2c869'])[0];
const ago = ms => { const m = Math.round(ms / 60_000); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };
const PHASE = { play: 'playing', intro: 'starting', final: 'podium', lobby: 'in the lobby' };
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const view = { games: '30', players: 'all' };   // opens on views that aren't empty on a Monday morning
let S = null;

async function loadStats(fresh = false, quiet = false) {
  try {
    S = await (quiet ? api('admin', { action: 'stats' }) : call('stats', { fresh }));
    renderLive();
    if (!quiet) renderStats();
  } catch { /* the toast said so (or a quiet refresh failed: try again in 30 s) */ }
}

function big(n, label, sub) {
  return h('div.ad-big', h('b', String(n)), h('span', label), sub ? h('small', sub) : null);
}

function renderLive() {
  const box = document.getElementById('ad-live-b2');
  if (!box || !S) return;
  const L = S.live;
  const inGame = Object.values(L.playing).reduce((a, b) => a + b, 0);
  box.replaceChildren(
    h('div.ad-row.ad-between', h('span', h('i.ad-dot', { class: L.online ? 'is-on' : '' }), h('span.ad-dim', L.online ? 'people in rooms' : 'quiet')),
      h('div.ad-row', h('span.ad-dim', `updated ${new Date(S.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}`),
        h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: () => loadStats(true) }, 'Refresh'))),
    h('div.ad-bigs', big(L.online, 'players in rooms'), big(L.rooms, 'rooms open'), big(inGame, 'games in progress')),
    L.list.length ? h('ul.ad-rooms', ...L.list.map(r => h('li', { style: { '--c': r.game ? light(r.game) : 'rgba(255,240,220,0.35)' } },
      h('b', r.game ? gameName(r.game) : 'Lobby'),
      h('span', r.game ? PHASE[r.phase] || r.phase || '' : 'picking a game'),
      h('span', `${r.online} online${r.players > r.online ? ` · ${r.players - r.online} away` : ''}`),
      h('span.ad-dim', `open ${ago(r.age)}`)))) : h('p.ad-dim', 'No one is in a room right now.'),
    h('p.ad-note', 'Counts people in rooms (the title screen has no connection, so visitors who never host or join aren’t seen).'));
}

function tabs(key, opts, rerender) {
  return h('div.ad-tabs', ...opts.map(([v, label]) => h('button.ad-tab', { type: 'button', class: view[key] === v ? 'is-on' : '', onclick: () => { view[key] = v; rerender(); } }, label)));
}

function gamesBlock() {
  const G = S.games;
  const src = view.games === 'today' ? (G.today || {}) : view.games === 'week' ? G.week : view.games === '30' ? G.last30 : G.all;
  const rows = GAMES.map(g => ({ id: g.id, n: src[g.id] || 0 })).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...rows.map(r => r.n));
  const total = rows.reduce((a, r) => a + r.n, 0);
  return h('div.ad-block',
    h('div.ad-row.ad-between', h('h3', 'Games played'), tabs('games', [['today', 'Today'], ['week', 'This week'], ['30', '30 days'], ['all', 'All time']], renderStats)),
    h('ol.ad-bars', ...rows.map((r, i) => h('li', { style: { '--c': light(r.id), '--w': `${(r.n / max) * 100}%` } },
      h('span.ad-bar-n', `${i + 1}`),
      h('span.ad-bar-name', gameName(r.id)),
      h('span.ad-bar', h('i')),
      h('b', String(r.n)),
      h('small', G.avgPlayers[r.id] ? `${G.avgPlayers[r.id]} avg players` : '')))),
    h('p.ad-note', `${total} matches · counted when the server verifies a finished match`));
}

function dailyBlock() {
  const D = S.games.daily;
  const max = Math.max(1, ...D.map(d => d.n));
  const label = k => { const d = new Date(Date.UTC(+k.slice(1, 5), +k.slice(5, 7) - 1, +k.slice(7, 9))); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };
  return h('div.ad-block',
    h('h3', 'Matches per day · last 30 days'),
    h('div.ad-cols', ...D.map((d, i) => h('div.ad-col', { title: `${label(d.k)}: ${d.n}`, style: { '--h': `${(d.n / max) * 100}%` } },
      h('i'), h('small', i % 5 === 4 || i === D.length - 1 ? label(d.k) : '')))));
}

function playersBlock() {
  const P = S.players;
  const list = view.players === 'today' ? (P.topToday || []) : view.players === 'week' ? P.topWeek : view.players === 'all' ? P.topAll : P.topXp;
  const empty = { today: 'No matches yet today.', week: 'No matches yet this week.', all: 'No matches yet.', xp: 'No XP yet.' }[view.players];
  return h('div.ad-block',
    h('div.ad-row.ad-between', h('h3', 'Most active players'), tabs('players', [['today', 'Today'], ['week', 'This week'], ['all', 'All time'], ['xp', 'XP']], renderStats)),
    list.length ? h('ol.ad-top', ...list.map((p, i) => h('li',
      h('span.ad-bar-n', String(i + 1)),
      avatar(p.a, p.c, 26),
      h('button.ad-linkbtn', { type: 'button', onclick: () => open(p.pid) }, p.n, h('small', p.t ? fmtTag(p.t) : '')),
      emblem(p.r, 18),
      p.h ? h('span.ad-tag.is-hidden', 'HIDDEN') : null,
      h('b', view.players === 'xp' ? `${p.x.toLocaleString()} XP` : `${p.n_matches} ${p.n_matches === 1 ? 'match' : 'matches'}`)))) : h('p.ad-dim', empty));
}

function growthBlock() {
  const P = S.players, T = S.totals;
  const max = Math.max(1, ...P.newByWeek.map(w => w.n));
  const wl = k => `${+k.slice(5, 7)}/${+k.slice(7, 9)}`;
  return h('div.ad-block',
    h('h3', 'Players'),
    h('div.ad-bigs.is-small',
      big(S.today ? S.today.players : 0, 'played today', S.today ? `${S.today.matches} ${S.today.matches === 1 ? 'match' : 'matches'} today` : null),
      big(P.activeWeek, 'played this week', P.activeWeek ? `${P.returningWeek} came back from an earlier week` : null),
      big(T.played, 'have played', `${T.multiNight} on more than one night`),
      big(T.players, 'profiles')),
    h('div.ad-subh', 'New players per week'),
    h('div.ad-cols.is-weeks', ...P.newByWeek.map(w => h('div.ad-col', { title: `week of ${wl(w.wk)}: ${w.n}`, style: { '--h': `${(w.n / max) * 100}%` } },
      h('i'), h('em', String(w.n)), h('small', wl(w.wk))))));
}

function timesBlock() {
  const T = S.times;
  const hours = [0, 6, 12, 18];
  return h('div.ad-block.ad-wide',
    h('h3', `Busiest times · last ${T.days} days · Eastern`),
    h('div.ad-heat',
      h('span'), ...Array.from({ length: 24 }, (_, hr) => h('small.ad-heat-h', hours.includes(hr) ? ['12a', '6a', '12p', '6p'][hours.indexOf(hr)] : '')),
      ...T.grid.flatMap((row, d) => [h('small.ad-heat-d', DOW[d]), ...row.map((n, hr) => h('i', { title: `${DOW[d]} ${hr}:00 — ${n} ${n === 1 ? 'match' : 'matches'}`, style: { '--a': T.max ? (n ? 0.15 + 0.85 * (n / T.max) : 0) : 0 } }))])),
    h('p.ad-note', 'Each square is an hour; brighter = more matches finished then.'));
}

function renderStats() {
  const box = document.getElementById('ad-stats-b2');
  if (!box || !S) return;
  { const c = cardOf('ad-stats'); if (c) c.count(`${S.totals.matches.toLocaleString()} matches`); }
  box.replaceChildren(
    h('div.ad-stats-grid', gamesBlock(), playersBlock(), dailyBlock(), growthBlock(), timesBlock()));
}

// THE OUTAGE: today + the 6 days before, each a toggle (a second tap confirms)
/** DM2 — THE DAILIES card: the switch's state + ON / OFF + RESEED (preview → confirm) */
async function dailies(st) {
  const row = document.getElementById('ad-dly-row'), out = document.getElementById('ad-dly-out');
  if (!row) return;
  try {
    st ||= (await call('dailyState')).dailies;
    const on = !!(st && st.on);
    const lines = r => h('ul.ad-dly-steps', ...(r.steps || []).map(s => h('li', s)));
    row.replaceChildren(
      h('b.ad-dly-state', on ? 'DAILIES: ON' : 'DAILIES: OFF'),
      confirmBtn(on ? 'SWITCH OFF' : 'SWITCH ON', async () => { const r = await call('dailySwitch', { on: !on }); toast(on ? 'The dailies are OFF' : 'The dailies are ON'); dailies(r.dailies); audit(); }, on ? '' : 'is-primary'),
      tubeButton('RESEED · PREVIEW', { kind: 'secondary', size: 'sm', cls: 'ad-btn', onClick: async () => {
        const r = (await call('dailyReseed', {})).reseed;
        out.replaceChildren(h('p.ad-dim', r.dryRun ? 'THE PLAN (nothing written yet):' : 'Nothing to do:'), lines(r),
          r.dryRun ? confirmBtn('RESEED NOW', async () => { const x = (await call('dailyReseed', { confirm: true })).reseed; out.replaceChildren(h('p.ad-dim', x.changed ? `DONE — the new days start ${x.from} at 4 am Eastern (today untouched).` : 'Nothing changed.'), lines(x)); toast(x.changed ? 'Reseeded' : 'Nothing changed'); audit(); }, 'is-danger') : null);
      } }));
  } catch (e) { row.replaceChildren(h('span.ad-dim', `Couldn’t load (${e.message || e})`)); }
}
async function outages(r) {
  const row = document.getElementById('ad-outage-row');
  if (!row) return;
  try {
    r ||= await call('outages');
    const { dayNum, dayOf } = await import('../core/streak.js');
    const T = dayNum(r.today), on = r.outage || {};
    row.replaceChildren(...Array.from({ length: 7 }, (_, i) => {
      const d = dayOf(T - i), lit = !!on[d];
      const lab = `${i === 0 ? 'TODAY' : i === 1 ? 'YESTERDAY' : d.slice(5, 7) + '/' + d.slice(7)}${lit ? ' · OUTAGE' : ''}`;
      return confirmBtn(lab, async () => { outages({ ...(await call('outage', { day: d, on: !lit })), today: r.today }); toast(lit ? 'Outage removed' : 'Outage marked — no streak breaks'); audit(); }, lit ? 'is-primary' : '');
    }));
  } catch (e) { row.replaceChildren(h('span.ad-dim', `Couldn’t load (${e.message || e})`)); }
}

// THE GROUPED LOGS (js/admin/groups.js): one row per kind — its count, "N new" since MARK SEEN, first / last seen; a tap opens its entries
const logs = { err: [], rep: [], errQ: '', repQ: '', openErr: new Set(), openRep: new Set() };
async function errors() {
  if (!document.getElementById('ad-errs')) return;
  renderErrors((await call('errors')).errors);
}
const counts = o => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ');
function renderErrors(list) { logs.err = list || []; paintErrors(); }
function groupRow({ g, open, onToggle, meta, items, onSeen, onClear }) {
  const body = h('div.ad-grp-b', { hidden: !open }, ...(open ? items() : []));
  return h('li.ad-err.ad-grp', { class: g.newN ? 'is-new' : '' },
    h('div.ad-err-top',
      h('b.ad-err-n', `×${g.n}`),
      h('button.ad-err-m', { type: 'button', 'aria-expanded': String(open), onclick: onToggle }, g.title, g.newN ? h('span.ad-new', `${g.newN} new`) : null),
      g.newN ? h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: onSeen }, 'Mark seen') : null,
      confirmBtn('Clear', onClear)),
    h('div.ad-err-meta', ...meta),
    body);
}
function paintErrors() {
  const box = document.getElementById('ad-errs');
  if (!box) return;
  const all = groupErrors(logs.err), groups = filterGroups(all, logs.errQ);
  { const c = cardOf('ad-errors'); if (c) c.count(all.length ? countLine(all) : '0'); }
  box.replaceChildren(...(groups.length ? groups.map(g => groupRow({
    g, open: logs.openErr.has(g.key),
    onToggle: () => { if (logs.openErr.has(g.key)) logs.openErr.delete(g.key); else logs.openErr.add(g.key); paintErrors(); },
    meta: [h('span', `${g.items.length} place${g.items.length === 1 ? '' : 's'}`), h('span', `last ${when(g.last)}`), g.n > 1 ? h('span', `first ${when(g.first)}`) : null, h('span', counts(g.items.reduce((o, e) => { for (const [k, n] of Object.entries(e.d || {})) o[k] = (o[k] || 0) + n; return o; }, {})))],
    items: () => g.items.map(e => {
      const stack = e.k ? h('pre.ad-stack', e.k) : null;
      if (stack) stack.hidden = true;
      return h('div.ad-inst',
        h('div.ad-err-meta.ad-inst-meta',
          h('b', `×${e.n}`),
          h('button.ad-linkbtn', { type: 'button', title: 'Show the stack', onclick: () => { if (stack) stack.hidden = !stack.hidden; } }, h('code', `${e.s || '?'}${e.l ? `:${e.l}` : ''}`)),
          e.w ? h('span', e.w) : null, h('span', counts(e.d)), h('span', counts(e.b)), h('span', `last ${when(e.last)}`), e.v ? h('span', `build ${e.v}`) : null, e.p === 'board' ? h('span', '/board') : null),
        stack);
    }),
    onSeen: async () => { const r = await call('seenLogs', { sigs: g.items.map(e => e.sig) }); renderErrors(r.errors); toast('Marked seen'); audit(); },
    onClear: async () => { renderErrors((await call('clearErrors', { sigs: g.items.map(e => e.sig) })).errors); audit(); },
  })) : [h('li.ad-dim', logs.err.length ? 'Nothing matches the filter.' : 'No errors reported. 🎉')]));
}

async function reports() {
  if (!document.getElementById('ad-reps')) return;
  renderReports((await call('reports')).reports);
}
function renderReports(list) { logs.rep = list || []; paintReports(); }
function paintReports() {
  const box = document.getElementById('ad-reps');
  if (!box) return;
  const all = groupReports(logs.rep), groups = filterGroups(all, logs.repQ);
  { const c = cardOf('ad-reports'); if (c) c.count(all.length ? countLine(all) : '0'); }
  box.replaceChildren(...(groups.length ? groups.map(g => groupRow({
    g, open: logs.openRep.has(g.key),
    onToggle: () => { if (logs.openRep.has(g.key)) logs.openRep.delete(g.key); else logs.openRep.add(g.key); paintReports(); },
    meta: [h('span', `last ${when(g.last)}`), g.n > 1 ? h('span', `first ${when(g.first)}`) : null],
    items: () => g.items.map((r, i) => {
      const body = h('pre.ad-stack.ad-rep', r.text);
      body.hidden = i > 0;   // (the newest open, the rest folded)
      return h('div.ad-inst',
        h('div.ad-err-top',
          h('button.ad-err-m', { type: 'button', title: 'Show / hide', onclick: () => { body.hidden = !body.hidden; } }, `${when(r.at)} · ${r.d || '?'} ${r.b || ''}`, r.seen ? null : h('span.ad-new', 'new')),
          confirmBtn('Clear', async () => { renderReports((await call('clearReports', { id: r.id })).reports); audit(); })),
        h('div.ad-err-meta', r.v ? h('span', `build ${r.v}`) : null, h('span', r.ua || '')),
        body);
    }),
    onSeen: async () => { const r = await call('seenLogs', { ids: g.items.map(x => x.id) }); renderReports(r.reports); toast('Marked seen'); audit(); },
    onClear: async () => { renderReports((await call('clearReports', { ids: g.items.map(x => x.id) })).reports); audit(); },
  })) : [h('li.ad-dim', logs.rep.length ? 'Nothing matches the filter.' : 'No reports yet.')]));
}

// BNAME — THE BOARD's REPORT button (api/board.js#flagRow)
async function flags() {
  if (!document.getElementById('ad-flags')) return;
  renderFlags((await call('flags')).flags);
  // (LOBBY 2.0 A — THE REPORT PUSH opens /admin#reports: the Board reports in view once they're in)
  if (location.hash === '#reports' && !flags.scrolled) { flags.scrolled = true; const c = cardOf('reports'); if (c) { c.set(true); c.el.scrollIntoView({ block: 'start' }); } }
}
function renderFlags(list) {
  const box = document.getElementById('ad-flags');
  if (!box) return;
  { const c = cardOf('reports'); if (c) c.count(list.length ? String(list.length) : '0'); }
  box.replaceChildren(...(list.length ? list.map(f => {
    const p = f.player;
    return h('li.ad-err',
      h('div.ad-err-top',
        h('b.ad-err-n', `×${f.n || 1}`),
        p ? h('button.ad-err-m', { type: 'button', title: 'Open the player', onclick: () => open(p.pid) }, `${p.n}${fmtTag(p.t)}`) : h('span.ad-err-m', 'profile gone'),
        confirmBtn('Dismiss', async () => { renderFlags((await call('clearFlag', { id: f.id })).flags); audit(); })),
      h('div.ad-err-meta',
        h('span', `on the board as ${f.nick.n}`),
        h('span', counts(f.why)),
        h('span', counts(f.b)),
        h('span', `last ${when(f.last)}`),
        p && p.h ? h('span.ad-tag.is-hidden', 'HIDDEN') : null));
  }) : [h('li.ad-dim', 'No board reports.')]));
}

async function boot() {
  installEmblems();
  if (!isConfigured) { app.replaceChildren(h('p.ad-wait', 'Firebase is not configured.')); return; }
  try {
    await initFirebase();
    const who = await api('admin', { action: 'whoami' });
    if (!who.admin) { denied(who); return; }
    shell();
  } catch (e) {
    app.replaceChildren(h('section.ad-card', h('h1', 'Can’t reach the server'), h('p', e.message || String(e)), h('p.ad-dim', 'The /api functions need the Vercel environment variables (see CLAUDE.md → Profiles).')));
  }
}
boot();
