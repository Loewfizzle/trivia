// The profile: a membership card to the speakeasy. Glass card with the avatar, name tag, rank emblem and an XP bar
// that fills with light; the profile key as a secret password card (tap to reveal, copy, a new key); "Show me on
// global leaderboards"; and per-game cards (wins, win rate, highlights, records, weekly and all-time ranks).
// promptKey(): the gentle reminder sheet after a player's first few matches.
import { h, reducedMotion } from '../ui/dom.js';
import { avatar } from '../ui/components.js';
import { emblem } from '../ui/emblems.js';
import { toast } from '../ui/toast.js';
import { setState, state } from '../store.js';
import { loadProfile, saveProfile, loadMe, loadKey } from '../identity.js';
import { signOf } from '../core/items.js';
import { GAMES, COLORS, NAME_MAX, colorHex } from '../config.js';
import { mastery } from '../core/ranks.js';
import { levelOf } from '../core/levels.js';
import { gildedCard } from '../progress/card.js';
import { progressSections, customizeBar } from '../progress/profile.js';
import { birthdayRow } from '../progress/extras.js';
import { openStreakCard } from '../progress/streak-card.js';
import { pgSheet } from '../progress/look.js';
import { BOARD_GAMES } from '../core/boards.js';
import { boardDef, fmtValue, MIN_WR_GAMES, winRate } from '../core/boards.js';
import { fetchMe, myRanks, myKey, regenKey, restoreKey, setShown, setNotes, notes, setStyle, keyOffer, keepNewKey } from '../profile/me.js';
import { GAME_LIGHT } from '../board/view.js';
import { boardSfx } from '../board/audio.js';
import { sfx } from '../audio/sfx.js';
import { settings } from '../audio/settings.js';
import { memberLabel } from '../core/member.js';
import { sanitizeName } from '../core/room-logic.js';
import { openPfSheet, closeAllPfSheets } from '../profile/sheets.js';

const HL = { gridlock: [['sunk', 'FLEETS SUNK'], ['w_classic', 'CLASSIC WINS'], ['w_salvo', 'SALVO WINS'], ['w_royale', 'ROYALE WINS'], ['w_arcade', 'ARCADE WINS']], agent: [['esc', 'ESCAPES'], ['spot', 'AGENTS CAUGHT']], signal: [['el', 'ELIMINATIONS']], bluff: [['fool', 'PLAYERS FOOLED']], prism: [['ko', 'KNOCKOUTS']] };
const num = n => Math.round(n || 0).toLocaleString('en-US');
const reduced = () => !!settings.reducedFx || reducedMotion();
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** The membership card — PROGRESSION A: THE ORIGINAL GILDED (js/progress/card.js; the old holographic card + its finishes are folded
 *  into the new items — core/items.js). opts: { st (the streak), card, mini, onFlame } */
export function memberCard(pub, local, xp, opts = {}) {
  pgSheet();
  return gildedCard(pub ? { ...pub, x: xp ?? pub.x } : null, local || {}, opts);
}

