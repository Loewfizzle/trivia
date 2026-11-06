// OVERCLOCK — DUMB LUCK's screen (OC5 — the rules: luck.js; the plan: docs/overclock.md "DUMB LUCK"). Three moments inside ONE challenge
// slot, every one drawn from the room's state + the server clock (a refresh / a locked phone / a new host lands on the same moment):
//   THE ODDS BOARD (~7 s)   six cards, one per horse in its OWN color (the same on every phone — never orange): the color's name, the odds
//                           BIG, PAYS n; tap to pick (changeable until the gate closes); your card FILLS with its color; who's on which
//                           horse rides as name tags ("MAYA +1").
//   THE RACE (16 s)         a night track, six horizontal lanes, NEON-TUBE horses (Muybridge's gallop traced — horse-frames.js) galloping
//                           left → right, a checkered neon finish line; YOUR horse pulses, its lane breathes in its color, its number wears
//                           a white ring, a small white YOU tag (on trial). Canvas 2D: every frame of every horse PRE-RENDERED once per
//                           color (a sprite sheet); the race only moves + flips frames.
//   THE FINISH (4 s)        the photo-finish freeze, the winner's color blasts the screen, the payouts row (yours in your horse's color),
//                           LONG SHOT! for an 8-1 / 12-1 win. Then OVERCLOCK's shared flow (WINNING TICKETS / THE HOUSE WINS → standings).
// Sounds (felt, not heard — the game works silently): the bell at the off, the hooves under the race (a gapless loop), the crowd swelling
// down the stretch, the photo-finish click, LONG SHOT!.
import { h, reducedMotion } from '../../../ui/dom.js';
import { avatar } from '../../../ui/components.js';
import { colorHex } from '../../../config.js';
import { ctx2d } from '../../../ui/canvas-safe.js';
import { HORSES, DL_PICK_MS, DL_RACE_MS, LONG_SHOT, pickOf, dlOf, dlStage, raceScript, posAt, leaderAt } from '../luck.js';
import { FRAMES, GROUND, LOOP } from '../horse-frames.js';
import { ocSfx, ocLoop } from '../sfx.js';

// ---------------------------------------------------------------------------------------------- THE NEON HORSES (pre-rendered)
const PADU = 16;                                  // the glow's room around a frame (horse units — 100 = nose to tail)
const CELL_W = 100 + PADU * 2, CELL_H = GROUND + PADU * 2;
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const rgba = (hex, a) => `rgba(${rgb(hex).join(',')},${a})`;
const PATHS = FRAMES.map(fr => {
  const p = new Path2D();
  for (const lp of fr) {
    p.moveTo(lp[0], lp[1]);
    for (let k = 2; k < lp.length; k += 2) p.lineTo(lp[k], lp[k + 1]);
    p.closePath();
  }
  return p;
});
/** one color's 12 frames on one canvas: the NEON TUBE STACK (a wide soft glow · the near glow · the tube · a white-hot core) over a faint
 *  glass fill; `halo` = the wide breathing glow only (YOUR horse's pulse — its opacity animates, nothing else) */
