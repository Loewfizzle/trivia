// OVERCLOCK — MAKE 24: merge tiles with + − × ÷ (exact fractions) to reach 24.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, pulseClass, vibrate } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';
import { applyOp, OP_SIGN } from '../challenges.js';
import { fmtSigned, fracEl, fastButton } from '../shared.js';

export default function uiMake24(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-m24');
  let idx = Math.min(1, Math.floor(chal.p));
  let tiles = [], history = [], sel = null, op = null, busy = false, uid = 0;
  const title = h('div.ch-prompt');
  const tileRow = h('div.m24-tiles');
  const status = h('div.m24-status');
  const OPS = { '+': 'Plus', '-': 'Minus', '*': 'Times', '/': 'Divided by' };
  const opBtns = Object.keys(OPS).map(o => fastButton('button.m24-op', { dataset: { op: o }, 'aria-label': OPS[o] }, () => pickOp(o), OP_SIGN[o]));
  const undoBtn = fastButton('button.btn.btn-ghost.btn-sm', {}, () => undo(), '↶ UNDO');
  const resetBtn = fastButton('button.btn.btn-ghost.btn-sm', {}, () => reset(), 'RESET');
  const skipBtn = fastButton('button.btn.btn-ghost.btn-sm', {}, () => doSkip(), 'SKIP →');
  const fmtV = v => (v[1] === 1 ? fmtSigned(v[0]) : `${fmtSigned(v[0])}/${v[1]}`);
  const say = (t, cls = '') => { status.textContent = t; status.className = `m24-status ${cls}`; };
  const paint = fresh => {
    tileRow.style.setProperty('--n', tiles.length);
    tileRow.replaceChildren(...tiles.map((t, k) => fastButton('button.m24-tile', {
      class: [t.id === sel ? 'is-sel' : '', t.id === fresh ? 'is-new' : ''].join(' '), 'aria-label': `Tile ${fmtV(t.v)}`, dataset: { k: String(k) },
    }, () => pickTile(t.id), fracEl(t.v))));
    opBtns.forEach(b => b.classList.toggle('is-on', b.dataset.op === op));
    wrap.classList.toggle('has-sel', sel != null);
    undoBtn.disabled = !history.length;
    resetBtn.disabled = !history.length;
  };
  const show = () => {
    tiles = s.puzzles[idx].nums.map(n => ({ id: uid++, v: [n, 1] }));
    history = []; sel = null; op = null;
    title.textContent = `PUZZLE ${idx + 1}/2 · ${idx ? 'HARD' : 'EASY'}`;
    skipBtn.hidden = idx > 0;
    wrap.classList.remove('is-solved');
    say('NUMBER → OPERATOR → NUMBER');
    paint();
    pulseClass(tileRow, 'q-in');
  };
  const next = () => { busy = false; if (chal.done) return; idx = 1; show(); };
  const pickTile = id => {
    if (busy || chal.done) return;
    if (sel == null || (op == null && sel !== id)) { sel = id; sfx('key'); vibrate(5); paint(); return; }
    if (sel === id) { sel = null; op = null; sfx('tap'); paint(); return; }
    merge(sel, op, id);
  };
  const pickOp = o => {
    if (busy || chal.done) return;
    if (sel == null) { say('PICK A NUMBER FIRST', 'is-warn'); pulseClass(tileRow, 'nudge', 400); return; }
    op = op === o ? null : o;
    sfx('tap');
    vibrate(5);
    paint();
  };
  const merge = (aId, o, bId) => {
    const a = tiles.find(t => t.id === aId), b = tiles.find(t => t.id === bId);
    const v = applyOp(a.v, o, b.v);
    if (!v) { sfx('invalid'); pulseClass(tileRow, 'shake', 450); say('YOU CAN’T DIVIDE BY ZERO', 'is-warn'); op = null; paint(); return; }
    history.push(tiles.map(t => ({ ...t })));
    const t = { id: uid++, v };
    tiles = tiles.flatMap(x => (x.id === aId ? [] : x.id === bId ? [t] : [x]));
    sel = tiles.length > 1 ? t.id : null; // keep going from the result
    op = null;
    sfx('select');
    vibrate(8);
    paint(t.id);
    if (tiles.length > 1) { say(`${fmtV(a.v)} ${OP_SIGN[o]} ${fmtV(b.v)} = ${fmtV(v)}`); return; }
    if (v[0] === 24 && v[1] === 1) {
      busy = true;
      wrap.classList.add('is-solved');
      say('24 — SOLVED!', 'is-good');
      api.part(true);
      if (!chal.done) setTimeout(next, 1000);
    } else {
      sfx('invalid');
      pulseClass(tileRow, 'shake', 450);
      say(`THAT MAKES ${fmtV(v)} — UNDO OR RESET`, 'is-warn');
    }
  };
  const undo = () => { if (busy || !history.length) return; tiles = history.pop(); sel = null; op = null; sfx('tap'); say('UNDONE'); paint(); };
  const reset = () => { if (busy || !history.length) return; tiles = history[0]; history = []; sel = null; op = null; sfx('tap'); say('BACK TO THE START'); paint(); };
  const doSkip = () => {
    if (busy || chal.done || idx > 0) return;
    busy = true;
    say(`ONE WAY: ${s.puzzles[0].sol}`, 'is-warn');
    api.part(false, true);
    setTimeout(next, 1800);
  };
  api.key = e => {
    if (OPS[e.key] || e.key === 'x') pickOp(e.key === 'x' ? '*' : e.key);
    else if (/^[1-4]$/.test(e.key) && tiles[Number(e.key) - 1]) pickTile(tiles[Number(e.key) - 1].id);
    else if (e.key === 'Backspace') undo();
    else if (e.key === 'Escape') reset();
  };
  show();
  wrap.append(title, h('div.m24-target', h('small', 'MAKE'), h('b', '24')), tileRow, h('div.m24-ops', opBtns), status, h('div.ch-actions.m24-actions', undoBtn, resetBtn, skipBtn));
  return { el: wrap, destroy() { api.key = null; } };
}
