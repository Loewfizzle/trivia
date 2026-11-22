// /admin — moderation for the global boards. Signs in with this browser's own anonymous identity (the same profile as
// the app on this browser); every action goes to POST /api/admin, which checks the profile id against ADMIN_PIDS and
// writes an audit entry. Search players, remove a record, reset a board, rename, hide from the boards, the audit log.
import { h } from '../ui/dom.js';
import { toast } from '../ui/toast.js';   // (SHELL 2.0 A: THE MESSAGE — was the page's own .ad-toast)
import { avatar, tubeButton } from '../ui/components.js';
import { emblem, installEmblems } from '../ui/emblems.js';
import { initFirebase, isConfigured } from '../firebase.js';
import { api } from '../profile/api.js';
import { state } from '../store.js';
import { boardDef, fmtValue } from '../core/boards.js';
import { fmtTag, isOffensive } from '../core/names.js';
import { houseNick } from '../core/nicknames.js';
import { levelLabel } from '../core/levels.js';
import { GAMES } from '../config.js';
import { GAME_LIGHT } from '../board/view.js';
import { groupErrors, groupReports, filterGroups, countLine } from './groups.js';
import { lazyImport } from '../ui/lazy-import.js';
import { big, statsBlocks, dailyChart } from './stats-view.js';   // (CITY C — ONE stats builder: /admin + the ☰ STATS sheet)
import { ownerTag } from '../ui/owner-tag.js';

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
    // CITY I — SECOND ACCOUNTS + DON'T COUNT (owner-only): accounts that share a hashed address — it only FLAGS; DON'T COUNT is the owner's tap
    card('ad-second', 'Second accounts', { cls: 'ad-errors ad-second', open: false },
      h('div.ad-row', h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: secondAccounts }, 'Refresh')),
      h('p.ad-dim', 'Accounts seen on the SAME connection in the last 14 days (the server keeps only a hashed address — never the address itself). Nothing happens on its own. DON’T COUNT takes an account out of THE BOARD, SCORES, the dailies’ “2ND OF 5” line + THE PENTHOUSE for everyone else — its own stats, streak, XP, items + achievements stay, and it sees no change of its own. UNDO puts it back everywhere at once.'),
      h('div.ad-second-list', { id: 'ad-second' }, h('p.ad-dim', 'Loading…'))),
    card('ad-errors', 'Errors from phones', { cls: 'ad-errors', open: false },
      logTools('ad-errors', v => { logs.errQ = v; paintErrors(); }, errors, confirmBtn('Clear all', async () => { renderErrors((await call('clearErrors')).errors); toast('Cleared'); audit(); }, 'is-danger')),
      h('p.ad-dim', 'Code errors on players’ screens — one row per kind (the message), with its count + first / last seen; tap a row for each place it happened. MARK SEEN resets the “new” count. Quiet for 30 days → removed.'),
      h('p.ad-note.ad-quiet', { id: 'ad-quiet' }),   // (CITY A — THE QUIET COUNTS: counted, never a row each)
      h('ol.ad-errs', { id: 'ad-errs' }, h('li.ad-dim', 'Loading…'))),
    card('ad-reports', 'Reports from phones', { cls: 'ad-errors', open: false },
      logTools('ad-reports', v => { logs.repQ = v; paintReports(); }, reports, confirmBtn('Clear all', async () => { renderReports((await call('clearReports')).reports); toast('Cleared'); audit(); }, 'is-danger')),
      h('p.ad-dim', 'City 2.0 snapshots, one row per kind: SEND REPORT in the &debug=1 strip (TAP), or sent by the page itself when it froze (HANG — the main thread stopped answering; STALL — no frames; BOOT HANG — the page never got past its boot screen: what it was waiting for + what the watchdog did), BENCH. Newest 40 kept.'),
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
    // BOARD 2.0 A — THE BOARDS' BACK-FILL (api/_lib/board-fill.js): PREVIEW (nothing written) → BACK-FILL NOW on a second tap — once, after the
    // deploy (idempotent: a second run writes the same numbers); THE OVERALL BOARD's THIS WEEK from the stored records + the daily points
    card('ad-boards', 'The boards', { cls: 'ad-boards', open: false },
      h('p.ad-dim', 'BOARD 2.0: XP THIS WEEK (the overall board) is rebuilt from every match record + daily run of this week; TOTAL XP from each profile; DAILY POINTS from every counted daily since the dailies went live. Run it ONCE after the deploy — running it again changes nothing.'),
      h('div.ad-row', h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: boardsPreview }, 'Preview')),
      h('div.ad-boards-out', { id: 'ad-boards-out' })),
    // CITY FIXES + HOLD'EM — THE BILLBOARD: the speakeasy roof board's BASE POSTER (every phone within ~a minute, through the cached feed)
    card('ad-billboard', 'The billboard', { cls: 'ad-billboard' },
      h('p.ad-dim', 'The speakeasy’s roof billboard shows the TEXAS HOLD’EM ad in place of the day’s game while this is ON (your radio messages, LOOK UP, FIREWORKS, the party + the Sunday postcard still interrupt it). Turning it on starts it today — the billposter pastes it at ~5 pm, then stays home. OFF = the daily game posters again.'),
      h('div.ad-row', { id: 'ad-bb-row' }, h('span.ad-dim', 'Loading…')),
      // THE TRI-VISION: JAYWALK's poster = the board's second face (the slats turn HOLD'EM ↔ JAYWALK every 45–60 s while both are on)
      h('p.ad-dim', 'JAYWALK — the board’s second face: while both are ON the board TURNS between HOLD’EM and JAYWALK every 45–60 s (every phone the same face). COMING SOON until you say NOW OPEN — or set an OPEN DAY: from that day it reads NOW OPEN (the days before stay COMING SOON). OFF = HOLD’EM alone, no turning.'),
      h('div.ad-row', { id: 'ad-jw-row' }, h('span.ad-dim', 'Loading…')),
      // CITY B — THE DROP's face (the third): ON = 14 days from THE DROP's go-live, then it retires · OFF · KEEP ON
      h('p.ad-dim', 'PRISM DROP’s DAILY — the board’s third face (PRISM DROP · NEW DAILY): it appears by itself on the daily’s go-live day and turns with the others for 14 days, then retires. ON = that window · OFF = never · KEEP ON = it never retires.'),
      h('div.ad-row', { id: 'ad-drop-row' }, h('span.ad-dim', 'Loading…'))),
    // DM2 — THE DAILIES (owner only — the server checks): THE GO-LIVE SWITCH (a second tap flips it) + THE RESEED (DM2 ADD-ON: server-side —
    // PREVIEW shows the plan, nothing written; RESEED NOW on a second tap: a fresh daily secret from the next 4 am, today + the past untouched)
    card('ad-dailies', 'The dailies', { cls: 'ad-dailies' },
      h('p.ad-dim', 'THE GO-LIVE SWITCH turns every daily on or off for everyone, at once (any time). RESEED gives the dailies a fresh secret from the next 4 am Eastern — run it when the repo goes private (preview first; today’s run and every past result stay as they are).'),
      h('div.ad-row', { id: 'ad-dly-row' }, h('span.ad-dim', 'Loading…')),
      h('div.ad-dly-out', { id: 'ad-dly-out' }),
      // THE DROP B — THE SCHEDULED GO-LIVE: one row per daily — LIVE / LIVE FROM <date> 4 AM (+ CANCEL) / OFF (+ GO LIVE AT THE NEXT 4 AM)
      h('p.ad-dim', 'GO LIVE AT THE NEXT 4 AM (per daily, any time): the daily turns on by itself at the next 4 am Eastern turn — never mid-day. CANCEL works until then. From that day THE SWEEP and PERFECT WEEK need it too. (Only while the switch above is ON.)'),
      h('div.ad-dly-golive', { id: 'ad-dly-golive' }),
      // DAILY A — THE DAILY BEST BACKFILL (api/_lib/daily-best-fill.js): every player's best per daily from the kept days — PREVIEW first, then a
      // second tap; safe to run twice (a better stored best stays)
      h('p.ad-dim', 'DAILY BEST — every player’s best result per daily, built from the kept days (once, after the deploy; safe to run again).'),
      h('div.ad-row', h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: bestPreview }, 'DAILY BEST · PREVIEW')),
      h('div.ad-dly-best', { id: 'ad-dly-best' }),
      // CITY E — THE TAPPABLE SHARE CARD: the cards shared links show (7 days each); the owner deletes ONE (a second tap)
      h('p.ad-dim', 'SHARE CARDS — the day’s scorecard a shared link previews (kept 7 days). Delete one by its row, or paste its link / code.'),
      h('div.ad-dly-shares', { id: 'ad-dly-shares' }, h('span.ad-dim', 'Loading…')),
      // DFIX3 — THE STATS (started / finished per daily, today + 7 days) + TODAY'S PLAYERS (ADD FRIEND = the ordinary friend request)
      h('div.ad-dly-stats', { id: 'ad-dly-stats' }, h('p.ad-dim', 'Loading…'))),
    // CITY E — THE NIGHTLY BACKUP (docs/backup.md): the last pickup of each copy — GitHub (the private repo, the main copy) · the PC (the second)
    // — its time + size; RED when older than 36 h (a night missed). A still row — no animation.
    card('ad-backup', 'Backups', { cls: 'ad-backup' },
      h('p.ad-dim', 'Every night ~4:30 am ET the private GitHub repo takes a copy of every durable node (kept 14 days), then the mini PC (~4:45 am, 14 days). Red = no copy for 36 hours. How to restore: docs/backup.md.'),
      h('div.ad-bk-rows', { id: 'ad-bk-rows' }, h('span.ad-dim', 'Loading…'))),
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
    // CITY C — THE FOUNDER WINDOW, folded at the very BOTTOM (the owner REOPENED it Nov 14 for new joiners): its CURRENT state — OPEN / CLOSED +
    // since when + the founders. Nothing ever closes it automatically: only this switch (a second tap confirms; closing sweeps first — founder.js)
    card('ad-audit', 'Audit log', { cls: 'ad-audit', open: false }, h('div.ad-row', h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: audit }, 'Refresh')), h('ol.ad-log', { id: 'ad-log' })),
    card('ad-founder', 'Founder window', { cls: 'ad-founder', open: false }, h('div.ad-row', { id: 'ad-founder-row' }, h('span.ad-dim', 'Loading…'))));
  app.replaceChildren(
    h('a.ad-link.ad-back', { href: '/' }, '‹ BACK TO THE CITY'),   // (DFIX3 — the owner: the authorized page had no way back; the denied page always had one)
    h('header.ad-head', h('div', h('div.ad-kicker', 'NEON SPEAKEASY'), h('h1', 'Admin')), h('div.ad-head-links', h('a.ad-link', { href: '/lab' }, 'The Card Lab ›'), ' ', h('a.ad-link', { href: '/board' }, 'The Board ›'))),
    jumpBar(),
    grid);
  audit();
  nightlyBackups();   // (FIXES R1 — CITY E named it backups() too: the module failed to parse, /admin hung on "Signing in…")
  outages();
  dailies(); dailyStats(); billboard();
  errors();
  reports();
  flags();
  secondAccounts();
  testPlayers();
  backups();
  gifts();
  founderWin();
  loadStats();
  // "live now" keeps itself current while the page is open and visible (the server caches it for 30 s)
  setInterval(() => { if (document.visibilityState === 'visible') loadStats(false, true); }, 30_000);
}