function horseSheet(color, L, dpr, halo = false) {
  const k = L / 100, px = k * dpr;
  const cw = Math.ceil(CELL_W * px), ch = Math.ceil(CELL_H * px);
  const cv = document.createElement('canvas');
  cv.width = cw * FRAMES.length; cv.height = ch;
  const x = ctx2d(cv);
  if (!x) return null;
  x.lineJoin = 'round'; x.lineCap = 'round';
  const u = css => css / k;                       // css px → horse units
  FRAMES.forEach((_, i) => {
    x.setTransform(px, 0, 0, px, i * cw + PADU * px, PADU * px);
    const P = PATHS[i];
    if (halo) {
      x.shadowColor = rgba(color, 0.95); x.shadowBlur = 11 * dpr;
      x.strokeStyle = rgba(color, 0.55); x.lineWidth = u(7); x.stroke(P);
      x.shadowBlur = 0;
      x.strokeStyle = rgba('#ffffff', 0.35); x.lineWidth = u(3.2); x.stroke(P);
      return;
    }
    x.fillStyle = rgba(color, 0.13); x.fill(P, 'evenodd');
    x.shadowColor = rgba(color, 0.9); x.shadowBlur = 7 * dpr;
    x.strokeStyle = rgba(color, 0.32); x.lineWidth = u(5.2); x.stroke(P);
    x.shadowBlur = 0;
    x.strokeStyle = rgba(color, 0.55); x.lineWidth = u(3.4); x.stroke(P);
    x.strokeStyle = color; x.lineWidth = u(2.2); x.stroke(P);
    x.strokeStyle = 'rgba(255,255,255,0.88)'; x.lineWidth = u(0.75); x.stroke(P);
  });
  return { cv, cw, ch, k };
}
/** a frame from a sheet, the horse's NOSE at (nx) + its hooves on (gy) — css px */
function drawHorse(c, sheet, f, nx, gy, alpha = 1) {
  if (!sheet) return;
  const { cv, cw, ch, k } = sheet;
  const w = CELL_W * k, hh = CELL_H * k;
  const dx = nx - (PADU + 100) * k, dy = gy - (PADU + GROUND) * k;
  if (alpha !== 1) c.globalAlpha = alpha;
  c.drawImage(cv, f * cw, 0, cw, ch, dx, dy, w, hh);
  if (alpha !== 1) c.globalAlpha = 1;
}

/** the odds card's own small neon horse (the extended gallop — frame 7), an SVG in the card's color: the glass, a soft glow (static), the
 *  tube, a white-hot core — nothing on it moves */
const CARD_FRAME = 6;
const CARD_D = FRAMES[CARD_FRAME].map(lp => {
  let d = `M${lp[0]} ${lp[1]}`;
  for (let k = 2; k < lp.length; k += 2) d += `L${lp[k]} ${lp[k + 1]}`;
  return `${d}Z`;
}).join('');
let cardN = 0;
function cardHorse(i) {
  const id = `ocdlh${++cardN}`;
  const vb = `${-PADU} ${-PADU} ${CELL_W} ${CELL_H}`;
  return h('span.oc-dl-card-horse', { 'aria-hidden': 'true', html: `<svg viewBox="${vb}" aria-hidden="true"><defs><filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter></defs><path class="oc-dlh-fill" d="${CARD_D}"/><path class="oc-dlh-glow" filter="url(#${id})" d="${CARD_D}"/><path class="oc-dlh-tube" d="${CARD_D}"/><path class="oc-dlh-core" d="${CARD_D}"/></svg>` });
}

// ---------------------------------------------------------------------------------------------- the screen
const STAND = FRAMES.length - 1;     // frame 12 = standing (the gate)
const LANE_MIN = 52, LANE_MAX = 62;
const fmtOdds = n => `${n}-1`;

