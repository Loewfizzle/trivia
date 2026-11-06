// THE CARD LAB's VIEWS — THE LAB 2.0 (THE VAULT 2C; the owner, Nov 3 6:02 + 6:45 pm: "getting cluttered"). Reused by every future
// collectible (docs/vault.md). Mounted by lab.js (the real page: the server's marks) and tests/integration/vault-preview.html (no Firebase).
//   A TOP BAR: ← THE CITY · THE LAB · "N need you" (sticky, solid — it never covers what's under it at rest)
//   4 SECTIONS: CARDS · EMBLEMS · GLOWS + TUBES · LOBBY TEST (A FULL LOBBY + its settings: STILL, the tiers, THE DIAGNOSTICS, the WEAR mixes)
//   A FILTER row (default NEEDS YOU = never marked + CHANGED) · CHANGED · FIX · APPROVED · ALL — each with its count; empty = "All caught up."
//   ONE ROW PER ITEM: its tier gem + name + NEW / its state, the slim strip (a FULL toggle flips it to the full card IN PLACE — each face
//   keeps its own marks: `full-<card>`), "CHANGED <date> — what" beside his old mark + note, then APPROVE · FIX (+ a note) · CUT.
// Every item at REAL PHONE SIZE (a 390-wide column), moving as in the game; ONE effect surface per section list.
//   mountLab(root, { marks, onMark }) → { setMarks(m), destroy() }
import { h } from '../ui/dom.js';
import { toast as showMessage } from '../ui/toast.js';
import { LAB, GUESTS, labStatus, changesOf, verOf, NEEDS } from './catalog.js';
import { mountStrips, stripEl, LOOKS, fxOpts } from './strip.js';
import { createSurface } from '../fx/renderer.js';
import { FX } from '../fx/index.js';
import { emblemSvg, prominence, TEST_EMBLEMS } from './emblems.js';
import { fxStats, setFxReduced, setFxTier, fxReduced, setFxDiag } from '../fx/renderer.js';
import { TIER_NAMES } from '../core/items.js';
import { fullCardEl, mountFull } from './full.js';
import { emblemEl } from './emblem-art.js';
import { applyGlow } from './glows.js';
import { gemEl } from './gems.js';
import { isDevCard, isOneOfOne } from '../core/dev-cards.js';
import { AVATAR_IDS } from '../config.js';
import { memberLabel } from '../core/member.js';

