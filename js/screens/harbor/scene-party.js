// CITY 2.0 — THE PARTY's WIRING (SCHED — FR5 C1's cut: a pure MOVE out of scene.js, no behaviour changed): the promenade lamps' life (the
// switch-on one by one, the rare stutter) + the party's wash on them, the rainbow's target, partyTick (the party's ramp, the beat, the pulse)
// + the finale; one factory over ONE ctx of getters (+ setters) onto scene.js's own state (docs/harbor/review-5.md C1).
import { sunPosition } from '../../core/sky.js';
import { partyState, partyHour, finaleDue, advanceBeat, partyPalette, partySeed } from '../../core/party.js';
import { harborParty, harborPartyPlan, partyReadyHour } from '../../core/harbor-show.js';
import { advanceHarborBeat, pulseGain, pulseOut, stepSafety, safePunch } from '../../core/harbor-beat.js';
import { bowEnvelope, bowWeights, bowSchedule, lastRain } from '../../core/rainbow.js';
import { groundY, project } from '../../core/harbor-layout.js';
import { settings } from '../../audio/settings.js';
import { lampThresholds, warmUp, lampMoment } from '../../core/harbor-lamps.js';
import { lightMode } from '../../core/harbor-light.js';
import { darkness, litK, isNight, partyReady } from '../../core/harbor-dark.js';
import { spookyFlicker } from '../../core/harbor-holiday.js';

