// CITY 2.0 — THE HOLIDAYS' WIRING (SCHED — FR5 C1's cut: a pure MOVE out of scene.js, no behaviour changed): the NEON sign's holiday dressing,
// the holiday sky (the witch, the bats, the ghost ship), the holiday props + the parade (each loaded lazily, in season) + holidayTick (the
// day's holiday state, the light rules, the dusk); one factory over ONE ctx of getters (+ setters) onto scene.js's own state (review-5.md C1).
import { sunTimes } from '../../core/sky.js';
import { tierVal } from '../../core/harbor-tiers.js';
import { project } from '../../core/harbor-layout.js';
import { xmasPrelude } from '../../core/harbor-xmas.js';
import { litK } from '../../core/harbor-dark.js';
import { paradeWindow, paradeUnits } from '../../core/harbor-parade.js';
import { latchBig, holidayAt, halloweenPieces, dotdPieces, thanksgivingPieces, lightRules, titleHoliday } from '../../core/harbor-holiday.js';
import { lazyImport } from '../../ui/lazy-import.js';

// (scene.js's own module-level helpers this code uses — copied)
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/** C: scene.js's state by getters (+ a setter where this code assigns it): bakeTones, bigClock=, bigHeld=, bigRelatch=, bigWall=, cam, clock, DEBUG, destroyed, DK, dpr, dprTier, dress=, dressLoading=, duskDay=, duskH=, forceAtOf, HL=, HP=, hprops=, hpropsLoading=, hpropsMs=, HR=, HS=, HZ, L, lastSignLv=, LB, legendPow, LK, lkMs, LOADLOG, nowT, parade=, paradeLoading=, paraKey=, paraUnits=, pokeLog, propModelNow, PWQ, rects, S, signLive, snd, tier, treeHeld=, W, WF, WXS, XP=, zap */
export function createSceneHoliday(C) {
  const DRESS_COLS = { halloween: [[255, 122, 18], [155, 61, 255], [255, 122, 18], [155, 61, 255]], dotd: [[255, 166, 42], [255, 46, 151], [255, 166, 42], [255, 46, 151]], thanksgiving: [[255, 190, 58], [255, 190, 58], [255, 190, 58], [255, 190, 58]] };   // (FR7 FIXES C — THE GOLD WEEK's tubes)
  const PINK4 = [[255, 46, 151], [255, 46, 151], [255, 46, 151], [255, 46, 151]];
  // WIN2 — THE SPIDERS' WORLD: the SPEAKEASY word's tubes in LOGO units (the sign's viewBox: -26 -30 384 …; logoRect() is the SVG's
  // rect inset 7 % / 18 %), and the letters' middles for a poke's x
  const LOGO_VB = { x: -26, y: -30, w: 384 }, LETTER_X = [32, 128, 208, 300];
  function wordLogo() {
    const rr = C.rects(); if (!rr.neon || !rr.word || !(rr.neon.w > 0)) return null;
    const svgL = rr.neon.x - rr.neon.w / 0.86 * 0.07, svgT = rr.neon.y - rr.neon.h / 0.64 * 0.18, k = (rr.neon.w / 0.86) / LOGO_VB.w;
    const lx = px => LOGO_VB.x + (px - svgL) / k, ly = py => LOGO_VB.y + (py - svgT) / k;
    return { x0: lx(rr.word.x) + 6, x1: lx(rr.word.x + rr.word.w) - 6, y: ly(rr.word.y + rr.word.h * 0.5) };
  }
  function pokeDress(ev) { if (!C.dress || !C.dress.scare) return 0; const x = ev.x != null ? ev.x : ev.letter != null ? LETTER_X[Math.max(0, Math.min(3, ev.letter | 0))] : null; const n = C.dress.scare({ kind: ev.kind || 'poke', x, k: ev.k }); C.pokeLog.push({ t: +C.nowT.toFixed(1), kind: ev.kind, x, n }); if (C.pokeLog.length > 12) C.pokeLog.shift(); return n; }
  function dressTick(t) {
    const fw = C.clock.force.has('sign-web'), fd = C.clock.force.has('sign-dotd'), ft = C.clock.force.has('sign-thanks');   // (&force=sign-thanks — the maple leaves + the gold tubes, any day)
    // (FR7 FIXES C — A SIGN FORCE ALWAYS SHOWS THE FULL LOOK: it used to fall back to the real calendar while it WAS that holiday's season — the
    //  preview link showed no leaves before ~Nov 15, a half web early in October; now the force wins, in season or not)
    const H = fw ? { id: 'halloween', phase: 'build', stage: 1, down: 0, days: 30, eve: false } : fd ? { id: 'dotd', phase: 'day', stage: 1, down: 0, days: 1, day: 0, eve: false } : ft ? { id: 'thanksgiving', phase: 'build', stage: 1, down: 0, days: 20, eve: false } : C.HS;
    const P = H === C.HS ? C.HP : H.id === 'halloween' ? { web: 1, spider: true, spider2: true } : H.id === 'thanksgiving' ? { leaves: 1, gold: true } : { sign: 1 };
    leavesTick(t, H, P);
    if (!C.dress) {
      if (!C.dressLoading && (H.id === 'halloween' || H.id === 'dotd')) { C.dressLoading = true; lazyImport(import('./signdress.js'), './signdress.js').then(m => { if (!C.destroyed) C.dress = m.createSignDress(); }).catch(e => { C.dressLoading = false; console.warn('[harbor] sign dress', e); }); }
      return;
    }
    if (C.S.dressHost) C.dress.setHost(C.S.dressHost);
    { const lv = C.signLive(); if (C.lastSignLv >= 0 && Math.abs(lv - C.lastSignLv) > 0.3) pokeDress({ kind: lv < C.lastSignLv ? 'dim' : 'flash', k: Math.min(1, 0.4 + Math.abs(lv - C.lastSignLv)) }); C.lastSignLv = lv;
      if (C.zap.flash() > 0.35) pokeDress({ kind: 'lightning', k: 0.85 }); }
    C.dress.frame({ holiday: H, pieces: P, t, motion: !!C.S.motion, tier: C.tier, dpr: C.dpr, dressDpr: tierVal('dressDpr', C.dprTier) / 10, signLit: C.signLive(), word: wordLogo(), letterCols: C.HR && C.HR.sign && H === C.HS ? DRESS_COLS[C.HR.sign] || null : null,
      dark: clamp01(1 - (C.LK.w.day || 0) - 0.5 * (C.LK.w.golden || 0)), wind: C.WXS ? C.WXS.gust || 0 : (C.LK.wind == null ? 3 : C.LK.wind) });
  }
  // FR7 FIXES C — THANKSGIVING's MAPLE LEAVES behind NEON (screens/harbor/leafbank.js — lazy: loaded in the season / by the force only; its atlas
  // after the reveal, never in THE BOOT BUDGET); the module is this closure's — destroyLeaves() frees it (scene.js#destroy: THE LONG NIGHT's RULE)
  let leaves = null, leavesLoading = false;
  function leavesTick(t, H, P) {
    const k = H && H.id === 'thanksgiving' && P ? P.leaves || 0 : 0;
    if (!leaves) {
      if (k > 0 && !leavesLoading) { leavesLoading = true; lazyImport(import('./leafbank.js'), './leafbank.js').then(m => { if (!C.destroyed) leaves = m.createLeafBank(); }).catch(e => { leavesLoading = false; console.warn('[harbor] leaf bank', e); }); }
      return;
    }
    if (C.S.dressHost) leaves.setHost(C.S.dressHost);
    leaves.frame({ k, day: 1 - clamp01(1 - (C.LK.w.day || 0) - 0.5 * (C.LK.w.golden || 0)), lit: C.signLive(), gold: !!(P && P.gold), cols: P && P.gold ? DRESS_COLS.thanksgiving : PINK4,
      dpr: tierVal('dressDpr', C.dprTier) / 10, tier: C.tier, motion: !!C.S.motion });
  }
  function destroyLeaves() { if (leaves) { try { leaves.destroy(); } catch { /* fine */ } } leaves = null; leavesLoading = false; }
  const leavesDebug = () => (leaves ? leaves.debug() : null);
  const dressDebug = () => (C.dress ? C.dress.debug() : null);
  const hskyWanted = () => C.HS.id === 'halloween' || C.clock.force.has('ghost-ship') || C.clock.force.has('witch') || C.clock.force.has('bats');
  // (11a-2 — THE WITCH WAS CHOPPY (the owner's phone): LK.local carries WHOLE seconds, refreshed only with the look — her pass (+ the ghost
  // ship's) read from it jumped ~40–120 pt at a time. The sky's holiday pieces get the local time to the millisecond: the look's local
  // second + the time since it was taken)
  const fineLocal = () => { const lc = C.LK.local; if (!lc) return lc; return { ...lc, s: lc.s + (C.clock.now() - Math.floor(C.lkMs / 1000) * 1000) / 1000 }; };
  const hskyEnv = o => ({ L: C.L, W: C.W, HZ: C.HZ, dpr: C.dpr, lc: fineLocal(), nowS: C.clock.now() / 1000, motion: C.S.motion, tier: C.tier, hp: C.HP, dusk: C.duskH, force: C.clock.force, forceAt: C.forceAtOf, play: C.S.motion ? C.snd.play : null, dark: clamp01((C.LK.w.night || 0) + (C.LK.w.late || 0) + 0.6 * (C.LK.w.dusk || 0)), ...o });
  const hpropsEnv = (fadeIn, lit, mon) => { const wd = C.LK.windDir == null ? 250 : C.LK.windDir; return { L: C.L, HS: C.HS, HP: C.HP, tree: !!C.treeHeld, T: C.bakeTones, dark: litK(C.DK, 'lamps') * (lit > 0 ? 1 : 0.3) * C.PWQ /* (C4c: the lamps' light painted into the props dies with the drain) */, t: performance.now() / 1000, ms: C.clock.now(), motion: C.S.motion, tier: C.tier, dpr: C.dpr, fade: fadeIn,
    wind: C.WF.v(0.5), gust: C.WXS ? C.WXS.gust || 0 : 0, power: C.LB ? C.legendPow(C.W * 0.3, 'near', 211) : 1, monarchAt: mon ? C.forceAtOf('monarchs') * 1000 : null,
    propModel: C.propModelNow() /* (C4c: THE HARVEST DISPLAY's 3D model test — &prop=model + its panel row) */ }; };
  function paradeItems(fadeIn) {
    if (!C.L || !C.bakeTones || C.clock.force.has('no-holiday-props')) return [];
    const nowS = C.clock.now() / 1000, fp = C.clock.force.has('parade'), w = paradeWindow(nowS, { off: C.LK.local ? C.LK.local.off : 0, forceAt: fp ? C.forceAtOf('parade') : null });
    if (!w || nowS < w.T0 - 5) return [];
    if (!C.parade) { if (!C.paradeLoading) { C.paradeLoading = true; lazyImport(import('./parade.js'), './parade.js').then(m => { if (!C.destroyed) C.parade = m.createParade(); }).catch(e => { C.paradeLoading = false; console.warn('[harbor] parade', e); }); } return []; }
    const k = `${Math.round(w.T0)}`; if (k !== C.paraKey) { C.paraKey = k; C.paraUnits = paradeUnits(w); }
    const wd = C.LK.windDir == null ? 250 : C.LK.windDir;
    return C.parade.items({ L: C.L, w, units: C.paraUnits, x0: C.L.speakeasy ? C.L.speakeasy.x1 - 2.6 : -20, t: nowS, T: C.bakeTones, dark: litK(C.DK, 'lamps'), dpr: C.dpr, fade: fadeIn,
      wind: C.WF.v(0.5), gust: C.WXS ? C.WXS.gust || 0 : 0 });
  }
  /** the parade for the sounds: { units: [{ kind, i, x (0..1 of the screen: its middle) }] } | null */
  function paraSound() {
    if (!C.paraUnits || !C.L) return null;
    const nowS = C.clock.now() / 1000, x0 = C.L.speakeasy ? C.L.speakeasy.x1 - 2.6 : -20, out = [];
    for (const u of C.paraUnits) { if (u.t > nowS) break; const head = x0 + (nowS - u.t) * 0.78, mid = head - u.len / 2; const [sx] = project(C.cam, mid, 0, 56.2); if (sx < -0.4 * C.W || sx > 1.4 * C.W) continue; out.push({ kind: u.kind, i: u.i, x: sx / C.W }); }
    return out.length ? { units: out } : null;
  }
  /** WIN — the holiday's big set pieces on a pass, z-sorted with the walkers (people.js's extras) → [{ z, draw(c) }] */
  const hpropsItems = (pass, fadeIn, lit) => (C.hprops && (C.HS.id || C.treeHeld || (C.HP && (C.HP.giant || C.HP.bigs))) && !C.clock.force.has('no-holiday-props') && C.bakeTones && C.L ? C.hprops.items(pass, hpropsEnv(fadeIn, lit, false)) : []);
  function hpropsDraw(c, pass, fadeIn, lit) {
    const mon = C.clock.force.has('monarchs');
    if (!C.hprops) {
      if (!C.hpropsLoading && (C.HS.id || mon || C.treeHeld)) { C.hpropsLoading = true; lazyImport(import('./holidayprops.js'), './holidayprops.js').then(m => { if (C.destroyed) return; C.hprops = m.createHolidayProps(); if (C.hprops.onHarvestModel) C.hprops.onHarvestModel(e => C.LOADLOG.add('note', `THE HARVEST MODEL (&prop=model): ${e.state}${e.why ? ` — ${e.why}` : ''}${e.ms ? ` (${e.ms} ms)` : ''}`)); }).catch(e => { C.hpropsLoading = false; console.warn('[harbor] holiday props', e); }); }
      return;
    }
    if ((!C.HS.id && !mon) || C.clock.force.has('no-holiday-props') || !C.bakeTones || !C.L) return;
    const t0 = C.DEBUG ? performance.now() : 0;
    C.hprops.draw(c, pass, hpropsEnv(fadeIn, lit, mon));
    if (C.DEBUG) { const d = performance.now() - t0; C.hpropsMs = C.hpropsMs * 0.97 + d * 0.03 * 3; if (typeof window !== 'undefined') { window.__hpropsMs = +(C.hpropsMs / 3).toFixed(3); window.__hprops = C.hprops; const b = window.__hpropsLog || (window.__hpropsLog = []); if (pass === 'ground') b.push(d); else if (b.length) b[b.length - 1] += d; if (b.length > 900) b.splice(0, 300); } }
  }
  function holidayTick() {
    const lc = C.LK.local;
    C.HS = holidayAt(lc);
    const hr = lc ? lc.h + lc.mi / 60 + (lc.s || 0) / 3600 : 12;
    if (lc && C.duskDay !== `${lc.y}-${lc.m}-${lc.d}`) { C.duskDay = `${lc.y}-${lc.m}-${lc.d}`; try { const st = sunTimes(C.clock.now(), C.clock.tz, C.LK.lat, C.LK.lon); if (st.set) C.duskH = ((((st.set + lc.off * 60000) / 3.6e6) % 24) + 24) % 24; } catch { /* the default */ } }
    const hp = C.HS.id === 'halloween' ? halloweenPieces(C.HS, { hour: hr, giant: C.clock.force.has('giant') }) : C.HS.id === 'dotd' ? dotdPieces(C.HS, { hour: hr, dusk: C.duskH }) : C.HS.id === 'thanksgiving' ? thanksgivingPieces(C.HS, { hour: hr }) : null;
    // (11a-2 — BIG PIECES CHANGE OFF-CAMERA (core/harbor-holiday.js#latchBig): the giant + the big set pieces only change at a load, a return
    // from the background or a jump of the clock (a preview, the panel) — never on screen)
    { const nowMs = C.clock.now(), wall = performance.now(); if (C.bigClock != null && Math.abs((nowMs - C.bigClock) - (wall - C.bigWall)) > 90e3) C.bigRelatch = true; C.bigClock = nowMs; C.bigWall = wall; }
    C.XP = xmasPrelude(lc, { dusk: C.duskH });
    if (C.clock.force.has('xmas-lights')) C.XP = { ...C.XP, lights: 1, lit: true };
    if (C.clock.force.has('shoppers')) C.XP = { ...C.XP, rush: 1 };
    if (C.treeHeld == null || C.bigRelatch) C.treeHeld = !!(C.XP.tree || C.clock.force.has('treestand'));
    if (C.clock.force.has('treestand')) C.treeHeld = true;
    { const r = latchBig(C.bigHeld, hp, C.bigRelatch); C.HP = r.pieces; C.bigHeld = r.held; C.bigRelatch = false; }
    if (C.L && C.L.cart) C.L.cart.cider = !!(C.HP && C.HP.cider);   // (11a-2: the chestnut cart's HOT CIDER board through the Thanksgiving build-up)
    C.HR = lightRules(C.HS, { hour: hr, dark: clamp01((C.LK.w.night || 0) + (C.LK.w.late || 0) + 0.5 * (C.LK.w.dusk || 0)) });
    if (!C.HR.strings && C.XP.lit) C.HR.strings = 'christmas';   // (11a-2: the roof's café lights in Christmas colours with the first strings)
    // (City 2.0 owns Halloween + Day of the Dead: the district's Halloween — its witch, bats + rooftop pumpkin — never runs here; the
    // title's sign dressing reads City 2.0's calendar through look())
    // (11a-2: + THANKSGIVING — City 1.0's calendar keeps it 'full' Wed → Fri: the Harbor's sign was amber on Black Friday)
    if (C.LK.holiday && (C.LK.holiday.id === 'halloween' || C.LK.holiday.id === 'thanksgiving')) C.LK.holiday = null;
    C.LK.c2holiday = titleHoliday(C.HS);
    // (FR7 FIXES C: &force=sign-thanks = the FULL look — the gold tubes too, any day)
    if (C.clock.force.has('sign-thanks')) { C.LK.c2holiday = { id: 'thanksgiving', full: true, k: 1, c2: true }; C.HR = { ...C.HR, sign: 'thanksgiving', signLight: '#ffc23a' }; }
    // (the windows' scenes plan by the hour: they read the DAY's stage — noon's — so a plan never shifts mid-hour; eve flips once)
    if (C.HS.id && lc) { const hd = holidayAt({ y: lc.y, m: lc.m, d: lc.d, h: 12, mi: 0 }), pd = hd.id === 'halloween' ? halloweenPieces(hd) : null;
      C.HL = { id: C.HS.id, stage: Math.round((hd.id === C.HS.id ? hd.stage : C.HS.stage) * 100) / 100, eve: !!C.HS.eve, w: pd ? Math.round(pd.windows * 10) / 10 : 1, ofrendas: C.HP && C.HP.ofrendas != null ? C.HP.ofrendas : 0 };
      if (C.HS.id === 'halloween' && C.HS.eve) C.HL.w = 1; } else C.HL = null;
  }
  return { destroyLeaves, leavesDebug, dressDebug, dressTick, holidayTick, hpropsDraw, hpropsItems, hskyEnv, hskyWanted, paraSound, paradeItems, pokeDress };
}