/** The secret password card: masked, tap to reveal, copy; a new key on a confirmed second tap. */
function keyCard({ onNew } = {}) {
  let shown = false, timer = 0, armed = false;
  const text = h('span.pf-key-text');
  const paint = () => {
    const k = myKey();
    text.textContent = !k ? 'NO KEY ON THIS DEVICE' : shown ? k : 'NEON-••••-••••-••••';
    wrap.classList.toggle('is-shown', shown && !!k);
    wrap.classList.toggle('is-none', !k);
  };
  const reveal = () => {
    if (!myKey()) return;
    shown = !shown; clearTimeout(timer);
    if (shown) { timer = setTimeout(() => { shown = false; paint(); }, 20000); sfx('select'); }
    paint();
  };
  const copy = async e => {
    e.stopPropagation();
    const k = myKey();
    if (!k) return;
    try { await navigator.clipboard.writeText(k); toast('KEY COPIED — KEEP IT SOMEWHERE SAFE', 'ok'); } catch { shown = true; paint(); toast('SELECT AND COPY THE KEY', 'info'); }
    setNotes({ saved: true });
  };
  const newBtn = h('button.pf-key-new', { type: 'button', onclick: async e => {
    e.stopPropagation();
    if (!armed) { armed = true; newBtn.textContent = 'TAP AGAIN — THE OLD KEY STOPS WORKING'; newBtn.classList.add('is-armed'); setTimeout(() => { armed = false; newBtn.textContent = 'NEW KEY'; newBtn.classList.remove('is-armed'); }, 4000); return; }
    armed = false; newBtn.textContent = 'NEW KEY'; newBtn.classList.remove('is-armed');
    try { await regenKey(); shown = true; paint(); toast('A NEW KEY — THE OLD ONE NO LONGER WORKS', 'ok'); onNew && onNew(); } catch (err) { toast(err.message || 'COULDN’T REACH THE SERVER', 'err'); }
  } }, 'NEW KEY');
  const wrap = h('div.pf-key', { role: 'button', tabindex: '0', 'aria-label': 'Your profile key — tap to reveal', onclick: reveal, onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); } } },
    h('div.pf-key-head', h('span.pf-key-k', 'YOUR KEY'), h('span.pf-key-s', 'the password at the door')),
    h('div.pf-key-val', text),
    h('div.pf-key-actions',
      h('span.pf-key-hint', 'TAP TO REVEAL'),
      h('button.pf-key-copy', { type: 'button', onclick: copy }, 'COPY'),
      newBtn));
  paint();
  return wrap;
}

/** The membership card as a full-screen overlay (from a room: the lobby, the menu, the podium), back = close. */
let cardOverlay = null;
export function openCard() {
  if (cardOverlay) return;
  const view = createView({ overlay: true, onBack: () => closeCard() });
  const el = h('section.screen.screen-in.pf-overlay');
  cardOverlay = { el, view };
  document.body.append(el);
  view.mount(el);
}
export function closeCard() {
  if (!cardOverlay) return;
  const { el, view } = cardOverlay;
  cardOverlay = null;
  view.unmount && view.unmount();
  el.classList.add('screen-out');
  setTimeout(() => el.remove(), 260);
}

const KEY_WHY = 'ONE CARD, ALL YOUR DEVICES: your key brings this card to another phone, another browser or the iPhone Home Screen app — every device works at once. Never give it to anyone else: whoever has it is you.';