/** CITY C — THE FOUNDER WINDOW's row: OPEN / CLOSED + since when + the founders · the switch (CLOSE / REOPEN, a second tap) */
async function founderWin(f) {
  const row = document.getElementById('ad-founder-row');
  if (!row) return;
  try {
    f ||= (await call('founderState')).founder;
    const when = f.at ? new Date(f.at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;
    row.replaceChildren(
      h('b.ad-dly-state', { class: f.open ? 'is-open' : 'is-closed' }, f.open ? 'OPEN' : 'CLOSED'),
      h('span.ad-dim', `${when ? `since ${when}` : f.open ? 'open since the start' : ''} · ${f.holders || 0} founding member${f.holders === 1 ? '' : 's'}`),
      confirmBtn(f.open ? 'CLOSE IT' : 'REOPEN', async () => { const r = await call('radioFounder', { open: !f.open }); toast(r.founder.open ? 'The founder window is OPEN' : 'The founder window is CLOSED'); founderWin(r.founder); audit(); }, f.open ? 'is-danger' : 'is-primary'),
      h('p.ad-dim', f.open ? 'While it’s open, everyone who plays a counted match gets FOUNDING MEMBER — and keeps it. Nothing closes it by itself.' : 'Closed: nobody new gets FOUNDING MEMBER; the founders keep it.'));
  } catch (e) { row.replaceChildren(h('span.ad-dim', `Couldn’t load (${e.message || e})`)); }
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
    // BOARD 2.0 A — THE PLAYER PAGE's DATA as a viewer gets it (/api/profile `player` — what BOARD 2.0 B draws; you as the viewer): a plain look
    h('h3', 'Player page data'),
    h('div.ad-row', h('button.btn.btn-ghost.btn-sm.ad-btn', { type: 'button', onclick: async e => { const out = e.currentTarget.parentNode.nextElementSibling; try { out.textContent = JSON.stringify(await api('profile', { action: 'player', pid: p.pid }), null, 1); } catch (err) { out.textContent = String(err && err.message || err); } } }, 'Show')),
    h('pre.ad-dim.ad-pp', { style: { whiteSpace: 'pre-wrap', fontSize: '12px', maxHeight: '320px', overflow: 'auto' } }),
    h('h3', 'Visibility'),
    h('div.ad-row', v.priv.banned
      ? confirmBtn('Return to the boards', async () => { render(await call('hide', { pid: p.pid, on: false })); toast('Back on the boards'); audit(); })
      : confirmBtn('Hide from every board', async () => { render(await call('hide', { pid: p.pid, on: true })); toast('Hidden'); audit(); }, 'is-danger')),
    h('h3', 'Boards'),
    boards.length ? h('div.ad-boards', ...boards.map(b => {
      const def = boardDef(b.b);
      return h('div.ad-board',
        h('div.ad-board-h', h('b', `${b.game ? gameName(b.game) : 'OVERALL'} · ${def ? def.label : b.b}`), h('code', b.b)),
        h('div.ad-board-v',
          h('span', 'ALL TIME ', h('b', b.all ? fmtValue(def && def.allFmt ? { ...def, fmt: def.allFmt } : def, b.all.v) : '—'), b.all && b.all.rank ? ` #${b.all.rank}` : ''),
          h('span', 'THIS WEEK ', h('b', b.week ? fmtValue(def, b.week.v) : '—'), b.week && b.week.rank ? ` #${b.week.rank}` : '')),
        def && def.kind === 'overall' ? null : h('div.ad-row',
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
    const S = await lazyImport(import('../vault/strip.js'), '../vault/strip.js'); await S.vaultSheet();
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

// ---------------------------------------------------------------- BOARD 2.0 A — THE BOARDS' BACK-FILL
const fillLine = p => `Week ${p.wk}: ${p.weekPlayers} player${p.weekPlayers === 1 ? '' : 's'} earned ${Number(p.weekXp).toLocaleString('en-US')} XP this week · ${p.players} profiles · ${p.days} daily-days read${p.pointsPlayers != null ? ` · ${p.pointsPlayers} with daily points` : ''}${p.holdemPlayers != null ? ` · HOLD’EM: ${p.holdemWins} tournament win${p.holdemWins === 1 ? '' : 's'} for ${p.holdemPlayers} player${p.holdemPlayers === 1 ? '' : 's'}` : ''}${p.ocSeed ? ` · OVERCLOCK: ${p.ocSeed} BEST QUICK RUN${p.ocSeed === 1 ? '' : 's'} seeded from QUICK · SOLO` : ''}${p.resetAt ? ` · only since THE RESET of ${new Date(p.resetAt).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' })}` : ''}`;
async function boardsPreview() {
  const out = document.getElementById('ad-boards-out');
  const { backfill: dry } = await call('boardsBackfill');
  out.replaceChildren(h('div.ad-tp-dry', h('b', fillLine(dry.preview)), h('p.ad-dim', 'Nothing written yet. Tap twice to fill the boards.'),
    h('div.ad-row', confirmBtn('Back-fill now', async () => {
      const { backfill: r } = await call('boardsBackfill', { confirm: true });
      out.replaceChildren(h('p', h('b', 'Done. '), `${fillLine(r.preview)} — ${r.rows} board row${r.rows === 1 ? '' : 's'} written.`));
      toast('Boards back-filled'); audit();
    }))));
}

// ---------------------------------------------------------------- DAILY A — THE DAILY BEST BACKFILL
const bestLine = p => `${p.players} player${p.players === 1 ? '' : 's'} · ${p.days} days read (${dayLabel(p.from)} → ${dayLabel(p.to)}) · ${Object.entries(p.games).map(([g, x]) => `${g.toUpperCase()}: ${x.days} day${x.days === 1 ? '' : 's'}, ${x.scores} score${x.scores === 1 ? '' : 's'}${x.missing.length ? ` (nothing kept on ${x.missing.length})` : ''}`).join(' · ')}${p.before ? ` · ${p.before}` : ''}`;
async function bestPreview() {
  const out = document.getElementById('ad-dly-best');
  const { preview } = await call('dailyBestBackfill');
  out.replaceChildren(h('div.ad-tp-dry', h('b', bestLine(preview)), h('p.ad-dim', 'Nothing written yet. Tap twice to build DAILY BEST.'),
    h('div.ad-row', confirmBtn('Build DAILY BEST now', async () => {
      const r = await call('dailyBestBackfill', { confirm: true });
      out.replaceChildren(h('p', h('b', 'Done. '), `${bestLine(r.preview)} — ${r.written} player${r.written === 1 ? '' : 's'} updated${r.gone ? ` · ${r.gone} removed profile${r.gone === 1 ? '' : 's'} skipped` : ''}.`));
      toast('DAILY BEST built'); audit();
    }))));
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

// PLAY NOW — WHO'S ON on /admin → STATS: the LEDGER's list (ui/whos-on.js — ONE builder), made once and kept across the stats' re-renders;
// it refreshes every 30 s only while this page is on screen (the server checks the owner ROLE; an admin who isn't the radio's owner reads
// "The owner only.")
let whoBlock = null;
function whoSection() {
  // (THE POOL FIXES add-on 3: it was section.ad-who — the PLAYER block's class, a flex ROW: the heading floated beside a list squeezed into the
  //  right half, "DIME TIME" broke letter by letter — now its own class, laid out like the LEDGER's sheet: the heading on its line, full-width rows)
  const sec = h('section.ad-whoson', h('h3.ad-h3', 'WHO’S ON', h('small', ' · online now')));
  if (whoBlock) sec.append(whoBlock.el);
  else lazyImport(import('../ui/whos-on.js'), '../ui/whos-on.js').then(m => { whoBlock = whoBlock || m.whosOnBlock({ api }); if (!whoBlock.el.isConnected) sec.append(whoBlock.el); }).catch(() => {});
  return sec;
}
function renderStats() {
  const box = document.getElementById('ad-stats-b2');
  if (!box || !S) return;
  { const c = cardOf('ad-stats'); if (c) c.count(`${S.totals.matches.toLocaleString()} matches`); }
  box.replaceChildren(
    whoSection(),
    h('div.ad-stats-grid', ...statsBlocks(S, { view, rerender: renderStats, onPlayer: open })),
    // (FR7 FIXES C2 — THE SUPPORTED FLOOR: one quiet line — browsers below it were told to update; never a BOOT HANG in the reports)
    h('p.ad-note.ad-old', `old browsers: ${(S.oldBrowsers && S.oldBrowsers.n) || 0}${S.oldBrowsers && S.oldBrowsers.last ? ` · last ${new Date(S.oldBrowsers.last).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''} — below the supported floor (Chrome 92 · Firefox 90 · Safari / iOS 16): shown “too old”, never a BOOT HANG`));
}

// THE OUTAGE: today + the 6 days before, each a toggle (a second tap confirms)
/** DFIX3 — a daily's spoiler-free score line (its thin meta — js/screens/daily.js reads it the same way) */
const dyMetas = new Map();
const dyMeta = id => { if (!dyMetas.has(id)) dyMetas.set(id, lazyImport(import(`../games/${id}/meta.js`), '../games/*/meta.js').catch(() => ({}))); return dyMetas.get(id); };
/** DFIX3 — THE DAILIES' STATS block: per daily STARTED · FINISHED today + the last 7 days as small bars; TODAY'S PLAYERS with ADD FRIEND */
async function dailyStats() {
  const box = document.getElementById('ad-dly-stats');
  if (!box) return;
  try {
    const S = (await call('dailyStats')).stats;
    const metas = Object.fromEntries(await Promise.all(S.dailies.map(async d => [d.id, await dyMeta(d.id)])));
    const line = (id, score) => { const m = metas[id]; return m && typeof m.scoreLine === 'function' ? m.scoreLine(score) : String(score); };
    const { friendButton } = await lazyImport(import('../profile/friends-ui.js'), '../profile/friends-ui.js');
    // (CITY G — THE DAILIES CHART: ONE builder, js/admin/stats-view.js#dailyChart — the ☰ STATS sheet draws the same)
    const blocks = S.dailies.map(d => h('div.ad-block.ad-dly-g', ...dailyChart(d.name, d.days, S.day)));
    const rows = S.players.map(p => h('li.ad-dly-p',
      avatar(p.a, p.c, 26),
      h('button.ad-linkbtn', { type: 'button', onclick: () => open(p.pid) }, p.n, h('small', p.t ? fmtTag(p.t) : '')),
      h('span.ad-dly-lv', `LV ${p.l || 1}`),
      h('span.ad-dly-res', ...S.dailies.map(d => { const r = p.results[d.id]; return h('span.ad-dly-r', { class: r && r.playing ? 'is-playing' : r ? 'is-done' : 'is-none' }, h('small', d.name), r && r.playing ? 'PLAYING' : r ? line(d.id, r.score) + (r.gated ? ' · NOT COUNTED' : '') : '—'); })),
      h('span.ad-tag', { class: p.counts ? 'is-counts' : 'is-new' }, p.counts ? 'COUNTS' : 'NEW TODAY'),
      p.h ? h('span.ad-tag.is-hidden', 'HIDDEN') : null,
      h('span.ad-dly-fr', friendButton({ pid: p.pid }, { name: p.n, size: 'sm', block: false }))));
    box.replaceChildren(
      ...blocks,
      h('div.ad-row.ad-between', h('h3', `Today’s players`), h('span.ad-dim', S.n > S.players.length ? `newest ${S.players.length} of ${S.n}` : `${S.n}`)),
      rows.length ? h('ol.ad-top.ad-dly-players', ...rows) : h('p.ad-dim', 'Nobody has started a daily yet today.'));
  } catch (e) { box.replaceChildren(h('p.ad-dim', `Couldn’t load the stats (${e.message || e})`)); }
}
/** DM2 — THE DAILIES card: the switch's state + ON / OFF + RESEED (preview → confirm) */
async function billboard(st) {
  const row = document.getElementById('ad-bb-row');
  if (!row) return;
  try {
    let jw = null;
    if (!st) { const r0 = await call('billboardState'); st = r0.billboard; jw = r0.jaywalk; jaywalkRow(jw); dropRow(r0.drop); }
    const set = async patch => { const r = await call('billboardSet', patch); toast(r.billboard.on ? `HOLD’EM ad ON · ${r.billboard.bar === 'open' ? 'NOW OPEN' : 'COMING SOON'}` : 'HOLD’EM ad OFF — the game posters are back'); billboard(r.billboard); audit(); };
    row.replaceChildren(
      h('b.ad-dly-state', st.on ? `HOLD’EM AD: ON · ${st.bar === 'open' ? 'NOW OPEN' : 'COMING SOON'}` : 'HOLD’EM AD: OFF'),
      confirmBtn(st.on ? 'SWITCH OFF' : 'SWITCH ON', () => set({ on: !st.on, bar: st.bar }), st.on ? '' : 'is-primary'),
      st.on ? tubeButton(st.bar === 'open' ? 'SHOW COMING SOON' : 'SHOW NOW OPEN', { kind: 'secondary', size: 'sm', cls: 'ad-btn', onClick: () => set({ on: true, bar: st.bar === 'open' ? 'soon' : 'open' }) }) : null,
      h('span.ad-dim', st.set ? `since ${st.since}` : `the default (since ${st.since})`));
  } catch (e) { row.replaceChildren(h('span.ad-dim', `Couldn’t load (${e.message || e})`)); }
}
/** THE TRI-VISION — JAYWALK's row: ON / OFF · COMING SOON / NOW OPEN · its OPEN DAY */
function jaywalkRow(st) {
  const row = document.getElementById('ad-jw-row');
  if (!row || !st) return;
  const set = async patch => { const r = await call('billboardJaywalk', patch); toast(r.jaywalk.on ? `JAYWALK ON · ${r.jaywalk.bar === 'open' ? 'NOW OPEN' : r.jaywalk.open ? `NOW OPEN from ${r.jaywalk.open}` : 'COMING SOON'}` : 'JAYWALK OFF — HOLD’EM alone'); jaywalkRow(r.jaywalk); audit(); };
  const day = h('input.input.ad-jw-open', { type: 'date', value: st.open || '', 'aria-label': 'JAYWALK’s open day' });
  row.replaceChildren(
    h('b.ad-dly-state', st.on ? `JAYWALK: ON · ${st.bar === 'open' ? 'NOW OPEN' : st.open ? `COMING SOON → NOW OPEN ${st.open}` : 'COMING SOON'}` : 'JAYWALK: OFF'),
    confirmBtn(st.on ? 'SWITCH OFF' : 'SWITCH ON', () => set({ on: !st.on, bar: st.bar, open: st.open || '' }), st.on ? '' : 'is-primary'),
    st.on ? tubeButton(st.bar === 'open' ? 'SHOW COMING SOON' : 'SHOW NOW OPEN', { kind: 'secondary', size: 'sm', cls: 'ad-btn', onClick: () => set({ on: true, bar: st.bar === 'open' ? 'soon' : 'open', open: st.open || '' }) }) : null,
    h('label.ad-dim', 'Open day'), day,
    tubeButton('SET DAY', { kind: 'secondary', size: 'sm', cls: 'ad-btn', onClick: () => set({ on: st.on, bar: st.bar, open: day.value || '' }) }),
    h('span.ad-dim', st.set ? `since ${st.since}` : `the default (since ${st.since})`));
}
/** CITY B — THE DROP's face: ON (the 14-day window from its go-live) · OFF · KEEP ON */
function dropRow(st) {
  const row = document.getElementById('ad-drop-row');
  if (!row || !st) return;
  const set = async mode => { const r = await call('billboardDrop', { mode }); toast(`PRISM DROP daily's face: ${{ on: 'ON (14 days from its go-live)', off: 'OFF', keep: 'KEEP ON' }[r.drop.mode]}`); dropRow({ ...st, mode: r.drop.mode }); audit(); };
  const word = { on: 'ON', off: 'OFF', keep: 'KEEP ON' };
  row.replaceChildren(
    h('b.ad-dly-state', `PRISM DROP DAILY's FACE: ${word[st.mode] || 'ON'}`),
    ...['on', 'off', 'keep'].filter(m => m !== st.mode).map(m => confirmBtn(word[m], () => set(m), m === 'on' ? 'is-primary' : '')),
    h('span.ad-dim', st.live ? `PRISM DROP's daily goes live ${st.live} — the face ${st.mode === 'keep' ? 'stays on' : `retires after ${st.days || 14} days`}` : 'PRISM DROP’s daily isn’t scheduled live yet — the face waits for it'));
}
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
    goLiveRows(st);
    shareRows();
  } catch (e) { row.replaceChildren(h('span.ad-dim', `Couldn’t load (${e.message || e})`)); }
}
/** CITY E — THE SHARE CARDS row: the live cards (name · daily · day · code) + DELETE (TAP AGAIN TO CONFIRM) + a paste box; stills only */
async function shareRows(cards) {
  const box = document.getElementById('ad-dly-shares');
  if (!box) return;
  try {
    cards ||= (await call('shareCards')).cards || [];
    const del = async code => { const r = await call('shareDelete', { code }); toast(r.gone ? 'Share card deleted' : 'No such card (already gone)'); shareRows(r.cards || []); audit(); };
    const paste = h('input.input.ad-shr-code', { type: 'text', placeholder: 'a link or a code', 'aria-label': 'A share link or code', autocomplete: 'off' });
    box.replaceChildren(
      ...(cards.length ? cards.map(c => h('div.ad-row.ad-shr', { dataset: { code: c.code } },
        h('b.ad-dly-state', `${c.n || '?'} · ${(c.g || []).length === 1 ? String(c.g[0]).toUpperCase() : 'THE DAILIES'} · ${dayLabel(c.day)}`),
        h('span.ad-dim', c.code),
        confirmBtn('DELETE', () => del(c.code), 'is-danger'))) : [h('p.ad-dim', 'No share cards right now.')]),
      h('div.ad-row', paste, confirmBtn('DELETE THIS ONE', () => del(paste.value), 'is-danger')));
  } catch (e) { box.replaceChildren(h('span.ad-dim', `Couldn’t load (${e.message || e})`)); }
}
/** THE DROP B — "SUN NOV 15" from a day key (its own calendar day — never the admin's zone) */
const dayLabel = dk => { const m = /^d(\d{4})(\d{2})(\d{2})$/.exec(String(dk || '')); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).replace(',', '').toUpperCase() : String(dk || ''); };
/** THE DROP B — THE SCHEDULED GO-LIVE's rows: each daily's state + its one action (a confirm tap — TAP AGAIN TO CONFIRM) */
function goLiveRows(st) {
  const box = document.getElementById('ad-dly-golive');
  if (!box || !st || !Array.isArray(st.rows)) return;
  const act = async (game, cancel) => {
    const r = await call('dailySchedule', { game, ...(cancel ? { cancel: true } : {}) });
    const row = (r.dailies.rows || []).find(x => x.id === game) || {};
    toast(cancel ? `${row.name || game}: the go-live is cancelled` : `${row.name || game} goes LIVE ${dayLabel(row.from)} at 4 am`);
    dailies(r.dailies); audit();
  };
  box.replaceChildren(...st.rows.map(r => h('div.ad-row.ad-dly-live', { dataset: { id: r.id, state: r.state } },
    h('b.ad-dly-state', `${r.name}: ${r.state === 'live' ? 'LIVE' : r.state === 'scheduled' ? `LIVE FROM ${dayLabel(r.from)} 4 AM` : 'OFF'}`),
    r.state === 'off' ? confirmBtn('GO LIVE AT THE NEXT 4 AM', () => act(r.id, false), 'is-primary') : null,
    r.state === 'scheduled' && !r.code ? confirmBtn('CANCEL', () => act(r.id, true)) : null,   // (HIGH RISE DAILY B: a go-live set in code — the row's liveFrom — has no CANCEL)
    h('span.ad-dim', r.always ? 'always in the set' : r.state === 'off' ? `would open ${dayLabel(st.next)} at 4 am` : r.state === 'scheduled' ? (r.code ? 'opens by itself — set by the deploy' : 'opens by itself — no deploy needed') : `live since ${dayLabel(r.from)}`))));
}
/** CITY E — THE BACKUPS row: GITHUB · THE PC, each its last pickup (when · how big) — red past 36 h (BACKUP_LATE_H) */
const BACKUP_LATE_H = 36;
async function nightlyBackups() {
  const box = document.getElementById('ad-bk-rows');
  if (!box) return;
  try {
    const { backup = {}, now = Date.now() } = await call('backupState');
    const mb = n => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round((n || 0) / 1e3)} KB`);
    box.replaceChildren(...[['gh', 'GITHUB (private repo)'], ['pc', 'THE PC']].map(([k, label]) => {
      const b = backup[k], late = !b || now - b.at > BACKUP_LATE_H * 3600e3;
      return h('div.ad-row.ad-bk', { class: late ? 'is-late' : '' },
        h('b.ad-dly-state', label),
        h('span', b ? `${new Date(b.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${mb(b.bytes)} · ${b.parts || 0} parts` : 'never'),
        late ? h('span.ad-tag.is-bad', b ? `${Math.round((now - b.at) / 3600e3)} H AGO` : 'NO COPY YET') : h('span.ad-dim', `${Math.round((now - b.at) / 3600e3)} h ago`));
    }));
  } catch (e) { box.replaceChildren(h('span.ad-dim', `Couldn’t load (${e.message || e})`)); }
}
async function outages(r) {
  const row = document.getElementById('ad-outage-row');
  if (!row) return;
  try {
    r ||= await call('outages');
    const { dayNum, dayOf } = await lazyImport(import('../core/streak.js'), '../core/streak.js');
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
  const r = await call('errors');
  renderErrors(r.errors); paintQuiet(r.quiet);
}
// CITY A — THE QUIET COUNTS (api/log.js#QUIET_KINDS): the noise that is COUNTED, never a row — a room write refused after the phone had gone
// (left / lost the host / the room closed) and a browser extension's error; one line, the last time each happened
function paintQuiet(q) {
  const el = document.getElementById('ad-quiet');
  if (!el || !q) return;
  const when = t => (t ? ` · last ${new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : '');
  el.textContent = `counted, not listed — room writes refused after leaving: ${(q.gone && q.gone.n) || 0}${when(q.gone && q.gone.last)} · browser-extension errors: ${(q.ext && q.ext.n) || 0}${when(q.ext && q.ext.last)} · audio leaves on non-admin phones: ${(q.snd && q.snd.n) || 0}${when(q.snd && q.snd.last)} · slow HOLD'EM dealer calls: ${(q.slow && q.slow.n) || 0}${when(q.slow && q.slow.last)} · dead screens sent to the city: ${(q.dead && q.dead.n) || 0}${when(q.dead && q.dead.last)} · late proof chunks: ${(q['late-proof'] && q['late-proof'].n) || 0}${when(q['late-proof'] && q['late-proof'].last)} · slow first loads (still arriving at 12 s — no reload): ${(q['slow-boot'] && q['slow-boot'].n) || 0}${when(q['slow-boot'] && q['slow-boot'].last)} · late votes (rematch + game): ${(q['late-vote'] && q['late-vote'].n) || 0}${when(q['late-vote'] && q['late-vote'].last)} · writes from a phone that lost the host: ${(q['not-host'] && q['not-host'].n) || 0}${when(q['not-host'] && q['not-host'].last)}`;   // (CITY PART 1: + late-proof (was counted, never shown) · slow-boot · late-vote · not-host)
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

// CITY I — SECOND ACCOUNTS (api/admin.js#secondAccounts) + DON'T COUNT / UNDO (api/admin.js 'noCount' — audited)
async function secondAccounts() {
  if (!document.getElementById('ad-second')) return;
  renderSecond(await call('secondAccounts'));
}
function renderSecond(r) {
  const box = document.getElementById('ad-second');
  if (!box || !r) return;
  { const c = cardOf('ad-second'); if (c) c.count(String((r.groups || []).length)); }
  const day = at => (at ? new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : '—');
  const flip = (a, on) => (on
    ? confirmBtn('DON’T COUNT', async () => { renderSecond(await call('noCount', { pid: a.pid, on: true })); toast(`${a.n} is not counted`); audit(); }, 'is-danger')
    : tubeButton('UNDO', { kind: 'secondary', size: 'sm', cls: 'ad-btn', onClick: async () => { renderSecond(await call('noCount', { pid: a.pid, on: false })); toast(`${a.n} counts again`); audit(); } }));
  const row = a => h('li.ad-err.ad-sa',
    h('div.ad-err-top',
      h('button.ad-err-m', { type: 'button', title: 'Open the player', onclick: () => open(a.pid) }, a.n, ownerTag(a.t)),   // (CITY PART 2 — THE OWNER'S NAME TAG: bold white mono, the ONE helper)
      a.nc ? h('span.ad-tag.is-hidden', 'NOT COUNTED') : null,
      flip(a, !a.nc)),
    h('div.ad-err-meta',
      a.first ? h('span', `first seen ${day(a.first)}`) : null,
      a.last ? h('span', `last ${day(a.last)}`) : null,
      h('span', `${a.plays} play${a.plays === 1 ? '' : 's'}`),
      a.nc ? h('span', `not counted since ${day(a.nc.at)}`) : null));
  const groups = (r.groups || []).map((g, i) => h('section.ad-sa-g', h('h3.ad-h3', `GROUP ${i + 1}`, h('small', ` · ${g.accounts.length} accounts${g.shared > 1 ? ` · ${g.shared} shared connections` : ''}`)), h('ol.ad-errs', ...g.accounts.map(row))));
  const off = (r.flagged || []).filter(Boolean);
  box.replaceChildren(
    ...(groups.length ? groups : [h('p.ad-dim', `No accounts share a connection (the last ${r.days || 14} days).`)]),
    ...(off.length ? [h('section.ad-sa-g', h('h3.ad-h3', 'NOT COUNTED', h('small', ` · ${off.length}`)), h('ol.ad-errs', ...off.map(row)))] : []));
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
    const uid = await initFirebase();
    state.uid = uid;   // (DFIX3 — the profile modules read this browser's identity from the store: ADD FRIEND on TODAY'S PLAYERS needs it)
    const who = await api('admin', { action: 'whoami' });
    if (!who.admin) { denied(who); return; }
    shell();
  } catch (e) {
    app.replaceChildren(h('section.ad-card', h('h1', 'Can’t reach the server'), h('p', e.message || String(e)), h('p.ad-dim', 'The /api functions need the Vercel environment variables (see CLAUDE.md → Profiles).')));
  }
}
boot();
