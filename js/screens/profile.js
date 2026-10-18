// The profile: a membership card to the speakeasy. Glass card with the avatar, name tag, rank emblem and an XP bar
// that fills with light; the profile key as a secret password card (tap to reveal, copy, a new key); "Show me on
// global leaderboards"; and per-game cards (wins, win rate, highlights, records, weekly and all-time ranks).
// promptKey(): the gentle reminder sheet after a player's first few matches.
import { h, reducedMotion } from '../ui/dom.js';
import { avatar } from '../ui/components.js';
import { emblem, RANK_COLORS } from '../ui/emblems.js';
import { toast } from '../ui/toast.js';
import { setState } from '../store.js';
import { loadProfile, loadMe } from '../identity.js';
import { GAMES, colorHex } from '../config.js';
import { RANKS, progress } from '../core/ranks.js';
import { fmtTag } from '../core/names.js';
import { careerBoards, recordBoards, boardDef, fmtValue, MIN_WR_GAMES, winRate } from '../core/boards.js';
import { fetchMe, myRanks, myKey, regenKey, restoreKey, setShown, setNotes, notes } from '../profile/me.js';
import { GAME_LIGHT } from '../board/view.js';
import { boardSfx } from '../board/audio.js';
import { sfx } from '../audio/sfx.js';
import { settings } from '../audio/settings.js';

const HL = { gridlock: [['sunk', 'FLEETS SUNK'], ['w_classic', 'CLASSIC WINS'], ['w_salvo', 'SALVO WINS'], ['w_royale', 'ROYALE WINS'], ['w_arcade', 'ARCADE WINS']], agent: [['esc', 'ESCAPES'], ['spot', 'AGENTS CAUGHT']], signal: [['el', 'ELIMINATIONS']], bluff: [['fool', 'PLAYERS FOOLED']], prism: [['ko', 'KNOCKOUTS']] };
const num = n => Math.round(n || 0).toLocaleString('en-US');
const reduced = () => !!settings.reducedFx || reducedMotion();
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** The membership card itself (also used by the key prompt). */
function memberCard(pub, local, xp) {
  const p = pub || { n: local.name, t: null, a: local.avatar, c: local.color, r: 0, x: 0 };
  const pr = progress(xp ?? p.x ?? 0);
  const fill = h('span.pf-xp-fill', { style: { '--f': String(pr.frac) } });
  const card = h('div.pf-card', { style: { '--c': colorHex(p.c), '--rk': RANK_COLORS[pr.i] } },
    h('span.pf-holo', { 'aria-hidden': 'true' }),
    h('div.pf-card-top', h('span.pf-brand', 'NEON SPEAKEASY'), h('span.pf-member', 'MEMBER')),
    h('div.pf-card-mid',
      h('div.pf-av', avatar(p.a, p.c, 70)),
      h('div.pf-id',
        h('div.pf-name', p.n || 'PLAYER'),
        h('div.pf-tag', p.t ? fmtTag(p.t) : 'MEMBERSHIP PENDING'),
        h('div.pf-rank', pr.rank.name)),
      h('div.pf-emb.rk-big', emblem(pr.i, 82))),
    h('div.pf-xp',
      h('div.pf-xp-bar', fill, h('span.pf-xp-glint')),
      h('div.pf-xp-row',
        h('span', h('b', num(xp ?? p.x)), ' XP'),
        h('span', pr.next ? `${num(pr.need)} TO ${pr.next.name}` : 'THE TOP OF THE HOUSE'))));
  requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('is-lit')));
  return card;
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

const KEY_WHY = 'Your profile lives on this device. Switching phones, clearing browser data, or moving between Safari and the Home Screen app on iPhone needs this key — save it in your notes or a password manager. Never share it: whoever has it is you.';