// LOBBY 2.0 A — THE PROFILE POLISH (the owner's 2C review, Nov 3 9:20–9:40 pm). THE HEADER: only ‹ BACK (top left) + the music mute (top
// right — the corner's own; the ☰ menu + the word MEMBERSHIP are gone: the full card on top says whose page it is). THE PAGE keeps only:
// the full card + CUSTOMIZE YOUR CARD (the ONE gold button) · LEVEL (the pink tube) · THE GOAL TILE · STATS · the latest 3 trophies (+ THE
// TROPHY CASE) · the latest sightings (+ ALL) · MASTERY (a game → its records in a sheet) · a short ACCOUNT block. POP-UPS (profile/sheets.js)
// hold the rest, one step at a time: Edit profile → NAME / COLOUR, RESTORE YOUR ACCOUNT, a game's records. ONE BUTTON SYSTEM: every other
// button is NEON GLASS (.pf-gb — dark glass, a soft white edge, white text); NEW KEY small + red-edged, a second tap confirms.
export function createView({ onBack = null, overlay = false } = {}) {
  const els = {};
  let data = null, destroyed = false;

  function mount(el) {
    el.classList.add('pf-screen');
    document.body.classList.add('pf-on');
    els.card = h('div.pf-card-slot');
    els.show = h('input.pf-switch-in', { type: 'checkbox', role: 'switch', checked: true, onchange: onShow });
    els.foot = h('div.pf-foot');
    els.why = h('div.pf-why-slot');
    els.cz = h('div.pf-cz-slot');
    els.bday = h('div.pf-bday-slot');
    els.keyBox = h('div.pf-keybox-slot');
    els.mast = h('div.pf-mast-slot');
    els.newKey = h('button.pf-gb.pf-gb-sm.is-danger.pf-newkey', { type: 'button', onclick: onNewKey }, 'NEW KEY');
    els.elsewhere = h('button.pf-gb.pf-gb-big.pf-elsewhere', { type: 'button', onclick: () => import('../profile/bring.js').then(B => B.openElsewhere()) }, h('b', 'USE THIS CARD ON ANOTHER DEVICE'), h('small', 'your card on a second phone, a computer or the Home Screen app'));
    els.restore = h('button.pf-gb.pf-gb-big.pf-restore', { type: 'button', onclick: openRestore }, h('b', 'RESTORE YOUR ACCOUNT'), h('small', 'have a key from another device? bring that card here'));
    el.append(
      h('header.bar.pf-bar',
        h('button.icon-btn.pf-back', { type: 'button', 'aria-label': 'Back', onclick: back }, '‹')),
      h('div.pf-scroll',
        els.card,
        els.cz,
        els.why,
        els.prog = h('div.pf-prog'),
        els.mast,
        h('section.pf-sec.pf-account',
          h('h3.pf-h', 'ACCOUNT'),
          overlay ? null : h('button.pf-acc-row.pf-edit', { type: 'button', onclick: openEditProfile }, h('b', 'Edit profile'), h('span', 'name · colour ›')),
          els.bday,
          els.keyBox,
          els.elsewhere,
          els.restore,
          h('label.pf-switch', h('span.pf-switch-l', h('b', 'Show me on global leaderboards'), h('small', 'Off: your stats still count, only you see them.')), els.show, h('span.pf-switch-ui', { 'aria-hidden': 'true' })),
          h('div.pf-newkey-row', els.newKey)),
        els.foot));
    paintLocal();
    paintKey();
    load();
  }

  function back() { closeAllPfSheets(); if (onBack) { onBack(); return; } try { sessionStorage.setItem('nd:back', '1'); } catch { /* fine */ } setState({ view: 'title' }); }

  // ---------------------------------------------------------------- YOUR KEY — ONE block (2C's page showed the key THREE times)
  function paintKey() {
    const k = loadKey();
    els.elsewhere.hidden = !k;
    els.newKey.hidden = !k;
    if (!k) { els.keyBox.replaceChildren(); return; }
    let shown = false, timer = 0;
    const text = h('span.pf-kb-text');
    const saved = h('p.pf-kb-saved');
    const val = h('button.pf-kb-val', { type: 'button', 'aria-label': 'Your key — tap to reveal' }, text, h('small', 'TAP TO REVEAL'));
    const paintT = () => { text.textContent = shown ? k : 'NEON-••••-••••-••••'; val.classList.toggle('is-shown', shown); };
    const paintS = () => {
      const ok = !!(notes() || {}).saved;
      saved.classList.toggle('is-ok', ok);
      saved.replaceChildren(ok ? h('span', '✓ saved — keep it where you’ll find it') : h('span', 'Not saved yet — ', h('button.pf-kb-did', { type: 'button', onclick: () => { setNotes({ saved: true }); paintS(); toast('NICE — YOUR CARD IS SAFE', 'ok'); } }, 'I saved it')));
    };
    val.addEventListener('click', () => { shown = !shown; clearTimeout(timer); if (shown) { timer = setTimeout(() => { shown = false; paintT(); }, 20000); sfx('select'); } paintT(); });
    const acts = h('div.pf-kb-acts',
      h('button.pf-gb', { type: 'button', 'data-act': 'copy', onclick: async () => { const B = await import('../profile/bring.js'); await B.copyKey(k, text); paintS(); } }, 'COPY'),
      typeof navigator.share === 'function' ? h('button.pf-gb', { type: 'button', 'data-act': 'share', onclick: async () => { const B = await import('../profile/bring.js'); await B.shareKey(k); paintS(); } }, 'SHARE') : null);
    els.keyBox.replaceChildren(h('div.pf-kb',
      h('div.pf-kb-h', h('b', 'YOUR KEY'), h('span', 'the password at the door')),
      val, acts, saved,
      h('p.pf-kb-why', 'It brings this card to any device. Never give it to anyone else — whoever has it is you.')));
    paintT(); paintS();
  }
  let armed = 0;
  async function onNewKey() {
    const b = els.newKey;
    if (!armed) { armed = setTimeout(() => { armed = 0; b.textContent = 'NEW KEY'; b.classList.remove('is-armed'); }, 4000); b.textContent = 'TAP AGAIN — THE OLD KEY STOPS WORKING'; b.classList.add('is-armed'); return; }
    clearTimeout(armed); armed = 0; b.textContent = 'NEW KEY'; b.classList.remove('is-armed');
    try { await regenKey(); setNotes({ saved: false }); paintKey(); toast('A NEW KEY — THE OLD ONE NO LONGER WORKS', 'ok'); } catch (err) { toast(err.message || 'COULDN’T REACH THE SERVER', 'err'); }
  }

  // ---------------------------------------------------------------- EDIT PROFILE (a sheet: NAME › · COLOUR › — each its own step)
  function openEditProfile() {
    const nameV = h('span.pf-er-v'), colV = h('span.pf-er-v');
    const paint = () => { const q = loadProfile() || {}; nameV.textContent = q.name || '—'; colV.replaceChildren(h('i.pf-er-sw', { style: { '--c': colorHex(q.color) } }), String(q.color || '').toUpperCase()); };
    const sheet = openPfSheet({ kicker: 'YOUR PROFILE', title: 'EDIT PROFILE', cls: 'pf-edit-sheet', body: [
      h('button.pf-acc-row.pf-er.pf-er-name', { type: 'button', onclick: () => openNameEditor(paint) }, h('b', 'NAME'), nameV, h('i.pf-er-go', '›')),
      h('button.pf-acc-row.pf-er.pf-er-colour', { type: 'button', onclick: () => openColourEditor(paint) }, h('b', 'COLOUR'), colV, h('i.pf-er-go', '›')),
      h('p.pfs-note', 'Your emblem changes in CUSTOMIZE YOUR CARD.')] });
    paint();
    return sheet;
  }
  function saveLocal(patch) {
    const q = { ...(loadProfile() || {}), ...patch };
    saveProfile(q);
    sfx('lock');
    // (the global profile follows — renames: once a day — then the page repaints from the server)
    import('../profile/me.js').then(m => m.syncMe()).then(() => { if (!destroyed) load(); }).catch(() => {});
  }
  function openNameEditor(onDone) {
    const q = loadProfile() || {};
    let s = null;
    const input = h('input.input.input-name.pf-name-in', { type: 'text', maxLength: NAME_MAX, value: q.name || '', autocomplete: 'nickname', autocapitalize: 'off', spellcheck: false, 'aria-label': 'Your name' });
    const go = () => {
      const name = sanitizeName(input.value, NAME_MAX);
      if (!name) { toast('ENTER A NAME', 'err'); input.focus(); return; }
      saveLocal({ name }); if (onDone) onDone(); s.close();
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    s = openPfSheet({ kicker: 'EDIT PROFILE', title: 'YOUR NAME', cls: 'pf-name-sheet', body: [
      h('label.field', h('span.label', 'NAME'), input),
      h('p.pf-public', 'This name shows on the public board — don’t use your full real name.'),
      h('button.btn.btn-primary.btn-block.pf-save', { type: 'button', onclick: go }, h('span', 'SAVE'))] });
    setTimeout(() => input.focus(), 320);
    return s;
  }
  function openColourEditor(onDone) {
    let pick = (loadProfile() || {}).color, s = null;
    const sw = h('div.swatches.pf-swatches', { role: 'radiogroup', 'aria-label': 'Colour' });
    const paint = () => { for (const b of sw.children) b.setAttribute('aria-checked', String(b.dataset.id === pick)); };
    for (const c of COLORS) sw.append(h('button.swatch', { type: 'button', role: 'radio', 'aria-label': c.id, dataset: { id: c.id }, style: { '--c': c.hex }, onclick: () => { pick = c.id; paint(); } }));
    paint();
    s = openPfSheet({ kicker: 'EDIT PROFILE', title: 'YOUR COLOUR', cls: 'pf-colour-sheet', body: [
      h('p.pfs-note', 'Your colour lights your emblem, your ring in the line and your name in the room.'), sw,
      h('button.btn.btn-primary.btn-block.pf-save', { type: 'button', onclick: () => { if (pick) saveLocal({ color: pick }); if (onDone) onDone(); s.close(); } }, h('span', 'SAVE'))] });
    return s;
  }

  // ---------------------------------------------------------------- RESTORE YOUR ACCOUNT (a sheet)
  function openRestore() {
    let s = null;
    const input = h('input.input.pf-key-in', { type: 'text', placeholder: 'NEON-XXXX-XXXX-XXXX', autocapitalize: 'characters', autocomplete: 'off', spellcheck: false, 'aria-label': 'Profile key', maxLength: 24 });
    const go = h('button.btn.btn-primary.btn-block', { type: 'button' }, h('span', 'RESTORE MY PROFILE'));
    go.addEventListener('click', async () => { if (await doRestore(input.value, go)) s.close(); });
    s = openPfSheet({ kicker: 'YOUR ACCOUNT', title: 'RESTORE YOUR ACCOUNT', cls: 'pf-restore-sheet', body: [
      h('p.pfs-note', 'Paste the key from your other device. This device joins that card — with all its stats; the other device stays signed in.'),
      input, go,
      h('p.pfs-note.is-small', 'The profile this device has now is replaced (if it never finished a match, it’s removed).')] });
    setTimeout(() => input.focus(), 320);
    return s;
  }

  function paintLocal() {
    // (PERF-A — FR5 E1: a cached profile made for ANOTHER login is never painted as the member)
    const m0 = loadMe(), m = m0 && m0.uid === state.uid ? m0 : null;
    if (!data) els.card.replaceChildren(memberCard(m && m.profile, loadProfile() || {}, m && m.profile ? m.profile.x : 0, { onFlame: () => openStreakCard(null) }));
    paintWhy(m0);
  }
  /** PERF-A — THE CARD SAYS WHY (the Oct 31 scare: a blank card that looked like a wiped account): the key offer (a new profile was made
   *  while this device held a key), a sign-in that changed, or nothing saved on this ADDRESS (another origin is another storage) */
  function paintWhy(m0) {
    const off = keyOffer();
    if (off) {
      const go = h('button.pf-gb.pf-gb-big', { type: 'button', onclick: () => doRestore(off.key, go) }, h('b', 'RESTORE IT'));
      els.why.replaceChildren(h('div.pf-note.is-offer',
        h('b', 'THIS DEVICE ALREADY HAD A KEY — RESTORE IT?'),
        h('p', 'A new profile was made on this device, but the key it already had is kept. Restore it to get that profile + its stats back.'),
        go,
        h('button.pf-link', { type: 'button', onclick: () => { keepNewKey(); toast('KEPT THE NEW PROFILE — THE OLD KEY STILL WORKS IF YOU ENTER IT', 'info', 5200); paintKey(); paintWhy(loadMe()); } }, 'No — keep the new profile')));
      return;
    }
    if (m0 && m0.uid !== state.uid && loadKey()) {
      const go = h('button.pf-gb.pf-gb-big', { type: 'button', onclick: () => doRestore(loadKey(), go) }, h('b', 'RESTORE WITH YOUR KEY'));
      els.why.replaceChildren(h('div.pf-note', h('b', 'THIS DEVICE’S SIGN-IN CHANGED'), h('p', 'Your key is still here — restore it to bring your profile back.'), go));
      return;
    }
    if (!m0 && !loadKey()) {
      const go = h('button.pf-gb.pf-gb-big', { type: 'button', onclick: () => import('../profile/bring.js').then(B => B.openBring({ onDone: () => { paintKey(); paintLocal(); load(); } })) }, h('b', 'BRING YOUR CARD'));
      els.why.replaceChildren(h('div.pf-note', h('b', 'ALREADY A MEMBER?'), h('p', `Nothing is saved on this device yet (${location.host}) — your card wasn’t deleted. Bring it here with your key: your card works on all your devices at once.`), go));
      return;
    }
    els.why.replaceChildren();
  }
  async function doRestore(key, btn) {
    if (btn) btn.classList.add('is-busy');
    try {
      const r = await restoreKey(key, { onRetry: () => toast('WAKING THE SERVER — TRYING AGAIN', 'info', 2600) });
      toast(`WELCOME BACK, ${r.profile.n.toUpperCase()}`, 'ok');
      sfx('join');
      data = null;
      paintKey();
      paintLocal();
      load();
      return true;
    } catch (e) {
      toast(e.message || 'THAT KEY DIDN’T WORK', 'err');
      // (the invalid sound only when the server REFUSED the key — never for a network failure)
      if (e && e.status >= 400 && e.status < 500) sfx('invalid');
      return false;
    } finally { if (btn) btn.classList.remove('is-busy'); }
  }

  async function load() {
    try {
      data = await fetchMe();
      if (destroyed) return;
      paintCard();
      paintWhy(loadMe());
      paintProgress();
      paintMastery();
      els.show.checked = !!data.priv.shown;
      els.show.disabled = !!data.priv.banned;
      els.foot.replaceChildren(
        h('span', `MEMBER SINCE ${since(data)}`),
        h('button.pf-pid', { type: 'button', title: 'Your profile id (for the admin page)', onclick: () => { navigator.clipboard && navigator.clipboard.writeText(data.pid).then(() => toast('PROFILE ID COPIED', 'ok')).catch(() => {}); } }, `ID ${data.pid}`));
    } catch (e) {
      if (destroyed) return;
      els.prog.replaceChildren(h('div.pf-loading.is-off', e.status === 404 ? 'Finish a match and your membership is made — automatically, no signup.' : 'The membership office is closed right now — your games still count and land here when it opens.'));
    }
  }

  // THE VAULT 1B: the card you EQUIP is your profile's card — its FULL CARD once the owner has approved it in THE CARD LAB (the Gilded
  // membership card stands until then, and for the Gilded itself)
  let fullMounted = null, paintN = 0;
  function paintCard() {
    const n = ++paintN;
    if (fullMounted) { fullMounted.destroy(); fullMounted = null; }
    els.card.replaceChildren(memberCard(data.profile, loadProfile() || {}, data.stats.xp, { st: data.stats.st, onFlame: () => openStreakCard(data.stats.st) }));
    els.cz.replaceChildren(customizeBar(data, { name: data.profile.n || (loadProfile() || {}).name || '', onWear: wear }));
    const p = data.profile || {}, cd = p.cd;
    if (!cd || cd === 'card-gilded') return;
    import('../vault/full.js').then(async F => {
      if (!(await F.canShowFull(cd)) || n !== paintN || destroyed) return;
      const L = levelOf(data.stats.xp || p.x || 0);
      const who = { name: p.n, lv: L, avatar: p.a, color: p.c, at: p.at, no: memberLabel(p.mn), fd: !!p.fd, shape: p.es, tube: p.tb, glow: p.g, spotted: data.stats.it && data.stats.it[cd] };
      fullMounted = F.mountFullCard(els.card, cd, who);
      // (the hero: a tap opens the full card's own animated view — it scrolls away like any panel; only on-screen art moves)
      fullMounted.el.classList.add('pf-hero'); fullMounted.el.setAttribute('role', 'button'); fullMounted.el.tabIndex = 0;
      const open = () => F.openFullCard(cd, who);
      fullMounted.el.addEventListener('click', open);
      fullMounted.el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    }).catch(() => {});
  }
  // PROGRESSION A + LOBBY 2.0 A: level (+ the streak row) · THE GOAL TILE · stats · the latest trophies · the latest sightings (+ a favor)
  function paintProgress() {
    const s = data.stats, now = Date.now(), local = loadProfile() || {};
    const secs = progressSections(data, { name: data.profile.n || local.name || '', now, onFlame: () => openStreakCard(s.st), onWear: wear });
    els.prog.replaceChildren(h('div.pg-prof', ...secs));
    els.bday.replaceChildren(birthdayRow(data, { now }));
  }
  // MASTERY — one tile a playable game (the ring + PLAYED · WINS); a tap → that game's record in a sheet (wins, win rate, its bests + ranks).
  // (The owner: NO "NOT YET PLAYED" — gone with its pills; 2C's YOUR GAMES cards live in the sheet.)
  function paintMastery() {
    const g = data.stats.g || {};
    const tiles = GAMES.filter(x => BOARD_GAMES.includes(x.id) && x.playable !== false).map(x => {
      const m = mastery(g[x.id]), st = g[x.id] || {};
      const t = h('button.pf-mast', { type: 'button', class: m.lvl ? '' : 'is-none', dataset: { game: x.id }, style: { '--a1': (GAME_LIGHT[x.id] || ['#fff'])[0], '--f': String(m.frac) }, 'aria-label': m.lvl ? `${x.name}: mastery level ${m.lvl}${m.max ? ' (max)' : `, ${m.need} to the next`} — your record` : `${x.name}: not played yet` },
        h('span.pf-mast-ring', h('b', m.lvl ? String(m.lvl) : '—')),
        h('span.pf-mast-t', h('span.pf-mast-n', x.name), h('small', st.p ? `${num(st.p)} PLAYED · ${num(st.w || 0)} ${st.w === 1 ? 'WIN' : 'WINS'}` : 'not played yet')),
        st.p ? h('i.pf-mast-go', '›') : null);
      if (st.p) t.addEventListener('click', () => openGame(x, st));
      else t.disabled = true;
      return t;
    });
    els.mast.replaceChildren(h('section.pf-sec.pf-mastery', h('h3.pf-h', 'MASTERY'), h('div.pf-mast-grid', ...tiles)));
  }
  async function openGame(game, s) {
    const boards = [`${game.id}-wins`];
    for (const b of Object.keys(data.stats.b || {})) if (boardDef(b) && boardDef(b).game === game.id) boards.push(b);
    const body = h('div.pf-game-slot', gameCard(game, s, (data.stats.gw || {})[game.id], {}, 0));
    openPfSheet({ kicker: 'YOUR RECORD', title: game.name, cls: 'pf-game-sheet', body });
    let ranks = {};
    try { ranks = await myRanks(boards); } catch { ranks = {}; }
    if (!destroyed) body.replaceChildren(gameCard(game, s, (data.stats.gw || {})[game.id], ranks, 0));
  }

  // equip something you own (the server checks it): a card · a name glow · a tube style · an emblem shape ('' = take it off)
  async function wear(slot, id) {
    try {
      const prof = await setStyle({ [slot]: id });
      // (THE VAULT 2C — a sign-up shape equipped in CUSTOMIZE: this device's own identity follows — the rooms show it)
      const sign = slot === 'shape' ? signOf(id) : null;
      if (sign) { const lp = loadProfile(); if (lp && lp.avatar !== sign) saveProfile({ ...lp, avatar: sign }); }
      if (destroyed) return;
      data.profile = { ...data.profile, ...prof };
      sfx('select');
      paintCard();
      paintProgress();
      return true;
    } catch (e) { toast(e.code === 'locked' ? 'THAT ISN’T IN YOUR VAULT' : 'THE VAULT IS CLOSED RIGHT NOW', 'err'); return false; }
  }

  function since(d) {
    const at = d && d.profile && d.profile.at;
    const dt = new Date(at || Date.now());
    return `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
  }

  function rankLine(r) {
    if (!r) return null;
    const bits = [];
    if (r.week && r.week.rank) bits.push(h('span', h('b', `#${num(r.week.rank)}`), ' THIS WEEK'));
    if (r.all && r.all.rank) bits.push(h('span', h('b', `#${num(r.all.rank)}`), ' ALL TIME'));
    return bits.length ? h('div.pf-ranks', ...bits) : null;
  }

  function gameCard(game, s, w, ranks, i) {
    const [a1, a2] = GAME_LIGHT[game.id] || ['#fff', '#fff'];
    const recs = Object.entries(data.stats.b || {}).map(([b, v]) => ({ def: boardDef(b), v })).filter(x => x.def && x.def.game === game.id && x.v.a != null);
    const hl = (HL[game.id] || []).filter(([k]) => s[k] > 0);
    return h('article.pf-game', { style: { '--a1': a1, '--a2': a2, '--i': i } },
      h('header.pf-game-h', h('span.pf-game-n', game.name), h('span.pf-game-p', `${num(s.p)} PLAYED`)),
      h('div.pf-game-big',
        h('div.pf-stat', h('b', num(s.w)), h('span', s.w === 1 ? 'WIN' : 'WINS')),
        h('div.pf-stat', s.p >= MIN_WR_GAMES ? h('b', `${(winRate(s.w || 0, s.p) / 100).toFixed(0)}%`) : h('b.is-dim', '—'), h('span', s.p >= MIN_WR_GAMES ? 'WIN RATE' : `WIN RATE AFTER ${MIN_WR_GAMES}`)),
        w && w.p ? h('div.pf-stat', h('b', num(w.w || 0)), h('span', 'WINS THIS WEEK')) : null),
      rankLine(ranks[`${game.id}-wins`]),
      hl.length ? h('div.pf-hl', ...hl.map(([k, l]) => h('span', h('b', num(s[k])), ` ${l}`))) : null,
      recs.length ? h('div.pf-recs', ...recs.map(({ def, v }) => h('div.pf-rec',
        h('span.pf-rec-l', def.game === 'pulse' && def.song ? `${def.label} · ${def.diff.toUpperCase()}` : def.label),
        h('span.pf-rec-v', fmtValue(def, v.a)),
        rankLine(ranks[def.id])))) : null);
  }

  async function onShow() {
    const on = els.show.checked;
    try { await setShown(on); toast(on ? 'YOU’RE ON THE GLOBAL BOARDS' : 'HIDDEN FROM THE GLOBAL BOARDS — YOUR STATS STILL COUNT', 'ok'); } catch (e) { els.show.checked = !on; toast(e.message || 'COULDN’T REACH THE SERVER', 'err'); }
  }

  return {
    mount,
    update() {},
    unmount() { destroyed = true; document.body.classList.remove('pf-on'); closeAllPfSheets(); },
  };
}

/** The gentle reminder: after a player's first few matches, back in the lobby. */
export function promptKey() {
  if (document.querySelector('.pf-prompt')) return;
  const n = notes();
  setNotes({ prompted: (n.prompted || 0) + 1 });
  let sheet;
  const close = () => { sheet.classList.add('out'); setTimeout(() => sheet.remove(), 260); };
  const m = loadMe();
  // (THE VAULT 1A: SHARE — the phone's own sheet → Notes / Mail / Messages / a password manager)
  const shareRow = typeof navigator.share === 'function' ? h('button.btn.btn-ghost.btn-block', { type: 'button', onclick: () => import('../profile/bring.js').then(B => B.shareKey()).then(ok => { if (ok) close(); }) }, h('span', 'SHARE IT TO NOTES OR MAIL')) : null;
  sheet = h('div.modal.pf-prompt', { onclick: e => { if (e.target === sheet) close(); } },
    h('div.sheet', { role: 'dialog', 'aria-label': 'Save your profile key' },
      h('div.sheet-grip'),
      h('div.pf-prompt-head', m && m.profile ? h('span.rk-big', emblem(m.profile.r | 0, 54)) : null,
        h('div', h('div.sheet-kicker', 'YOUR MEMBERSHIP'), h('h2.sheet-title', 'Save your key somewhere safe'))),
      h('p.pf-why', h('b', 'Email it to yourself, put it in Notes or a password manager. Lose it and your card can’t come back.')),
      h('p.pf-why', KEY_WHY),
      keyCard(),
      shareRow,
      h('div.pf-prompt-actions',
        h('button.btn.btn-primary.btn-block', { type: 'button', onclick: () => { setNotes({ saved: true }); close(); toast('NICE — YOUR RECORD IS SAFE', 'ok'); } }, h('span', 'I’VE SAVED IT')),
        h('button.btn.btn-text.btn-block', { type: 'button', onclick: close }, 'LATER'))));
  document.body.append(sheet);
  if (!reduced()) boardSfx('pb');
}
