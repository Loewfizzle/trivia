// HOLD'EM — THE SIDEWAYS TABLE's numbers (HE7 — docs/holdem.md "THE SIDEWAYS LAYOUT"), PURE: the screen's size (+ its safe areas) and the
// number of opponents → every piece's place, in CSS px (= iPhone points), the same shape as layout.js#tableLayout (+ `wide: true`) so the
// view, the motion and the overlap test read one thing. The portrait table (layout.js) is untouched.
//   THE TABLE    a WIDE STADIUM (rounded ends left / right) filling the screen left of THE ACTION COLUMN
//   THE SEATS    YOU at the bottom centre; the others FULLY EVENLY SPACED by arc length round the rail (fraction i / N clockwise from you —
//                the screen's bottom-left first); every seat the same block: the emblem on the rail, the plate under it, the tag under the
//                plate, the cards beside the emblem (inward — outward for a seat level with your cards), the bet toward the middle
//   THE MIDDLE   the board centred, the pot above it (the side pots above the pot); your hand's name ABOVE your cards (a gold line)
//   THE COLUMN   on the RIGHT, under the right thumb: the music button (the console's) + the level line at its top; low: the presets above
//                FOLD / RAISE / CALL (the slider, the pre-actions, the between-hands buttons in the same place); LEAVE + your clock above
// DESKTOP / any wide window (`stageOf`): the same layout in a STAGE scaled to the window (one CSS transform — every coordinate the motion
// uses stays in the stage's units), its frame no flatter than a phone on its side, centred; the backdrop fills the rest.
import { ACT } from './layout.js';

const CARD_RATIO = 78 / 56;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** THE STAGE's numbers: z from the window (≥ 1, ≤ 2.4 — a 4K screen), the frame no flatter than STAGE.aspect (a phone on its side ≈ 2.16)
 *  and no wider than 2.4 × its height (an ultra-wide), `margin` stage units of air at the sides */
export const STAGE = { w: 900, h: 400, zMax: 2.4, aspect: 2.0, margin: 20 };
/** the action column (pt at s = 1): the round buttons + their gap, the presets, the column's width */
export const COL = { btn: 54, gap: 16, preset: 56, presetGap: 6, edge: 10 };
/** a wide seat's block in its own units (× ss around the emblem's centre): the plate's width, the tag's, the cards' box, the bet's box */
export const WSEAT = { emb: 22, embBig: 28, plateW: 108, plateTop: 23, plateBot: 55, tagTop: 57, tagBot: 72, tagW: 116, cardsIn: 24, cardsW: 61, cardsH: 21, betW: 72, betH: 22, big: 9 };
/** the board's card width (pt) by the opponents: heads-up big, 3–4 players a little bigger, 5–8 */
export const WBOARD = { 1: 66, 2: 60, 3: 60, rest: 56, min: 42 };
/** YOUR bet sideways: its chips over its amount (a column — it fits the felt beside your cards) */
export const MYBET = { w: 50, h: 42 };

/**
 * THE STAGE (desktop + any wide window): → { z, x, y, w, h } — the stage's scale + its frame (window px for x / y, stage units for w / h).
 * A phone on its side (≤ ~440 tall) = the screen itself (z 1); a desktop = z from the window, the frame at most STAGE.aspect flat, centred.
 */
export function stageOf(W, H) {
  const z = clamp(Math.min(W / STAGE.w, H / STAGE.h), 1, STAGE.zMax);
  if (z <= 1.0001) return { z: 1, x: 0, y: 0, w: W, h: H };
  const sw = W / z, sh = H / z;
  // (a little air at the window's sides — the end seats never touch its edge)
  const fw = Math.min(sw - 2 * STAGE.margin, sh * 2.4), fh = Math.min(sh, Math.max(STAGE.h, fw / STAGE.aspect));
  return { z, x: (W - fw * z) / 2, y: (H - fh * z) / 2, w: fw, h: fh };
}