export default function uiDumbLuck(spec, api) {
  const field = spec.field;                                 // [{ k, name, c, lane, n, pay }]
  const me = api.me();
  const spectator = !api.isPlayer();
  let local = -1;                                           // my pick before the room echoes it
  let raf = 0, gone = false, stage = '', lastLead = -1, leadAt = 0, calloutKey = '';
  let script = null, scriptKey = '', sheets = null, halo = null, winHalo = null, bg = null, tags = null;
  let W = 0, H = 0, laneH = 58, dpr = 1, L = 60;
  let hooves = null, roared = null, finishShown = false;
  const quiet = reducedMotion();

  // ---- THE ODDS BOARD
  const gateN = h('b.oc-dl-gate-n', '7');
  const gateBar = h('i.oc-dl-gate-fill');
  const cards = field.map((f, i) => {
    const tagsEl = h('span.oc-dl-tags');
    const el = h('button.oc-dl-card', { type: 'button', style: { '--hc': f.c }, dataset: { lane: String(i), sfx: 'none' }, 'aria-label': `${f.name}, ${fmtOdds(f.n)}, pays ${f.pay}` },
      h('span.oc-dl-card-glow', { 'aria-hidden': 'true' }),
      h('span.oc-dl-card-in',
        h('span.oc-dl-card-top', h('span.oc-dl-lane', String(i + 1)), h('b.oc-dl-cname', f.name)),
        h('span.oc-dl-card-mid', h('b.oc-dl-odds', fmtOdds(f.n)), h('span.oc-dl-pays', h('small', 'PAYS'), h('b', String(f.pay)))),
        h('span.oc-dl-card-bot', tagsEl, cardHorse(i))));
    const pick = e => { if (e) e.preventDefault(); choose(i); };
    el.addEventListener('pointerdown', pick);
    el.addEventListener('click', e => { if (e.detail === 0) pick(e); });
    return { el, tagsEl };
  });
  const ticket = h('div.oc-dl-ticket');
  const board = h('div.oc-dl-board',
    h('div.oc-dl-bhead', h('b.oc-dl-btitle', spectator ? 'THE FIELD' : 'PICK YOUR HORSE'), h('span.oc-dl-gate', 'GATE CLOSES IN ', gateN)),
    h('div.oc-dl-gatebar', gateBar),
    h('div.oc-dl-cards', cards.map(c => c.el)),
    ticket);

  // ---- THE RACE
  const canvas = h('canvas.oc-dl-cv', { 'aria-hidden': 'true' });
  const lanesEl = h('div.oc-dl-lanes', field.map((f, i) => h('span.oc-dl-lnum', { style: { '--hc': f.c }, dataset: { lane: String(i) } }, String(i + 1))));
  const callout = h('div.oc-dl-call', { 'aria-live': 'polite' });
  const orderChips = field.map((f, i) => h('span.oc-dl-ord', { style: { '--hc': f.c }, dataset: { lane: String(i) } }, h('b', String(i + 1))));
  const order = h('div.oc-dl-order', { 'aria-hidden': 'true' }, orderChips);
  let orderSig = '';
  const mine = h('div.oc-dl-mine');
  const result = h('div.oc-dl-result', { 'aria-live': 'polite' });
  const blast = h('i.oc-dl-blast', { 'aria-hidden': 'true' });
  const finish = h('div.oc-dl-fin', { 'aria-live': 'polite' });
  const track = h('div.oc-dl-track', h('div.oc-dl-rail', { 'aria-hidden': 'true' }), canvas, lanesEl, finish);
  const race = h('div.oc-dl-race', callout, order, track, mine, result);
  const el = h('div.oc-dl', { class: spectator ? 'is-spectator' : null }, board, race, blast);

  const ctx = ctx2d(canvas, { alpha: false });
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => size()) : null;
  if (ro) ro.observe(track);

  function size() {
    const r = track.getBoundingClientRect();   // (the ResizeObserver's callback — never in the frame loop)
    if (!r.width || !r.height) return;
    W = Math.round(r.width); H = Math.round(r.height);
    laneH = Math.max(LANE_MIN, Math.min(LANE_MAX, Math.floor((H - 20) / HORSES.length)));
    L = Math.round(laneH * 1.04);
    dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    track.style.setProperty('--lane', `${laneH}px`);
    track.style.setProperty('--top', `${topY()}px`);
    sheets = field.map(f => horseSheet(f.c, L, dpr));
    halo = null; winHalo = null; bg = null; tags = null;
    draw();
  }
  const topY = () => Math.round((H - laneH * HORSES.length) / 2);

  // ---- the state
  const game = () => api.game();
  const ci = () => game().ci;
  const myPick = () => {
    const b = api.boards()[me];
    const h0 = pickOf(b);
    return h0 >= 0 ? h0 : local;
  };
  const backers = lane => {
    const d = dlOf(game(), ci());
    const out = [];
    for (const uid of api.uids()) {
      const p = d ? (d.pk[uid] ?? -1) : uid === me && local >= 0 ? local : pickOf(api.boards()[uid]);
      if (p === lane) out.push(uid);
    }
    return out;
  };
  function choose(i) {
    if (spectator || stage !== 'pick') return;
    if (local === i && myPick() === i) return;
    local = i;
    api.pickHorse(i);
    ocSfx('tap');
    paintBoard();
  }

  // ---- THE ODDS BOARD's paint (every state change + each second of the gate)
  function paintBoard() {
    const pk = myPick();
    cards.forEach((c, i) => {
      c.el.classList.toggle('is-mine', pk === i);
      c.el.disabled = spectator || stage !== 'pick';
      const who = backers(i);
      const meIn = who.includes(me);
      const others = who.filter(u => u !== me);
      const kids = [];
      if (meIn) kids.push(h('span.oc-dl-tag.is-you', 'YOU'));
      if (others.length) kids.push(h('span.oc-dl-tag', api.player(others[0]).name, others.length > 1 ? h('small', ` +${others.length - 1}`) : null));
      const sig = `${meIn}|${others.join(',')}`;
      if (c.tagsEl.dataset.sig !== sig) { c.tagsEl.dataset.sig = sig; c.tagsEl.replaceChildren(...kids); }
    });
    const f = field[pk];
    ticket.replaceChildren(...(spectator ? [h('span', 'YOU JOIN THE NEXT MATCH — WATCH THE RACE')]
      : f ? [h('span.oc-dl-ticket-k', 'YOUR TICKET'), h('b', { style: { color: f.c } }, f.name), h('span', ` · ${fmtOdds(f.n)} · PAYS ${f.pay}`)]
        : [h('span', 'TAP A HORSE · ANY NUMBER OF YOU CAN BACK THE SAME ONE')]));
    ticket.classList.toggle('has-pick', !!f);
  }
  function paintMine() {
    const d = dlOf(game(), ci());
    const pk = d ? (d.pk[me] ?? -1) : myPick();
    const f = field[pk];
    mine.style.setProperty('--hc', f ? f.c : '#aab1c4');
    mine.replaceChildren(...(spectator ? [h('span', 'SPECTATING')]
      : f ? [h('span.oc-dl-mine-k', 'YOUR HORSE'), h('b', f.name), h('span', ` · ${fmtOdds(f.n)} · PAYS ${f.pay}`)]
        : [h('span.oc-dl-mine-k', 'NO TICKET'), h('span', ' — JUST WATCH')]));
    lanesEl.querySelectorAll('.oc-dl-lnum').forEach((n, i) => n.classList.toggle('is-mine', pk === i));
  }

  // ---- THE RACE's layers (built once per size)
  function buildBg() {
    const cv = document.createElement('canvas');
    cv.width = canvas.width; cv.height = canvas.height;
    const x = ctx2d(cv);
    if (!x) return null;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    // the night turf: deep green-black, the lanes alternating, a soft light from above
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#05080a'); g.addColorStop(0.5, '#070d0c'); g.addColorStop(1, '#040607');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const t0 = topY();
    for (let i = 0; i < HORSES.length; i++) {
      x.fillStyle = i % 2 ? 'rgba(40,70,58,0.10)' : 'rgba(30,52,46,0.05)';
      x.fillRect(0, t0 + i * laneH, W, laneH);
    }
    // the lane lines: faint glass hairlines
    x.strokeStyle = 'rgba(200,230,255,0.10)'; x.lineWidth = 1;
    for (let i = 1; i < HORSES.length; i++) { const y = Math.round(t0 + i * laneH) + 0.5; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    // the two rails: cool white neon tubes
    for (const y of [t0 - 3, t0 + laneH * HORSES.length + 3]) {
      x.shadowColor = 'rgba(190,225,255,0.9)'; x.shadowBlur = 8 * dpr;
      x.strokeStyle = 'rgba(190,225,255,0.45)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke();
      x.shadowBlur = 0; x.strokeStyle = 'rgba(245,250,255,0.9)'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke();
    }
    // a vignette at the two ends (the eye goes to the middle)
    const v = x.createLinearGradient(0, 0, W, 0);
    v.addColorStop(0, 'rgba(0,0,0,0.55)'); v.addColorStop(0.12, 'rgba(0,0,0,0)'); v.addColorStop(0.9, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.35)');
    x.fillStyle = v; x.fillRect(0, 0, W, H);
    return cv;
  }
  /** a lane's name tag ("YOU +1" · "MAYA +2") as a small sprite */
  function tagSprite(text, you, color) {
    const fs = 11, pad = 5;
    const cv = document.createElement('canvas');
    const x0 = ctx2d(cv);
    if (!x0) return null;
    x0.font = `700 ${fs}px 'OD Chakra', 'Chakra Petch', sans-serif`;
    const tw = Math.ceil(x0.measureText(text).width);
    const w = tw + pad * 2 + 2, hh = fs + 8;
    cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(hh * dpr);
    const x = ctx2d(cv);
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.font = `700 ${fs}px 'OD Chakra', 'Chakra Petch', sans-serif`;
    x.fillStyle = you ? 'rgba(255,255,255,0.95)' : 'rgba(10,12,17,0.82)';
    x.strokeStyle = you ? '#ffffff' : rgba(color, 0.85);
    x.lineWidth = 1;
    x.beginPath(); x.roundRect ? x.roundRect(0.5, 0.5, w - 1, hh - 1, 4) : x.rect(0.5, 0.5, w - 1, hh - 1); x.fill(); x.stroke();
    x.fillStyle = you ? '#0a0c11' : '#ffffff';
    x.textBaseline = 'middle';
    x.fillText(text, pad + 1, hh / 2 + 0.5);
    return { cv, w, h: hh };
  }
  function buildTags() {
    const d = dlOf(game(), ci());
    return field.map((f, i) => {
      const who = d ? Object.keys(d.pk).filter(u => d.pk[u] === i && api.uids().includes(u)) : backers(i);
      if (!who.length) return null;
      const meIn = who.includes(me), others = who.filter(u => u !== me);
      const text = meIn ? (others.length ? `YOU +${others.length}` : 'YOU') : `${api.player(others[0]).name.slice(0, 10)}${others.length > 1 ? ` +${others.length - 1}` : ''}`;
      return tagSprite(text, meIn, f.c);
    });
  }

  function ensureScript() {
    const g0 = game(), d = g0 && dlOf(g0, g0.ci);
    if (d && (!script || scriptKey !== `${g0.matchId}|${g0.ci}|${d.w}`)) { script = raceScript(g0.seed, g0.ci, d.w); scriptKey = `${g0.matchId}|${g0.ci}|${d.w}`; tags = null; }
    return script;
  }

  // ---- the frame: everything from (the script, the ms into the race) — PURE of the past (a refresh draws the same frame)
  const S = () => W * 10;                  // px per world unit (the track ≈ 10 screens long)
  function camOf(ms) {
    const lead = Math.max(...field.map((_, i) => posAt(script, i, ms)));
    const anchor = W * 0.64, line = W * 0.84;
    return { cam: Math.min(lead, 1 - (line - anchor) / S()), anchor };
  }
  function draw() {
    if (!ctx || !W) return;
    const g0 = game();
    if (!g0) return;
    const now = api.now();
    const st = dlStage(g0, g0.ci, now);
    const d = dlOf(g0, g0.ci);
    ensureScript();
    if (!bg) bg = buildBg();
    if (!tags && (d || stage !== 'pick')) tags = buildTags();
    const pk = d ? (d.pk[me] ?? -1) : myPick();
    if (pk >= 0 && !halo) halo = horseSheet(field[pk].c, L, dpr, true);
    const c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (bg) c.drawImage(bg, 0, 0, W, H); else { c.fillStyle = '#06080a'; c.fillRect(0, 0, W, H); }
    const ms = st.stage === 'race' ? st.ms : st.stage === 'finish' || st.stage === 'done' ? DL_RACE_MS : 0;
    const finished = st.stage === 'finish' || st.stage === 'done';
    if (finished && d && !winHalo) winHalo = horseSheet('#ffffff', L, dpr, true);
    const atGate = !script || (st.stage !== 'race' && st.stage !== 'finish' && st.stage !== 'done');
    const sp = S(), t0 = topY();
    const { cam, anchor } = script && !atGate ? camOf(ms) : { cam: 0, anchor: W * 0.64 };
    const X = wx => anchor + (wx - cam) * sp;
    const tw = performance.now() / 1000;
    // the rail posts scroll by (every 0.012 of the track — a post a beat at full gallop), the distance poles every 0.25
    c.strokeStyle = 'rgba(220,240,255,0.55)'; c.lineWidth = 1.4;
    const step = 0.012, first = Math.floor((cam - anchor / sp) / step) - 1, last = Math.ceil((cam + (W - anchor) / sp) / step) + 1;
    c.beginPath();
    for (let k = first; k <= last; k++) {
      const x = Math.round(X(k * step)) + 0.5;
      if (x < -2 || x > W + 2) continue;
      c.moveTo(x, t0 - 9); c.lineTo(x, t0 - 3);
      c.moveTo(x, t0 + laneH * HORSES.length + 3); c.lineTo(x, t0 + laneH * HORSES.length + 9);
    }
    c.stroke();
    // the starting gate (world 0) — a stall per lane, gone once the field is away
    const gx = X(0) + 4;
    if (gx > -10 && gx < W + 10) {
      c.strokeStyle = 'rgba(190,225,255,0.5)'; c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i <= HORSES.length; i++) { const y = t0 + i * laneH; c.moveTo(gx, y - 2); c.lineTo(gx, y + (i < HORSES.length ? laneH * 0.55 : 0)); }
      c.stroke();
    }
    // YOUR LANE breathes in your horse's color
    if (pk >= 0) {
      const a = quiet ? 0.12 : 0.1 + 0.07 * (0.5 + 0.5 * Math.sin(tw * 3.1));
      const lg = c.createLinearGradient(0, 0, W, 0);
      lg.addColorStop(0, rgba(field[pk].c, a * 1.5)); lg.addColorStop(1, rgba(field[pk].c, a * 0.35));
      c.fillStyle = lg; c.fillRect(0, t0 + pk * laneH + 1, W, laneH - 2);
    }
    // THE FINISH LINE (world 1): a checkered neon band + its two lit edges, FINISH over the top rail
    const fx = X(1);
    if (fx > -20 && fx < W + 20) {
      const top = t0 - 4, bot = t0 + laneH * HORSES.length + 4, sq = 5;
      for (let y = top, r = 0; y < bot; y += sq, r++) {
        c.fillStyle = r % 2 ? 'rgba(240,248,255,0.92)' : 'rgba(10,12,17,0.9)'; c.fillRect(fx - sq, y, sq, Math.min(sq, bot - y));
        c.fillStyle = r % 2 ? 'rgba(10,12,17,0.9)' : 'rgba(240,248,255,0.92)'; c.fillRect(fx, y, sq, Math.min(sq, bot - y));
      }
      c.shadowColor = 'rgba(255,255,255,0.9)'; c.shadowBlur = 10;
      c.fillStyle = 'rgba(255,255,255,0.95)'; c.fillRect(fx - sq - 1.5, top, 1.5, bot - top); c.fillRect(fx + sq, top, 1.5, bot - top);
      c.shadowBlur = 0;
    }
    // THE HORSES (top lane first — the lower lanes are nearer)
    for (let i = 0; i < HORSES.length; i++) {
      const wx = script && !atGate ? posAt(script, i, ms) : 0;
      const nx = X(wx);
      const gy = t0 + (i + 1) * laneH - Math.max(4, laneH * 0.09);
      let f = STAND;
      if (!atGate) {
        const stride = L * 1.75;
        f = st.stage === 'race' ? Math.floor(((wx * sp + i * 41) / stride) * LOOP) % LOOP : (i * 3 + 4) % LOOP;
        if (f < 0) f += LOOP;
      }
      const tg = tags && tags[i];
      if (tg) c.drawImage(tg.cv, Math.max(28, Math.round(nx - L * 1.04 - tg.w)), Math.round(t0 + i * laneH + laneH * 0.5 - tg.h * 0.2), tg.w, tg.h);
      if (i === pk && halo) drawHorse(c, halo, f, nx, gy, quiet ? 0.55 : 0.4 + 0.45 * (0.5 + 0.5 * Math.sin(tw * 4.2)));
      if (finished && d && i === d.w && winHalo) drawHorse(c, winHalo, f, nx, gy, 0.9);
      drawHorse(c, sheets && sheets[i], f, nx, gy);
    }
    // THE RUNNING ORDER (DOM): the places now — moved only when they change (transform)
    if (script && !atGate) {
      const now0 = field.map((_, i) => i).sort((a, b) => posAt(script, b, ms) - posAt(script, a, ms));
      const sig = now0.join('');
      if (sig !== orderSig) { orderSig = sig; now0.forEach((lane, k) => { orderChips[lane].style.transform = `translateX(${k * 100}%)`; orderChips[lane].classList.toggle('is-first', k === 0); }); }
    }
    // the race's callouts (DOM — the words), at most one change a beat
    if (st.stage === 'race' && script) {
      const ld = leaderAt(script, ms);
      let key;
      if (ms < 1700) key = 'off';
      else if (ms > DL_RACE_MS - 3600) key = 'stretch';
      else if (ld !== lastLead && ms - leadAt > 1100) { lastLead = ld; leadAt = ms; key = `lead${ld}`; } else key = calloutKey;
      if (key !== calloutKey) setCall(key, ld);
      // the crowd swells down the stretch
      if (!roared && ms > DL_RACE_MS - 5200 && ms < DL_RACE_MS - 400) { roared = ocLoop('roar', { gain: 0.25, fadeMs: 900 }); setTimeout(() => roared && roared.gain(1, 2500), 60); }
    }
  }
  function setCall(key, ld) {
    calloutKey = key;
    const f = field[ld];
    const kids = key === 'off' ? [h('b', 'AND THEY’RE OFF!')]
      : key === 'stretch' ? [h('b', 'THE FINAL STRETCH')]
        : key === 'gate' ? [h('b', 'AT THE GATE…')]
          : key.startsWith('lead') && f ? [h('b', { style: { color: f.c } }, f.name), h('span', ' LEADS')] : [];
    callout.replaceChildren(h('span.oc-dl-call-in', { class: quiet ? null : 'is-in' }, ...kids));
  }

  // ---- THE FINISH (the photo-finish freeze, the color blast, the payouts, LONG SHOT!)
  function showFinish(animate) {
    if (finishShown) return;
    finishShown = true;
    const g0 = game(), d = dlOf(g0, g0.ci);
    if (!d) return;
    const f = field[d.w];
    const winners = api.uids().filter(u => d.pk[u] === d.w);
    const long = f.n >= LONG_SHOT;
    ensureScript();
    const photo = script && script.photo;
    const myH = d.pk[me];
    const youWon = winners.includes(me);
    const place = script ? script.order.indexOf(myH) : -1;
    el.style.setProperty('--wc', f.c);
    finish.style.setProperty('--wc', f.c);
    const chips = winners.slice(0, 6).map((u, k) => {
      const p = api.player(u);
      return h('span.oc-dl-pay', { class: u === me ? 'is-you' : null, style: { '--k': k, ...(u === me ? { '--hc': f.c } : {}) } }, avatar(p.avatar, p.color, 22), h('b', u === me ? 'YOU' : p.name), h('em', `+${f.pay}`));
    });
    const kids = [h('i.oc-dl-flash', { 'aria-hidden': 'true' })];
    if (long) kids.push(h('div.oc-dl-rays-clip', { 'aria-hidden': 'true' }, h('i.oc-dl-rays')), h('div.oc-dl-long', { 'data-text': 'LONG SHOT!' }, 'LONG SHOT!'));
    if (photo) kids.push(h('div.oc-dl-photo', h('b', 'PHOTO FINISH')));
    finish.replaceChildren(...kids);
    const res = [
      h('div.oc-dl-wname', h('b', f.name), h('span', ' WINS'), h('em', ` · ${fmtOdds(f.n)}`)),
      h('div.oc-dl-pays', ...(chips.length ? chips : [h('span.oc-dl-nopay', `NOBODY BACKED ${f.name}`)]), ...(winners.length > 6 ? [h('span.oc-dl-more', `+${winners.length - 6}`)] : [])),
    ];
    if (!spectator) res.push(h('div.oc-dl-you', { class: youWon ? 'is-won' : null, style: { '--hc': field[myH] ? field[myH].c : '#aab1c4' } },
      youWon ? `YOUR TICKET PAYS +${f.pay}` : myH == null ? 'NO TICKET THIS RACE' : `YOUR HORSE · ${field[myH].name} · ${ordinal(place + 1)}`));
    result.replaceChildren(...res);
    result.classList.add('is-on');
    result.classList.toggle('is-instant', !animate || quiet);
    blast.classList.add('is-on');
    blast.classList.toggle('is-instant', !animate || quiet);
    el.classList.add('is-finished');
    finish.classList.add('is-on');
    finish.classList.toggle('is-instant', !animate || quiet);
    finish.classList.toggle('is-long', long);
    if (animate) {
      ocSfx('photo');
      if (long) setTimeout(() => { if (!gone) ocSfx('longshot'); }, 520);
    }
    if (hooves) { hooves.stop(700); hooves = null; }
    if (roared) { roared.gain(0.6, 300); const r = roared; roared = null; setTimeout(() => r.stop(1600), 900); }
  }
  const ordinal = n => (n === 1 ? '1ST' : n === 2 ? '2ND' : n === 3 ? '3RD' : n > 0 ? `${n}TH` : '—');

  // ---- the loop: the stage now (from the server clock), its paint, the race's frame
  function tick() {
    raf = 0;
    if (gone) return;
    const g0 = game();
    if (!g0) return;
    const now = api.now();
    const st = dlStage(g0, g0.ci, now);
    if (st.stage !== stage) enter(st.stage, st);
    if (st.stage === 'pick') {
      const left = Math.max(0, g0.playStartAt + DL_PICK_MS - now);
      const n = String(Math.ceil(left / 1000));
      if (gateN.textContent !== n) { gateN.textContent = n; gateN.parentElement.classList.toggle('is-hot', left <= 3000); }
      gateBar.style.transform = `scaleX(${(left / DL_PICK_MS).toFixed(4)})`;
    } else draw();
    if (st.stage !== 'done') raf = requestAnimationFrame(tick);
  }
  function enter(next, st) {
    const was = stage;
    stage = next;
    el.dataset.stage = next;
    if (next === 'pick') { paintBoard(); return; }
    paintBoard(); paintMine();
    if (next === 'off') { setCall('gate'); return; }
    if (next === 'race') {
      tags = null;
      // the off: the bell (only seen live — a refresh mid-race drops straight in), the hooves under the race
      if (st.ms < 900) { ocSfx('bell'); }
      else if (st.ms < 2000) setCall('off');
      if (!hooves) hooves = ocLoop('hooves', { gain: 1, fadeMs: was ? 300 : 900 });
      return;
    }
    if (next === 'finish' || next === 'done') { if (!script) draw(); draw(); showFinish(next === 'finish' && st.ms < 450); }
  }

  /** the view calls this on every room update (the picks, the lock) */
  function sync() {
    if (gone) return;
    if (stage === 'pick') paintBoard();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  // the first paint + the loop
  setTimeout(() => { if (!gone && !W) size(); }, 0);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { tags = null; }).catch(() => {});
  raf = requestAnimationFrame(tick);
  paintBoard();

  return {
    el,
    sync,
    destroy() {
      gone = true;
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (hooves) hooves.stop(300);
      if (roared) roared.stop(300);
      // free the sprite memory
      for (const s of [...(sheets || []), halo, winHalo]) if (s && s.cv) { s.cv.width = s.cv.height = 0; }
      if (bg) bg.width = bg.height = 0;
      canvas.width = canvas.height = 0;
    },
  };
}
