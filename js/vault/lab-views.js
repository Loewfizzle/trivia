// THE CARD LAB's VIEWS (THE VAULT 1A; reused by 1B, VAULT 2 + every future collectible — docs/vault.md). Every lab item at REAL PHONE
// SIZE (a 390-wide column), ANIMATED as in the game, THE SLIM STRIP FIRST; its NAME + TIER + what it does; under it APPROVE · FIX (+ a
// note) · CUT. "A FULL LOBBY": 8 strips at once in the lobby's calmer cut — any mix (the 8 samples, 8 legendaries, 8 of one) — with a
// live fps readout. Mounted by lab.js (the real page: the server's marks) and tests/integration/vault-preview.html (no Firebase).
//   mountLab(root, { marks, onMark, who }) → { setMarks(m), destroy() }
import { h } from '../ui/dom.js';
import { LAB, GUESTS } from './catalog.js';
import { mountStrips, stripEl, LOOKS } from './strip.js';
import { createSurface } from '../fx/renderer.js';
import { FX } from '../fx/index.js';
import { emblemSvg, prominence, TEST_EMBLEMS } from './emblems.js';
import { fxStats, setFxReduced, setFxTier, fxReduced, setFxDiag } from '../fx/renderer.js';
import { TIER_NAMES } from '../core/items.js';