/** a point on the stadium (x0..x1 × y0..y1, ends round) at arc fraction f from the bottom centre, CLOCKWISE on screen (toward the left first) */
export function onStadium(x0, y0, x1, y1, f) {
  const r = (y1 - y0) / 2, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, half = Math.max(0, (x1 - x0) / 2 - r);
  const P = 4 * half + 2 * Math.PI * r;
  let d = ((f % 1) + 1) % 1 * P;
  if (d <= half) return { x: cx - d, y: y1 };                                        // the bottom straight, leftward
  d -= half;
  if (d <= Math.PI * r) { const a = d / r; return { x: cx - half - r * Math.sin(a), y: cy + r * Math.cos(a) }; }   // the left end, up
  d -= Math.PI * r;
  if (d <= 2 * half) return { x: cx - half + d, y: y0 };                            // the top straight, rightward
  d -= 2 * half;
  if (d <= Math.PI * r) { const a = d / r; return { x: cx + half + r * Math.sin(a), y: cy - r * Math.cos(a) }; }   // the right end, down
  d -= Math.PI * r;
  return { x: cx + half - d, y: y1 };                                               // the bottom straight, back to the centre
}

const rect = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });
const hit = (a, b, pad = 0) => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;

/**
 * A wide seat's pieces in its own units: the plate under the emblem (centred · `l` its left edge with the emblem's · `r` its right edge),
 * the tag under the plate (aligned by `tl` the same way — the plate's by default), the cards beside the emblem on side `cs` (+1 right ·
 * −1 left · 0 above); `bet` = its centre (set by the layout).
 */
export function wideSeatBox({ pl = 'c', tl = pl, cs = 1, big = false, bet = [0, 96] } = {}) {
  const S = WSEAT, e = big ? S.embBig : S.emb, b = big ? S.big : 0;
  const pw = S.plateW, tw = S.tagW;
  const px = pl === 'l' ? [-S.emb - 2, -S.emb - 2 + pw] : pl === 'r' ? [S.emb + 2 - pw, S.emb + 2] : [-pw / 2, pw / 2];
  const tx = tl === 'l' ? [-S.emb - 2, -S.emb - 2 + tw] : tl === 'r' ? [S.emb + 2 - tw, S.emb + 2] : [-tw / 2, tw / 2];
  const ci = S.cardsIn + (big ? 6 : 0);
  // (cs 0 = the cards ABOVE the emblem — a seat with no room beside it)
  const cards = cs > 0 ? [ci, -S.cardsH, ci + S.cardsW, S.cardsH] : cs < 0 ? [-ci - S.cardsW, -S.cardsH, -ci, S.cardsH] : [-S.cardsW / 2, -e - 4 - 2 * S.cardsH, S.cardsW / 2, -e - 4];
  return {
    pl, tl, cs, big,
    main: [Math.min(px[0], -e), -e, Math.max(px[1], e), S.plateBot + b],
    tag: [tx[0], S.tagTop + b, tx[1], S.tagBot + b],
    cards,
    bet: [bet[0] - S.betW / 2, bet[1] - S.betH / 2, bet[0] + S.betW / 2, bet[1] + S.betH / 2],
    betAt: bet,
    // the D button (18 pt) on the emblem's lower edge, on the side away from the cards
    dealer: [-(cs || 1) * (e + 2), e - 8],
  };
}
const absBox = (seat, ss, r) => rect(seat.x + r[0] * ss, seat.y + r[1] * ss, seat.x + r[2] * ss, seat.y + r[3] * ss);

/**
 * → the layout (layout.js#tableLayout's shape + wide pieces):
 * { wide, s, ss, w, h, k, box, seats: [{ x, y, side: 'ring', big, f, top, low, wbox }], pot, sideTop, board, presets, buttons, btn, gap,
 *   myBet, hand, plate, label, award (its width), act: { x, w, x0, x1 }, level, leave, clock, status, cbs (the corner buttons), misfits }
 * The seats' scale `ss` steps down (never below 0.78) only while something doesn't fit or the board's cards are under 50 pt — `misfits` =
 * what still didn't (0 on every phone).
 */
