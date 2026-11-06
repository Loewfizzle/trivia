// PROGRESSION A — THE PREVIEWS: every screen with scripted data, no match needed. The live site: ?preview=moment | card | streak (flame — the dock's streak — gone, SHELL 2.0 B1)
// (title.js opens it over the city; nothing is written, nothing is sent — a preview never counts). The look page:
// tests/integration/progress-preview.html?view=… (no Firebase). Flags: &at=end · &up=0 · &card=<card id> · &streak=N · &state=lit|waiting|frozen
// · &cards=1 (every card look) · &rm=1 (reduced motion).
import { h } from '../ui/dom.js';
import { XP_AT, rewardsUpTo } from '../core/levels.js';
import { dayOf, dayNum, streakDay } from '../core/streak.js';
import { ITEMS } from '../core/items.js';
import { setPctForTest } from './look.js';

// (&name= — THE VAULT 1B: the longest names (NAME_MAX 12, e.g. WWWWWWWWWWWW / LOEWFIZZLE) on the card + the strips)
const NAME = (() => { try { return (new URLSearchParams(location.search).get('name') || 'BEN').slice(0, 12).toUpperCase(); } catch { return 'BEN'; } })();
/** a streak of n nights as the server keeps it (lit tonight / waiting / frozen yesterday) */
export function sampleStreak(n = 7, state = 'lit', now = Date.now()) {
  const T = dayNum(streakDay(now)), last = state === 'lit' ? T : state === 'frozen' ? T - 2 : T - 1;
  const hh = {};
  for (let i = 0; i < Math.min(n, 14); i++) hh[dayOf(last - i)] = 1;
  if (n >= 3) hh[dayOf(last - 2)] = 2;   // one night covered by a freeze, this week
  return { n, d: dayOf(last), b: Math.max(n, 12), f: state === 'frozen' ? 1 : 1, fn: 10, h: hh, w: null, wm: null };
}
export function sampleProfile(q = new URLSearchParams()) {
  const xp = XP_AT[23] + 260;
  const it = {}; let t = 1;
  for (const id of rewardsUpTo(23)) it[id] = t++;
  for (const id of ['glow-ember', 'emb-key', 'card-brushed', 'card-founder', 'flame-full', 'glow-afterglow', 'emb-owl', 'tube-breath', 'tube-chase', 'glow-gold', 'glow-spark', 'emb-snowflake', 'card-inferno', 'card-prism', 'card-marquee', 'card-glitter', 'card-camo', 'card-zebra', 'card-platinum', 'emb-torch', 'emb-house', 'emb-lightning', 'emb-prism', 'emb-sweetheart', 'emb-sg-tr3b', 'tube-twotone']) it[id] = t++;
  // (THE VAULT 2B: &dev=1 — the owner's own: THE TWO DEV CARDS + Nº 0001)
  if (q.get('dev') === '1') { it['card-dev-switchboard'] = t++; it['card-dev-source'] = t++; }   // (2A: the samples' tube styles, glows + an ice emblem)
  // (PROGRESSION B: three CITY SIGHTINGS spotted — their pairs; the album shows the prints the owner's &sgdemo links took on this device)
  const sgAt = Date.UTC(2026, 10, 2, 3, 14);
  for (const [k, id] of ['ufo', 'skull', 'btc'].entries()) { it[`card-sg-${id}`] = sgAt + k * 864e5; it[`emb-sg-${id}`] = sgAt + k * 864e5; }
  const ac = { 'first-round': 1, 'house-warming': 2, 'top-shelf': 3, 'night-owl': 4 };
  const n = Number(q.get('streak') || 7);
  return {
    pid: 'ppreview00000',
    priv: { bd: q.get('bd') === '0' ? null : { m: 11, d: 3 }, bdAt: Date.UTC(2027, 10, 1) },
    profile: { n: NAME, t: '0042', mn: q.get('dev') === '1' ? 1 : 42, a: 'diamond', c: 'magenta', x: xp, at: Date.UTC(2026, 9, 3), s: n, sd: null, cd: q.get('card') || null, g: null, fd: true },
    stats: { xp, g: { prism: { p: 81, w: 27 }, overclock: { p: 47, w: 14 } }, b: { 'prism-rush': { a: 1 }, 'overclock-std': { a: 1 }, x1: { a: 1 }, x2: { a: 1 }, x3: { a: 1 }, x4: { a: 1 } }, st: sampleStreak(n, q.get('state') || 'lit'), it, ac, sg: { ufo: 3, skull: 1, btc: 2 }, fv: Number(q.get('fv') || 1) },
  };
}
/** the outcome a match gives (the server's shape): 2nd of 4, a level-up 24 → 25 (its reward: `card-champagne`), the streak, TOP SHELF (+ BRUSHED GOLD) */
export function sampleOutcome(q = new URLSearchParams()) {
  // (OVERCLOCK CARDS' ADD-ON: &solo=1 = a SOLO run (n 1, rank 1, no win) · &ach=house-warming,redline · &items=glow-ice,tube-gold — what the
  //  after-match screen shows, scripted)
  const up = q.get('up') !== '0', solo = q.get('solo') === '1', list = k => (q.get(k) ? q.get(k).split(',').filter(Boolean) : null);
  const from = up ? XP_AT[25] - 140 : XP_AT[23] + 200, gain = 175;
  return {
    gid: solo ? 'overclock' : 'prism', rank: solo ? 1 : 2, win: false, n: solo ? 1 : 4, ...(solo ? { solo: true } : {}),
    xp: { gain, from, to: from + gain, parts: [{ k: 'played', label: 'MATCH PLAYED', v: 50 }, { k: 'place', label: '2ND PLACE', v: 60 }, { k: 'pb', label: 'PERSONAL BEST', v: 40 }, { k: 'new', label: 'NEW GAME TONIGHT', v: 25 }] },
    lv: { from: up ? 24 : 23, to: up ? 25 : 23 },
    items: list('items') || (up ? ['card-champagne', 'card-brushed'] : ['card-brushed']),
    ach: list('ach') || ['top-shelf'],
    st: sampleStreak(Number(q.get('streak') || 7), 'lit'),
    sev: { first: true, frozen: [], milestones: [] },
  };
}

