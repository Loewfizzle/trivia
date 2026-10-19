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
import { RANKS, progress, step, streakPct, weeklyGoal, goalProgress, GOAL_XP, mastery, FINISHES, GLOWS, worn, isUnlocked, stepNameAt } from '../core/ranks.js';
import { BOARD_GAMES } from '../core/boards.js';
import { dayKey, weekKey, weekEndsAt } from '../core/week.js';
import { fmtTag } from '../core/names.js';
import { careerBoards, recordBoards, boardDef, fmtValue, MIN_WR_GAMES, winRate } from '../core/boards.js';
import { fetchMe, myRanks, myKey, regenKey, restoreKey, setShown, setNotes, notes, setStyle } from '../profile/me.js';
import { GAME_LIGHT } from '../board/view.js';
import { boardSfx } from '../board/audio.js';
import { sfx } from '../audio/sfx.js';
import { settings } from '../audio/settings.js';

const HL = { gridlock: [['sunk', 'FLEETS SUNK'], ['w_classic', 'CLASSIC WINS'], ['w_salvo', 'SALVO WINS'], ['w_royale', 'ROYALE WINS'], ['w_arcade', 'ARCADE WINS']], agent: [['esc', 'ESCAPES'], ['spot', 'AGENTS CAUGHT']], signal: [['el', 'ELIMINATIONS']], bluff: [['fool', 'PLAYERS FOOLED']], prism: [['ko', 'KNOCKOUTS']] };
const num = n => Math.round(n || 0).toLocaleString('en-US');
const reduced = () => !!settings.reducedFx || reducedMotion();
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** The membership card itself (also used by the key prompt, THE VAULT and the preview page). */
const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.append(...kids); return e; };
// an engraved guilloche rosette (hypotrochoid bands) and fine wave lines: drawn once, the finish colours them
let guilloPaths = null;
function guilloche() {
  if (!guilloPaths) {
    const rose = (R0, r, d, cx, cy, steps = 900) => {
      let p = '';
      for (let i = 0; i <= steps; i++) { const t = (i / steps) * Math.PI * 2 * r; const x = cx + (R0 - r) * Math.cos(t) + d * Math.cos(((R0 - r) / r) * t); const y = cy + (R0 - r) * Math.sin(t) - d * Math.sin(((R0 - r) / r) * t); p += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
      return p;
    };
    const waves = [];
    for (let k = 0; k < 9; k++) { let p = ''; for (let x = 0; x <= 320; x += 4) { const y = 150 + k * 5 + Math.sin(x / 18 + k * 0.7) * 6 + Math.sin(x / 47) * 4; p += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1); } waves.push(p); }
    guilloPaths = { roses: [rose(70, 7, 40, 248, 70), rose(52, 5, 30, 248, 70), rose(34, 3, 18, 248, 70)], waves };
  }
  return svg('svg', { class: 'pf-c-guil', viewBox: '0 0 320 202', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' },
    ...guilloPaths.roses.map(d => svg('path', { d })), ...guilloPaths.waves.map(d => svg('path', { d, class: 'w' })));
}
// the deco frame: a fine inner border with fan corners
function decoFrame() {
  const fan = (x, y, sx, sy) => svg('g', { transform: `translate(${x} ${y}) scale(${sx} ${sy})` },
    svg('path', { d: 'M0 22 A22 22 0 0 1 22 0' }), svg('path', { d: 'M0 15 A15 15 0 0 1 15 0' }), svg('path', { d: 'M0 8 A8 8 0 0 1 8 0' }),
    svg('path', { d: 'M0 0 L13 13' }));
  return svg('svg', { class: 'pf-c-frame', viewBox: '0 0 320 202', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
    svg('rect', { x: 7, y: 7, width: 306, height: 188, rx: 12 }),
    svg('rect', { x: 11, y: 11, width: 298, height: 180, rx: 9, class: 'thin' }),
    fan(11, 11, 1, 1), fan(309, 11, -1, 1), fan(11, 191, 1, -1), fan(309, 191, -1, -1));
}

/** opts: { fin, glow, mini (no text block: THE VAULT's swatches), tilt (follow the finger) } */
export function memberCard(pub, local, xp, opts = {}) {
  const p = pub || { n: local.name, t: null, a: local.avatar, c: local.color, r: 0, x: 0 };
  const X = xp ?? p.x ?? 0;
  const pr = progress(X);
  const sp = step(X);
  const w = worn(X, opts.fin ?? p.f, opts.glow ?? p.g);
  const fin = opts.fin || w.f, glow = opts.glow || w.g;
  const fill = h('span.pf-xp-fill', { style: { '--f': String(sp.frac) } });
  const light = h('span.pf-c-light', { 'aria-hidden': 'true' });
  const card = h('div.pf-card', { class: opts.mini ? 'is-mini' : '', dataset: { fin }, style: { '--c': colorHex(p.c), '--rk': RANK_COLORS[pr.i] } },
    h('span.pf-c-base', { 'aria-hidden': 'true' }, h('span.pf-c-flow'), h('span.pf-c-flow.b')),
    guilloche(),
    decoFrame(),
    h('span.pf-c-sheen', { 'aria-hidden': 'true' }),
    h('span.pf-holo', { 'aria-hidden': 'true' }),
    light,
    opts.mini ? null : h('div.pf-card-top', h('span.pf-brand', 'NEON SPEAKEASY'), h('span.pf-member', 'MEMBER')),
    opts.mini ? null : h('div.pf-card-mid',
      h('div.pf-av', avatar(p.a, p.c, 70)),
      h('div.pf-id',
        h('div.pf-name', { class: `nm-glow-${glow}` }, p.n || 'PLAYER'),
        h('div.pf-tag', p.t ? fmtTag(p.t) : 'MEMBERSHIP PENDING'),
        h('div.pf-rank', sp.name)),
      h('div.pf-emb.rk-big', emblem(pr.i, 82))),
    opts.mini ? null : h('div.pf-xp',
      h('div.pf-xp-bar', fill, h('span.pf-xp-glint')),
      h('div.pf-xp-row',
        h('span', h('b', num(X)), ' XP'),
        h('span', sp.nextName ? `${num(sp.need)} TO ${sp.nextName}` : 'THE TOP OF THE HOUSE'))));
  requestAnimationFrame(() => requestAnimationFrame(() => {
    card.classList.add('is-lit');
    // a long name shrinks to fit (measured once, when the card is on screen)
    const nm = card.querySelector('.pf-name');
    if (nm && nm.isConnected) { let fs = parseFloat(getComputedStyle(nm).fontSize) || 24; while (nm.scrollWidth > nm.clientWidth + 1 && fs > 13) { fs -= 1; nm.style.fontSize = `${fs}px`; } }
  }));
  // the tilt: the card leans toward the finger and the light follows it (transforms only; measured once per press)
  if (opts.tilt !== false && !opts.mini && !reduced()) {
    let rect = null;
    const move = e => {
      if (!rect) rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5, y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${(x * 10).toFixed(2)}deg) rotateX(${(-y * 8).toFixed(2)}deg)`;
      light.style.transform = `translate(${(x * 100).toFixed(1)}%, ${(y * 100).toFixed(1)}%)`;
      card.classList.add('is-tilt');
    };
    const leave = () => { rect = null; card.style.transform = ''; light.style.transform = ''; card.classList.remove('is-tilt'); };
    card.addEventListener('pointerenter', () => { rect = null; });
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', leave);
    card.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') leave(); });
    card.addEventListener('pointercancel', leave);
  }
  return card;
}

/** THE VAULT: every finish and glow; the unlocked ones to wear, the locked ones as what's coming. */
export function vault({ pub, local, xp, onWear }) {
  const X = xp ?? (pub && pub.x) ?? 0;
  const w = worn(X, pub && pub.f, pub && pub.g);
  const total = FINISHES.length + GLOWS.length - 1;
  const have = FINISHES.filter(x => isUnlocked(x, X)).length + GLOWS.filter(x => x.id !== 'none' && isUnlocked(x, X)).length;
  const next = [...FINISHES, ...GLOWS].filter(x => !isUnlocked(x, X)).sort((a, b) => a.at - b.at)[0];
  const fins = FINISHES.map(it => {
    const open = isUnlocked(it, X);
    const on = open && w.f === it.id;
    return h('button.pf-vf', { type: 'button', class: [open ? 'is-open' : 'is-locked', on ? 'is-on' : ''].join(' '), 'aria-label': open ? `${it.name}${on ? ', wearing' : ', tap to wear'}` : `${it.name}, unlocks at ${stepNameAt(it.at)}`,
      onclick: () => { if (open && !on) onWear({ f: it.id }); } },
      memberCard(pub, local || {}, X, { fin: it.id, mini: true }),
      h('span.pf-vf-lock', { 'aria-hidden': 'true' }),
      h('span.pf-vf-n', it.name),
      h('span.pf-vf-s', on ? 'WEARING' : open ? 'WEAR' : stepNameAt(it.at)));
  });
  const name = (pub && pub.n) || (local && local.name) || 'PLAYER';
  const glows = GLOWS.map(it => {
    const open = isUnlocked(it, X);
    const on = open && w.g === it.id;
    return h('button.pf-vg', { type: 'button', class: [open ? 'is-open' : 'is-locked', on ? 'is-on' : ''].join(' '), 'aria-label': open ? `${it.name} glow${on ? ', wearing' : ', tap to wear'}` : `${it.name} glow, unlocks at ${stepNameAt(it.at)}`,
      onclick: () => { if (open && !on) onWear({ g: it.id }); } },
      h('span.pf-vg-name', { class: `nm-glow-${it.id}` }, name),
      h('span.pf-vf-n', it.name),
      h('span.pf-vf-s', on ? 'WEARING' : open ? 'WEAR' : stepNameAt(it.at)));
  });
  return h('section.pf-sec.pf-vault',
    h('div.pf-vault-h', h('h3.pf-h', 'THE VAULT'), h('span', `${have} / ${total} UNLOCKED`)),
    next ? h('p.pf-vault-next', 'Next: ', h('b', next.name), ` at ${stepNameAt(next.at)}`) : h('p.pf-vault-next', 'Every piece in the vault is yours.'),
    h('div.pf-vh', 'CARD FINISHES'),
    h('div.pf-vf-row', ...fins),
    h('div.pf-vh', 'NAME GLOWS · ON YOUR CARD AND IN EVERY LOBBY'),
    h('div.pf-vg-row', ...glows));
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

const KEY_WHY = 'Your profile lives on this device. Switching phones, clearing browser data, or moving between Safari and the Home Screen app on iPhone needs this key — save it in your notes or a password manager. Never share it: whoever has it is you.';

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
    el.append(
      h('header.bar',
        h('button.icon-btn', { type: 'button', 'aria-label': 'Back', onclick: back }, '‹'),
        h('div.bar-title', 'MEMBERSHIP')),
      h('div.pf-scroll',
        els.card,
        overlay ? null : h('div.pf-actions',
          h('button.btn.btn-ghost', { type: 'button', onclick: () => setState({ view: 'setup', setupMode: 'edit' }) }, h('span', 'EDIT PROFILE')),
          h('button.btn.btn-ghost', { type: 'button', onclick: () => setState({ view: 'board' }) }, h('span', 'THE BOARD'))),
        els.prog = h('div.pf-prog'),
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

  function back() { if (onBack) { onBack(); return; } try { sessionStorage.setItem('nd:back', '1'); } catch { /* fine */ } setState({ view: 'title' }); }

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

  // the nightly streak, this week's goal and per-game mastery
  function paintProgress() {
    const s = data.stats;
    const now = Date.now();
    const st = s.st || null;
    const alive = st && (st.d === dayKey(now) || st.d === dayKey(now - 86_400_000));
    const n = alive ? st.n || 1 : 0;
    const tonight = st && st.d === dayKey(now);
    const pct = Math.round(streakPct(n + (tonight ? 0 : 1)) * 100);
    const streak = h('div.pf-streak', { class: n >= 2 ? 'is-hot' : '' },
      h('span.pf-flame', { 'aria-hidden': 'true' }),
      h('div', h('b', n ? `${n}-NIGHT STREAK` : 'NO STREAK YET'),
        h('span', n && tonight ? (pct ? `Tonight's matches earn +${Math.round(streakPct(n) * 100)}% XP` : 'Play tomorrow night to start the bonus')
          : n ? `Play tonight to keep it — +${pct}% XP` : 'Play two nights in a row: +10% XP a night, up to +40%')));
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
    const tiles = GAMES.filter(x => BOARD_GAMES.includes(x.id)).map(x => {
      const m = mastery(g[x.id]);
      return h('div.pf-mast', { class: m.lvl ? '' : 'is-none', style: { '--a1': (GAME_LIGHT[x.id] || ['#fff'])[0], '--f': String(m.frac) }, title: m.lvl ? `${x.name}: level ${m.lvl}${m.max ? ' (max)' : `, ${m.need} to the next`}` : `${x.name}: not played yet` },
        h('span.pf-mast-ring', h('b', m.lvl ? String(m.lvl) : '—')), h('span.pf-mast-n', x.name));
    });
    els.prog.replaceChildren(streak, goalEl, vaultEl(), h('section.pf-sec.pf-mastery', h('h3.pf-h', 'MASTERY'), h('div.pf-mast-grid', ...tiles)));
  }

  function vaultEl() {
    return vault({ pub: data.profile, local: loadProfile() || {}, xp: data.stats.xp, onWear: async patch => {
      try {
        const prof = await setStyle(patch);
        if (destroyed) return;
        data.profile = { ...data.profile, ...prof };
        sfx('select');
        els.card.replaceChildren(memberCard(data.profile, loadProfile() || {}, data.stats.xp));
        els.prog.querySelector('.pf-vault').replaceWith(vaultEl());
      } catch (e) { toast(e.code === 'locked' ? 'NOT UNLOCKED YET' : 'THE VAULT IS CLOSED RIGHT NOW', 'err'); }
    } });
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
