import { isUnlocked } from '../audio/engine.js';
import { neonFlicker, neonDropout, neonCatch, neonHumFade, neonRaceCrackle, neonPreload } from '../audio/ambience.js';
import { neonPlan, neonState, neonNext, firstTapAnswer, createStartDetector } from '../core/neon-ramp.js';
import { logoTrack } from '../ui/logo.js';
import { beatSource } from '../audio/beat.js';
import { beatMode } from '../core/harbor-beat.js';
import { settings } from '../audio/settings.js';

/** createNeon(T) — moved out of title.js#createTitle by scripts/split-closure.mjs (no behaviour change): T carries the names it shares
 *  with that closure, live (getters + setters); what it returns, the closure reads as neon.<name>. */
export function createNeon(T) {
  // ------------------------------------------------------------------ THE NEON COMES ALIVE (core/neon-ramp.js, docs/title.md)
  // The sign follows the day's plan: silent sputters that grow through the golden hour, letters sticking, THE CATCH — the crackle +
  // hum, the only sound — when the sun's disc goes behind the rooftops; the city's signs answer one at a time. At dawn the city
  // signs go first, then the logo falters and dies letter by letter. The sun's computed place only — never the weather.
  // The dock: icons dark through the ramp, lit from the catch until the last letter dies; HOST brightens at the catch and softens
  // (no flicker) when the last letter dies.
  let neonPlanV = null, neonKey = '', neonT = 0, neonStage = null, neonFromPlan = false, neonSounds = 0, stormOn = false;   // (stormOn — SP3: the sign lit by a dark storm afternoon)
  // CITY 2.0 — THE HUM (NEON PASS 3, the owner's ears): no hum looping all night — the power-on brings it up and it FADES OUT
  // smoothly over the 10 s after the sign is fully on (ambience.js#neonHumFade); the same after a tapped letter re-ignites. The
  // files are warmed once audio unlocks (checked on every neon update); a hidden page / the goodbye cut a hum still fading.
  let humStop = null, neonWarm = false;
  function humSync(on) {
    if (!neonWarm && isUnlocked()) { neonWarm = true; neonPreload(); }
    if ((!on || T.destroyed || document.visibilityState !== 'visible') && humStop) { humStop(0.6); humStop = null; }
  }
  /** City 2.0: a power-on (the catch, a tapped letter re-igniting) — the recorded strike + the hum fading out after it.
   *  11a-2 (the owner, Oct 26: the tap's hum lasted "way too long"): the sound FOLLOWS THE RACE — a short buzz-up as the letter
   *  re-lights, a light crackle riding the race across the letters, then it fades out as the race ends: a TAP ≤ ~1.5 s in all
   *  (NEON_SOUND.tap), THE CATCH a little longer with its longer race (~3 s, never a drone). One at a time: a new power-on stops the
   *  last one's strike + hum at once (never stacked), and a tap within NEON_SOUND.cool of the last one plays no new strike. */
  let strikeStop = null, strikeAt = -1e9;
  function neonOnSound(level = 1, kind = 'catch') {
    if (T.destroyed || document.visibilityState !== 'visible') return;
    const cfg = T.NEON_SOUND[kind] || T.NEON_SOUND.catch, now = performance.now();
    if (kind === 'tap' && now - strikeAt < T.NEON_SOUND.cool) return;
    strikeAt = now;
    if (strikeStop) strikeStop(0.06);
    if (humStop) humStop(0.06);
    strikeStop = neonCatch({ level, dur: cfg.strike });
    humStop = neonHumFade({ level, fadeIn: cfg.up, hold: cfg.hold, fade: cfg.fade });
    neonRaceCrackle({ span: cfg.crackle, n: cfg.ticks, level: kind === 'tap' ? 0.7 : 1 });
    T.neonSoundLog.push({ kind, at: Math.round(now), total: +(Math.max(cfg.strike, cfg.hold + cfg.fade)).toFixed(2) }); if (T.neonSoundLog.length > 20) T.neonSoundLog.shift();
  }
  // CITY 2.0 — THE WARM-UP'S LAST 30 s (NEON PASS 4, the owner): the golden-hour sputters stay silent until the last
  // WARM_SOUND_MS before THE CATCH; from then each tube striking plays a flicker, quiet at first and building toward the catch
  // (level 0.3 → 0.8), never closer than 4 s → 1.2 s apart (real time). Then the catch's power-on + the fading hum. The window is
  // on the plan's clock (?speed= shrinks it too); never on the first paint, under Reduced effects or on a hidden page.
  const WARM_SOUND_MS = 30000;
  let warmSoundAt = -1e9, neonWarmSounds = 0;
  function warmFlicker() {
    if (!neonPlanV || !T.scene || T.reduced() || T.destroyed || document.visibilityState !== 'visible') return;
    const left = neonPlanV.catchAt - T.scene.now();
    if (left <= 0 || left > WARM_SOUND_MS) return;
    const k = 1 - left / WARM_SOUND_MS, now = performance.now();
    if (now - warmSoundAt < 4000 - 2800 * k) return;
    warmSoundAt = now; neonWarmSounds++;
    neonFlicker({ level: 0.3 + 0.5 * k });
  }
  const NEON_LIT ={ stage: 'night', letters: [true, true, true, true], signs: null, fade: 1, caught: true };
  const NEON_DAY = { stage: 'day', letters: [false, false, false, false], signs: null, fade: 0, caught: false };
  function neonNow() {
    neonFromPlan = false;
    if (!T.scene) return NEON_DAY;
    const L = T.scene.look();
    if (!L) return NEON_DAY;
    if (L.alwaysNight) return NEON_LIT;
    const m = T.scene.neonMoments ? T.scene.neonMoments() : null;
    if (!m) return T.scene.signOn() ? NEON_LIT : NEON_DAY;                    // no sunrise / sunset today (polar): the old rule
    const nSigns = Math.max(1, T.scene.signCount ? T.scene.signCount() : 4), sp = T.scene.speed ? T.scene.speed() : 1;
    const key = `${Math.round(m.catchAt / 10000)}|${Math.round(m.clearAt / 10000)}|${T.reduced() ? 'r' : ''}|${nSigns}|${sp}`;
    if (key !== neonKey) {
      neonKey = key;
      const day = new Date(m.rise).toISOString().slice(0, 10);
      neonPlanV = neonPlan({ moments: m, seed: `${day}|${(L.lat || 0).toFixed(1)}|${(L.lon || 0).toFixed(1)}`, signs: nSigns, reduced: T.reduced(), scale: sp });
    }
    const st = neonState(neonPlanV, T.scene.now());
    neonFromPlan = !!st;
    // (City 2.0, SP3: a DARK STORM AFTERNOON lights the sign with the city — the skyline's neon on the shared darkness (core/harbor-dark.js);
    // a little hysteresis so a passing squall can't flick it; back to the plan (daylight glass) as the storm clears)
    if (T.scene.stormLit && !(st && st.caught)) { const k = T.scene.stormLit(); stormOn = stormOn ? k > 0.35 : k > 0.55; if (stormOn) return { ...NEON_LIT, storm: true }; } else stormOn = false;
    // (8a — the first tap in the evening warm-up window caught the sign early: lit for good — tonight's plan only)
    if (st && st.stage === 'ramp' && earlyCatch != null && Math.abs(earlyCatch - neonPlanV.catchAt) < 30 * 60000) return { ...st, stage: 'lit', letters: [true, true, true, true], fade: 1, caught: true };
    return st || NEON_DAY;
  }
  let earlyCatch = null;           // (the catchAt of the plan the first tap caught early)
  function applyNeon(st, opts = {}) {
    if (!T.els.sign || !T.scene) return;
    humSync(!!st.caught);
    const s = T.els.sign, letters = [...s.querySelectorAll('.ndl')];
    const prev = neonStage;
    neonStage = st.stage;
    T.scene.set({ signPower: st.signs });
    // HOST: bright from the catch until the last letter dies; softer by day and through the ramp
    T.els.actions.classList.toggle('is-daylit', st.stage === 'day' || st.stage === 'ramp');
    // JOIN / HOST (FRIENDS B): lit day + night — softer by day; the old "unlit glass by day" is gone (ringsWanted is always true once the
    // title's sequence is done)
    if (T.tl && T.tl.done && T.dk.dock) {
      const want = T.dk.ringsWanted(st);
      if (want && !T.dk.dock.ringLit()) T.dk.ringOn(prev === 'ramp' && !opts.quiet && !T.reduced() ? [[0, true], [70, false], [150, true], [230, false], [340, true]] : null);
      else if (!want && T.dk.dock.ringLit()) { T.dk.dock.resetRing(); T.dk.dock.ringSet(false); }
    }
    if (st.caught) {
      if (!s.classList.contains('is-steady') || s.classList.contains('is-day')) {
        const isCatch = prev === 'ramp' && !opts.quiet;
        s.classList.remove('is-day', 'is-fade');
        letters.forEach((l, i) => { if (!T.tap.buzzing.has(i)) l.classList.add('on'); });
        s.classList.add('is-steady');
        setTimeout(() => { if (!T.destroyed) s.classList.add('is-warm'); }, 60);
        T.dk.dockAll(true);
        if (isCatch) {
          // THE CATCH: all four lock on together, the crackle + hum, a soft bloom (City 2.0: the city holds its tier through it)
          if (T.scene.hold) T.scene.hold(3000);
          neonOnSound();   // (the recorded power-on + the hum fading)
          neonSounds++;
          s.classList.add('is-catch');
          setTimeout(() => { if (!T.destroyed) s.classList.remove('is-catch'); }, 1500);
          setTimeout(() => raceLogo('catch'), 120);          // (NEON PASS 6: THE RACE rides on top of the catch — its timing + sound unchanged)
        }
      }
      T.scene.set({ logo: 1, signPow: 1, caught: true });
      return;
    }
    // the ramp, the goodbye, the day: the daytime glass look, with whichever letters are lit right now
    s.classList.remove('is-steady', 'is-warm');
    s.classList.add('is-day');
    const fade = !!(neonPlanV && neonPlanV.reduced && (st.stage === 'ramp' || st.stage === 'goodbye'));
    s.classList.toggle('is-fade', fade);
    if (fade) s.style.setProperty('--rf', st.fade.toFixed(3));
    let on = 0, struck = 0, dropped = 0;
    letters.forEach((l, i) => {
      if (st.letters[i]) on++;
      if (T.tap.buzzing.has(i)) return;
      const was = l.classList.contains('on');
      l.classList.toggle('on', !!st.letters[i]);
      if (was !== !!st.letters[i]) { if (st.letters[i]) struck++; else dropped++; }
    });
    // CITY 2.0 — THE RECORDED NEON (NEON PASS 3 + 4, the owner's ears): the golden-hour warm-up is SILENT but for its last 30 s
    // (warmFlicker: the strikes building toward the catch); the dawn's stutters are silent — only the very last tube cutting out
    // at dawn sounds, the dropout, softly (it lands as the plan turns to 'day'). Never on the first paint, never under Reduced effects.
    if (st.stage === 'ramp' && !opts.quiet && !fade && struck) warmFlicker();
    if (prev === 'goodbye' && st.stage === 'day' && !opts.quiet && !fade && dropped) neonDropout({ level: 0.55 });
    T.dk.dockAll(true);   // (FRIENDS B: the pill's icons stay LIT by day — they no longer go dark with the sign's last letter)
    const share = fade ? st.fade : on / 4;
    T.scene.set({ logo: share > 0 ? 1 : 0, signPow: share, caught: false });
  }
  // PARTY NIGHTS (scene.js#partyTick, every frame while it's on): --pb the breath 0..1, --pe how hard (the phase's energy, 0
  // until the start wave has passed), --psw the finale's swell; .is-party while the party is on
  let partyOn = false;
  const partyCssOff = /no-party-css/.test(location.search);   // (test-only: pacing bisects)
  function partyFrame(p) {
    if (T.destroyed || !T.els.root || partyCssOff) return;
    if (!T.els.root.dataset.pt) { T.els.root.dataset.pt = '1'; for (const k of ['no-bloom', 'no-ringbreath', 'no-shimmer', 'no-vars']) if (location.search.includes(k)) T.els.root.classList.add(k); }
    if (T.els.root.classList.contains('no-vars')) { T.els.root.classList.toggle('is-party', p.on > 0); return; }
    const on = p.on > 0;
    if (on !== partyOn) { partyOn = on; T.els.root.classList.toggle('is-party', on); if (!on && partyEls) { for (const g of partyEls.glows) g.el.style.opacity = ''; if (partyEls.word) partyEls.word.style.opacity = ''; if (partyEls.logo) partyEls.logo.style.opacity = ''; partyEls = null; } }
    if (!on) return;
    // (NEON PASS 6: THE RACE now and then on a party night — every ~40–70 s, on a bar line, from the warm-up's middle)
    { const t = performance.now(); if (raceNext < 0) raceNext = t + 9000; else if (t > raceNext && p.ramp > 0.6 && p.bar !== raceBar && !raceBusy()) { raceNext = t + 40000 + Math.random() * 30000; raceLogo('party'); } raceBar = p.bar; }
    // the numbers go on the three elements that breathe — never on the root: a custom property there is inherited by the whole
    // title, and writing it every frame re-styled all of it (100 ms frames on a slow phone). (Reduced: the breath holds at 0.5.)
    // (the rings breathe through their glow layer's opacity — a compositor change — never the registered --hk, whose 2.4 s
    // transition restarted on every write and re-styled the whole ring)
    if (!partyEls || !partyEls.bloom || !partyEls.bloom.isConnected) partyEls = { bloom: T.els.sign.querySelector('.nd-bloom'), word: T.els.sign.querySelector('.nd-word-p'), logo: T.els.sign.querySelector('.nd-logo-glow'), lp: -1, lk: '', glows: [...T.els.root.querySelectorAll('.nd-ringbtn')].map(r => ({ el: r.querySelector('.nd-hglow'), ring: r, k: r.classList.contains('nd-joinring') ? 0.46 : 0.62 })).filter(g => g.el), bo: -1, hk: -1, wp: -1 };
    const pe = p.ramp * p.energy;
    // the bloom holds a gentle level that moves with the party's phase and the finale's swell (the beat breathes in the canvas's
    // halo under it): a big layer re-composited every frame cost a slow phone 60+ ms
    // (City 2.0, NEON PASS 3: the NEON word joins the show on its BIGGEST drops only — p.big, a flare easing back)
    const sw = Math.max(p.swell, 0.8 * (p.big || 0), T.fwFlare);   // (PART 10: + a big firework's flare)
    // (City 2.0, NEON PASS 4 — THE HARD BEAT: the rings + SPEAKEASY PUNCH on every beat — p.punch, a ~50 ms attack and a quick
    // decay — through opacity alone: the rings' glow layer, SPEAKEASY's extra glow layer; the big bloom keeps its gentle level)
    // (PART 10: the bloom sits outside the sign's dimmed wrapper — it follows a dim (a sky message, the fireworks, the TR-3B) itself,
    // eased over the dim's own time, so a dark sign never keeps a glow of its own on the fog)
    { const tn = performance.now(), sd = T.scene && T.scene.signDim ? T.scene.signDim() : null, want = sd ? sd.logo : 1, dtb = Math.min(100, tn - (bloomDimAt || tn));
      bloomDimAt = tn; bloomDim += (want - bloomDim) * Math.min(1, dtb / Math.max(120, (sd && sd.ms) || 1200) * 2.5); if (Math.abs(want - bloomDim) < 0.01) bloomDim = want; }
    const bo = Math.round((0.2 * pe + 0.6 * sw) * bloomDim * 50) / 50, hk = Math.round((0.78 + 1.2 * (p.punch || 0) + 0.5 * sw) * 50) / 50;
    if (partyEls.word) { const wp = Math.round(Math.min(1, (p.punch || 0) * 1.45 + 0.6 * sw) * 40) / 40; if (wp !== partyEls.wp) { partyEls.wp = wp; partyEls.word.style.opacity = String(wp); } }
    // (NEON PASS 5 — the owner: THE NEON LOGO PULSES TOO, with the city: a clear but gentler punch than the skyline so the word stays
    // readable — its light alone (.nd-logo-glow, opacity only), on the letters that are lit right now)
    if (partyEls.logo) {
      const lk = [...T.els.sign.querySelectorAll('.nd-logo .ndl')].map(l => (l.classList.contains('on') ? 1 : 0)).join('');
      if (lk !== partyEls.lk) { partyEls.lk = lk; partyEls.logo.querySelectorAll('.ndg').forEach((g, i) => g.classList.toggle('off', lk[i] !== '1')); }
      // (7a, the owner: "close" but not obvious enough on her iPhone — one step stronger: 0.78 → 1.02 × the punch, the cap 0.8 → 0.95)
      const lp = Math.round(Math.min(0.95, (p.punch || 0) * 1.02 + 0.45 * sw) * 40) / 40;
      if (lp !== partyEls.lp) { partyEls.lp = lp; partyEls.logo.style.opacity = String(lp); }
    }
    if (bo !== partyEls.bo && partyEls.bloom) { partyEls.bo = bo; partyEls.bloom.style.setProperty('--bo', bo); }
    if (hk !== partyEls.hk) { partyEls.hk = hk; for (const g of partyEls.glows) g.el.style.opacity = g.ring.classList.contains('is-lit') ? String(Math.round(hk * g.k * 250) / 250) : ''; }
  }
  let partyEls = null, bloomDim = 1, bloomDimAt = 0;
  // ---------------------------------------------------------------- THE RACE (NEON PASS 6, City 2.0 — the owner)
  // A bright surge races through the NEON letters in turn — N → E → O → N, through the blacked-out connectors between them (dim
  // there: it runs behind the painted tube) — each letter BLAZING fully on as it passes (its own blaze layer, opacity only), then a
  // quick sweep across SPEAKEASY. At the catch, when a tap re-ignites a letter, and now and then on party nights. Smooth: the head +
  // its tail move by transform along the tube at a steady speed on the frame clock; nothing else changes a frame. Reduced effects /
  // motion: none. &force=race previews it every 6 s.
  let race = null, raceNext = -1, raceBar = -1;
  // (7a section 0 — THE MUSIC'S FIRST TAP: 'first' = the lit sign's quicker, brighter race; 'surge' = BY DAY, gas igniting in the
  // unlit glass — every letter blazes as the head passes and fades straight back to daytime glass; both swell the sign's bloom)
  const RACE = { catch: { v: 0.8, decay: 950, peak: 1, word: 1 }, tap: { v: 0.85, decay: 700, peak: 0.9, word: 0.85 }, party: { v: 0.62, decay: 650, peak: 0.85, word: 0.9 },
    first: { v: 1.2, decay: 560, peak: 1, word: 1, bloom: 0.55 }, surge: { v: 1.1, decay: 430, peak: 1, word: 0.9, bloom: 0.5, day: true, hold: 300 } };
  // (FP3a, the owner: the day's surge holds its peak + bloom ~300 ms longer — at 2 s with no hold it read as a flash)
  function raceLogo(kind) {
    const cfg = RACE[kind] || RACE.party, day = !!cfg.day;
    if (T.destroyed || raceBusy() || T.reduced() || !T.els.sign) return false;
    if (day ? !T.els.sign.classList.contains('is-day') : (!T.els.sign.classList.contains('is-steady') || T.els.sign.classList.contains('is-day'))) return false;
    const wrap = T.els.sign.querySelector('.nd-logo-wrap');
    const blaze = wrap ? [...wrap.querySelectorAll('.nd-race-l')] : [], H = wrap && wrap.querySelector('.nd-race-h');
    if (blaze.length !== 4 || !H) return false;
    const track = logoTrack(), lit = day ? [true, true, true, true] : [...T.els.sign.querySelectorAll('.nd-logo .ndl')].map(l => l.classList.contains('on'));
    const bloom = cfg.bloom ? T.els.sign.querySelector('.nd-bloom') : null;
    if (T.scene && T.scene.poke) T.scene.poke({ kind: 'race', k: 1 });   // (WIN2: the race runs the whole sign — both spiders)
    if (day) T.els.sign.classList.add('nd-surge');           // (the race's layers show through the daytime glass while it runs: title.css)
    const alive = () => (day ? T.els.sign.classList.contains('is-day') : T.els.sign.classList.contains('is-steady'));
    // the schedule: each stretch at the letters' speed (the connectors 2.5× faster), its time span + its global arc offset
    let t = 0, off = 0;
    const segs = track.map(sg => { const v = cfg.v * (sg.letter < 0 ? 2.5 : 1), o = { ...sg, t0: t, dur: sg.total / v, off }; t += o.dur; off += sg.total; return o; });
    const tEnd = t, total = off, inL = [0, 1, 2, 3].map(i => { const g = segs.find(x => x.letter === i); return [g.t0, g.t0 + g.dur]; });
    const at = S => { let g = segs[segs.length - 1]; for (const x of segs) if (S < x.off + x.total) { g = x; break; } const u = Math.max(0, Math.min(g.total, S - g.off)); let j = 1; while (j < g.len.length - 1 && g.len[j] < u) j++; const k = (u - g.len[j - 1]) / Math.max(1e-6, g.len[j] - g.len[j - 1]); return [g.pts[j - 1][0] + (g.pts[j][0] - g.pts[j - 1][0]) * k, g.pts[j - 1][1] + (g.pts[j][1] - g.pts[j - 1][1]) * k, g.letter]; };
    const Sat = e => { for (const x of segs) if (e < x.t0 + x.dur) return x.off + Math.max(0, e - x.t0) / x.dur * x.total; return total; };
    const dots = [...H.querySelectorAll('.ndr-t')].reverse(), hd = H.querySelector('.ndr-hd'), word = [...T.els.sign.querySelectorAll('.nd-word-r i')];
    const hold = cfg.hold || 0, tW = tEnd - 120 + hold, WD = 560, done = Math.max(tEnd + hold + cfg.decay, tW + WD + 500);
    const last = new Map(), put = (el, a) => { const q = Math.round(a * 50) / 50; if (last.get(el) !== q) { last.set(el, q); el.style.opacity = q ? String(q) : ''; } };
    const sm = v => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
    const t0 = performance.now();
    const end = () => { for (const el of [...blaze, ...dots, hd, ...word, ...(bloom ? [bloom] : [])]) el.style.opacity = ''; T.els.sign.classList.remove('nd-surge'); if (race === me) { race = null; surgeRetry(); } };
    const me = race = { kind, seen: t0, end };
    const frame = now => {
      if (T.destroyed || race !== me) return;
      me.seen = performance.now();
      const e = now - t0;
      if (e > done || !alive()) { end(); return; }
      // (the first tap's answer: the sign's bloom swells with the surge — up as it starts, easing off as the head leaves the last N)
      if (bloom) put(bloom, cfg.bloom * sm(e / 260) * (1 - sm((e - tEnd * 0.55 - hold) / (tEnd * 0.45 + cfg.decay))));
      // the head + its tail (on a connector the light runs behind the painted tube: dim)
      const S = Sat(e), fadeIn = sm(e / 90), fadeOut = 1 - sm((e - tEnd + 60) / 220);
      const [hx, hy, hl] = at(S);
      hd.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)})`); put(hd, (hl < 0 ? 0.32 : 1) * fadeIn * fadeOut);
      dots.forEach((d, k) => { const s2 = S - (k + 1) * 5.5; if (s2 < 0) { put(d, 0); return; } const [x, y, l] = at(s2); d.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); put(d, Math.pow(1 - k / dots.length, 1.3) * (l < 0 ? 0.3 : 1) * fadeIn * fadeOut); });
      // each letter blazes as the surge enters it, holds while it runs through, then eases back (a letter that's out stays out)
      blaze.forEach((b, i) => { if (!lit[i]) return; const [a, z0] = inL[i], z = z0 + hold; put(b, cfg.peak * (e < a ? 0 : e < z ? sm((e - a) / 140) : Math.exp(-(e - z) / (cfg.decay * 0.42)))); });
      // SPEAKEASY: a quick sweep, letter by letter
      if (e > tW) { const p = (e - tW) / WD * 1.5 - 0.25; word.forEach((w, j) => { const d = Math.abs((j + 0.5) / word.length - p); put(w, cfg.word * Math.pow(Math.max(0, 1 - d / 0.2), 1.6)); }); }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    return true;
  }
  // (8a — a race whose frames stopped coming — WebKit dropping a pending rAF while the page was in the background — never holds the
  // sign "busy" for good: after a second without a frame it is cleaned up, and the next race / the first tap runs)
  function raceBusy() { if (race && performance.now() - race.seen > 1000) race.end(); return !!race; }
  if (/[?&]force=([^&]*,)?race(,|&|$)/.test(location.search)) { const iv = setInterval(() => { if (T.destroyed) { clearInterval(iv); return; } raceLogo('party'); }, 6000); }

  // ---------------------------------------------------------------- THE MUSIC STARTING (7a section 0 → FP3a, City 2.0 — the owner)
  // No "tap for music" hint: whenever the MUSIC STARTS — the visit's first tap, the music button back ON, a rescue after the
  // background — the NEON sign answers it, from its REAL state on screen (core/neon-ramp.js#firstTapAnswer, tested): the sign NOT
  // lit (the morning goodbye, the day, golden hour's early sputters; the DOM's is-day) → a bright surge races through the glass
  // N → E → O → N, holds its peak a moment and fades back to daylight glass (raceLogo 'surge'); lit (is-steady, not is-day) → a
  // quicker, brighter race through the lit tubes ('first'); in the evening WARM-UP WINDOW (the last few minutes before the catch)
  // → THE CATCH (the sign lights for good, earlyCatch).
  // FP3a (FREV B3 — the surge was lost to a tap-armed 6-s watch + a once-per-visit flag spent before the answer ran): ONE detector
  // on this tick (createStartDetector: the song's clock silent ≥ 1 s, then moving — audio/music.js#musicClock: never with the music
  // off / muted / at zero volume, never when the start failed), ONE entry signSurge(reason) with a 10 s COOLDOWN stamped only when
  // it really ran, and an answer that can't run yet (the intro, a race / the catch running, the race's SVGs not in yet) is PENDING:
  // it fires from finish() and from the running race's end, within SURGE_PEND. Reduced motion / effects: one gentle brighten (the
  // catch still catches). &force=first-tap previews it every 5 s (no cooldown).
  const SURGE_COOL = 10000, SURGE_PEND = 8000;
  let surgeLast = null, surgeSkip = null, surgeCount = 0, surgeIv = 0, surgePending = null;
  // (ATM-A: until the visit's first song is answered the detector is FRESH — neon-ramp.js: a dropout while the station's synced
  // player re-places its voices right after a load no longer disarms it; module-level, so a later title visit mid-song isn't a start)
  const surgeStart = createStartDetector({ quietMs: 1000, fresh: !T.visitAnswered });
  /** the sign's answer now (the music started / the preview / the test hook) — returns what it did */
  function signSurge(why = 'hook') {
    const now = performance.now();
    const did = (() => {
      if (T.destroyed || !T.scene) return 'skip:off';
      if (why === 'music' && now - T.surgeAt < SURGE_COOL) return 'skip:cool';
      if (!T.els.sign) return 'skip:off';
      // the sign's real state now (the plan's — the DOM catches up first if a timer ran late, e.g. just back from the background)
      const st = T.tl && T.tl.done && T.scene ? neonNow() : null;
      if (st && st.stage !== neonStage) applyNeon(st);
      const cl = T.els.sign.classList;
      const ans = firstTapAnswer(st, neonFromPlan ? neonPlanV : null, T.scene ? T.scene.now() : 0, { intro: !T.tl || !T.tl.done,
        busy: raceBusy() || cl.contains('is-catch') || cl.contains('nd-glow-in'), reduced: T.reduced(), lit: cl.contains('is-steady') && !cl.contains('is-day') });
      if (ans.startsWith('skip')) return ans;
      if (ans === 'catch') { earlyCatch = neonPlanV.catchAt; neonTick(); return 'catch'; }   // (applyNeon: prev 'ramp' → caught = THE CATCH, its sound + race)
      if (ans === 'soft') {
        // one gentle brighten: the sign's bloom fades up and back (opacity only, no motion)
        const s = T.els.sign;
        s.classList.remove('nd-glow-out'); s.classList.add('nd-glow-in');
        setTimeout(() => { s.classList.remove('nd-glow-in'); s.classList.add('nd-glow-out'); }, 450);
        setTimeout(() => s.classList.remove('nd-glow-out'), 1700);
        return 'soft';
      }
      return raceLogo(ans) ? ans : 'skip:race';
    })();
    // (can't run yet → pending: the intro's end or the running race's end fires it — never lost, never spent)
    // (ATM-A: a COOLDOWN skip — the detector catching the same song the tap's fallback already answered — never overwrites the last
    // real answer: it is kept apart for the readout)
    if (did === 'skip:cool') { surgeSkip = { why, did, at: Math.round(now) }; return did; }
    if (why !== 'force' && (did === 'skip:intro' || did === 'skip:busy' || did === 'skip:race')) surgePending = { why, at: now };
    else if (!did.startsWith('skip')) { surgePending = null; surgeCount++; if (why !== 'force') { T.surgeAt = now; if (why === 'music') { T.visitAnswered = true; surgeStart.spend(); } } }
    surgeLast = { why, did, at: Math.round(now), ...(surgePending && surgePending.at === now ? { pending: true } : {}) };
    return did;
  }
  /** a pending answer, once the sign is free (finish(), a race's end) — one rAF later so is-day / is-steady have applied */
  function surgeRetry() {
    if (!surgePending || T.destroyed) return;
    requestAnimationFrame(() => {
      if (!surgePending || T.destroyed) return;
      if (performance.now() - surgePending.at > SURGE_PEND) { surgePending = null; return; }
      if (race || !T.tl || !T.tl.done) return;                       // (still busy: the next end tries again)
      const p = surgePending; surgePending = null;
      signSurge(p.why);
    });
  }
  // 9a — THE SURGE ON THE BEAT (the owner's add-on): when the music comes on (the first tap or the music button), the race starts ON
  // the song's NEXT BEAT — the next DOWNBEAT when that's within ONBEAT.down — from the trusted grid as heard (audio/beat.js#beatSource,
  // the same clock the city's lights follow). No trusted grid → at once; a tap that should start the music whose clock hasn't moved
  // within ONBEAT.wait → at once too (the clock's later start then meets the 10-s cooldown). Never more than one waiting.
  const ONBEAT = { down: 0.6, wait: 800, early: 0.02 };
  let beatT = 0, armedAt = 0, onBeat = null;
  /** where the song is on its trusted grid as heard (beats, 0 mod 4 = a downbeat) + its beats a second; null without one */
  function gridNow() {
    const sg = beatSource(); const md = beatMode(sg);
    if (!sg || (md !== 'grid' && md !== 'direct-grid')) return null;
    const g = sg.grid, bps = g.bpm / 60;
    return { tb: (sg.pos - (g.t0 || 0)) * bps - (g.down || 0), bps };
  }
  /** ms to the next beat (or downbeat) of the song as heard; null without a trusted grid */
  function nextBeatMs() {
    const gn = gridNow(); if (!gn) return null;
    const { tb, bps } = gn;
    const toBeat = (Math.ceil(tb + ONBEAT.early) - tb) / bps, toDown = (4 * Math.ceil((tb + ONBEAT.early) / 4) - tb) / bps;
    return Math.round((toDown <= ONBEAT.down ? toDown : toBeat) * 1000);
  }
  function surgeOnBeat(why) {
    armedAt = 0;
    if (beatT) return;
    const ms = nextBeatMs();
    if (ms == null) { signSurge(why); return; }
    onBeat = { why, wait: ms, at: Math.round(performance.now()) };
    beatT = setTimeout(() => {
      beatT = 0; if (T.destroyed) return;
      const gn = gridNow(), err = gn ? gn.tb - Math.round(gn.tb) : null;     // (how far off the beat it really fired, in beats)
      const did = signSurge(why);
      if (surgeLast) surgeLast.onBeat = { wait: onBeat.wait, err: err == null ? null : +err.toFixed(3), down: gn ? ((Math.round(gn.tb) % 4) + 4) % 4 === 0 : null, did };
      onBeat = null;
    }, ms);
  }
  // (a tap that should start the music — the music on, not muted, its clock still — arms the fallback; read after the tap's own
  // handlers have run: the music button's toggle first)
  const armTap = () => setTimeout(() => { if (!T.destroyed && !settings.musicOff && !settings.muted && settings.music > 0 && T.songClock() < 0) armedAt = performance.now(); }, 0);
  document.addEventListener('pointerup', armTap, true);
  {
    // the detector + &force=first-tap — from the URL or THE PREVIEW PANEL (live: the scene's force set): 2.4 s after the intro
    // (shots.mjs's burst starts ~2.6 s after it: --every 120 --count 12 catches it), then every 5 s while it's on
    let surgeOn = false, surgeNext = 0;
    const watch = () => {
      if (T.destroyed) return;
      const now = performance.now();
      if (surgeStart.feed(T.songClock(), now)) surgeOnBeat('music');
      else if (armedAt && now - armedAt > ONBEAT.wait) { armedAt = 0; if (!beatT && T.songClock() < 0) signSurge('music'); }
      const on = !!(T.scene && T.scene.forced && T.scene.forced('first-tap')) && !!(T.tl && T.tl.done);
      if (on && !surgeOn) surgeNext = now + 2400;
      surgeOn = on;
      if (on && now >= surgeNext) { signSurge('force'); surgeNext = now + 5000; }
      surgeIv = setTimeout(watch, 100);
    };
    surgeIv = setTimeout(watch, 100);
  }
  function neonTick() {
    clearTimeout(neonT);
    if (T.destroyed || !T.scene || !T.tl || !T.tl.done) return;
    const st = neonNow();
    applyNeon(st);
    const now = T.scene.now();
    const next = neonFromPlan ? neonNext(neonPlanV, now) : now + 60000;
    const sp = T.scene.speed ? T.scene.speed() : 1;
    neonT = setTimeout(neonTick, Math.max(25, Math.min(2000, (next - now) / sp + 8)));
  }
  return {
    get applyNeon() { return applyNeon; },
    get armTap() { return armTap; },
    get beatT() { return beatT; },
    get humSync() { return humSync; },
    get neonNow() { return neonNow; },
    get neonOnSound() { return neonOnSound; },
    get neonPlanV() { return neonPlanV; },
    get neonSounds() { return neonSounds; },
    get neonStage() { return neonStage; },
    get neonT() { return neonT; },
    get neonTick() { return neonTick; },
    get neonWarmSounds() { return neonWarmSounds; },
    get onBeat() { return onBeat; },
    get partyFrame() { return partyFrame; },
    get race() { return race; },
    get raceLogo() { return raceLogo; },
    get signSurge() { return signSurge; },
    get SURGE_COOL() { return SURGE_COOL; },
    get surgeCount() { return surgeCount; },
    get surgeIv() { return surgeIv; },
    get surgeLast() { return surgeLast; },
    get surgePending() { return surgePending; },
    get surgeRetry() { return surgeRetry; },
    get surgeSkip() { return surgeSkip; },
  };
}
