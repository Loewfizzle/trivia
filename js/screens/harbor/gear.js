// CITY 2.0 — THE HARBOR, PART 8b1: THE WORKERS' GEAR — what the crew carries, drawn on the people's rig (folk.js calls GEAR[carry]
// after the near arm). Big enough to read on a phone at ~27 pt a figure: the milkman's wire carrier of white bottles, the ice block on
// a leather pad with its tongs, the galvanized can on the collector's shoulder, a crate of soda (the bottle caps along its top), the
// long ladder carried level, the billposter's paste bucket + his roll of sheets + the long brush, the mailbag, the flower basket, the
// double-bass case (the band's tallest silhouette), the white wing's can cart, the broom, the cop's baton (twirled).
// Each painter: g = { hand ([x, y] — the near hand on screen), J (the rig: folk.js#jointsOf), X / Y (body units → screen), H (the
// figure's height, pt), f(col, k) (the scene's light on a colour: sunlit by day, lamp-lit at night — the clothes' own), d (the side it
// faces on screen), t, mo, pose }.
const TAU = Math.PI * 2;
const WOOD = [150, 118, 78], WOOD_LO = [108, 82, 54], ZINC = [156, 160, 166], ZINC_LO = [96, 100, 108], GLASS = [236, 240, 238];
const shoulderOf = g => { const s = g.J.shs[g.J.near]; return [g.X(s[0]), g.Y(s[1] + 0.03)]; };
// (8b2: a load on the shoulder sits a little BEHIND the neck — side-on it no longer covers the face)
// (8b2 — 'unload': from the hands over the truck's bed up to the shoulder as J.uk runs 0 → 1)
const loadOf = g => { const [x, y] = shoulderOf(g), sx = x - g.d * g.H * 0.065 * Math.abs(g.J.cx); if (g.pose !== 'unload') return [sx, y]; const k = g.J.uk || 0, [hx, hy] = g.hand; return [hx + (sx - hx) * k, hy + (y - hy) * k]; };
const lw = (g, k) => Math.max(0.35, g.H * k);