export function createView() {
  const els = {};
  let data = null, destroyed = false;

  function mount(el) {
    el.classList.add('pf-screen');
    els.card = h('div.pf-card-slot');
    els.games = h('div.pf-games');
    els.show = h('input.pf-switch-in', { type: 'checkbox', role: 'switch', checked: true, onchange: onShow });
    els.restore = h('div.pf-restore');
    els.foot = h('div.pf-foot');
    el.append(
      h('header.bar',
        h('button.icon-btn', { type: 'button', 'aria-label': 'Back', onclick: back }, '‹'),
        h('div.bar-title', 'MEMBERSHIP')),
      h('div.pf-scroll',
        els.card,
        h('div.pf-actions',
          h('button.btn.btn-ghost', { type: 'button', onclick: () => setState({ view: 'setup', setupMode: 'edit' }) }, h('span', 'EDIT PROFILE')),
          h('button.btn.btn-ghost', { type: 'button', onclick: () => setState({ view: 'board' }) }, h('span', 'THE BOARD'))),
        h('section.pf-sec',
          els.key = keyCard({ onNew: () => {} }),
          h('p.pf-why', KEY_WHY),
          els.restore),
        h('section.pf-sec',
          h('label.pf-switch', h('span.pf-switch-l', h('b', 'Show me on global leaderboards'), h('small', 'Off: your stats still count, only you see them.')), els.show, h('span.pf-switch-ui', { 'aria-hidden': 'true' }))),
        h('section.pf-sec', h('h3.pf-h', 'YOUR GAMES'), els.games),
        els.foot));
    renderRestore(false);
    paintLocal();
    load();
  }

  function back() { try { sessionStorage.setItem('nd:back', '1'); } catch { /* fine */ } setState({ view: 'title' }); }

  function paintLocal() {
    const m = loadMe();
    els.card.replaceChildren(memberCard(m && m.profile, loadProfile() || {}, m && m.profile ? m.profile.x : 0));
    els.games.replaceChildren(h('div.pf-loading', 'Loading your record…'));
  }

  async function load() {
    try {
      data = await fetchMe();
      if (destroyed) return;
      els.card.replaceChildren(memberCard(data.profile, loadProfile() || {}, data.stats.xp));
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
      els.restore.replaceChildren(h('button.pf-link', { type: 'button', onclick: () => renderRestore(true) }, 'Have a key from another device? Use it here'));
      return;
    }
    const input = h('input.input.pf-key-in', { type: 'text', placeholder: 'NEON-XXXX-XXXX-XXXX', autocapitalize: 'characters', autocomplete: 'off', spellcheck: false, 'aria-label': 'Profile key', maxLength: 24 });
    const go = h('button.btn.btn-primary.btn-block', { type: 'button', onclick: async () => {
      go.classList.add('is-busy');
      try {
        const r = await restoreKey(input.value);
        toast(`WELCOME BACK, ${r.profile.n.toUpperCase()}`, 'ok');
        sfx('join');
        renderRestore(false);
        els.key.replaceWith(els.key = keyCard());
        paintLocal();
        load();
      } catch (e) { toast(e.message || 'THAT KEY DIDN’T WORK', 'err'); sfx('invalid'); } finally { go.classList.remove('is-busy'); }
    } }, h('span', 'RESTORE MY PROFILE'));
    els.restore.replaceChildren(h('div.pf-restore-box',
      h('p.pf-why', 'This device takes over the profile the key belongs to — with all its stats. The profile this device has now is replaced (if it never finished a match, it’s removed).'),
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
  sheet = h('div.modal.pf-prompt', { onclick: e => { if (e.target === sheet) close(); } },
    h('div.sheet', { role: 'dialog', 'aria-label': 'Save your profile key' },
      h('div.sheet-grip'),
      h('div.pf-prompt-head', m && m.profile ? h('span.rk-big', emblem(m.profile.r | 0, 54)) : null,
        h('div', h('div.sheet-kicker', 'YOUR MEMBERSHIP'), h('h2.sheet-title', 'Save your key'))),
      h('p.pf-why', KEY_WHY),
      keyCard(),
      h('div.pf-prompt-actions',
        h('button.btn.btn-primary.btn-block', { type: 'button', onclick: () => { setNotes({ saved: true }); close(); toast('NICE — YOUR RECORD IS SAFE', 'ok'); } }, h('span', 'I’VE SAVED IT')),
        h('button.btn.btn-text.btn-block', { type: 'button', onclick: close }, 'LATER'))));
  document.body.append(sheet);
  if (!reduced()) boardSfx('pb');
}