const CARDS = LAB.filter(x => x.kind === 'card');
// THE DIAGNOSTICS ROW (THE VAULT 1B — the owner's iPhone is the verdict for speed): each switch turns ONE cost off, remembered per device
// (localStorage vl:diag); &diag=nofx,nolaser,nosprites,nopause,noglow,noemb,nogpu in the address sets them for one visit (the bench).
const DIAG = [
  { k: 'glow', label: 'CSS GLOWS', css: 'vl-diag-noglow' },
  { k: 'emb', label: 'EMBLEMS', css: 'vl-diag-noemb' },
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

export function mountLab(root, o = {}) {
  let marks = o.marks || {}, view = 'strips', mounted = [], fpsT = 0, mix = 'samples';
  const blocks = new Map();
  const content = h('div.vl-content');
  const tabs = h('div.vl-tabs', { role: 'tablist' },
    h('button.vl-tab', { type: 'button', dataset: { v: 'strips' }, onclick: () => show('strips') }, 'THE STRIPS'),
    h('button.vl-tab', { type: 'button', dataset: { v: 'lobby' }, onclick: () => show('lobby') }, 'A FULL LOBBY'),
    h('button.vl-tab', { type: 'button', disabled: true, title: 'THE VAULT 1B — after you approve the strips' }, 'FULL CARDS · 1B'));
  const still = h('button.vl-tab', { type: 'button', onclick: () => { setFxReduced(!fxReduced()); paintOpts(); } });
  const tierBtns = ['AUTO', 0, 1, 2].map(t => h('button.vl-tab', { type: 'button', dataset: { t: String(t) }, onclick: () => { setFxTier(t === 'AUTO' ? null : t); tierPick = t; paintOpts(); } }, t === 'AUTO' ? 'TIER AUTO' : `TIER ${t}`));
  let tierPick = 'AUTO';
  const opts = h('div.vl-opts', still, ...tierBtns);
  // THE DIAGNOSTICS ROW: ON = the shipped behaviour; tap one to turn that cost off; RESET = all on
  const diag = loadDiag();
  const diagBtns = DIAG.map(o => h('button.vl-tab.vl-dg', { type: 'button', dataset: { k: o.k }, onclick: () => { if (diag[o.k] === false) delete diag[o.k]; else diag[o.k] = false; saveDiag(diag); applyDiag(); } }));
  const diagRow = h('div.vl-diag', h('div.vl-diag-h', 'DIAGNOSTICS', h('small', ' · tap one off, watch the readout · remembered on this phone')),
    h('div.vl-opts', ...diagBtns, h('button.vl-tab.vl-dg', { type: 'button', onclick: () => { for (const k of Object.keys(diag)) delete diag[k]; saveDiag(diag); applyDiag(); } }, 'RESET')));
  function applyDiag() {
    DIAG.forEach((o, i) => {
      const on = diag[o.k] !== false;
      if (o.css) document.documentElement.classList.toggle(o.css, !on); else setFxDiag(o.k, on);
      diagBtns[i].textContent = `${o.label} ${on ? 'ON' : 'OFF'}`; diagBtns[i].classList.toggle('is-off', !on);
    });
    if (window.__lab) window.__lab.diag = { ...diag };
  }
  const fps = h('div.vl-fps', { 'aria-live': 'off' });
  root.replaceChildren(
    h('div.vl-lab-k', 'NEON SPEAKEASY · THE VAULT'),
    h('h1', 'THE CARD LAB'),
    h('p.vl-lab-sub', 'Every strip at its real phone size, moving as it will in the game. Mark each one: ', h('b.vl-a', 'APPROVE'), ' ships it · ', h('b.vl-a', 'FIX'), ' + a note sends it back · ', h('b.vl-a', 'CUT'), ' drops it. THE VAULT 1B reads your marks first.'),
    tabs, opts, diagRow, content, fps);
  // (?bare=1: the lobby / the strips alone — no header + switches: the look reviews' close-ups)
  if (new URLSearchParams(location.search).get('bare') === '1') { root.replaceChildren(content, fps); fps.hidden = true; }
  function paintOpts() {
    still.textContent = fxReduced() ? 'STILL (REDUCED MOTION) ✓' : 'STILL (REDUCED MOTION)';
    still.classList.toggle('is-on', fxReduced());
    content.classList.toggle('vl-still', fxReduced());
    for (const b of tierBtns) b.classList.toggle('is-on', String(tierPick) === b.dataset.t);
  }
  function unmountAll() { for (const m of mounted) m.destroy(); mounted = []; blocks.clear(); }

  function markRow(item) {
    const m = marks[item.id] || {};
    const note = h('textarea.vl-note', { placeholder: 'What should change? (it goes to the next pass)', maxLength: 400, hidden: m.m !== 'fix' }, m.note || '');
    const who = h('div.vl-who-m', m.at ? `${(m.m || 'cleared').toUpperCase()} · ${when(m.at)}${m.note && m.m !== 'fix' ? ` · “${m.note}”` : ''}` : 'Not marked yet');
    const btn = (k, label) => h('button.vl-mark', { type: 'button', dataset: { m: k }, class: m.m === k ? 'is-on' : '', onclick: () => {
      const cur = (marks[item.id] || {}).m || null;
      if (k === 'fix') { note.hidden = false; if (cur !== 'fix') send(item.id, 'fix', note.value); else note.focus(); return; }
      send(item.id, cur === k ? null : k, '');
    } }, label);
    const saveNote = h('button.vl-mark', { type: 'button', hidden: m.m !== 'fix', onclick: () => send(item.id, 'fix', note.value) }, 'SAVE NOTE');
    note.addEventListener('input', () => { saveNote.hidden = false; });
    return h('div.vl-markbox', h('div.vl-marks', btn('approve', 'APPROVE'), btn('fix', 'FIX'), btn('cut', 'CUT')), note, saveNote, who);
  }
  async function send(id, mark, note) {
    try {
      const r = o.onMark ? await o.onMark(id, mark, note) : null; marks = (r && r.marks) || { ...marks, [id]: { m: mark, note, at: Date.now() } }; repaintMarks();
      // SAVED ✓ (THE VAULT 1B — the owner looked for a save button: a mark saves on the tap; this says so, on that item, once the server has it)
      const b = blocks.get(id);
      if (b) { const s = h('span.vl-saved', { role: 'status' }, mark ? 'SAVED ✓' : 'CLEARED ✓'); b.mark.querySelector('.vl-marks').append(s); setTimeout(() => s.classList.add('is-out'), 1600); setTimeout(() => s.remove(), 2100); }
      if (window.__lab) window.__lab.saved = (window.__lab.saved || 0) + 1;
    }
    catch (e) { toast(e && e.message ? e.message : 'COULDN’T SAVE THE MARK', true); }
  }
  function repaintMarks() { for (const [id, b] of blocks) { const item = LAB.find(x => x.id === id); b.mark.replaceWith(b.mark = markRow(item)); } window.__lab && (window.__lab.marks = marks); }

  function stripsView() {
    const grid = h('div.vl-items');
    content.replaceChildren(grid);
    const rows = [], places = [];
    for (const item of LAB) {
      const head = h('div.vl-item-h', h('b', `${item.n} · ${item.name}`), h('span', TIER_NAMES[item.tier]), h('code', item.id));
      const stage = h('div.vl-stage.vl-col');
      const blk = h('section.vl-item', { dataset: { id: item.id } }, head, stage, h('p.vl-motion', item.motion));
      grid.append(blk);
      if (item.kind === 'card') {
        const g = GUESTS[(item.n - 1) % GUESTS.length];
        places.push({ stage, rows: [{ card: item.id, name: g.name, lv: g.lv, host: item.n === 1 }] });
      } else {
        const em = TEST_EMBLEMS[item.id];
        stage.append(h('div.vl-emb-big', emblemSvg(em.finish, 'lead'), emblemSvg(em.finish, 'even', { size: 28 }),
          h('small', 'full size · at 28 pt (its lobby size)', h('br'), `On a COMMON card it ${prominence('common', em.tier) === 'lead' ? 'LEADS' : 'plays even'} · on a LEGENDARY it ${prominence('legendary', em.tier) === 'quiet' ? 'plays QUIETER' : 'plays even'}`)));
        places.push({ stage, rows: [{ card: 'card-brushed', name: 'BEN', lv: 23, emblem: item.id }, { card: 'card-sg-ufo', name: 'EMMA', lv: 64, emblem: item.id }] });
      }
      const mark = markRow(item);
      blk.append(mark);
      blocks.set(item.id, { blk, mark });
      rows.push(item);
    }
    // ONE effect surface for the whole view (the grid): every strip a slot in it
    const surface = createSurface(grid, { label: 'lab' });
    for (const p of places) for (const r of p.rows) {
      const el = stripEl(r);
      p.stage.append(h('div.vl-col.vl-one', el));
      const look = LOOKS[r.card];
      if (look && look.fx) surface.add(el, FX[look.fx], { seed: r.lv || 1, radius: 12 });
    }
    mounted.push({ destroy: () => surface.destroy() });
  }

  function lobbyView() {
    const pick = h('select.vl-tab', { 'aria-label': '8 of one card', onchange: () => { mix = pick.value; draw(); } },
      h('option', { value: '' }, '8 OF ONE…'), ...CARDS.map(c => h('option', { value: c.id }, c.name)));
    const mixes = [['samples', 'THE 8 SAMPLES'], ['legend', '8 LEGENDARIES']].map(([k, l]) => h('button.vl-tab', { type: 'button', dataset: { k }, onclick: () => { mix = k; pick.value = ''; draw(); } }, l));
    const list = h('div.vl-list');
    const box = h('div.vl-lobby', h('div.vl-lobby-h', 'IN THE LOBBY · 8 / 8'), list);
    content.replaceChildren(h('div.vl-mix', ...mixes, pick), box,
      h('p.vl-motion', 'The lobby’s calmer cut, all eight on ONE shared canvas. The readout (bottom right): frames a second, the effects’ tier, their draw cost, the canvas size.'));
    const draw = () => {
      unmountAll();
      for (const b of mixes) b.classList.toggle('is-on', b.dataset.k === mix);
      list.replaceChildren();
      const rows = GUESTS.map((g, i) => ({ card: mix === 'samples' ? CARDS[i % CARDS.length].id : mix === 'legend' ? 'card-sg-ufo' : mix, name: g.name, lv: g.lv, seed: i + 1, host: i === 0 }));
      mounted.push(mountStrips(list, rows, { calm: true, label: 'lobby' }));
      window.__lab && (window.__lab.mix = mix);
    };
    draw();
  }

  function show(v) {
    view = v; unmountAll();
    for (const b of tabs.querySelectorAll('.vl-tab')) b.classList.toggle('is-on', b.dataset.v === v);
    if (v === 'lobby') lobbyView(); else stripsView();
    window.__lab && (window.__lab.view = v);
    try { const q = new URLSearchParams(location.search); q.set('view', v); history.replaceState(null, '', `${location.pathname}?${q}`); } catch { /* fine */ }
  }

  // the fps readout: its own frame counter (the whole page's frames) + the effect library's numbers
  let frames = 0, t0 = performance.now(), raf = 0;
  const count = () => { frames++; raf = requestAnimationFrame(count); };
  raf = requestAnimationFrame(count);
  fpsT = setInterval(() => {
    const now = performance.now(), f = Math.round(frames * 1000 / (now - t0)); frames = 0; t0 = now;
    fps.textContent = `${f} fps · ${fxStats.fms} ms/frame\n${fxStats.slow} slow /s${fxStats.scrolling ? ' · SCROLL-HELD' : ''}\nfx tier ${fxStats.tier}${fxStats.held ? ' HELD' : ''} · ${fxStats.dpr}× · ${fxStats.ms} ms js\n${fxStats.gpu ? `GPU · ${fxStats.draws} draws` : '2D canvas'} · ${fxStats.slots} slots · ${fxStats.mp} MP`;
    fps.classList.toggle('is-bad', f < 55 && !fxReduced());
    if (window.__lab) window.__lab.fps = f;
  }, 500);

  function toast(msg, bad) { const t = h('div.vl-toast', { class: bad ? 'is-bad' : '' }, msg); document.body.append(t); setTimeout(() => t.classList.add('is-out'), 2200); setTimeout(() => t.remove(), 2600); }

  window.__lab = { marks, view, fps: 0, stats: fxStats, show, mix, diag: {} };
  applyDiag();
  paintOpts();
  const q = new URLSearchParams(location.search);
  if (q.get('mix')) mix = q.get('mix');
  show(q.get('view') === 'lobby' ? 'lobby' : 'strips');
  return {
    setMarks(m) { marks = m || {}; repaintMarks(); },
    destroy() { unmountAll(); clearInterval(fpsT); cancelAnimationFrame(raf); },
  };
}
