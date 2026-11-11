// THE DAILY MODULE — SHARE TODAY (BOARD 2.0 B — the owner's add-on, Nov 9: "SHARE TODAY = ONE CARD FROM EACH DAILY's OWN PIECES"; the ticket version
// before it was "a weird one"). ONE 1080 × 1350 card: ONE header (the date + the streak flame), a SECTION per FINISHED daily in the dailies' order —
// each drawn by THAT DAILY's own share card's pieces (its `paintSection` — js/games/<id>/share.js: the same painters its own card calls, never a
// redraw or a copy; its own small wordmark on top), ONE foot (NEONSPEAKEASY.COM as the headline — CITY FIXES' rule; no per-daily footers).
// The data: each section from its daily's SPOILER-FREE share inputs, which the SERVER builds from its record of the finished run (`today { share }`
// — THE PASSWORD's marks + counts, COAST CLEAR's no-board inputs; never a word, a letter or the board). An unfinished daily = no section, one quiet
// "NOT YET: <name>" line. ONE daily finished = that daily's OWN card, exactly as it is. A daily with no section painter (a new one plugged in) or
// no share data → its name + its result line (its meta's scoreLine). Up to 6 sections, scaled evenly. Both looks (the day sky / the night neon).
// THE BAR: shown 360 px wide in a text thread, THE PASSWORD's grid colours, the time and the address still read (the pass log's shots).
import { shareFrame, sendShare } from './share.js';
import { shareTodayLine, MAX_ROWS } from './today-logic.js';
import { dateLineOf } from './ticket-art.js';
import { lazyImport } from '../ui/lazy-import.js';

const LOOKS = {
  night: { bg0: '#05040c', bg1: '#140a24', ink: '#f6f2ff', dim: 'rgba(226,222,246,0.72)', sign: '#ff6fc8', glow: 'rgba(255,111,200,0.75)', rule: 'rgba(255,255,255,0.12)' },
  day: { bg0: '#9fcdff', bg1: '#f2f8ff', ink: '#14284a', dim: '#3a5582', sign: '#16305c', glow: 'transparent', rule: 'rgba(22,48,92,0.16)' },
};
const FONT_D = 'Orbitron, "Chakra Petch", system-ui, sans-serif', FONT_U = '"Chakra Petch", system-ui, sans-serif';
/** the dailies whose OWN share card can paint a section: the module + its inputs from the server's share data */
const SECTIONS = {
  password: { load: () => Promise.all([lazyImport(import('../games/password/share.js'), '../games/password/share.js'), lazyImport(import('../games/password/logic.js'), '../games/password/logic.js')]).then(([S, G]) => ({ S, input: s => ({ run: G.runFromShare(s) }), ok: s => !!G.runFromShare(s) })) },
  coastclear: { load: () => lazyImport(import('../games/coastclear/share.js'), '../games/coastclear/share.js').then(S => ({ S, input: s => ({ inputs: s }), ok: s => !!s })) },
};