export function wideLayout(o) {
  const s = clamp((o.h - (o.top || 0) - (o.bottom || 0)) / 370, 0.8, 1.12);
  // (the biggest seats with nothing misfit and the board's cards ≥ 50 pt; else the seats step down — the board's size first, then the seats')
  const score = L => L.misfits * 1000 - Math.min(L.board.card.w, 50);
  let best = null;
  for (let ss = clamp(0.9 * s, 0.78, 0.96); ss >= 0.78 - 1e-6; ss -= 0.02) {
    const L = attempt(o, s, ss);
    if (!best || score(L) < score(best) - 1e-6) best = L;
    if (!L.misfits && L.board.card.w >= 50) break;
  }
  return best;
}

// (cb / cbTop / cbIn = the console's corner buttons in the frame's units — a desktop's stage passes them scaled + shifted; on a phone the
//  frame IS the screen: 36 pt, 10 pt under the safe top, 12 pt in)
function attempt({ w, h, top = 0, bottom = 0, left = 0, right = 0, k = 0, cb = 36, cbTop = top + 10, cbIn = 12 }, s, ss) {
  let misfits = 0;
  const N = k + 1, big = k === 1;
  // ---- THE COLUMN (the right): the round buttons at the foot, the presets above, then your clock, LEAVE, the status; the level line up top
  const btn = Math.max(50, COL.btn * Math.min(1, s)), gap = COL.gap * Math.min(1, s);
  const aw = Math.max(3 * btn + 2 * gap, 3 * COL.preset + 2 * COL.presetGap);
  const ax1 = w - right - COL.edge, ax0 = ax1 - aw, ax = (ax0 + ax1) / 2;
  const buttons = h - bottom - 8 - btn / 2;
  const presets = buttons - btn / 2 - Math.max(ACT.gapPB, ACT.gapPB * s) - ACT.preset / 2;
  const clock = presets - ACT.preset / 2 - 7;                               // (YOUR clock: a bar over the presets)
  const status = clock - 10 - 12;                                            // ("BO IS THINKING…" — above the pre-actions, two of them stacked)
  const leave = status - 12 - 8 - 22;                                        // (CASH's LEAVE)
  const level = Math.max(top + 8, cbTop + cb + 8);                          // (its top: under the music button)
  // the console's corner buttons (36 pt at 12 pt in, + their 44 pt tap area): no seat under them
  const t4 = 4 * cb / 36;
  const cbs = [rect(left + cbIn - t4, cbTop - t4, left + cbIn + cb + t4, cbTop + cb + t4), rect(w - right - cbIn - cb - t4, cbTop - t4, w - right - cbIn + t4, cbTop + cb + t4)];
  // ---- YOU: your two cards over the bottom rail, your plate under them (it overlaps their foot), your hand's name above them
  const hc = { w: 64 * s, h: 64 * s * (108 / 78) };
  const plateH = 26;
  const handY = h - bottom - 2 - plateH - hc.h / 2 + 8 * s;
  const plateTop = handY + hc.h / 2 - 8 * s;
  const labelY = handY - hc.h / 2 - 11 * s;
  const e = (big ? WSEAT.embBig : WSEAT.emb) * ss;
  const heroBox = cx => rect(cx - hc.w * 0.92, handY - hc.h / 2, cx + hc.w * 0.92, h);
  const plateBox = cx => rect(cx - 85, plateTop, cx + 85, plateTop + plateH);
  // (your hand's name: a bet shares the felt only with a hand still running — its name ≤ ~26 letters; the showdown's longer line has no bets)
  const labelBox = cx => rect(cx - 110 * Math.min(1, s), labelY - 9 * s, cx + 110 * Math.min(1, s), labelY + 9 * s);
  const onScreen = r => r.x0 >= left + 2 && r.x1 <= ax0 - 4 && r.y0 >= top + 1 && r.y1 <= h - bottom - 1;

  // ---- THE TABLE: the stadium's box (its emblems on the rail stay on screen, clear of the column); the seats round its rail
  const table = shrink => {
    const bx0 = left + 6 + e - 8 * s + shrink, bx1 = ax0 - 8 - (WSEAT.emb + 2) * ss + 8 * s;
    const by0 = top + 4 + e - 8 * s, by1 = handY + 10 * s;
    const box = { x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 };
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const tx0 = bx0 + 8 * s, ty0 = by0 + 8 * s, tx1 = bx1 - 8 * s, ty1 = by1 - 8 * s;   // the seat track = the rail's middle
    const seats = [], taken = [];
    let corner = false, bad = 0;
    for (let i = 1; i <= k; i++) {
      const f = i / N, p = onStadium(tx0, ty0, tx1, ty1, f);
      // the plate: centred; a seat at an END keeps it inward (never off the screen); a seat LEVEL WITH YOUR CARDS keeps its plate, cards +
      // tag on its OUTER side (the felt between it and your cards is your bet's); the cards beside the emblem, toward the middle — the first
      // choice on screen, off the column + the corner buttons + your cards, clear of the seats already placed
      const end = Math.min((tx1 - tx0) / 3, (ty1 - ty0) * 0.45);
      const low = p.y > handY - hc.h / 2;
      const leftHalf = p.x <= cx + 0.5, centre = Math.abs(p.x - cx) < 1;
      const inP = leftHalf ? 'l' : 'r', outP = leftHalf ? 'r' : 'l', inC = leftHalf ? 1 : -1;
      const pls = big || centre ? ['c'] : low ? [outP, 'c', inP] : p.x < tx0 + end || p.x > tx1 - end ? [inP, 'c'] : ['c', inP, outP];
      const css = centre ? [1, -1, 0] : low ? [-inC, inC, 0] : [inC, -inC, 0];
      let pick = null;
      for (const pl of pls) for (const tl of [pl, 'c', pl === 'l' ? 'r' : 'l']) for (const cs of css) {
        if (pick) break;
        const bx = wideSeatBox({ pl, tl, cs, big }), parts = ['main', 'tag', 'cards'].map(n => absBox(p, ss, bx[n]));
        if (parts.some(r => !onScreen(r) || hit(r, heroBox(cx), 2) || hit(r, plateBox(cx), 2) || hit(r, labelBox(cx), 2) || taken.some(t => hit(r, t, 2)))) continue;
        if (parts.some(r => cbs.some(c => hit(r, c)))) { corner = true; continue; }
        pick = { pl, tl, cs, parts };
      }
      if (!pick) { bad++; const bx = wideSeatBox({ pl: pls[0], cs: css[0], big }); pick = { pl: pls[0], tl: pls[0], cs: css[0], parts: ['main', 'tag', 'cards'].map(n => absBox(p, ss, bx[n])) }; }
      taken.push(...pick.parts);
      seats.push({ x: p.x, y: p.y, side: 'ring', big, f, pl: pick.pl, tl: pick.tl, cs: pick.cs, low, top: centre && p.y < cy, parts: pick.parts });
    }
    return { box, cx, cy, seats, taken, corner, bad };
  };
  // (the table narrows from the left only while a seat would sit under ☰ — the corner button keeps its 44 pt)
  let T = table(0);
  for (let shrink = 4; T.corner && shrink <= 120; shrink += 4) { const T2 = table(shrink); if (!T2.corner || shrink === 120) { T = T2; break; } }
  misfits += T.bad;
  const { box, cx, seats, taken } = T;

  // ---- THE TOP SEAT's bet (a seat straight across from you): beside its plate, away from its cards, when there's room — the middle keeps
  // the height (heads-up: the board big in the middle); else under its tag
  const betRect = (q, at) => absBox(q, ss, wideSeatBox({ ...q, bet: at }).bet);
  for (const q of seats.filter(x => x.top)) {
    const b = wideSeatBox(q), side = -(q.cs || 1), pr = b.main;
    const besides = [side * ((side < 0 ? -pr[0] : pr[2]) + 4 + WSEAT.betW / 2), (WSEAT.plateTop + WSEAT.plateBot) / 2 + (big ? WSEAT.big : 0)];
    const under = [0, WSEAT.tagBot + (big ? WSEAT.big : 0) + 4 + WSEAT.betH / 2];
    const r = betRect(q, besides);
    q.betAt = onScreen(r) && !taken.some(t => hit(r, t, 2)) && !cbs.some(c => hit(r, c)) ? besides : under;
    taken.push(betRect(q, q.betAt));
  }

  // ---- THE MIDDLE: the side-pot line (3+ players) + the pot + the board — the biggest board (WBOARD by the opponents) whose stack fits
  // between the seats and your hand's name, centred in the band it fits in
  const yBot = labelY - 9 * s - 4;
  const sideH = k >= 2 ? 14 * s + 2 : 0;
  const fixed = sideH + 22 * s + 5 * s;
  const stack = (c, st) => {
    const ch = c * CARD_RATIO, pot = st + sideH + 11 * s, by = pot + 11 * s + 5 * s + ch / 2, bw = 5 * c + 4 * 5 * s;
    return { st, pot, by, ch, c, board: rect(cx - bw / 2, by - ch / 2, cx + bw / 2, by + ch / 2), potBox: rect(cx - 56 * s, st, cx + 56 * s, pot + 11 * s) };
  };
  const bwMax = Math.min((WBOARD[k] || WBOARD.rest) * Math.min(1, s * 1.05), (box.w - 2 * (16 * s + 40)) / 5.3);
  let M = null;
  for (let c = bwMax; c >= WBOARD.min - 1e-6 && !M; c -= 0.5) {
    const ok = [];
    for (let st = box.y + 16 * s + 4; st + fixed + c * CARD_RATIO <= yBot; st += 1) {
      const m = stack(c, st);
      if (!taken.some(r => hit(r, m.board, 2) || hit(r, m.potBox, 2))) ok.push(m);
    }
    if (ok.length) {
      // the longest run of free positions — its middle
      const runs = [];
      let cur = [ok[0]];
      for (let i = 1; i < ok.length; i++) { if (ok[i].st - ok[i - 1].st <= 1.01) cur.push(ok[i]); else { runs.push(cur); cur = [ok[i]]; } }
      runs.push(cur);
      const run = runs.reduce((a, r) => (r.length > a.length ? r : a));
      M = run[Math.floor(run.length / 2)];
    }
  }
  if (!M) { misfits++; M = stack(WBOARD.min, Math.max(box.y + 16 * s, yBot - fixed - WBOARD.min * CARD_RATIO)); }
  const boardCard = { w: M.c, h: M.ch };

  // ---- YOUR BET: its chips over its amount, on the felt beside your cards (left first)
  const myAt = (side, dy) => ({ x: cx + side * (hc.w * 0.92 + 6 + MYBET.w / 2), y: handY - hc.h * 0.1 + dy });
  const myRect = p => rect(p.x - MYBET.w / 2, p.y - MYBET.h / 2, p.x + MYBET.w / 2, p.y + MYBET.h / 2);
  let mb = null;
  for (const dy of [0, -10, 10, -20, 20, -30, 30]) for (const side of [-1, 1]) {
    const r = myRect(myAt(side, dy));
    if (!mb && !taken.some(t => hit(t, r, 2)) && !hit(r, M.board, 2) && !hit(r, labelBox(cx), 1) && onScreen(r)) mb = myAt(side, dy);
  }
  if (!mb) { misfits++; mb = myAt(-1, 0); }
  const fixedBoxes = [M.board, M.potBox, heroBox(cx), plateBox(cx), labelBox(cx), rect(ax0 - 4, level, w, h), myRect(mb)];

  // ---- THE BETS: each seat's toward the board's centre, the nearest clear spot along that line (then a little either side)
  const placed = seats.filter(q => q.top).map(q => betRect(q, q.betAt));
  for (const q of seats) {
    if (q.top) continue;
    const others = taken.filter(r => !q.parts.includes(r));
    const a0 = Math.atan2(M.by - q.y, cx - q.x);
    let at = null;
    for (const da of [0, 0.25, -0.25, 0.5, -0.5, 0.8, -0.8, 1.1, -1.1, 1.4, -1.4, 1.7, -1.7]) {
      if (at) break;
      const ux = Math.cos(a0 + da), uy = Math.sin(a0 + da);
      for (let R = 36; R <= 170; R += 3) {
        const c = [ux * R, uy * R], r = betRect(q, c);
        if (!onScreen(r) || q.parts.some(o => hit(o, r, 1)) || others.some(o => hit(o, r, 2)) || fixedBoxes.some(o => hit(o, r, 2)) || placed.some(o => hit(o, r, 2))) continue;
        at = c; break;
      }
    }
    if (!at) { misfits++; at = [Math.cos(a0) * 80, Math.sin(a0) * 80]; }
    q.betAt = at;
    placed.push(betRect(q, at));
  }
  for (const q of seats) q.wbox = wideSeatBox({ ...q, bet: q.betAt });

  // THE AWARD BOX (the hand's end — the winning hand + a pot's line) ON THE POT'S SPOT (the pot + the side-pot line give way to it then):
  // heads-up ONE row (no side pots), else two compact rows; as wide as the seats there allow
  const aTop = k >= 2 ? M.st : M.pot - 11 * s, aBot = M.pot + 11 * s;
  let awardW = 420;
  while (awardW > 160 && taken.some(r => hit(r, rect(cx - awardW / 2, aTop, cx + awardW / 2, aBot), 1))) awardW -= 4;
  if (taken.some(r => hit(r, rect(cx - awardW / 2, aTop, cx + awardW / 2, aBot), 1))) misfits++;
  return {
    wide: true, s, ss, w, h, k, box, cbs, misfits,
    seats: seats.map(q => ({ x: q.x, y: q.y, side: 'ring', big: q.big, f: q.f, top: q.top, low: q.low, wbox: q.wbox })),
    pot: M.pot, sideTop: M.st, award: awardW,
    board: { y: M.by, card: boardCard, gap: 5 * s },
    presets, buttons, btn, gap,
    myBet: { x: mb.x, y: mb.y, above: false },
    hand: { y: handY, card: hc },
    plate: plateTop,
    label: labelY,
    act: { x: ax, w: aw, x0: ax0, x1: ax1 },
    level, leave, clock, status,
  };
}