// (scene.js's own module-level helpers this code uses — copied)
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/** C: scene.js's state by getters (+ a setter where this code assigns it): bc, bowForcedAt=, cam, centre, clock, DK, fw, fwx, H, hbeat, HR, HZ, L, lampDbg=, lampFaultNow, lastDt, lastWet, LB, legendPow, legends, LK, PT, pulseQ=, punchHist, punchI=, qp, roPk=, roPkAt=, roPulse=, S, safety, tier, W, wxNow */
export function createSceneParty(C) {
  // 8P — THE LAMPS' LIFE (core/harbor-lamps.js): the switch-on order + the warm-up, the rare moment on the city clock (the same lamp on
  // every phone); a lamp already on when the page opens never stutters; the crossing's pair stays steady while an event is on the inlay
  let lampTh = null, lampThKey = '', lampOnAt = [], lampWas = [];
  // NIGHT-A — THE PARTY's TINT on the new light's wash (the owner: "party nights tint the wash faintly with the neon's colours"): one
  // full-width gradient over the promenade + the street, 'lighter', a few % — the party palette's colour, a new one every 8 bars (eased
  // over the last bar: never on the beat, never a flash); the blackout takes it down with the lamps. Tier 0: none (one fill a frame).
  function partyWash(c, fadeIn) {
    if (lightMode() !== 'new' || !(C.PT.on > 0.02) || C.tier === 0 || fadeIn <= 0 || !C.PT.palette || !C.PT.palette.length) return;
    const k = 0.06 * C.PT.on * fadeIn * litK(C.DK, 'lamps') * (C.S.lit > 0 ? C.S.lit : 0) * (C.LB ? C.legendPow(C.W * 0.5, 'near', 210) : 1);
    if (k < 0.004) return;
    const pal = C.PT.palette, n = pal.length, u = C.S.motion ? (((C.PT.bar || 0) % (8 * n)) + (C.PT.phase || 0)) / 8 : 0, i = Math.floor(u) % n, f = clamp01(((u % 1) - 0.85) / 0.15);
    const col = pal[i].map((v, j) => Math.round(v + (pal[(i + 1) % n][j] - v) * f)), y0 = groundY(C.cam, C.L.prom.z1), g = c.createLinearGradient(0, y0, 0, C.H);
    g.addColorStop(0, `rgba(${col},${(k * 0.35).toFixed(4)})`); g.addColorStop(1, `rgba(${col},${k.toFixed(4)})`);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, y0, C.W, C.H - y0); c.restore();
  }
  function lampLife(t) {
    const n = C.L.lamps.length, ramp = litK(C.DK, 'lamps'), seed = C.L.seed || 1924, key = `${n}|${seed}`;
    if (key !== lampThKey) { lampThKey = key; lampTh = lampThresholds(n, seed); lampOnAt = new Array(n).fill(-99); lampWas = new Array(n).fill(null); }
    // (PROM: the two implied pools nearest the compass stay steady while an event stands on it — the tall pair's old rule)
    const ms = C.clock.now(), mo = C.S.motion, skip = C.centre.active() && C.L.medallion ? C.L.lamps.map((l, i) => [Math.abs(l.x - C.L.medallion.x), i]).sort((a, b) => a[0] - b[0]).slice(0, 2).map(p => p[1]) : [];
    const m = mo && ramp > 0.6 ? lampMoment(ms, n, { seed, skip }) : null;
    const levels = [], off = []; let dim = false;
    for (let i = 0; i < n; i++) {
      const on = ramp >= lampTh[i];
      if (on && lampWas[i] === false) lampOnAt[i] = t;
      lampWas[i] = on;
      let lv = on ? (mo ? warmUp(t - lampOnAt[i]) : 1) : 0;
      if (m && m.i === i) lv *= m.level(ms);
      // (8b1 — CAUSE AND EFFECT: a lamp's BAD NIGHT — it stutters every minute or so until the morning's short ladder fixes it)
      // (11a-1 — THE SPOOKY LIGHT: on Halloween night each lamp now and then GUTTERS — its own seeded stutter, a few times a minute)
      if (lv > 0 && mo && C.HR.lampFlicker > 0.01) lv *= 1 - C.HR.lampFlicker * spookyFlicker(ms / 1000, i);
      if (lv > 0 && mo && C.lampFaultNow && C.lampFaultNow.lamp === i && ms / 1000 >= C.lampFaultNow.from) { const u = ((ms / 1000 - C.lampFaultNow.from) % C.lampFaultNow.period); if (u < 1.1) lv *= u < 0.12 ? 0.1 : u < 0.3 ? 0.75 : u < 0.42 ? 0.05 : u < 0.62 ? 0.6 : u < 0.75 ? 0.15 : 1; }
      if (C.legends && C.legends.active()) lv *= C.legendPow(project(C.cam, C.L.lamps[i].x, 0, C.L.lamps[i].z)[0], 'near', 100 + i);   // (6b: a legendary's power)
      levels.push(lv); off.push(1 - lv); if (lv < 0.98) dim = true;
    }
    C.lampDbg = { levels: levels.map(v => +v.toFixed(2)), th: lampTh.map(v => +v.toFixed(2)), moment: m ? { i: m.i, kind: m.kind, at: m.at, len: +m.len.toFixed(2) } : null };
    return { levels, off, dim: dim && ramp > 0.02, ramp };
  }

  // ------------------------------------------------------------------ RAINBOWS + PARTY NIGHTS (the rules: core/; Part 11 builds the party's look)
  const BOW0 = { day: 0, moon: 0, neon: 0, secondary: false, strength: 1 };
  function bowTarget(t) {
    const f = C.clock.force, now = C.clock.now();
    const forced = f.has('rainbow2') ? 'day2' : f.has('rainbow') ? 'day' : f.has('moonbow') ? 'moon' : f.has('neonbow') ? 'neon' : null;
    if (forced) {
      if (C.bowForcedAt == null) { if (t < 1.2) return BOW0; C.bowForcedAt = now; }
      const env = smooth(0, 8000, now - C.bowForcedAt);
      return { day: forced.startsWith('day') ? env : 0, moon: forced === 'moon' ? env : 0, neon: forced === 'neon' ? env : 0, secondary: forced === 'day2', strength: 1, forced };
    }
    const wet = lastRain(C.wxNow(), C.clock.preview && !C.clock.keepLive ? null : C.lastWet());
    if (wet == null) return BOW0;
    const env = bowEnvelope(now, wet);
    if (env <= 0) return { ...BOW0, wet };
    const w = bowWeights(C.LK, { party: C.PT.ramp });
    return { day: env * w.day, moon: env * w.moon, neon: env * w.neon, secondary: bowSchedule(wet).secondary, strength: w.strength, wet, env };
  }
  // FP2 — TONIGHT'S PARTY PLAN (core/harbor-show.js#harborPartyPlan): the warm-up at 8:30 pm or when the power-up has finished, whichever
  // is later; the peak at 9:30 or 45 min after that — once an evening (the real sun: when darkness() first passes partyReady)
  let planKey = '', planV = harborPartyPlan();
  function partyPlanNow() {
    const lc = C.LK.local; if (!lc) return planV;
    const an = !!settings.alwaysNight || !C.LK.sun, key = `${lc.y}-${lc.m}-${lc.d}-${lc.h < 12}|${an}|${C.LK.lat}|${C.LK.lon}`;
    if (key === planKey) return planV;
    planKey = key;
    const mid = Date.UTC(lc.y, lc.m - 1, lc.d) - lc.off * 60000 - (lc.h < 12 ? 864e5 : 0);
    const ready = an ? null : partyReadyHour(mid, ms => darkness({ el: sunPosition(ms, C.LK.lat, C.LK.lon).el }), partyReady);
    return (planV = harborPartyPlan(ready));
  }
  function partyTick(t, dt, lit) {
    const hol = C.LK.holiday && C.LK.holiday.full ? C.LK.holiday.id : null;
    const caught = C.S.caught != null ? C.S.caught : isNight(C.DK);
    // (&force=no-party: THE PREVIEW PANEL's PARTY OFF — a real party night held dark)
    // (DT1: a party night powers up first — the show warms up once the blue hour's power-up is done)
    // (FP2: and never before tonight's warm-up — 8:30 pm at the earliest: harborParty(…).on)
    const plan = partyPlanNow(), hp0 = harborParty(partyHour(C.LK.local), plan);
    const ps = C.clock.force.has('no-party') ? { on: 0, energy: 0, phase: null, forced: true } : partyState(C.LK.local, { caught: caught && lit > 0.5 && partyReady(C.DK) && hp0.on, force: C.clock.force.has('party') });
    // (8b2 — THE BLACKOUT WINS (the owner: the TR-3B forced with PARTY ON left the neon, the windows, the sky beams + the show lit): the
    // party show is scaled by what's left of the city's power at its SOURCE — every party light (the chasers, the LED facades, the punch,
    // the sky beams, the searchlights' turn) reads PT.on / PT.ramp; dark while the city is dead, ramping back with the power)
    const blk = C.legends && C.legends.active() ? C.legends.blackout() : null, pwK = blk ? clamp01(1 - blk.k) : 1;
    if (pwK < 1) ps.on *= pwK;
    // (9f — LOAD WEATHER: the windows' party look is baked from tonight's party WITHOUT the title's gates (its entrance light, the
    // sign's catch — which lags a panel's clock jump by a second): the city's own darkness decides; the entrance fades
    // the whole city in anyway, so a party night's windows are party from the first picture, never re-baked mid-fade-in)
    C.PT.litOn = ps.forced ? ps.on : partyState(C.LK.local, { caught: isNight(C.DK) && partyReady(C.DK) && hp0.on, force: C.clock.force.has('party') }).on * pwK;
    C.PT.name = ps.phase; C.PT.on = ps.on; C.PT.ramp = ps.on; C.PT.energy = ps.energy; C.PT.motion = C.S.motion; C.PT.tier = C.tier; C.PT.plan = plan; C.PT.power = pwK;
    // (the harbor's own night — FP2: 8:30 pm warm-up → 9:30 pm peak → calming after 1 am; core/party.js keeps the window + the 2 am wind-down)
    if (ps.on > 0 && !ps.forced) { C.PT.energy = hp0.energy; C.PT.name = hp0.name; }
    C.PT.palette = partyPalette(hol);
    const song = ps.on > 0 && C.S.beat ? C.S.beat() : null;
    C.PT.song = song;   // (SP5: the dancers' song edge — songEdge())
    advanceBeat(C.bc, dt, song);
    C.PT.breath = C.S.motion ? C.bc.breath : 0.5;
    // THE BEAT (NEON PASS 5 — core/harbor-beat.js): the song's grid (real bars, the downbeat) + the kicks the analyser hears; the
    // pulse HALF-TIME (beats 1 + 3, the downbeat hardest); without music a calm 120 bpm of its own
    advanceHarborBeat(C.hbeat, dt, song, ps.on > 0 && C.S.kick ? C.S.kick() : null);
    C.PT.songPos = song && song.pos >= 0 ? song.pos : null;   // (ATM-B: the song position this frame's beat used — the SONG CLOCK check compares at that same instant)
    C.PT.bar = C.hbeat.bar; C.PT.phase = C.hbeat.barU; C.PT.beat = C.hbeat.idx === 0 && C.hbeat.u < 0.25;
    C.PT.beatU = C.hbeat.u; C.PT.beatT = C.hbeat.T; C.PT.beatIdx = C.hbeat.idx; C.PT.beats = Math.floor(C.hbeat.beats); C.PT.beatsF = C.hbeat.beats; C.PT.rate = 1 / (4 * C.hbeat.T); C.PT.src = C.hbeat.src;
    // (8a — PULSE STRENGTH: ONE multiplier on the punch here, at its source — every beat-driven light reads PT.punch or the ripple's
    // history; the preview panel's slider / &pulse= (core/harbor-beat.js#pulseGain, PULSE_DEFAULT), with the soft knee: pulseOut)
    const pq = C.qp.get('pulse'); if (pq !== C.pulseQ) { C.pulseQ = pq; C.PT.pulse = pulseGain(pq); }
    // (8b1 — THE SAFETY RULE, core/harbor-beat.js#stepSafety: the punch only while the heard offset is confirmed — else a gentle breath;
    // the punch itself stays on the trusted grid)
    if (ps.on > 0) { const cb = C.S.beatCal ? C.S.beatCal() : {}; stepSafety(C.safety, { src: C.hbeat.src, bar: C.hbeat.bar, song: cb.song || (song && song.id) || null, anchors: cb.anchors, live: C.hbeat.live, cal: cb, saved: !!cb.saved, deafSong: !!cb.deafSong }, dt); }
    const sp0 = safePunch(C.safety, C.hbeat.punch, C.hbeat.beats, C.hbeat.level);
    C.PT.safe = C.safety.mode; C.PT.safeK = C.safety.k;
    C.PT.punch = C.S.motion && ps.on > 0 ? pulseOut(sp0 * ps.on * (0.72 + 0.28 * Math.min(1, Math.max(0, (C.PT.energy - 0.55) / 0.45))), C.PT.pulse) : 0;
    C.punchHist[C.punchI = (C.punchI + 1) & 63] = C.S.motion ? pulseOut(sp0, C.PT.pulse) : 0;          // (the show scales it by the scene + the night)
    C.roPk = Math.max(C.roPk, C.PT.punch); if (t - C.roPkAt > 0.5 || t < C.roPkAt) { C.roPulse = C.roPk; C.roPk = 0; C.roPkAt = t; }   // (the readout's `pulse`: the peak of the last ½ s)
    C.PT.punchAt = punchAt;
    C.PT.swell = Math.max(0, C.PT.swell - dt / 3800);
    const hr = partyHour(C.LK.local), sd = partySeed(C.LK.local);
    if (!C.fwx.ok() && ps.on > 0 && !ps.forced && !C.LK.nye && C.PT.finaleDone !== sd && finaleDue(C.PT.lastHour, hr)) { C.PT.finaleDone = sd; startFinale(); }   // (PART 10: the GPU engine's midnight shells replace it)
    C.PT.lastHour = hr;
    if (!C.fwx.ok() && C.clock.force.has('finale') && !C.PT.finaleForced && t > 2.5 && lit > 0.5) { C.PT.finaleForced = true; startFinale(); }
    if (C.S.onParty && (C.PT.on > 0 || C.PT.wasOn)) C.S.onParty(C.PT);
    C.PT.wasOn = C.PT.on > 0;
  }
  /** the city's punch s seconds ago (≤ ~1 s: the frames' history) — the show's ripple rolling across the skyline */
  function punchAt(s) { const n = Math.min(63, Math.round(s * 1000 / Math.max(8, C.lastDt))); return C.punchHist[(C.punchI - n + 64) & 63]; }
  // the midnight finale: shells over the city, never on the sign (Part 11 stages the real one)
  function startFinale() {
    if (!C.S.motion) { C.PT.swell = 1; C.PT.bursts++; return; }
    const pal = partyPalette(null), tr = C.S.textRects;
    const n = C.W < 760 ? 4 : 6, big = C.W < 760 ? Math.min(C.W * 0.18, 74) : Math.min(C.W * 0.11, 150);
    const yHi = tr && tr.tag ? tr.tag.y + tr.tag.h + big * 0.9 : C.HZ * 0.34, yLo = Math.max(yHi + 10, C.cam ? C.cam.limitY + 40 : C.HZ * 0.6);
    for (let i = 0; i < n; i++) C.fw.launch({ x: C.W * (0.2 + 0.6 * (i + 0.5) / n), y0: C.HZ * 0.98, ty: yHi + (yLo - yHi) * [0.5, 0.15, 0.75, 0.3, 0.6, 0.2][i % 6], col: pal[i % pal.length], col2: '#ffffff', big, delay: i * 0.36 });
  }
  return { bowTarget, lampLife, partyTick, partyWash, startFinale };
}