/** the streak flame (js/progress/flame-art.js — the one flame everywhere) as a bitmap */
async function flameImage(state, w) {
  try {
    const { flameSvg } = await lazyImport(import('../progress/flame-art.js'), '../progress/flame-art.js');
    const s = new XMLSerializer().serializeToString(flameSvg(state, w));
    return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`; });
  } catch { return null; }
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

/** the plan (PURE — tests/share-today.test.mjs): which dailies get a section, which read NOT YET, whether ONE daily's own card is the whole image */
export function planToday(today, share = {}, painters = Object.keys(SECTIONS)) {
  const ds = (today.dailies || []).slice(0, MAX_ROWS);
  const done = ds.filter(d => today.mine && today.mine[d.id] != null);
  const notYet = ds.filter(d => !done.includes(d));
  const sections = done.map(d => ({ id: d.id, name: d.name, own: painters.includes(d.id) && share && share[d.id] != null }));
  return { sections, notYet: notYet.map(d => d.name), single: sections.length === 1 && sections[0].own ? sections[0].id : null };
}

/**
 * THE CARD (a canvas). { streak } = the profile's streak (the flame + its count), { share } = the server's spoiler-free inputs per daily (`today
 * { share }`). Async: the dailies' share modules + the flame load on demand.
 */
export async function drawToday(today, lineOf, look = document.body.dataset.look === 'day' ? 'day' : 'night', { streak = 0, share = {} } = {}) {
  const night = look !== 'day', L = LOOKS[look] || LOOKS.night;
  const plan = planToday(today, share);
  const mods = {};
  await Promise.all(plan.sections.filter(s => s.own).map(async s => { try { mods[s.id] = await SECTIONS[s.id].load(); if (!mods[s.id].ok(share[s.id])) { delete mods[s.id]; s.own = false; } } catch { s.own = false; } }));
  // ONE daily finished → that daily's OWN card, exactly as it is (its own sign, foot and all)
  if (plan.single && mods[plan.single]) { const M = mods[plan.single]; return M.S.renderShare({ ...M.input(share[plan.single]), look }); }
  const { cv, c, W } = shareFrame({ bg0: L.bg0, bg1: L.bg1 }, look);
  const flame = streak > 0 ? await flameImage('lit', 160) : null;
  if (night) { const hz = c.createRadialGradient(W / 2, -60, 0, W / 2, -60, 720); hz.addColorStop(0, 'rgba(255,111,200,0.14)'); hz.addColorStop(1, 'rgba(255,111,200,0)'); c.fillStyle = hz; c.fillRect(0, 0, W, 1350); }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // ONE HEADER: the date + the streak flame (PD-4's Group 0 — the owner: ~1.4× bigger, it reads in a thread)
  c.save(); c.font = `800 53px ${FONT_U}`; c.letterSpacing = '12px'; c.fillStyle = L.ink; c.fillText(dateLineOf(today.day), W / 2 + 6, 82); c.restore();
  let top = 136;
  if (streak > 0) {
    const fw = 72, fh = Math.round(fw * 160 / 140), label = `${streak}-DAY STREAK`;
    c.save(); c.font = `800 45px ${FONT_U}`; c.letterSpacing = '6px';
    const tw = c.measureText(label).width, lx = W / 2 - (fw + 18 + tw) / 2;
    if (flame) c.drawImage(flame, lx, 158 - fh / 2, fw, fh);
    c.textAlign = 'left'; c.fillStyle = L.dim; c.fillText(label, lx + fw + 18, 160); c.restore();
    c.textAlign = 'center';
    top = 222;
  }
  // THE SECTIONS — ALL the room between the header and the foot, shared evenly (≤ 6; PD-4's Group 0: no empty band above the foot), each drawn by
  // its daily's own pieces in its whole box (a box taller than the section's smallest lays itself out in it — centred)
  const notLine = plan.notYet.length ? `NOT YET: ${plan.notYet.join(' · ')}` : '';
  const bottom = notLine ? 1166 : 1218, gap = 24, n = Math.max(1, plan.sections.length);
  const each = (bottom - top - gap * (n - 1)) / n;
  plan.sections.forEach((sec, i) => {
    const y = top + i * (each + gap);
    if (i) { c.save(); c.strokeStyle = L.rule; c.lineWidth = 2; c.beginPath(); c.moveTo(150, y - gap / 2); c.lineTo(W - 150, y - gap / 2); c.stroke(); c.restore(); }
    const M = sec.own ? mods[sec.id] : null;
    if (M) {
      // (scaled to its share of the card's height, never past its own size; drawn W / s wide, so it always spans the card's full width)
      const H0 = M.S.SECTION_H || 420, s = Math.min(1, each / H0);
      c.save(); c.translate(0, y); c.scale(s, s);
      M.S.paintSection(c, { ...M.input(share[sec.id]), look, W: W / s, H: each / s });
      c.restore();
    } else {
      // a daily with no section painter / no share data: its name (a small sign) + its result line
      const cy = y + each / 2, k = Math.min(1, each / 300);
      c.save(); c.font = `900 ${Math.round(46 * k)}px ${FONT_D}`; c.letterSpacing = `${Math.round(8 * k)}px`;
      if (night) { c.shadowColor = L.glow; c.shadowBlur = 22; }
      c.fillStyle = night ? '#fff3fb' : L.sign; c.fillText(String(sec.name || '').toUpperCase(), W / 2 + 4, cy - 46 * k); c.restore();
      c.save(); c.font = `800 ${Math.round(52 * k)}px ${FONT_U}`; c.letterSpacing = '3px'; c.fillStyle = L.ink;
      c.fillText(String(lineOf(sec.id, today.mine[sec.id])), W / 2 + 2, cy + 34 * k); c.restore();
    }
  });
  if (notLine) { c.save(); c.font = `700 26px ${FONT_U}`; c.letterSpacing = '5px'; c.fillStyle = L.dim; c.fillText(notLine, W / 2 + 3, 1196); c.restore(); }
  // ONE FOOT = THE ADDRESS AS ITS HEADLINE (CITY FIXES — the dailies chat, Nov 8): NEONSPEAKEASY.COM about the result lines' size, bold, wide
  // tracking; NIGHT a small neon sign (the pink in a soft glow, a white core, a thin pink tube round it); DAY strong dark navy. It must read when
  // the image is shown SMALL in a text thread (a 360-px-wide downscale: ~17 px letters)
  { const ADDR = 'NEONSPEAKEASY.COM', ay = 1280;
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    let fs = 52, ls = 7; c.font = `800 ${fs}px ${FONT_U}`; c.letterSpacing = `${ls}px`;
    while (c.measureText(ADDR).width > W - 220 && fs > 34) { fs -= 2; ls = Math.max(4, ls - 0.3); c.font = `800 ${fs}px ${FONT_U}`; c.letterSpacing = `${ls}px`; }
    const tw = c.measureText(ADDR).width, cx = W / 2 + ls / 2;
    if (night) {
      const bw = tw + 76, bh = fs + 36;
      c.save(); c.shadowColor = L.glow; c.shadowBlur = 22; c.strokeStyle = L.sign; c.lineWidth = 4; roundRect(c, W / 2 - bw / 2, ay - bh / 2, bw, bh, bh / 2); c.stroke();
      c.shadowBlur = 4; c.strokeStyle = 'rgba(255,236,248,0.85)'; c.lineWidth = 1.4; roundRect(c, W / 2 - bw / 2, ay - bh / 2, bw, bh, bh / 2); c.stroke(); c.restore();
      c.shadowColor = L.glow; c.shadowBlur = 30; c.fillStyle = L.sign; c.fillText(ADDR, cx, ay);
      c.shadowBlur = 7; c.fillStyle = '#fff3fb'; c.fillText(ADDR, cx, ay);
    } else { c.fillStyle = '#10234a'; c.fillText(ADDR, cx, ay); }
    c.restore(); }
  return cv;
}

/** SHARE TODAY's tap: the server's spoiler-free share inputs for your finished runs (`today { share }`), the card, the share sheet + the one line */
export async function shareToday(today, lineOf, { streak = 0 } = {}) {
  const line = shareTodayLine(today, (id, s) => String(lineOf(id, s)).toLowerCase());
  let share = {};
  try { const { dailyShare } = await lazyImport(import('./contract.js'), './contract.js'); const r = await dailyShare(); share = (r && r.day === today.day && r.share) || {}; } catch { /* the sections fall back to the result lines */ }
  const cv = await drawToday(today, lineOf, undefined, { streak, share });
  return sendShare(cv, { file: 'neon-speakeasy-dailies.png', line });
}
