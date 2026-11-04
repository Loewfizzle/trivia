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
import { GAMES } from '../config.js';
import { weeklyGoal, goalProgress, GOAL_XP, mastery } from '../core/ranks.js';
import { levelOf } from '../core/levels.js';
import { gildedCard } from '../progress/card.js';
import { progressSections, customizeBar } from '../progress/profile.js';
import { birthdayRow } from '../progress/extras.js';
import { openStreakCard } from '../progress/streak-card.js';
import { pgSheet } from '../progress/look.js';
import { BOARD_GAMES } from '../core/boards.js';
import { weekKey, weekEndsAt } from '../core/week.js';
import { careerBoards, recordBoards, boardDef, fmtValue, MIN_WR_GAMES, winRate } from '../core/boards.js';
import { fetchMe, myRanks, myKey, regenKey, restoreKey, setShown, setNotes, notes, setStyle, keyOffer, keepNewKey } from '../profile/me.js';
import { GAME_LIGHT } from '../board/view.js';
import { boardSfx } from '../board/audio.js';
import { sfx } from '../audio/sfx.js';
import { settings } from '../audio/settings.js';
import { memberLabel } from '../core/member.js';

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

export function createView({ onBack = null, overlay = false } = {}) {
  const els = {};
  let data = null, destroyed = false;

  function mount(el) {
    el.classList.add('pf-screen');
    els.card = h('div.pf-card-slot');
    els.games = h('div.pf-games');
    els.show = h('input.pf-switch-in', { type: 'checkbox', role: 'switch', checked: true, onchange: onShow });
    els.restore = h('div.pf-restore');
    els.foot = h('div.pf-foot');
    els.why = h('div.pf-why-slot');
    // THE VAULT 2C — THE PROFILE REARRANGED (the owner's approved mock, with the FULL CARD on top): 1 YOUR FULL CARD + CUSTOMIZE YOUR CARD ·
    // 2 LEVEL · 3 THE STREAK · 4 STATS (+ this week's goal) · 5 ACHIEVEMENTS (trophies) · 6 CITY SIGHTINGS · 7 MASTERY + YOUR GAMES · 8 ACCOUNT
    // (EDIT PROFILE · YOUR KEY · BIRTHDAY — one line once set · the opt-out). No BOARD button here: the dock's trophy has it.
    els.cz = h('div.pf-cz-slot');
    els.bday = h('div.pf-bday-slot');
    el.append(
      h('header.bar',
        h('button.icon-btn', { type: 'button', 'aria-label': 'Back', onclick: back }, '‹'),
        h('div.bar-title', 'MEMBERSHIP')),
      h('div.pf-scroll',
        els.card,
        els.cz,
        els.why,
        els.prog = h('div.pf-prog'),
        h('section.pf-sec.pf-games-sec', h('h3.pf-h', 'YOUR GAMES'), els.games),
        h('section.pf-sec.pf-account',
          h('h3.pf-h', 'ACCOUNT'),
          overlay ? null : h('button.pf-acc-row', { type: 'button', onclick: () => setState({ view: 'setup', setupMode: 'edit' }) }, h('b', 'Edit profile'), h('span', 'name · colour ›')),
          h('div.pf-acc-key',
            els.save = h('div.byc-save-slot'),
            els.key = keyCard({ onNew: () => paintSave() }),
            h('p.pf-why', KEY_WHY),
            els.elsewhere = h('button.btn.btn-ghost.btn-block.byc-else-btn', { type: 'button', onclick: () => import('../profile/bring.js').then(B => B.openElsewhere()) }, h('span', 'USE THIS CARD ON ANOTHER DEVICE')),
            els.restore),
          els.bday,
          h('label.pf-switch', h('span.pf-switch-l', h('b', 'Show me on global leaderboards'), h('small', 'Off: your stats still count, only you see them.')), els.show, h('span.pf-switch-ui', { 'aria-hidden': 'true' }))),
        els.foot));
    renderRestore(false);
    paintLocal();
    paintSave();
    load();
  }
  // THE VAULT 1A — SAVE YOUR KEY SOMEWHERE SAFE (bold until saved) + USE THIS CARD ON ANOTHER DEVICE (only with a key on this device)
  function paintSave() {
    if (els.elsewhere) els.elsewhere.hidden = !loadKey();
    import('../profile/bring.js').then(B => { if (!destroyed && els.save) els.save.replaceChildren(B.saveBox()); }).catch(() => {});
  }

  function back() { if (onBack) { onBack(); return; } try { sessionStorage.setItem('nd:back', '1'); } catch { /* fine */ } setState({ view: 'title' }); }

  function paintLocal() {
    // (PERF-A — FR5 E1: a cached profile made for ANOTHER login is never painted as the member)
    const m0 = loadMe(), m = m0 && m0.uid === state.uid ? m0 : null;
    els.card.replaceChildren(memberCard(m && m.profile, loadProfile() || {}, m && m.profile ? m.profile.x : 0, { onFlame: () => openStreakCard(null) }));
    els.games.replaceChildren(h('div.pf-loading', 'Loading your record…'));
    paintWhy(m0);
  }
  /** PERF-A — THE CARD SAYS WHY (the Oct 31 scare: a blank card that looked like a wiped account): the key offer (a new profile was made
   *  while this device held a key), a sign-in that changed, or nothing saved on this ADDRESS (another origin is another storage) */
  function paintWhy(m0) {
    const off = keyOffer();
    if (off) {
      const go = h('button.btn.btn-primary.btn-block', { type: 'button', onclick: () => doRestore(off.key, go) }, h('span', 'RESTORE IT'));
      els.why.replaceChildren(h('div.pf-note.is-offer',
        h('b', 'THIS DEVICE ALREADY HAD A KEY — RESTORE IT?'),
        h('p', 'A new profile was made on this device, but the key it already had is kept. Restore it to get that profile + its stats back.'),
        go,
        h('button.pf-link', { type: 'button', onclick: () => { keepNewKey(); toast('KEPT THE NEW PROFILE — THE OLD KEY STILL WORKS IF YOU ENTER IT', 'info', 5200); els.key.replaceWith(els.key = keyCard()); paintWhy(loadMe()); } }, 'No — keep the new profile')));
      return;
    }
    if (m0 && m0.uid !== state.uid && loadKey()) {
      const go = h('button.btn.btn-primary.btn-block', { type: 'button', onclick: () => doRestore(loadKey(), go) }, h('span', 'RESTORE WITH YOUR KEY'));
      els.why.replaceChildren(h('div.pf-note', h('b', 'THIS DEVICE’S SIGN-IN CHANGED'), h('p', 'Your key is still here — restore it to bring your profile back.'), go));
      return;
    }
    if (!m0 && !loadKey()) {
      const go = h('button.btn.btn-primary.btn-block', { type: 'button', onclick: () => import('../profile/bring.js').then(B => B.openBring({ onDone: () => { renderRestore(false); els.key.replaceWith(els.key = keyCard()); paintLocal(); paintSave(); load(); } })) }, h('span', 'BRING YOUR CARD'));
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
      renderRestore(false);
      els.key.replaceWith(els.key = keyCard());
      paintLocal();
      paintSave();
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
      els.show.checked = !!data.priv.shown;
      els.show.disabled = !!data.priv.banned;
      els.foot.replaceChildren(
        h('span', `MEMBER SINCE ${since(data)}`),
        h('button.pf-pid', { type: 'button', title: 'Your profile id (for the admin page)', onclick: () => { navigator.clipboard && navigator.clipboard.writeText(data.pid).then(() => toast('PROFILE ID COPIED', 'ok')).catch(() => {}); } }, `ID ${data.pid}`));
      await paintGames();
    } catch (e) {
      if (destroyed) return;
      els.games.replaceChildren(h('div.pf-loading.is-off', e.status === 404 ? 'Finish a match and your membership is made — automatically, no signup.' : 'The membership office is closed right now — your games still count and land here when it opens.'));
    }
  }

  // THE VAULT 1B: the card you WEAR is your profile's card — its FULL CARD once the owner has approved it in THE CARD LAB (the Gilded
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
  // PROGRESSION A: the level, the stats, the streak, the achievements, THE VAULT (only what you own) — then this week's goal + mastery
  function paintProgress() {
    const s = data.stats;
    const now = Date.now();
    const local = loadProfile() || {};
    const goal = weeklyGoal(s.wk || weekKey(now), BOARD_GAMES);
    const gp = goalProgress(goal, s.gw);
    const paid = s.gd === (s.wk || weekKey(now));
    const days = Math.max(1, Math.ceil((weekEndsAt(now) - now) / 86_400_000));
    const gname = goal.game ? (GAMES.find(g => g.id === goal.game) || {}).name : null;
    const goalEl = h('div.pf-goal', { class: paid ? 'is-done' : '' },
      h('div.pf-goal-h', h('span', 'THIS WEEK’S GOAL'), h('span', paid ? 'DONE' : `${days} DAY${days > 1 ? 'S' : ''} LEFT`)),
      h('b', goal.kind === 'game' ? `Play 4 matches of ${gname}` : goal.text),
      h('div.pf-goal-bar', h('i', { style: { transform: `scaleX(${gp.have / gp.n})` } })),
      h('div.pf-goal-f', h('span', `${gp.have} / ${gp.n}`), h('span', paid ? `+${GOAL_XP} XP EARNED` : `+${GOAL_XP} XP`)));
    const g = s.g || {};
    const tiles = GAMES.filter(x => BOARD_GAMES.includes(x.id) && x.playable !== false).map(x => {
      const m = mastery(g[x.id]);
      return h('div.pf-mast', { class: m.lvl ? '' : 'is-none', style: { '--a1': (GAME_LIGHT[x.id] || ['#fff'])[0], '--f': String(m.frac) }, title: m.lvl ? `${x.name}: level ${m.lvl}${m.max ? ' (max)' : `, ${m.need} to the next`}` : `${x.name}: not played yet` },
        h('span.pf-mast-ring', h('b', m.lvl ? String(m.lvl) : '—')), h('span.pf-mast-n', x.name));
    });
    const secs = progressSections(data, { name: data.profile.n || local.name || '', now, onFlame: () => openStreakCard(s.st), onWear: wear });
    const at = secs.findIndex(e => e.classList.contains('pg-stats'));
    secs.splice(at + 1, 0, goalEl);   // (this week's goal beside the stats)
    els.prog.replaceChildren(
      h('div.pg-prof', ...secs),
      h('section.pf-sec.pf-mastery', h('h3.pf-h', 'MASTERY'), h('div.pf-mast-grid', ...tiles)));
    els.bday.replaceChildren(birthdayRow(data, { now }));
  }

  // wear something you own (the server checks it): a card · a name glow · a tube style · an emblem shape ('' = take it off)
  async function wear(slot, id) {
    try {
      const prof = await setStyle({ [slot]: id });
      // (THE VAULT 2C — a sign-up shape worn in CUSTOMIZE: this device's own identity follows — the rooms show it)
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

  async function paintGames() {
    const g = data.stats.g || {};
    const played = GAMES.filter(x => g[x.id] && g[x.id].p > 0).sort((a, b) => g[b.id].p - g[a.id].p);
    const unplayed = GAMES.filter(x => !(g[x.id] && g[x.id].p > 0));
    // ranks for every played game's WINS + the records the player holds
    const boards = [];
    for (const x of played) {
      boards.push(`${x.id}-wins`);
      for (const b of Object.keys(data.stats.b || {})) if (boardDef(b) && boardDef(b).game === x.id) boards.push(b);
    }
    let ranks = {};
    try { if (boards.length) ranks = await myRanks(boards); } catch { ranks = {}; }
    if (destroyed) return;
    els.games.replaceChildren(
      ...played.map((x, i) => gameCard(x, g[x.id], (data.stats.gw || {})[x.id], ranks, i)),
      unplayed.length ? h('div.pf-unplayed', h('span', 'NOT PLAYED YET'), h('div', ...unplayed.map(x => h('span.pf-chip', { style: { '--a1': GAME_LIGHT[x.id][0] } }, x.name))))
        : null);
    if (!played.length) els.games.prepend(h('div.pf-loading', 'Your games appear here after your first match.'));
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

  function renderRestore(open) {
    if (!open) {
      els.restore.replaceChildren(h('button.pf-link', { type: 'button', onclick: () => renderRestore(true) }, 'Have a key from another device? Bring that card here'));
      return;
    }
    const input = h('input.input.pf-key-in', { type: 'text', placeholder: 'NEON-XXXX-XXXX-XXXX', autocapitalize: 'characters', autocomplete: 'off', spellcheck: false, 'aria-label': 'Profile key', maxLength: 24 });
    const go = h('button.btn.btn-primary.btn-block', { type: 'button', onclick: () => doRestore(input.value, go) }, h('span', 'RESTORE MY PROFILE'));
    els.restore.replaceChildren(h('div.pf-restore-box',
      h('p.pf-why', 'This device joins the card the key belongs to — with all its stats; the other device stays signed in. The profile this device has now is replaced (if it never finished a match, it’s removed).'),
      input, go,
      h('button.pf-link', { type: 'button', onclick: () => renderRestore(false) }, 'Cancel')));
    setTimeout(() => input.focus(), 50);
  }

  return {
    mount,
    update() {},
    unmount() { destroyed = true; },
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