/** THE PIECES' RECTANGLES (the CSS's offsets — css/holdem.css "HE7"): the same names as layout.js#blocks (+ the column's pieces) */
export function wideBlocks(L) {
  const cx = L.box.x + L.box.w / 2, s = L.s, A = L.act;
  const bw = 5 * L.board.card.w + 4 * L.board.gap;
  const r = (x, y, w, h) => rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
  return {
    seats: L.seats.map(q => ({ main: absBox(q, L.ss, q.wbox.main), cards: absBox(q, L.ss, q.wbox.cards), bet: absBox(q, L.ss, q.wbox.bet), tag: absBox(q, L.ss, q.wbox.tag) })),
    pot: r(cx, L.pot, 112 * s, 22 * s),
    side: L.k >= 2 ? rect(cx - 56 * s, L.sideTop, cx + 56 * s, L.pot - 11 * s - 2) : rect(cx, L.pot - 11 * s, cx, L.pot - 11 * s),
    board: r(cx, L.board.y, bw, L.board.card.h),
    presets: r(A.x, L.presets, A.w, ACT.preset),
    buttons: r(A.x, L.buttons, A.w, L.btn),
    myBet: r(L.myBet.x, L.myBet.y, MYBET.w, MYBET.h),
    hand: r(cx, L.hand.y, L.hand.card.w * 1.84, L.hand.card.h),
    plate: rect(cx - 85, L.plate, cx + 85, L.plate + 26),
    label: rect(cx - 110 * Math.min(1, s), L.label - 9 * s, cx + 110 * Math.min(1, s), L.label + 9 * s),
    // (the hand's end: THE AWARD BOX sits on the pot's spot, above the board — two lines; the between-hands buttons in the column)
    award: rect(cx - L.award / 2, L.k >= 2 ? L.sideTop : L.pot - 11 * s, cx + L.award / 2, L.pot + 11 * s),
    column: rect(A.x0, L.level, A.x1, L.h),
    corners: L.cbs,
  };
}