/** mount a preview into `root` (the look page) or over the title (the live site: root = null) */
export async function preview(view, q = new URLSearchParams(), root = null, keep = null) {
  setPctForTest({ i: Object.fromEntries(ITEMS.map((x, i) => [x.id, 3 + (i * 7) % 40])), a: { 'top-shelf': 22, 'first-round': 96, 'house-warming': 41, 'night-owl': 9 } });
  if (q.get('rm') === '1') document.documentElement.classList.add('pg-rm');
  const data = keep || sampleProfile(q);   // (2A: a wear in the preview repaints with the same sample — what it wears kept)
  // (the album: the preview's own prints — the &sgdemo links' — never the real album's)
  try { (await import('../profile/album.js')).useAlbum('ns-album-preview'); } catch { /* polish */ }
  if (view === 'moment') {
    const { openMoment } = await import('./moment.js');
    const o = sampleOutcome(q);
    const m = await openMoment(o, { game: 'prism', match: 3, name: NAME, onClose: () => { if (!root) location.replace(location.pathname); } });
    if (q.get('at') === 'end' && m) m.skip();
    window.__pg = { moment: m };
    return;
  }
  if (view === 'streak') {
    const { openStreakCard } = await import('./streak-card.js');
    window.__pg = { streak: await openStreakCard(data.stats.st) };
    return;
  }
  if (view === 'card' || view === 'profile') {
    const { gildedCard } = await import('./card.js');
    const { progressSections, customizeBar } = await import('./profile.js');
    const { birthdayRow } = await import('./extras.js');
    const { openStreakCard } = await import('./streak-card.js');
    const host = root || h('div.pg-pv-in');
    if (!root) {
      const { pgSheet } = await import('./look.js');
      await pgSheet();
      const shell = h('div.pg-pv', { role: 'dialog', 'aria-label': 'Membership card preview' }, h('div.pg-veil'), h('div.pg-pv-bar', { 'aria-hidden': 'true' }), h('button.pg-x', { type: 'button', 'aria-label': 'Close', onclick: () => shell.remove() }, '✕'), host);
      host.append(h('div.pg-pv-k', 'PREVIEW · A SAMPLE MEMBER'));
      import('../ui/layers.js').then(L => L.takeLayer(shell, { min: 9000 })).catch(() => {});   // (SHELL 2.0 A — H2: on THE LAYER STACK)
      document.body.append(shell);
    }
    if (q.get('cards') === '1') {
      for (const it of ITEMS.filter(x => x.kind === 'card')) host.append(h('div.lbl', `${it.name} · ${it.tier.toUpperCase()}`), gildedCard(data.profile, {}, { card: it.id, st: data.stats.st }));
    } else {
      host.append(gildedCard(data.profile, {}, { st: data.stats.st, onFlame: () => openStreakCard(data.stats.st) }));
      // (THE VAULT 2C: the profile's order — the card, CUSTOMIZE YOUR CARD, the sections, the birthday line at the bottom)
      if (view === 'profile' || !root) host.append(customizeBar(data, { name: NAME, onWear: async (slot, id) => { const k = { card: 'cd', shape: 'es', tube: 'tb', glow: 'g' }[slot]; if (slot === 'shape' && /^emb-sign-/.test(id || '')) { data.profile.a = id.slice(9); data.profile.es = null; return true; } data.profile[k] = id || null; return true; } }));
      if (view === 'profile' || !root) host.append(h('div.pg-prof', ...progressSections(data, { name: NAME, preview: true, onFlame: () => openStreakCard(data.stats.st), onWear: (slot, id) => { const k = { card: 'cd', shape: 'es', tube: 'tb', glow: 'g' }[slot]; if (!k) return; data.profile[k] = id || null; if (slot === 'card') { host.replaceChildren(); preview(view, new URLSearchParams({ ...Object.fromEntries(q), card: id }), host); return true; } host.replaceChildren(); preview(view, q, host, data); return true; } })));
    }
    if ((view === 'profile' || !root) && q.get('cards') !== '1') host.append(birthdayRow(data, { preview: true }));
    // (THE VAULT 2B: &dress=1 — the DRESS screen open at once; &tab=emblem|glow|tube)
    if (q.get('dress') === '1' && !window.__dressOpened) { window.__dressOpened = true; const D = await import('../vault/dress.js'); const d = D.openDress(data, { name: NAME, wear: async (slot, id) => { const k = { card: 'cd', shape: 'es', tube: 'tb', glow: 'g' }[slot]; if (slot === 'shape' && /^emb-sign-/.test(id || '')) { data.profile.a = id.slice(9); data.profile.es = null; return true; } data.profile[k] = id || null; return true; } }); if (q.get('tab')) { const b = d.el.querySelector(`[data-tab="${q.get('tab')}"]`); if (b) b.click(); } window.__dress = d; }
    window.__pg = { host };
    return host;
  }
}