const CARDS = LAB.filter(x => x.kind === 'card' && !x.gift);
// SHELL 2.0 B2 — THE GIFT CARDS (1 OF 1): their own section, GIFTS (the owner picks; PREVIEW shows one on HIS card — nothing is granted here)
const GIFTS = LAB.filter(x => x.kind === 'card' && x.gift);
/** the sample member number the lab dresses FOUNDING MEMBER + the DEV cards with (the owner's own: Nº 0001 — a real card shows the member's own №) */
const SAMPLE_NO = 1;
const noOf = n => memberLabel(n);
// THE DIAGNOSTICS (THE VAULT 1B — the owner's iPhone is the verdict for speed; 2C: folded into LOBBY TEST's settings): each switch turns ONE
// cost off, remembered per device (localStorage vl:diag); &diag=nofx,nolaser,nosprites,nopause,noglow,noemb,nogpu sets them for one visit.
const DIAG = [
  { k: 'glow', label: 'CSS GLOWS', css: 'vl-diag-noglow' },
  { k: 'emb', label: 'EMBLEMS', css: 'vl-diag-noemb' },
  { k: 'gem', label: 'TIER GEMS', css: 'vl-diag-nogem' },   // (2C: the gems' motion off — the dev gem's cost on the owner's phone)
  { k: 'fx', label: 'CANVAS FX' },
  { k: 'laser', label: 'THE LASER' },
  { k: 'sprites', label: 'UFO SPRITES' },
  { k: 'scrollPause', label: 'SCROLL-PAUSE', q: 'nopause' },
  { k: 'gpu', label: 'GPU DRAW', q: 'nogpu' },
];
function loadDiag() {
  let d = {};
  try { d = JSON.parse(localStorage.getItem('vl:diag') || '{}') || {}; } catch { d = {}; }
  const q = new URLSearchParams(location.search).get('diag');
  if (q != null) { d = {}; for (const w of q.split(',')) { const x = DIAG.find(o => (o.q || `no${o.k}`) === w.trim()); if (x) d[x.k] = false; } }
  return d;
}
const saveDiag = d => { try { localStorage.setItem('vl:diag', JSON.stringify(d)); } catch { /* private mode: this visit only */ } };
const when = at => new Date(at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const day = iso => { try { return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return iso; } };

// THE SECTIONS + THE FILTERS
export const SECTIONS = Object.freeze([['cards', 'CARDS'], ['gifts', 'GIFTS'], ['emblems', 'EMBLEMS'], ['glows', 'GLOWS + TUBES'], ['lobby', 'LOBBY TEST']]);
export const FILTERS = Object.freeze([['needs', 'NEEDS YOU'], ['changed', 'CHANGED'], ['fix', 'FIX'], ['approved', 'APPROVED'], ['all', 'ALL']]);
const FULL_OF = new Map(LAB.filter(x => x.kind === 'full').map(x => [x.of, x]));
/** the rows of a section: { key, item, ids (the markable faces), full? } */
export function rowsOf(sec) {
  if (sec === 'cards' || sec === 'gifts') return (sec === 'gifts' ? GIFTS : CARDS).map(item => { const full = FULL_OF.get(item.id); return { key: item.id, item, full, ids: full ? [item.id, full.id] : [item.id] }; });
  if (sec === 'emblems') return LAB.filter(x => x.kind === 'emblem').sort((a, b) => (a.n < 90) - (b.n < 90) || a.n - b.n).map(item => ({ key: item.id, item, ids: [item.id] }));
  if (sec === 'glows') return LAB.filter(x => x.kind === 'glow' || x.kind === 'tube').sort((a, b) => (a.kind === 'tube') - (b.kind === 'tube') || a.n - b.n).map(item => ({ key: item.id, item, ids: [item.id] }));
  return [];
}
/** does a row show under a filter (any of its faces) */
export function rowMatches(row, f, marks) {
  if (f === 'all') return true;
  return row.ids.some(id => { const s = labStatus(id, marks[id]); return f === 'needs' ? NEEDS.includes(s) : f === 'approved' ? s === 'approve' : s === f; });
}
export const countOf = (sec, f, marks) => rowsOf(sec).filter(r => rowMatches(r, f, marks)).length;
export const needCount = marks => ['cards', 'gifts', 'emblems', 'glows'].reduce((a, s) => a + countOf(s, 'needs', marks), 0);

// NEW since his last visit (this device): the highest lab number he has seen (localStorage vl:seen) — a first visit marks nothing new
const SEEN_KEY = 'vl:seen';
const maxN = LAB.reduce((a, x) => Math.max(a, x.n || 0), 0);
function seenN() { try { const v = Number(localStorage.getItem(SEEN_KEY)); return v > 0 ? v : maxN; } catch { return maxN; } }

export function mountLab(root, o = {}) {
  let marks = o.marks || {}, mounted = [], fpsT = 0, mix = 'samples';
  const q0 = new URLSearchParams(location.search);
  const legacy = { strips: 'cards', full: 'cards' }[q0.get('view')];
  let sec = legacy || (SECTIONS.some(([k]) => k === q0.get('view')) ? q0.get('view') : null);
  let filter = FILTERS.some(([k]) => k === q0.get('filter')) ? q0.get('filter') : (q0.get('view') ? 'all' : 'needs');
  const faceAll = q0.get('view') === 'full' || q0.get('face') === 'full';
  const fdAll = q0.get('fd') === '1';   // (&fd=1: every sample member a FOUNDER — the badge-slot check)
  const lastSeen = seenN();
  setTimeout(() => { try { localStorage.setItem(SEEN_KEY, String(maxN)); } catch { /* fine */ } }, 4000);
  const wearMix = { emb: false, glow: false, one: null };
  const rowsLive = new Map();   // key → { blk, row, face, paint() }

  const content = h('div.vl-content');
  const need = h('span.vl-need', { role: 'status' });
  const bar = h('header.vl-bar',
    h('a.vl-back', { href: '/', 'aria-label': 'Back to the city' }, '‹ THE CITY'),
    h('button.vl-bar-t', { type: 'button', 'aria-label': 'THE LAB — back to the top', onclick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) }, 'THE LAB'), need);   // (a tap = the top: the sections)
  const tabs = h('div.vl-tabs', { role: 'tablist' }, ...SECTIONS.map(([k, label]) => h('button.vl-tab', { type: 'button', role: 'tab', dataset: { v: k }, onclick: () => show(k) }, h('span', label), h('small.vl-tab-n'))));
  const filters = h('div.vl-filters', ...FILTERS.map(([k, label]) => h('button.vl-filter', { type: 'button', dataset: { f: k }, onclick: () => { filter = k; show(sec); } }, h('span', label), h('small.vl-filter-n'))));
  // THE SETTINGS (LOBBY TEST): STILL · the tiers · THE DIAGNOSTICS
  const still = h('button.vl-tab', { type: 'button', onclick: () => { setFxReduced(!fxReduced()); paintOpts(); } });
  let tierPick = 'AUTO';
  const tierBtns = ['AUTO', 0, 1, 2].map(t => h('button.vl-tab', { type: 'button', dataset: { t: String(t) }, onclick: () => { setFxTier(t === 'AUTO' ? null : t); tierPick = t; paintOpts(); } }, t === 'AUTO' ? 'TIER AUTO' : `TIER ${t}`));
  const diag = loadDiag();
  const diagBtns = DIAG.map(o2 => h('button.vl-tab.vl-dg', { type: 'button', dataset: { k: o2.k }, onclick: () => { if (diag[o2.k] === false) delete diag[o2.k]; else diag[o2.k] = false; saveDiag(diag); applyDiag(); } }));
  const settings = h('details.vl-set', h('summary', 'SETTINGS · DIAGNOSTICS'),
    h('div.vl-opts', still, ...tierBtns),
    h('div.vl-diag', h('div.vl-diag-h', 'DIAGNOSTICS', h('small', ' · tap one off, watch the readout · remembered on this phone')),
      h('div.vl-opts', ...diagBtns, h('button.vl-tab.vl-dg', { type: 'button', onclick: () => { for (const k of Object.keys(diag)) delete diag[k]; saveDiag(diag); applyDiag(); } }, 'RESET'))));
  function applyDiag() {
    DIAG.forEach((d, i) => {
      const on = diag[d.k] !== false;
      if (d.css) document.documentElement.classList.toggle(d.css, !on); else setFxDiag(d.k, on);
      diagBtns[i].textContent = `${d.label} ${on ? 'ON' : 'OFF'}`; diagBtns[i].classList.toggle('is-off', !on);
    });
    if (window.__lab) window.__lab.diag = { ...diag };
  }
  const fps = h('div.vl-fps', { 'aria-live': 'off', hidden: true });
  root.replaceChildren(bar, h('div.vl-head', tabs, filters), content, fps);
  // (?bare=1: the lobby / the items alone — no bar + switches: the look reviews' close-ups)
  const bare = q0.get('bare') === '1';
  if (bare) root.replaceChildren(content, fps);
  function paintOpts() {
    still.textContent = fxReduced() ? 'STILL (REDUCED MOTION) ✓' : 'STILL (REDUCED MOTION)';
    still.classList.toggle('is-on', fxReduced());
    content.classList.toggle('vl-still', fxReduced());
    for (const b of tierBtns) b.classList.toggle('is-on', String(tierPick) === b.dataset.t);
  }
  function paintCounts() {
    const n = needCount(marks);
    need.textContent = n ? `${n} NEED${n === 1 ? 'S' : ''} YOU` : 'ALL CAUGHT UP';
    try { localStorage.setItem('nd:lab-need', String(n)); } catch { /* fine */ }   // (SHELL 2.0 A: the ☰ menu's THE LAB row shows it)
    need.classList.toggle('is-zero', !n);
    for (const b of tabs.children) { const k = b.dataset.v; b.classList.toggle('is-on', k === sec); const c = k === 'lobby' ? '' : String(countOf(k, filter, marks)); b.querySelector('.vl-tab-n').textContent = c; }
    for (const b of filters.children) { const f = b.dataset.f; b.classList.toggle('is-on', f === filter); b.querySelector('.vl-filter-n').textContent = sec === 'lobby' ? '' : String(countOf(sec, f, marks)); }
    filters.hidden = sec === 'lobby';
    if (window.__lab) { window.__lab.need = n; window.__lab.filter = filter; }
  }
  function unmountAll() { for (const m of mounted) m.destroy(); mounted = []; rowsLive.clear(); }

  // ---- THE MARKS (one face at a time)
  function markRow(id) {
    const m = marks[id] || {};
    const note = h('textarea.vl-note', { placeholder: 'What should change? (it goes to the next pass)', maxLength: 400, hidden: m.m !== 'fix' }, m.note || '');
    const st = labStatus(id, m);
    const who = h('div.vl-who-m', m.at ? `${st === 'changed' ? 'YOUR MARK (before the change): ' : ''}${(m.m || 'cleared').toUpperCase()} · ${when(m.at)}${m.note && m.m !== 'fix' ? ` · “${m.note}”` : ''}` : 'Not marked yet');
    const btn = (k, label) => h('button.btn.btn-sm.vl-mark', { type: 'button', dataset: { m: k }, class: m.m === k && st !== 'changed' ? 'is-on' : m.m === k ? 'is-was' : '', onclick: () => {
      const cur = labStatus(id, marks[id]) === 'changed' ? null : (marks[id] || {}).m || null;
      if (k === 'fix') { note.hidden = false; if (cur !== 'fix') send(id, 'fix', note.value); else note.focus(); return; }
      send(id, cur === k ? null : k, '');
    } }, label);
    const saveNote = h('button.btn.btn-sm.btn-ghost.vl-mark', { type: 'button', hidden: m.m !== 'fix', onclick: () => send(id, 'fix', note.value) }, 'SAVE NOTE');
    note.addEventListener('input', () => { saveNote.hidden = false; });
    return h('div.vl-markbox', { dataset: { id } }, h('div.vl-marks', btn('approve', 'APPROVE'), btn('fix', 'FIX'), btn('cut', 'CUT')), note, saveNote, who);
  }
  async function send(id, mark, note) {
    try {
      const r = o.onMark ? await o.onMark(id, mark, note) : null;
      marks = (r && r.marks) || { ...marks, [id]: { m: mark, note, at: Date.now(), v: verOf(id) } };
      for (const R of rowsLive.values()) if (R.row.ids.includes(id)) R.paint();
      paintCounts();
      // SAVED ✓ (THE VAULT 1B — a mark saves on the tap; this says so, on that item, once the server has it)
      const R = [...rowsLive.values()].find(x => x.row.ids.includes(id));
      if (R) { const s = h('span.vl-saved', { role: 'status' }, mark ? 'SAVED ✓' : 'CLEARED ✓'); const mk = R.blk.querySelector('.vl-marks'); if (mk) mk.append(s); setTimeout(() => s.classList.add('is-out'), 1600); setTimeout(() => s.remove(), 2100); }
      if (window.__lab) { window.__lab.saved = (window.__lab.saved || 0) + 1; window.__lab.marks = marks; }
    } catch (e) { toast(e && e.message ? e.message : 'COULDN’T SAVE THE MARK', true); }
  }

  // ---- A ROW: the head (gem · name · NEW / state · id), the stage, the FULL toggle, the CHANGED line, the motion, the marks
  const STATE_WORD = { new: 'NOT MARKED', changed: 'CHANGED', approve: 'APPROVED', fix: 'FIX', cut: 'CUT' };
  function rowEl(row, surface, stageFor) {
    const { item } = row;
    const R = { row, face: 0, blk: null, paint: null };
    // (the face that needs him first: the strip, else the full card when only it matches the filter)
    if (row.full) R.face = faceAll ? 1 : rowMatches({ ids: [row.ids[0]] }, filter, marks) ? 0 : rowMatches({ ids: [row.ids[1]] }, filter, marks) ? 1 : 0;
    const stage = h('div.vl-stage.vl-col');
    const headName = h('b');
    const stateChip = h('span.vl-st');
    const isNew = item.n > lastSeen || (row.full && row.full.n > lastSeen);
    const head = h('div.vl-item-h', gemEl(item.tier, { dev: isOneOfOne(item.of || item.id) }), headName, isNew ? h('span.vl-new', 'NEW') : null, stateChip, h('code', item.id));
    const toggle = row.full ? h('button.vl-face', { type: 'button', 'aria-pressed': 'false', onclick: () => { R.face = R.face ? 0 : 1; mountFace(); R.paint(); } }) : null;
    const changed = h('div.vl-chg');
    const motion = h('p.vl-motion');
    let markBox = h('div');
    const blk = h('section.vl-item', { dataset: { id: row.key } }, head, stage, toggle, changed, motion, markBox);
    R.blk = blk;
    let mountedEls = [];
    function mountFace() {
      for (const e of mountedEls) { try { surface.remove(e); } catch { /* fine */ } }
      mountedEls = stageFor(stage, row, R.face, surface) || [];
    }
    R.paint = () => {
      const id = row.ids[R.face] || row.ids[0], it = R.face ? row.full : item, st = labStatus(id, marks[id]);
      headName.textContent = `${it.n} · ${(it.name || item.name || item.id)}`;
      stateChip.textContent = STATE_WORD[st]; stateChip.dataset.st = st;
      blk.dataset.st = st; blk.dataset.face = R.face ? 'full' : 'strip';
      if (toggle) {
        const other = row.ids[R.face ? 0 : 1], os = labStatus(other, marks[other]);
        toggle.replaceChildren(R.face ? '‹ THE STRIP' : 'FULL CARD ›', NEEDS.includes(os) ? h('small', os === 'changed' ? 'CHANGED' : 'NOT MARKED') : '');
        toggle.setAttribute('aria-pressed', String(!!R.face)); toggle.dataset.st = os; toggle.title = `${R.face ? 'The strip' : 'The full card'}: ${STATE_WORD[os]}`;
      }
      const ch = changesOf(id).filter(c => c.v === verOf(id));
      changed.replaceChildren(...(st === 'changed' || (ch.length && !marks[id]) ? ch.map(c => h('p', h('b', `CHANGED ${day(c.at)}`), ` — ${c.what}`)) : []));
      changed.hidden = !changed.childElementCount;
      motion.textContent = it.motion || '';
      const nb = markRow(id); markBox.replaceWith(nb); markBox = nb;
    };
    mountFace(); R.paint();
    rowsLive.set(row.key, R);
    return blk;
  }
  // the stages (each returns the elements it put on the surface)
  function cardStage(stage, row, face, surface) {
    const { item } = row, g = GUESTS[(item.n - 1) % GUESTS.length];
    if (face) {
      const i = (row.full.n - 11 + 80) % 8;
      const card = fullCardEl({ card: item.id, who: { name: g.name, lv: g.lv, avatar: ['bolt', 'diamond', 'crown', 'alien', 'star', 'moon', 'ghost', 'hex'][i], color: ['cyan', 'magenta', 'yellow', 'green', 'violet', 'orange', 'magenta', 'cyan'][i], at: Date.UTC(2026, 9, 3), no: noOf(SAMPLE_NO), fd: fdAll || item.id === 'card-founder' || isDevCard(item.id) }, spotted: Date.UTC(2026, 10, 3, 3, 14) });
      stage.replaceChildren(h('div.vl-col.vl-one', card));
      mountFull(surface, card, item.id, { seed: row.full.n });
      return [card];
    }
    const el = stripEl({ card: item.id, name: g.name, lv: g.lv, host: item.n === 1, no: noOf(SAMPLE_NO) });
    stage.replaceChildren(h('div.vl-col.vl-one', el));
    const look = LOOKS[item.id];
    if (look && look.fx) surface.add(el, FX[look.fx], fxOpts(item.id, { seed: g.lv || 1, radius: 12 }));
    return [el];
  }
  // (SHELL 2.0 B2 — a GIFT row: the card's own faces + PREVIEW ON MY CARD — the reveal exactly as its one owner will see it, on HIS name —
  //  nothing granted: /admin → GIFTS gives)
  function giftStage(stage, row, face, surface) {
    const els = cardStage(stage, row, face, surface);
    const pv = h('button.vl-tab.vl-gift-pv', { type: 'button', onclick: () => import('../profile/gift-reveal.js').then(m => m.revealGift(row.item.id, undefined, { preview: true })).catch(() => {}) }, 'PREVIEW ON MY CARD ›');
    stage.append(h('div.vl-gift-pvrow', pv, h('small', 'The full card as its owner meets it — “A gift from the house”. Nothing is given here: /admin → GIFTS.')));
    return els;
  }
  const sayOf = tier => h('small', 'full size · at 28 pt (its lobby size)', h('br'), `On a COMMON card it ${prominence('common', tier) === 'lead' ? 'LEADS' : 'plays even'} · on a LEGENDARY it ${prominence('legendary', tier) === 'quiet' ? 'HOLDS STILL (the card leads)' : 'plays even'}`);
  function stripsOn(stage, rows, surface) {
    const out = [];
    for (const r of rows) { const el = stripEl(r); stage.append(h('div.vl-col.vl-one', el)); const look = LOOKS[r.card]; if (look && look.fx) surface.add(el, FX[look.fx], fxOpts(r.card, { seed: r.lv || 1, radius: 12 })); out.push(el); }
    return out;
  }
  function emblemStage(stage, row, face, surface) {
    const { item } = row;
    stage.replaceChildren();
    if (TEST_EMBLEMS[item.id]) {
      const em = TEST_EMBLEMS[item.id];
      stage.append(h('div.vl-emb-big', emblemSvg(em.finish, 'lead'), emblemSvg(em.finish, 'even', { size: 28 }), sayOf(em.tier)));
      return stripsOn(stage, [{ card: 'card-brushed', name: 'BEN', lv: 23, emblem: item.id }, { card: 'card-sg-ufo', name: 'EMMA', lv: 64, emblem: item.id }], surface);
    }
    if (item.set) {
      const cols = ['magenta', 'cyan', 'yellow', 'green', 'orange', 'violet'];
      stage.append(h('div.ve-grid', ...AVATAR_IDS.map((a, i) => emblemEl({ avatar: a, color: cols[i % 6], mode: 'even', size: 56 }))),
        h('div.ve-grid.is-28', ...AVATAR_IDS.map((a, i) => emblemEl({ avatar: a, color: cols[(i + 2) % 6], mode: 'even', size: 28 }))));
      return stripsOn(stage, [{ card: 'card-brushed', name: 'BEN', lv: 23, avatar: 'crown', color: 'yellow' }, { card: 'card-sg-ufo', name: 'EMMA', lv: 64, avatar: 'ghost', color: 'cyan' }], surface);
    }
    stage.append(h('div.vl-emb-big', emblemEl({ id: item.id, mode: 'lead', size: 72 }), emblemEl({ id: item.id, mode: 'even', size: 28 }), sayOf(item.tier)));
    return stripsOn(stage, [{ card: 'card-brushed', name: 'BEN', lv: 23, emblem: item.id }, { card: 'card-sg-ufo', name: 'EMMA', lv: 64, emblem: item.id }], surface);
  }
  function glowStage(stage, row, face, surface) {
    const { item } = row;
    stage.replaceChildren();
    if (item.kind === 'tube') {
      const on = [['emb-key'], ['emb-sweetheart'], [null, 'star', 'cyan']];
      stage.append(h('div.ve-grid', ...on.map(([id, a, c]) => emblemEl({ id, avatar: a, color: c, tube: item.id, mode: 'lead', size: 72 }))),
        h('div.ve-grid.is-28', ...on.map(([id, a, c]) => emblemEl({ id, avatar: a, color: c, tube: item.id, mode: 'even', size: 28 }))));
      return stripsOn(stage, [{ card: 'card-brushed', name: 'BEN', lv: 23, emblem: 'emb-sweetheart', tube: item.id }, { card: 'card-sg-ufo', name: 'EMMA', lv: 64, avatar: 'bolt', color: 'magenta', tube: item.id }], surface);
    }
    const els = stripsOn(stage, [{ card: 'card-brushed', name: 'BEN', lv: 23, avatar: 'bolt', color: 'yellow', glow: item.id }, { card: 'card-sg-ufo', name: 'LOEWFIZZLE', lv: 64, avatar: 'alien', color: 'green', glow: item.id }], surface);
    const fc = fullCardEl({ card: 'card-midnight', who: { name: 'LOEWFIZZLE', lv: 41, avatar: 'crown', color: 'magenta', at: Date.UTC(2026, 9, 3), no: noOf(SAMPLE_NO), glow: item.id } });
    stage.append(h('div.vl-col.vl-one', fc)); mountFull(surface, fc, 'card-midnight');
    return [...els, fc];
  }

  // ---- A SECTION: the rows under the filter, on ONE effect surface
  function listView(s) {
    const q = new URLSearchParams(location.search);
    const only = (q.get('only') || q.get('full') || '').split(',').filter(Boolean);   // (&only= / &full=: the look reviews)
    const sheet = q.get('sheet') === '1';
    if (sheet && s === 'emblems') { sheetEmblems(only); return; }
    if (sheet && s === 'glows') { sheetGlows(only); return; }
    const rows = rowsOf(s).filter(r => (only.length ? only.includes(r.key) : rowMatches(r, filter, marks)));
    if (!rows.length) {
      const others = ['cards', 'gifts', 'emblems', 'glows'].filter(k => k !== s).map(k => [k, countOf(k, filter, marks)]).filter(([, n]) => n);
      content.replaceChildren(h('div.vl-empty',
        h('b', filter === 'needs' ? 'All caught up.' : 'Nothing here.'),
        h('p', filter === 'needs' ? 'Nothing waits for your marks in this section.' : `No ${FILTERS.find(f => f[0] === filter)[1]} items in this section.`),
        others.length ? h('div.vl-empty-go', ...others.map(([k, n]) => h('button.vl-tab', { type: 'button', onclick: () => show(k) }, `${SECTIONS.find(x => x[0] === k)[1]} · ${n}`))) : null,
        h('button.vl-tab', { type: 'button', onclick: () => { filter = 'all'; show(s); } }, 'SHOW ALL')));
      return;
    }
    const grid = h('div.vl-items');
    content.replaceChildren(grid);
    const surface = createSurface(grid, { label: `lab-${s}` });
    const stageFor = s === 'cards' ? cardStage : s === 'gifts' ? giftStage : s === 'emblems' ? emblemStage : glowStage;
    for (const r of rows) grid.append(rowEl(r, surface, stageFor));
    mounted.push({ destroy: () => surface.destroy() });
  }
  // (THE VAULT 2B: &sheet=1 — a CONTACT SHEET: every emblem at 72 + 28 pt / every glow on LOEWFIZZLE + a short name)
  function sheetEmblems(only) {
    const items = LAB.filter(x => (x.kind === 'emblem' || x.kind === 'tube') && (!only.length || only.includes(x.id))).sort((a, b) => (a.n < 90) - (b.n < 90) || a.n - b.n);
    content.replaceChildren(h('div.ve-sheet', ...items.filter(x => (x.kind === 'emblem' && !x.set && !TEST_EMBLEMS[x.id]) || x.kind === 'tube').map(item => h('div.ve-sheet-i', { dataset: { id: item.id } },
      item.kind === 'tube' ? h('div.ve-sheet-a', emblemEl({ id: 'emb-key', tube: item.id, mode: 'lead', size: 72 }), emblemEl({ avatar: 'star', color: 'cyan', tube: item.id, mode: 'even', size: 28 }))
        : h('div.ve-sheet-a', emblemEl({ id: item.id, mode: 'lead', size: 72 }), emblemEl({ id: item.id, mode: 'even', size: 28 })), h('b', item.name || item.id), h('small', `${TIER_NAMES[item.tier]} · ${item.kind === 'tube' ? 'TUBE STYLE' : (item.fin || '').toUpperCase()}`)))));
  }
  function sheetGlows(only) {
    content.replaceChildren(h('div.vg-sheet', ...LAB.filter(x => x.kind === 'glow' && (!only.length || only.includes(x.id))).map(item => h('div.vg-sheet-i', { dataset: { id: item.id } },
      h('div.vg-sheet-p', applyGlow(h('b.vl-name', 'LOEWFIZZLE'), item.id)), h('div.vg-sheet-p', applyGlow(h('b.vl-name', 'MAYA'), item.id)), h('small', `${item.name || item.id} · ${TIER_NAMES[item.tier]}`)))));
  }

  // ---- LOBBY TEST: A FULL LOBBY (8 strips at once in the lobby's calmer cut) + its settings (STILL, the tiers, THE DIAGNOSTICS, the WEAR mixes)
  function lobbyView() {
    const pick = h('select.vl-tab', { 'aria-label': '8 of one card', onchange: () => { mix = pick.value; draw(); } },
      h('option', { value: '' }, '8 OF ONE…'), ...CARDS.map(c => h('option', { value: c.id }, c.name || c.id)));
    const mixes = [['samples', 'THE 8 SAMPLES'], ['new', 'THE NEW 8'], ['legend', '8 LEGENDARIES'], ['sightings', 'THE 8 SIGHTINGS'], ['held', 'THE NEW 21'], ['gifts', 'THE GIFTS']].map(([k, l]) => h('button.vl-tab', { type: 'button', dataset: { k }, onclick: () => { mix = k; pick.value = ''; draw(); } }, l));
    const wearBtns = [['emb', 'EMBLEMS'], ['glow', 'GLOWS']].map(([k]) => h('button.vl-tab', { type: 'button', dataset: { w: k }, onclick: () => { wearMix[k] = !wearMix[k]; draw(); } }));
    const list = h('div.vl-list');
    const box = h('div.vl-lobby', h('div.vl-lobby-h', 'IN THE LOBBY · 8 / 8'), list);
    settings.querySelector('.vl-wear')?.remove();
    settings.append(h('div.vl-mix.vl-wear', h('span.vl-mix-k', 'EQUIP THE SAMPLES:'), ...wearBtns));
    content.replaceChildren(h('div.vl-mix', ...mixes, pick), settings, box,
      h('p.vl-motion', 'The lobby’s calmer cut, all eight on ONE shared canvas. The readout (bottom right): frames a second, the effects’ tier, their draw cost, the canvas size.'));
    const draw = () => {
      unmountAll();
      for (const b of mixes) b.classList.toggle('is-on', b.dataset.k === mix);
      list.replaceChildren();
      // (the mixes by the lab's numbers: 1A's samples 1–8, 1B's new 19–26, 1C's sightings 34–41, the held 50–70)
      const byN = (a, b) => CARDS.filter(c => c.n >= a && c.n <= b).sort((x, y) => x.n - y.n);
      const SAMPLES = byN(1, 8), NEW = byN(19, 26), SIGHT = byN(34, 41), HELD = byN(50, 70);
      for (const b of wearBtns) { b.classList.toggle('is-on', !!wearMix[b.dataset.w]); b.textContent = `${b.dataset.w === 'emb' ? 'EMBLEMS' : 'GLOWS'} ${wearMix[b.dataset.w] ? 'ON' : 'OFF'}`; }
      // (2B — &wear=emb2,glow: the BUSIEST mix — the 2B specials, the neon ones in the 2B tube styles, every moving glow)
      const B2 = wearMix.set === 2;
      const EMB = B2 ? ['emb-sg-btc', 'emb-butterfly', 'emb-sg-ghostship', 'emb-glasses', 'emb-sg-aurora', 'emb-stars', 'emb-ace', 'emb-xmas'] : ['emb-sg-ufo', 'emb-house', 'emb-sg-tr3b', 'emb-torch', 'emb-snowflake', 'emb-lightning', 'emb-prism', 'emb-sweetheart'],
        TUB = B2 ? [null, 'tube-beat', null, 'tube-flicker', null, 'tube-gold', null, 'tube-ember'] : [null, null, null, null, null, null, null, 'tube-chase'],
        GLO = B2 ? ['glow-glitch', 'glow-prism', 'glow-fire', 'glow-champagne', 'glow-tinsel', 'glow-starlight', 'glow-frost', 'glow-neon'] : ['glow-gold', 'glow-spark', 'glow-ember'];
      const AV = ['bolt', 'diamond', 'crown', 'alien', 'star', 'moon', 'ghost', 'hex'], COL = ['cyan', 'magenta', 'yellow', 'green', 'violet', 'orange', 'magenta', 'cyan'];
      const rows = GUESTS.map((g, i) => ({ avatar: AV[i], color: COL[i], ...(wearMix.emb ? (wearMix.one ? (/^tube-/.test(wearMix.one) ? { emblem: 'emb-key', tube: wearMix.one } : { emblem: wearMix.one }) : { emblem: EMB[i], tube: TUB[i] }) : {}), ...(wearMix.glow ? { glow: GLO[i % GLO.length] } : {}), card: mix === 'samples' ? SAMPLES[i % 8].id : mix === 'new' ? NEW[i % NEW.length].id : mix === 'sightings' ? SIGHT[i % SIGHT.length].id : mix === 'held' ? HELD[(i * 3 + 1) % HELD.length].id : mix === 'gifts' ? GIFTS[i % GIFTS.length].id : mix === 'gifts2' ? GIFTS[(i + 4) % GIFTS.length].id : mix === 'legend' ? 'card-sg-ufo' : mix, name: g.name, lv: g.lv, seed: i + 1, host: i === 0, no: noOf(SAMPLE_NO + i * 7) }));
      mounted.push(mountStrips(list, rows, { calm: true, label: 'lobby' }));
      window.__lab && (window.__lab.mix = mix, window.__lab.wear = { ...wearMix });
    };
    draw();
  }

  function show(s) {
    sec = s; unmountAll();
    fps.hidden = s !== 'lobby' || bare;
    if (s === 'lobby') lobbyView(); else listView(s);
    paintCounts();
    // (a tab tapped deep down the page brings the new view's top into sight under the sticky bar)
    try { const top = content.getBoundingClientRect().top - bar.getBoundingClientRect().height - 8; if (top < 0) window.scrollBy(0, top); } catch { /* fine */ }
    if (window.__lab) window.__lab.view = s;
    try { const q = new URLSearchParams(location.search); q.set('view', s); q.set('filter', filter); history.replaceState(null, '', `${location.pathname}?${q}`); } catch { /* fine */ }
  }

  // the fps readout (LOBBY TEST): its own frame counter (the whole page's frames) + the effect library's numbers
  let frames = 0, t0 = performance.now(), raf = 0;
  const count = () => { frames++; raf = requestAnimationFrame(count); };
  raf = requestAnimationFrame(count);
  fpsT = setInterval(() => {
    const now = performance.now(), f = Math.round(frames * 1000 / (now - t0)); frames = 0; t0 = now;
    fps.textContent = `${f} fps · ${fxStats.fms} ms/frame\n${fxStats.slow} slow /s${fxStats.scrolling ? ' · SCROLL-HELD' : ''}\nfx tier ${fxStats.tier}${fxStats.held ? ' HELD' : ''} · ${fxStats.dpr}× · ${fxStats.ms} ms js\n${fxStats.gpu ? `GPU · ${fxStats.draws} draws` : '2D canvas'} · ${fxStats.slots} slots · ${fxStats.mp} MP`;
    fps.classList.toggle('is-bad', f < 55 && !fxReduced());
    if (window.__lab) window.__lab.fps = f;
  }, 500);

  function toast(msg, bad) { showMessage(msg, bad ? 'err' : 'ok'); }   // (SHELL 2.0 A — H12: the lab's own vl-toast → THE MESSAGE)

  window.__lab = { marks, view: sec, fps: 0, stats: fxStats, show, mix, diag: {}, filter, setFilter: f => { filter = f; show(sec); } };
  applyDiag();
  paintOpts();
  if (q0.get('mix')) mix = q0.get('mix');
  if (q0.get('wear')) for (const w of q0.get('wear').split(',')) { if (w === 'emb2') { wearMix.emb = true; wearMix.set = 2; } else if (w in wearMix) wearMix[w] = true; else if (/^(emb|tube)-/.test(w)) { wearMix.emb = true; wearMix.one = w; } }
  // the first section: the one asked for, else the first that needs him
  if (!sec) sec = ['cards', 'gifts', 'emblems', 'glows'].find(k => countOf(k, filter, marks)) || 'cards';
  show(sec);
  return {
    setMarks(m) { marks = m || {}; show(sec); },
    destroy() { unmountAll(); clearInterval(fpsT); cancelAnimationFrame(raf); },
  };
}
