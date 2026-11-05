// The profile: a membership card to the speakeasy. Glass card with the avatar, name tag, rank emblem and an XP bar
// that fills with light; the profile key as a secret password card (tap to reveal, copy, a new key); "Show me on
// global leaderboards"; and per-game cards (wins, win rate, highlights, records, weekly and all-time ranks).
import { h, reducedMotion } from '../ui/dom.js';
import { onCloseAll } from '../ui/layers.js';
import { avatar, tubeButton, row } from '../ui/components.js';
import { emblem } from '../ui/emblems.js';
import { toast } from '../ui/toast.js';
import { setState, state } from '../store.js';
import { loadProfile, saveProfile, loadMe, loadKey } from '../identity.js';
import { signOf } from '../core/items.js';
import { GAMES } from '../config.js';
import { mastery } from '../core/ranks.js';
import { levelOf } from '../core/levels.js';
import { gildedCard } from '../progress/card.js';
import { progressSections, customizeBar } from '../progress/profile.js';
import { birthdayRow } from '../progress/extras.js';
import { openStreakCard } from '../progress/streak-card.js';
import { pgSheet } from '../progress/look.js';
import { BOARD_GAMES } from '../core/boards.js';
import { boardDef, fmtValue, MIN_WR_GAMES, winRate } from '../core/boards.js';
import { fetchMe, myRanks, regenKey, restoreKey, setShown, setNotes, notes, setStyle, keyOffer, keepNewKey, previousKey, forgetPreviousKey } from '../profile/me.js';
import { GAME_LIGHT } from '../board/view.js';
import { sfx } from '../audio/sfx.js';
import { settings } from '../audio/settings.js';
import { memberLabel } from '../core/member.js';
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

onCloseAll(() => closeCard());   // (FR6 FIXES A — B1 + B7: the game start + a kick close the profile overlay)


// LOBBY 2.0 A — THE PROFILE POLISH (the owner's 2C review, Nov 3 9:20–9:40 pm). THE HEADER: only ‹ BACK (top left) + the music mute (top
// right — the corner's own; the ☰ menu + the word MEMBERSHIP are gone: the full card on top says whose page it is). THE PAGE keeps only:
// the full card + CUSTOMIZE YOUR CARD (the ONE gold button) · LEVEL (the pink tube) · THE GOAL TILE · STATS · the latest 3 trophies (+ THE
// TROPHY CASE) · the latest sightings (+ ALL) · MASTERY (a game → its records in a sheet) · a short ACCOUNT block. POP-UPS (profile/sheets.js)
// hold the rest, one step at a time: Edit profile → NAME / COLOUR, RESTORE YOUR ACCOUNT, a game's records. ONE BUTTON SYSTEM: every other
// button is THE NEON TUBE (SHELL 2.0 A — components.css THE SHELL); NEW KEY a small red tube, a second tap confirms; the account's two
// links are THE ROW.
/** LOBBY FIXES — a MOUSE drag scrolls the YOU page (a desktop): past 6 px of movement it's a drag (the click after it is swallowed); a touch
 *  or a pen scrolls natively, as before */
function dragScroll(sc) {
  let d = null;
  sc.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('input, textarea, select')) return; d = { y: e.clientY, top: sc.scrollTop, on: false, id: e.pointerId }; });
  sc.addEventListener('pointermove', e => {
    if (!d || e.pointerId !== d.id) return;
    const dy = e.clientY - d.y;
    if (!d.on && Math.abs(dy) > 6) { d.on = true; sc.classList.add('is-dragging'); try { sc.setPointerCapture(e.pointerId); } catch { /* fine */ } }
    if (d.on) sc.scrollTop = d.top - dy;
  });
  const end = () => { if (d && d.on) { sc.classList.remove('is-dragging'); const swallow = ev => { ev.stopPropagation(); ev.preventDefault(); }; sc.addEventListener('click', swallow, { capture: true, once: true }); setTimeout(() => sc.removeEventListener('click', swallow, { capture: true }), 0); } d = null; };
  sc.addEventListener('pointerup', end); sc.addEventListener('pointercancel', end);
}