export const GEAR = {
  bottles(c, g) {
    const [x, y] = g.hand, H = g.H;
    c.strokeStyle = g.f([60, 60, 68]); c.lineWidth = lw(g, 0.008); c.strokeRect(x - H * 0.06, y + H * 0.02, H * 0.12, H * 0.07);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + H * 0.02); c.stroke();
    for (let i = 0; i < 4; i++) { const bx = x - H * 0.045 + i * H * 0.03; c.fillStyle = g.f(GLASS, 1.1); c.fillRect(bx - H * 0.011, y + H * 0.005, H * 0.022, H * 0.085); c.fillStyle = g.f([200, 200, 206]); c.fillRect(bx - H * 0.009, y, H * 0.018, H * 0.012); }
  },
  bundle(c, g) {
    const [x, y] = g.hand, H = g.H;
    c.fillStyle = g.f([224, 218, 198]); c.fillRect(x - H * 0.08, y - H * 0.03, H * 0.16, H * 0.09);
    c.fillStyle = g.f([150, 140, 120]); c.fillRect(x - H * 0.08, y + H * 0.005, H * 0.16, lw(g, 0.006));
    c.strokeStyle = g.f([120, 84, 50]); c.lineWidth = lw(g, 0.006); c.beginPath(); c.moveTo(x, y - H * 0.03); c.lineTo(x, y + H * 0.06); c.stroke();
  },
  stand(c, g) {
    const [x, y] = g.hand, H = g.H;
    c.save(); c.translate(x, y); c.rotate(-0.25 * g.d); c.fillStyle = g.f(WOOD); c.fillRect(-H * 0.035, -H * 0.13, H * 0.07, H * 0.26);
    c.fillStyle = g.f(WOOD_LO); c.fillRect(-H * 0.035, -H * 0.02, H * 0.07, lw(g, 0.008)); c.restore();
  },
  papers(c, g) {
    const [x, y] = g.hand, H = g.H;
    if (g.pose === 'wave') {
      // a paper held up for the passers (EXTRA!): a folded broadsheet, its columns of print
      c.fillStyle = g.f([226, 222, 206], 1.1); c.fillRect(x - H * 0.04, y - H * 0.11, H * 0.08, H * 0.105);
      c.fillStyle = g.f([110, 106, 100]); c.fillRect(x - H * 0.032, y - H * 0.1, H * 0.064, lw(g, 0.012));
      for (let i = 0; i < 3; i++) c.fillRect(x - H * 0.03, y - H * 0.078 + i * H * 0.022, H * 0.06, lw(g, 0.005));
      return;
    }
    c.fillStyle = g.f([220, 214, 196]); c.fillRect(x - H * 0.025 * g.d - H * 0.03, y - H * 0.06, H * 0.06, H * 0.11);
  },
  can(c, g) {
    // 8b2 — THE STREET'S OWN CAN at its real size (core/harbor-promenade.js#CAN: 1.24 × 0.8 units — 0.59 × 0.38 of a man): gripped at its
    // sides where it stands (its centre with the hands — the street's can hides at that moment), swung up onto the shoulder as he rises
    // (folk.js's squat curve, J.sq), leaning back over it; tipped over the truck's side; the same down again
    const H = g.H, cw = H * 0.37, ch = H * 0.57, sh = g.J.sh0 ? { ...g, J: { ...g.J, shs: g.J.sh0 } } : g, [sx, sy] = loadOf(sh), onSh = [sx - g.d * H * 0.07, sy - H * 0.17];
    let x, y, rot;
    if (g.pose === 'tip') { const [hx, hy] = g.hand; x = hx; y = hy - H * 0.1; rot = (1.25 + 0.2 * Math.sin(g.t * 2)) * g.d; }
    else if (g.pose === 'pick' || g.pose === 'set') { const k = 1 - (g.J.sq == null ? 1 : g.J.sq), [hx, hy] = g.hand; x = hx + (onSh[0] - hx) * k; y = hy + H * 0.1 + (onSh[1] - hy - H * 0.1) * k; rot = -0.55 * g.d * k; }
    else { [x, y] = onSh; rot = -0.55 * g.d; }
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = g.f(ZINC); c.beginPath(); c.moveTo(-cw / 2, -ch / 2); c.lineTo(cw / 2, -ch / 2); c.lineTo(cw * 0.46, ch / 2); c.lineTo(-cw * 0.46, ch / 2); c.closePath(); c.fill();
    c.fillStyle = g.f(ZINC_LO); for (let i = -2; i <= 2; i++) c.fillRect(i * cw * 0.17 - lw(g, 0.005), -ch * 0.44, lw(g, 0.01), ch * 0.9);
    for (const v of [-0.18, 0.22]) c.fillRect(-cw / 2, ch * v, cw, lw(g, 0.014));
    c.fillStyle = g.f([232, 236, 240], 1.25); c.fillRect(-cw * 0.3, -ch * 0.44, lw(g, 0.016), ch * 0.88); c.fillRect(-cw * 0.52, -ch / 2 - H * 0.012, cw * 1.04, Math.max(0.6, H * 0.018));
    if (g.pose !== 'tip') { c.fillStyle = g.f(ZINC_LO); c.beginPath(); c.ellipse(0, -ch / 2 - H * 0.016, cw * 0.5, H * 0.022, 0, Math.PI, 0); c.fill(); }
    c.restore();
  },
  ice(c, g) {
    const H = g.H, [x, y0] = loadOf(g), y = y0 - H * 0.07;
    c.fillStyle = g.f([92, 70, 52]); c.fillRect(x - H * 0.06, y0 - H * 0.015, H * 0.12, H * 0.03);
    c.fillStyle = g.f([188, 216, 232], 1.15); c.beginPath(); c.roundRect(x - H * 0.075, y - H * 0.055, H * 0.15, H * 0.11, H * 0.012); c.fill();
    c.fillStyle = g.f([244, 252, 255], 1.3); c.fillRect(x - H * 0.06, y - H * 0.048, H * 0.12, lw(g, 0.01)); c.fillRect(x - H * 0.066, y - H * 0.04, lw(g, 0.01), H * 0.07);
    c.strokeStyle = g.f([40, 36, 36]); c.lineWidth = lw(g, 0.01); c.beginPath(); c.moveTo(x - H * 0.06, y - H * 0.02); c.quadraticCurveTo(x, y - H * 0.11, x + H * 0.06, y - H * 0.02); c.stroke();
  },
  crate(c, g) {
    const H = g.H, [x, y0] = loadOf(g), y = y0 - H * 0.065;
    c.fillStyle = g.f(WOOD); c.fillRect(x - H * 0.08, y - H * 0.05, H * 0.16, H * 0.1);
    c.fillStyle = g.f(WOOD_LO); for (const v of [-0.02, 0.02]) c.fillRect(x - H * 0.08, y + H * v, H * 0.16, lw(g, 0.007));
    c.fillStyle = g.f([210, 200, 160], 1.1); for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x - H * 0.06 + i * H * 0.03, y - H * 0.055, lw(g, 0.01), 0, TAU); c.fill(); }
  },
  bucket(c, g) {
    const [x, y] = g.hand, H = g.H;
    c.fillStyle = g.f(ZINC); c.beginPath(); c.moveTo(x - H * 0.04, y + H * 0.03); c.lineTo(x + H * 0.04, y + H * 0.03); c.lineTo(x + H * 0.032, y + H * 0.105); c.lineTo(x - H * 0.032, y + H * 0.105); c.closePath(); c.fill();
    c.fillStyle = g.f([226, 230, 236], 1.15); c.fillRect(x - H * 0.022, y + H * 0.035, lw(g, 0.01), H * 0.065);
    c.strokeStyle = g.f(ZINC_LO); c.lineWidth = lw(g, 0.006); c.beginPath(); c.arc(x, y + H * 0.03, H * 0.04, Math.PI, 0); c.stroke();
  },
  squeegee(c, g) {
    const [x, y] = g.hand, H = g.H;
    c.strokeStyle = g.f([90, 70, 50]); c.lineWidth = lw(g, 0.012); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - H * 0.12); c.stroke();
    c.fillStyle = g.f([40, 40, 44]); c.fillRect(x - H * 0.05, y - H * 0.135, H * 0.1, lw(g, 0.018));
  },
  brush(c, g) {
    const [x, y] = g.hand, H = g.H;
    if (g.pose === 'pastehi' || g.pose === 'paste') {
      // the billposter's long-handled paste brush (the top row is out of his reach)
      const len = g.pose === 'pastehi' ? 0.75 : 0.32, tx = x + g.d * H * 0.02, ty = y - H * len;
      c.strokeStyle = g.f([120, 96, 64]); c.lineWidth = lw(g, 0.011); c.beginPath(); c.moveTo(x, y + H * 0.05); c.lineTo(tx, ty); c.stroke();
      c.fillStyle = g.f([206, 196, 166]); c.fillRect(tx - H * 0.05, ty - H * 0.028, H * 0.1, H * 0.032);
      return;
    }
    c.strokeStyle = g.f([110, 84, 56]); c.lineWidth = lw(g, 0.01); c.beginPath(); c.moveTo(x, y); c.lineTo(x - g.d * H * 0.02, y - H * 0.06); c.stroke();
    c.fillStyle = g.f([196, 160, 64]); c.fillRect(x - g.d * H * 0.02 - H * 0.012, y - H * 0.085, H * 0.024, H * 0.028);
  },
  chalk(c, g) { const [x, y] = g.hand; c.fillStyle = g.f([250, 250, 246], 1.2); c.fillRect(x - 0.5, y - 1.2, 1, 1.2); },
  ladder(c, g) { carriedLadder(c, g, 1.95, 0.075); },
  // (8b2 — THE TALL LADDER + THE STEPLADDER are PROPS from edge to edge (screens/harbor/workers.js draws them from core/harbor-crew.js's
  // state on the clock — carried, set down, raised, worked, lowered, carried off): the carriers' hands only hold them)
  ladderA() {}, ladderB() {}, steps() {}, walkup() {},
  // 8b2 — THE BILLPOSTER on the roof (hatch → ladder → catwalk → back): his paste bucket hooked at his hip, the roll of sheets slung at
  // his back, the long brush in his hand — up the board while he pastes, upright in his hand the rest of the time (never put away)
  poster(c, g) {
    const H = g.H, J = g.J, h = J.hips[J.near];
    GEAR.bucket(c, { ...g, hand: [g.X(h[0] + 0.035 * g.d), g.Y(h[1] + 0.02)] });
    const [sx, sy] = shoulderOf(g);
    c.save(); c.translate(sx - g.d * H * 0.05, sy + H * 0.06); c.rotate(-0.5 * g.d);
    c.fillStyle = g.f([226, 220, 200]); c.fillRect(-H * 0.1, -H * 0.022, H * 0.2, H * 0.044); c.restore();
    if (g.pose === 'paste' || g.pose === 'pastehi') { GEAR.brush(c, g); return; }
    const [x, y] = g.hand, tx = x + g.d * H * 0.03, ty = y - H * 0.42;
    c.strokeStyle = g.f([120, 96, 64]); c.lineWidth = lw(g, 0.011); c.beginPath(); c.moveTo(x - g.d * H * 0.005, y + H * 0.06); c.lineTo(tx, ty); c.stroke();
    c.fillStyle = g.f([206, 196, 166]); c.fillRect(tx - H * 0.045, ty - H * 0.03, H * 0.09, H * 0.032);
  },
  // (8b2 — THE PAINTERS' KIT off their ladder: the rolled drop cloth on the shoulder, the paint bucket in the other hand)
  kit(c, g) {
    const H = g.H, [x, y] = loadOf(g), far = g.J.hands[1 - g.J.near], lift = g.pose === 'pick' || g.pose === 'set';
    const [bx, by] = lift ? g.hand : [g.X(far[0]), g.Y(far[1])];
    kitBucket(c, g.f, bx, by, H);
    const [rx, ry] = lift ? [g.hand[0], g.hand[1] - H * 0.06] : [x, y - H * 0.035];
    kitRoll(c, g.f, rx, ry, H, g.d);
  },
  paste(c, g) {
    GEAR.bucket(c, g);
    const H = g.H, [sx, sy] = shoulderOf(g);
    c.save(); c.translate(sx - g.d * H * 0.03, sy + H * 0.05); c.rotate(-0.5 * g.d);
    c.fillStyle = g.f([226, 220, 200]); c.fillRect(-H * 0.12, -H * 0.025, H * 0.24, H * 0.05);
    c.fillStyle = g.f([180, 172, 150]); c.fillRect(-H * 0.12, -H * 0.004, H * 0.24, lw(g, 0.006)); c.restore();
  },
  mailbag(c, g) {
    const H = g.H, J = g.J, h = J.hips[1 - J.near], [sx, sy] = shoulderOf(g), bx = g.X(h[0]) - g.d * H * 0.03, by = g.Y(h[1] + 0.02);
    c.strokeStyle = g.f([80, 56, 36]); c.lineWidth = lw(g, 0.01); c.beginPath(); c.moveTo(sx, sy); c.lineTo(bx, by); c.stroke();
    c.fillStyle = g.f([122, 86, 54]); c.beginPath(); c.roundRect(bx - H * 0.065, by - H * 0.02, H * 0.13, H * 0.1, H * 0.015); c.fill();
    c.fillStyle = g.f([96, 66, 42]); c.fillRect(bx - H * 0.065, by - H * 0.02, H * 0.13, H * 0.035);
  },
  flowers(c, g) {
    const [x, y] = g.hand, H = g.H, cols = [[220, 60, 70], [246, 210, 80], [236, 130, 170], [250, 246, 236], [210, 70, 120], [246, 180, 70]];
    c.fillStyle = g.f([140, 104, 62]); c.beginPath(); c.ellipse(x, y + H * 0.03, H * 0.075, H * 0.04, 0, 0, Math.PI); c.fill();
    c.strokeStyle = g.f([140, 104, 62]); c.lineWidth = lw(g, 0.008); c.beginPath(); c.arc(x, y + H * 0.03, H * 0.06, Math.PI, 0); c.stroke();
    c.fillStyle = g.f([60, 110, 60]); c.fillRect(x - H * 0.06, y + H * 0.005, H * 0.12, H * 0.025);
    for (let i = 0; i < 6; i++) { c.fillStyle = g.f(cols[i], 1.2); c.beginPath(); c.arc(x - H * 0.055 + i * H * 0.022, y + H * 0.008 - (i % 2) * H * 0.014, Math.max(0.5, H * 0.014), 0, TAU); c.fill(); }
    if (g.pose === 'offer') { c.fillStyle = g.f(cols[0], 1.25); c.beginPath(); c.arc(x + g.d * H * 0.02, y - H * 0.035, Math.max(0.7, H * 0.022), 0, TAU); c.fill(); }
  },
  bass(c, g) {
    // a double-bass case standing beside him, held by its neck
    const H = g.H, [hx] = g.hand, x = hx + g.d * H * 0.11, foot = g.Y(0.01), top = foot - H * 1.0;
    c.fillStyle = g.f([46, 34, 30]); c.beginPath(); c.moveTo(x - H * 0.03, top); c.lineTo(x + H * 0.03, top); c.lineTo(x + H * 0.04, top + H * 0.36);
    c.bezierCurveTo(x + H * 0.17, top + H * 0.42, x + H * 0.13, top + H * 0.6, x + H * 0.1, top + H * 0.63); c.bezierCurveTo(x + H * 0.2, top + H * 0.72, x + H * 0.19, foot, x, foot);
    c.bezierCurveTo(x - H * 0.19, foot, x - H * 0.2, top + H * 0.72, x - H * 0.1, top + H * 0.63); c.bezierCurveTo(x - H * 0.13, top + H * 0.6, x - H * 0.17, top + H * 0.42, x - H * 0.04, top + H * 0.36); c.closePath(); c.fill();
    c.strokeStyle = g.f([130, 104, 86], 1.2); c.lineWidth = lw(g, 0.008); c.beginPath(); c.moveTo(x + g.d * H * 0.09, top + H * 0.5); c.quadraticCurveTo(x + g.d * H * 0.15, top + H * 0.78, x + g.d * H * 0.08, foot - H * 0.06); c.stroke();
  },
  broom(c, g) {
    const [x, y] = g.hand, H = g.H, sw = g.pose === 'sweep', ex = sw ? g.X(g.J.cx * 0.42) : x + g.d * H * 0.05, ey = sw ? g.Y(0.02) : y + H * 0.42;
    c.strokeStyle = g.f([140, 108, 70]); c.lineWidth = lw(g, 0.011); c.beginPath(); c.moveTo(x - (ex - x) * 0.25, y - (ey - y) * 0.25); c.lineTo(ex, ey); c.stroke();
    c.save(); c.translate(ex, ey); c.rotate(Math.atan2(ey - y, ex - x) - Math.PI / 2); c.fillStyle = g.f([186, 160, 96]);
    c.beginPath(); c.moveTo(-H * 0.02, 0); c.lineTo(H * 0.02, 0); c.lineTo(H * 0.045, H * 0.07); c.lineTo(-H * 0.045, H * 0.07); c.closePath(); c.fill(); c.restore();
  },
  // 11a-2 — THE LEAF RAKE: a long wooden handle, a FAN of thin tines at its foot (spread wide, raking the leaves toward him)
  rake(c, g) {
    const [x, y] = g.hand, H = g.H, sw = g.pose === 'sweep', ex = sw ? g.X(g.J.cx * 0.5) : x + g.d * H * 0.05, ey = sw ? g.Y(0.015) : y + H * 0.45;
    c.strokeStyle = g.f([150, 116, 74]); c.lineWidth = lw(g, 0.01); c.beginPath(); c.moveTo(x - (ex - x) * 0.3, y - (ey - y) * 0.3); c.lineTo(ex, ey); c.stroke();
    const a = Math.atan2(ey - y, ex - x);
    c.save(); c.translate(ex, ey); c.rotate(a - Math.PI / 2); c.strokeStyle = g.f([110, 104, 96]); c.lineWidth = lw(g, 0.004);
    for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(0, -H * 0.005); c.lineTo(i * H * 0.014, H * 0.065); c.stroke(); }
    c.beginPath(); c.moveTo(-H * 0.058, H * 0.05); c.quadraticCurveTo(0, H * 0.068, H * 0.058, H * 0.05); c.stroke(); c.restore();
  },
  wcan(c, g) {
    const [x, y] = g.hand, H = g.H;
    c.fillStyle = g.f([62, 104, 80]); c.fillRect(x - H * 0.035, y + H * 0.02, H * 0.07, H * 0.06);
    c.strokeStyle = g.f([62, 104, 80]); c.lineWidth = lw(g, 0.009); c.beginPath(); c.moveTo(x + g.d * H * 0.03, y + H * 0.06); c.lineTo(x + g.d * H * 0.09, y + H * 0.01); c.stroke();
  },
  sack(c, g) {
    const [x, y] = g.hand, H = g.H;
    c.fillStyle = g.f([170, 146, 104]); c.beginPath(); c.moveTo(x - H * 0.02, y); c.quadraticCurveTo(x - H * 0.08, y + H * 0.1, x - H * 0.03, y + H * 0.16); c.lineTo(x + H * 0.05, y + H * 0.16); c.quadraticCurveTo(x + H * 0.08, y + H * 0.08, x + H * 0.02, y); c.closePath(); c.fill();
  },
  // 8b2 — THE OFFICER's FLASHLIGHT: a short black barrel along his forearm, its lens a hot point (the beam itself: raid.js)
  flashlight(c, g) {
    const [x, y] = g.hand, e = g.J.elbows[g.J.near], ex = g.X(e[0]), ey = g.Y(e[1]), dx = x - ex, dy = y - ey, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, L2 = g.H * 0.07;
    c.strokeStyle = g.f([30, 30, 34]); c.lineWidth = Math.max(0.8, g.H * 0.024); c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - ux * L2 * 0.3, y - uy * L2 * 0.3); c.lineTo(x + ux * L2, y + uy * L2); c.stroke();
    c.fillStyle = 'rgba(255,248,226,0.95)'; c.beginPath(); c.arc(x + ux * L2, y + uy * L2, Math.max(0.6, g.H * 0.016), 0, TAU); c.fill();
  },
  // POLISH 5 — the hydrant man's big pentagon WRENCH: an iron bar in the hand, its head a dark jaw (turning the stem when he's down at it)
  wrench(c, g) {
    const [x, y] = g.hand, H = g.H, down = g.pose === 'pick', a = down ? (g.mo ? Math.sin(g.t * 3.4) * 0.5 : 0) - 0.2 : 0.35 * g.d, l = H * 0.17;
    const ex = x + Math.sin(a) * l * g.d, ey = y + Math.cos(a) * l * (down ? -0.4 : 1);
    c.strokeStyle = g.f([46, 46, 52]); c.lineWidth = Math.max(0.6, H * 0.018); c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
    c.fillStyle = g.f([34, 34, 40]); c.beginPath(); c.arc(ex, ey, Math.max(0.6, H * 0.022), 0, Math.PI * 2); c.fill();
  },
  baton(c, g) {
    const H = g.H;
    if (g.pose === 'twirl') { const [x, y] = g.hand, a = g.mo ? g.t * 9 : 0.6, l = H * 0.09; c.strokeStyle = g.f([30, 26, 24]); c.lineWidth = Math.max(0.6, H * 0.016); c.beginPath(); c.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); return; }
    const h = g.J.hips[g.J.near]; c.strokeStyle = g.f([30, 26, 24]); c.lineWidth = Math.max(0.6, H * 0.015); c.beginPath(); c.moveTo(g.X(h[0] + 0.02 * g.d), g.Y(h[1] + 0.02)); c.lineTo(g.X(h[0] + 0.035 * g.d), g.Y(h[1] - 0.14)); c.stroke();
  },
};
/** the painters' paint bucket hanging from a hand (its bail) — also on their cloth + hung on the ladder (workers.js) */
export function kitBucket(c, f, x, y, H) {
  c.strokeStyle = f(ZINC_LO); c.lineWidth = lw({ H }, 0.007); c.beginPath(); c.moveTo(x - H * 0.036, y + H * 0.035); c.lineTo(x, y); c.lineTo(x + H * 0.036, y + H * 0.035); c.stroke();
  c.fillStyle = f([226, 220, 206]); c.beginPath(); c.moveTo(x - H * 0.04, y + H * 0.035); c.lineTo(x + H * 0.04, y + H * 0.035); c.lineTo(x + H * 0.033, y + H * 0.105); c.lineTo(x - H * 0.033, y + H * 0.105); c.closePath(); c.fill();
  c.fillStyle = f([40, 44, 70]); c.fillRect(x - H * 0.04, y + H * 0.035, H * 0.08, Math.max(0.5, H * 0.018));        // (the enamel's dark blue run down its lip)
  c.fillStyle = f([196, 150, 60], 1.1); c.fillRect(x - H * 0.02, y + H * 0.06, H * 0.016, H * 0.03);
}
/** the rolled drop cloth: a canvas cylinder (its rolled end showing) */
export function kitRoll(c, f, x, y, H, d = 1) {
  const l = H * 0.2, r = H * 0.032;
  c.fillStyle = f([216, 208, 188]); c.beginPath(); c.roundRect(x - l / 2, y - r, l, r * 2, r); c.fill();
  c.fillStyle = f([176, 166, 146]); c.fillRect(x - l / 2 + r, y + r * 0.35, l - r * 2, Math.max(0.4, r * 0.4));
  c.strokeStyle = f([150, 120, 80]); c.lineWidth = lw({ H }, 0.006); c.beginPath(); c.moveTo(x - l * 0.22, y - r); c.lineTo(x - l * 0.22, y + r); c.moveTo(x + l * 0.22, y - r); c.lineTo(x + l * 0.22, y + r); c.stroke();
  c.fillStyle = f([196, 188, 166]); c.beginPath(); c.ellipse(x + d * l / 2, y, r * 0.5, r, 0, 0, TAU); c.fill();
}
/** a ladder carried on the shoulder, level, along the way they walk (foreshortened as they turn) */
function carriedLadder(c, g, len, gap, back = 0.58) {
  const H = g.H, [sx, sy] = shoulderOf(g), ax = Math.max(0.3, Math.abs(g.J.cx)), L2 = len * H * ax;
  const x0 = sx - g.d * L2 * back, x1 = sx + g.d * L2 * (1 - back), y = sy - H * 0.01;
  // (8b2: bolder — a dark edge under each rail + a lit top edge: it reads against the cobbles + the sky at 27 pt)
  c.lineCap = 'butt';
  c.strokeStyle = g.f(WOOD_LO.map(v => v * 0.55)); c.lineWidth = Math.max(0.9, H * 0.024);
  c.beginPath(); c.moveTo(x0, y + 0.25); c.lineTo(x1, y + 0.25); c.moveTo(x0, y - gap * H + 0.25); c.lineTo(x1, y - gap * H + 0.25); c.stroke();
  c.lineWidth = lw(g, 0.013); c.beginPath(); for (let u = 0.04; u < 1; u += 0.12 / len) { const x = x0 + (x1 - x0) * u; c.moveTo(x, y); c.lineTo(x, y - gap * H); } c.stroke();
  c.strokeStyle = g.f(WOOD, 1.15); c.lineWidth = Math.max(0.6, H * 0.016);
  c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.moveTo(x0, y - gap * H); c.lineTo(x1, y - gap * H); c.stroke();
}
/** the white wing's can cart: a can on two wheels with a broom + a shovel standing in it, pushed ahead of him on the ground */
export function gearCart(c, J, X, Y, H, f, st) {
  const x = X(J.cx * 0.5), y = Y(0), r = H * 0.075, w = H * 0.16, ch = H * 0.24, roll = (st.dist || 0) * 3.2;
  c.save();
  c.fillStyle = 'rgba(8,6,16,0.3)'; c.beginPath(); c.ellipse(x, y, w * 0.8, H * 0.025, 0, 0, TAU); c.fill();
  c.strokeStyle = f([70, 72, 80]); c.lineWidth = Math.max(0.5, H * 0.012); c.beginPath(); c.moveTo(x - J.d * w * 0.4, y - ch * 0.55); c.lineTo(X(J.hands[J.near][0]), Y(J.hands[J.near][1])); c.stroke();
  c.fillStyle = f([226, 228, 230]); c.fillRect(x - w / 2, y - ch - r * 0.4, w, ch);
  c.fillStyle = f([150, 154, 160]); c.fillRect(x - w / 2, y - ch - r * 0.4, w, Math.max(0.6, H * 0.02)); c.fillRect(x - w / 2, y - ch * 0.45, w, Math.max(0.4, H * 0.01));
  c.strokeStyle = f([140, 108, 70]); c.lineWidth = Math.max(0.45, H * 0.01); c.beginPath(); c.moveTo(x - w * 0.2, y - ch); c.lineTo(x - w * 0.32, y - ch - H * 0.2); c.moveTo(x + w * 0.15, y - ch); c.lineTo(x + w * 0.3, y - ch - H * 0.17); c.stroke();
  for (const sg of [-1, 1]) {
    const wx = x + sg * w * 0.42; c.fillStyle = f([40, 38, 42]); c.beginPath(); c.arc(wx, y - r, r, 0, TAU); c.fill();
    c.strokeStyle = f([120, 120, 126]); c.lineWidth = Math.max(0.3, H * 0.006); c.beginPath();
    for (let i = 0; i < 3; i++) { const a = roll + i * Math.PI / 3; c.moveTo(wx - Math.cos(a) * r * 0.8, y - r - Math.sin(a) * r * 0.8); c.lineTo(wx + Math.cos(a) * r * 0.8, y - r + Math.sin(a) * r * 0.8); }
    c.stroke();
  }
  c.restore();
}