export function createView({ onBack = null, overlay = false } = {}) {
  const els = {};
  let data = null, destroyed = false;

  function mount(el) {
    // (HOTFIX after THE SPEED PASS — the owner's live iPhone: the YOU page was UNSTYLED for a non-Gilded card — css/progress.css + vault.css
    //  loaded only through memberCard(), which paintHero skips for a full card. The page loads its sheets itself, before anything paints)
    pgSheet();
    el.classList.add('pf-screen');
    document.body.classList.add('pf-on');
    els.card = h('div.pf-card-slot');
    els.show = h('input.pf-switch-in', { type: 'checkbox', role: 'switch', checked: true, onchange: onShow });
    els.foot = h('div.pf-foot');
    els.why = h('div.pf-why-slot');
    els.cz = h('div.pf-cz-slot');
    els.bday = h('div.pf-bday-slot');
    els.keyBox = h('div.pf-keybox-slot');
    // (SHELL 2.0 B2 — YOUR PREVIOUS KEY on YOU → ACCOUNT: it only lived in City 1.0's key sheet — the key this phone held before a restore or
    //  a new key (profile/me.js#previousKey): a way back to that card. A glass row, only when there is one: tap = COPY; FORGET beside it)
    els.prevKey = prevKeyRow();
    els.mast = h('div.pf-mast-slot');
    // (SHELL 2.0 A — THE ONE LOOK: NEW KEY a small danger tube, its second tap the button itself red; the two account rows THE ROW)
    els.newKey = tubeButton('NEW KEY', { kind: 'danger', size: 'sm', cls: 'pf-newkey', confirm: 'TAP AGAIN — THE OLD KEY STOPS WORKING', onClick: onNewKey });
    els.elsewhere = row({ icon: 'card', label: 'Use this card on another device', sub: 'Your card on a second phone, a computer or the Home Screen app', cls: 'pf-elsewhere', onClick: () => import('../profile/bring.js').then(B => B.openElsewhere()) });
    // (LOBBY 2.0 B — the owner, Nov 4 7:10 am: RESTORE must stand out — a bright neon-CYAN edge + glow, a cyan title, a small key icon; not gold:
    //  CUSTOMIZE stays the screen's one gold primary; USE THIS CARD ON ANOTHER DEVICE stays glass)
    els.restore = row({ icon: 'key', ic: '#3ff0ff', label: 'Restore your account', sub: 'Have a key from another device? Bring that card here', cls: 'pf-restore', onClick: openRestore });
    el.append(
      h('header.bar.pf-bar',
        h('button.icon-btn.pf-back', { type: 'button', 'aria-label': 'Back', onclick: back }, '‹')),
      els.scroll = h('div.pf-scroll',
        els.card,
        els.cz,
        els.why,
        els.prog = h('div.pf-prog'),
        els.mast,
        h('section.pf-sec.pf-account',
          h('h3.pf-h', 'ACCOUNT'),
          // (LOBBY FIXES — the owner's ADD-ON 3: NAME + COLOUR are two rows at the top of CUSTOMIZE YOUR CARD (vault/dress.js) + the card's ✎;
          //  ACCOUNT keeps the key / restore / sign-in things only)
          els.bday,
          els.keyBox,
          els.prevKey,
          els.elsewhere,
          els.restore,
          h('label.pf-switch', h('span.pf-switch-l', h('b', 'Show me on global leaderboards'), h('small', 'Off: your stats still count, only you see them.')), els.show, h('span.pf-switch-ui', { 'aria-hidden': 'true' })),
          h('div.pf-newkey-row', els.newKey)),
        els.foot));
    dragScroll(els.scroll);
    paintLocal();
    paintKey();
    load();
  }
  // (THE SPEED PASS — the owner, Nov 4 6:28 pm: the ✎ beside the name on the card is GONE — CUSTOMIZE's EDIT USERNAME row is the one way in)

  // (SHELL 2.0 B1: opened from the ☰ menu → its ‹ BACK brings the menu back on top — settings-panel.js#backToMenu)
  const toMenu = () => import('../ui/settings-panel.js').then(m => m.backToMenu()).catch(() => {});
  function back() { closeAllPfSheets(); if (onBack) { onBack(); toMenu(); return; } try { sessionStorage.setItem('nd:back', '1'); } catch { /* fine */ } setState({ view: 'title' }); toMenu(); }

  function prevKeyRow() {
    const k = previousKey();
    if (!k) return null;
    const wrap = h('div.pf-prevkey');
    const copy = row({ icon: 'key', ic: '#9fd8ff', label: 'Your previous key', sub: k, value: 'COPY', cls: 'pf-prevkey-row', onClick: async () => { try { await navigator.clipboard.writeText(k); toast('Previous key copied', 'ok', { sub: 'RESTORE YOUR ACCOUNT with it to go back to that card.' }); } catch { toast('Select the key and copy it', 'info'); } } });
    const forget = row({ icon: 'leave', label: 'Forget the previous key', danger: true, chevron: false, cls: 'pf-prevkey-forget', confirm: 'TAP AGAIN TO FORGET IT', onClick: () => { forgetPreviousKey(); wrap.remove(); toast('Forgotten on this phone', 'ok'); } });
    wrap.append(copy, forget);
    return wrap;
  }

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
      h('button.btn.btn-ghost.btn-sm', { type: 'button', 'data-act': 'copy', onclick: async () => { const B = await import('../profile/bring.js'); await B.copyKey(k, text); paintS(); } }, 'COPY'),
      typeof navigator.share === 'function' ? h('button.btn.btn-ghost.btn-sm', { type: 'button', 'data-act': 'share', onclick: async () => { const B = await import('../profile/bring.js'); await B.shareKey(k); paintS(); } }, 'SHARE') : null);
    els.keyBox.replaceChildren(h('div.pf-kb',
      h('div.pf-kb-h', h('b', 'YOUR KEY'), h('span', 'the password at the door')),
      val, acts, saved,
      h('p.pf-kb-why', 'It brings this card to any device. Never give it to anyone else — whoever has it is you.')));
    paintT(); paintS();
  }
  async function onNewKey() {
    try { await regenKey(); setNotes({ saved: false }); paintKey(); toast('A NEW KEY — THE OLD ONE NO LONGER WORKS', 'ok'); } catch (err) { toast(err.message || 'COULDN’T REACH THE SERVER', 'err'); }
  }

  // ---------------------------------------------------------------- RESTORE YOUR ACCOUNT (a sheet)
  function openRestore() {
    let s = null;
    const input = h('input.input.pf-key-in', { type: 'text', placeholder: 'NEON-XXXX-XXXX-XXXX', autocapitalize: 'characters', autocomplete: 'off', spellcheck: false, 'aria-label': 'Profile key', maxLength: 24 });
    const go = h('button.btn.btn-primary.btn-block', { type: 'button' }, h('span', 'RESTORE MY PROFILE'));
    go.addEventListener('click', async () => { if (await doRestore(input.value, go)) s.close(); });
    s = openPfSheet({ kicker: 'YOUR ACCOUNT', title: 'RESTORE YOUR ACCOUNT', cls: 'pf-restore-sheet', body: [
      h('p.sh-note', 'Paste the key from your other device. This device joins that card — with all its stats; the other device stays signed in.'),
      input, go,
      h('p.sh-note.is-small', 'The profile this device has now is replaced (if it never finished a match, it’s removed).')] });
    setTimeout(() => input.focus(), 320);
    return s;
  }

  function paintLocal() {
    // (PERF-A — FR5 E1: a cached profile made for ANOTHER login is never painted as the member)
    const m0 = loadMe(), m = m0 && m0.uid === state.uid ? m0 : null;
    // (nothing saved for this sign-in yet but a key on the device = a member whose card we don't know yet: the blank shape, never the Gilded)
    if (!data) { if (!m && loadKey()) els.card.replaceChildren(h('div.pf-card-blank', { 'aria-hidden': 'true' })); else paintHero(m && m.profile, m && m.profile ? m.profile.x : 0, null, null); }
    paintWhy(m0);
  }
  /** PERF-A — THE CARD SAYS WHY (the Oct 31 scare: a blank card that looked like a wiped account): the key offer (a new profile was made
   *  while this device held a key), a sign-in that changed, or nothing saved on this ADDRESS (another origin is another storage) */
  function paintWhy(m0) {
    const off = keyOffer();
    if (off) {
      const go = h('button.btn.btn-ghost.btn-block', { type: 'button', onclick: () => doRestore(off.key, go) }, h('span', 'RESTORE IT'));
      els.why.replaceChildren(h('div.pf-note.is-offer',
        h('b', 'THIS DEVICE ALREADY HAD A KEY — RESTORE IT?'),
        h('p', 'A new profile was made on this device, but the key it already had is kept. Restore it to get that profile + its stats back.'),
        go,
        h('button.pf-link', { type: 'button', onclick: () => { keepNewKey(); toast('KEPT THE NEW PROFILE — THE OLD KEY STILL WORKS IF YOU ENTER IT', 'info', 5200); paintKey(); paintWhy(loadMe()); } }, 'No — keep the new profile')));
      return;
    }
    if (m0 && m0.uid !== state.uid && loadKey()) {
      const go = h('button.btn.btn-ghost.btn-block', { type: 'button', onclick: () => doRestore(loadKey(), go) }, h('span', 'RESTORE WITH YOUR KEY'));
      els.why.replaceChildren(h('div.pf-note', h('b', 'THIS DEVICE’S SIGN-IN CHANGED'), h('p', 'Your key is still here — restore it to bring your profile back.'), go));
      return;
    }
    if (!m0 && !loadKey()) {
      const go = h('button.btn.btn-ghost.btn-block', { type: 'button', onclick: () => import('../profile/bring.js').then(B => B.openBring({ onDone: () => { paintKey(); paintLocal(); load(); } })) }, h('span', 'BRING YOUR CARD'));
      els.why.replaceChildren(h('div.pf-note', h('b', 'ALREADY A MEMBER?'), h('p', `Nothing is saved on this device yet (${location.host}) — your card wasn’t deleted. Bring it here with your key: your card works on all your devices at once.`), go));
      return;
    }
    els.why.replaceChildren();
  }
  async function doRestore(key, btn) {
    if (btn) btn.classList.add('is-busy');
    try {
      const r = await restoreKey(key, { onRetry: () => toast('WAKING THE SERVER — TRYING AGAIN', 'info', 2600) });
      toast(`Welcome back, ${r.profile.n}`, 'ok');
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
      if (els.card.querySelector('.pf-card-blank') && !fullMounted && paintN === 0) paintHero(null, 0, null, null);   // (the office closed: the card we have)
      els.prog.replaceChildren(h('div.pf-loading.is-off', e.status === 404 ? 'Finish a match and your membership is made — automatically, no signup.' : 'The membership office is closed right now — your games still count and land here when it opens.'));
    }
  }

  // THE VAULT 1B: the card you EQUIP is your profile's card — its FULL CARD once the owner has approved it in THE CARD LAB (the Gilded
  // membership card stands until then, and for the Gilded itself)
  // THE SPEED PASS — THE CARD OPENS ON YOURS (the owner, Nov 4 5:55 pm: tapping YOU showed the Gilded card first, then swapped to his own):
  // the hero is painted from THIS device's saved profile at once — the equipped card, or (a full card still loading) a neutral BLANK card
  // shape — never another card; the server's answer repaints only if it changed something (the same card stays mounted, no second flash)
  let fullMounted = null, paintN = 0, heroSig = '';
  function paintHero(pub, xp, st, spotted) {
    const n = ++paintN, p = pub || {}, cd = p.cd, local = loadProfile() || {};
    const gilded = () => {
      if (fullMounted) { fullMounted.destroy(); fullMounted = null; }
      heroSig = '';
      els.card.replaceChildren(memberCard(pub, local, xp, { st, onFlame: () => openStreakCard(st) }));
    };
    if (!cd || cd === 'card-gilded') { gilded(); return; }
    const who = { name: p.n || local.name, lv: levelOf(xp || p.x || 0), avatar: p.a || local.avatar, color: p.c || local.color, at: p.at, no: memberLabel(p.mn), fd: !!p.fd, shape: p.es, tube: p.tb, glow: p.g, spotted: spotted || null };
    const sig = `${cd}|${JSON.stringify(who)}`;
    if (fullMounted && heroSig === sig) return;
    if (!fullMounted || fullMounted.cd !== cd) {
      if (fullMounted) { fullMounted.destroy(); fullMounted = null; }
      els.card.replaceChildren(h('div.pf-card-blank', { 'aria-hidden': 'true', dataset: { card: cd } }));
    }
    import('../vault/full.js').then(async F => {
      const ok = await F.canShowFull(cd);
      if (n !== paintN || destroyed) return;
      if (!ok) { gilded(); return; }
      if (fullMounted) { fullMounted.destroy(); fullMounted = null; }
      const m = F.mountFullCard(els.card, cd, who);
      fullMounted = { ...m, cd }; heroSig = sig;
      // (the hero: a tap opens the full card's own animated view — it scrolls away like any panel; only on-screen art moves)
      m.el.classList.add('pf-hero'); m.el.setAttribute('role', 'button'); m.el.tabIndex = 0;
      const open = () => F.openFullCard(cd, who);
      m.el.addEventListener('click', open);
      m.el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    }).catch(() => { if (n === paintN && !destroyed) gilded(); });
  }
  // THE VAULT 1B: the card you EQUIP is your profile's card — its FULL CARD once the owner has approved it in THE CARD LAB (the Gilded
  // membership card stands until then, and for the Gilded itself)
  function paintCard() {
    paintHero(data.profile, data.stats.xp, data.stats.st, data.stats.it && data.profile && data.stats.it[data.profile.cd]);
    els.cz.replaceChildren(customizeBar(data, { name: data.profile.n || (loadProfile() || {}).name || '', onWear: wear, onYou: () => { if (!destroyed) load(); } }));
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
    unmount() { destroyed = true; if (fullMounted) { fullMounted.destroy(); fullMounted = null; } document.body.classList.remove('pf-on'); closeAllPfSheets(); },
  };
}
