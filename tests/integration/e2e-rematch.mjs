// CITY G — REMATCH IN PLACE (the owner, Nov 17 — docs/cartridge.md "REMATCH IN PLACE"): a REMATCH from END-SCREEN STANDARD A's bar (ui/final.js →
// host.js#rematch({ inPlace })) never bounces out to the city: the end screen gives way STRAIGHT to the same game's next match on every phone —
// no city, no room screen, no walk-inside. For EVERY game on the shared end screen (PRISM DROP · OVERCLOCK · HOLD'EM · JAYWALK), with 2 and 4 phones:
//   the real room + the real start → the host's own game node set to its final (the e2e-profiles precedent) → the end screen + its REMATCH bar on
//   every phone → a guest's tap = their VOTE (written while the podium is up: WAITING FOR THE HOST) → every guest voted, still no start (the
//   host's tap starts it) → the host's tap → every phone's screen route sampled every 100 ms: game:<id>:<old> → game:<id>:<new> with NOTHING
//   between (no title / boot / board), the new match id an 'r' one, its game at its first phase; 0 refused writes on any phone.
// Also A LATE VOTE NEVER GOES IN: a guest's tap AFTER the match moved on writes nothing.
//   node e2e-rematch.mjs "<browser>" [./shots-rematch]        (on the emulators + scripts/serve.mjs --emu; PHONES=2 (or 4) · GAMES=prism,holdem)
import { createHarness } from './kit/harness.mjs';
import { flashWatch } from './kit/flash-watch.mjs';   // (CITY PART 1 — THE PINK FLASH: every frame of the end screen's crown + the REMATCH → next start)

const H = await createHarness({ name: 'rematch', slot: 'rm', sizes: [[390, 844]] });
const { ok, log, sleep, waitFor, evalIn, pages } = H;
const GAMES = (process.env.GAMES || 'prism,overclock,holdem,jaywalk').split(',').filter(Boolean);
const NS = [Number(process.env.PHONES || 2)];
const SHOTS_FIT = process.env.SHOTS !== '0';   // (one room a run: PHONES=2, then PHONES=4)
const route = p => p.evaluate(() => window.__arcade && window.__arcade.route ? window.__arcade.route() : '');
const refusedOn = p => p.evaluate(() => import('/js/firebase.js').then(m => ({ r: m.refusals(), h: m.hostRefusals(), g: m.goneRefusals() })));
// (a counted match opens THE XP MOMENT over the end screen — tapped through to its CONTINUE, as a player does)
async function clearMoment(p) {
  for (let i = 0; i < 16; i++) {
    const st = await p.evaluate(() => { const m = document.querySelector('.pg-moment'); if (!m) return 'none'; if (m.classList.contains('is-end')) { const b = m.querySelector('.pg-btn'); if (b) b.click(); return 'end'; } m.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); return 'beat'; });
    if (st === 'none') return;
    await sleep(700);
  }
}
async function tapBar(p) {
  await clearMoment(p);
  // (the bar's rect STABLE over 400 ms + it is the element under its own centre — a game's end screen settles its beats / scroll first)
  let r = null, last = '';
  for (let i = 0; i < 40; i++) {
    r = await p.evaluate(() => { const b = document.querySelector('.final-rematch'); if (!b) return null; b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect(), x = q.x + q.width / 2, y = q.y + q.height / 2, top = document.elementFromPoint(x, y); return { x, y, mine: !!(top && b.contains(top)) }; });
    const k = r ? `${Math.round(r.x)},${Math.round(r.y)},${r.mine}` : '';
    if (r && r.mine && k === last) break;
    last = k; await sleep(200);
  }
  if (!r || !r.mine) { log('debug-tap', JSON.stringify(await p.evaluate(() => { const b = document.querySelector('.final-rematch'); if (!b) return { route: window.__arcade.route() }; const q = b.getBoundingClientRect(), top = document.elementFromPoint(q.x + q.width / 2, q.y + q.height / 2); return { route: window.__arcade.route(), q: [q.x, q.y, q.width, q.height], top: top && (top.tagName + '.' + top.className), vh: innerHeight }; }))); await p.screenshot({ path: `${H.OUT}rm-debug-tap.png` }); return false; }
  await H.tap(p, r.x, r.y);
  return true;
}

await H.run(async () => {
  for (const n of NS) {
    const host = await H.joinAll(n);
    const P = pages.slice(0, n), guests = P.slice(1);
    for (const id of GAMES) {
      const tag = `${id} · ${n} phones`;
      // the real start (the full walk-inside — a new game from the room) → the match on every phone
      await host.evaluate(gid => import('/js/games/registry.js').then(R => R.loadGame(gid)).then(mod => import('/js/host.js').then(m => m.startGame(gid, (mod && mod.DEFAULT_SETTINGS) || {}))), id);
      for (const p of P) await waitFor(p, (s, g) => s.game && s.game.id === g && window.__arcade.route().startsWith(`game:${g}:`), `${tag}: the match on screen`, 40000, id);
      const m0 = await evalIn(host, s => s.game.matchId);
      // the host's own game node → its final (the shared end screen on every phone)
      // (its start 2 min ago: a game whose end runs beats first — OVERCLOCK's banner → standings → THE WINNER — lands on its last beat; its end
      //  10 min away: a director that walks back at phaseEndsAt (OVERCLOCK's) holds the podium)
      // (HOLD'EM: THE SERVER IS THE DEALER — its match ends the real way, the host's END GAME → the dealer → the podium by its director)
      if (id === 'holdem') { await sleep(2500); await host.evaluate(c => import('/js/games/holdem/index.js').then(m => m.endGame({ code: c })), H.code); }
      // (THE CONSOLE FIX: a PROOF game's match ends the real way — a `final` written over live runs is the attack the phones now play through;
      //  the idle kids / towers end on their own (the blackout · the fuse) and the host's own step writes the podium)
      else if (id === 'jaywalk' || id === 'highrise') { /* the runs end by themselves */ }
      else await host.evaluate(c => import('/js/firebase.js').then(fb => fb.update(fb.dbRef(`rooms/${c}/game`), { phase: 'final', phaseEndsAt: window.__arcade.serverNow() + 600000, phaseStartAt: window.__arcade.serverNow() - 120000 })), H.code);
      for (const p of P) await waitFor(p, () => !!document.querySelector('.final-rematch') && !!document.querySelector('.final-back'), `${tag}: the end screen's REMATCH bar`, 90000);   // (OVERCLOCK's end runs its beats first — THE WINNER at its victory beat)
      // CITY PART 1 — NO PINK FLASH (the owner: "a pink flash when the round ends"): a guest's every presented frame from the end frame standing
      // through the console's crown moment (2.5 s after it stands) to the settled screen — no large accent / pink full-screen frame
      { const cdpF = await guests[0].target().createCDPSession(), fw = await flashWatch(H.browser, cdpF, { diff: true });   /* (colour-free: any game's accent) */ await sleep(3900); const fl = await fw.stop({ settle: 400 });
        ok(fl.frames >= 10 && fl.flash.length === 0, `${tag}: NO PINK FLASH as the end screen crowns (${fl.frames} frames; the pinkest ${fl.worst ? `${(fl.worst.pink * 100).toFixed(0)} %` : '—'}, before ${(fl.before * 100).toFixed(0)} %, settled ${(fl.after * 100).toFixed(0)} %)${fl.flash.length ? ` — FLASH ${fl.flash.slice(0, 3).map(f => `${(f.pink * 100).toFixed(0)} % at ${f.t} ms`).join(' · ')}` : ''}`); }
      await sleep(600);
      // THE ROOM LINK FITS (the reviewer's item (1)): ROOM · SHARE each inside its half — the words + icon never through the divider, the 16 pt gutter
      //  kept — at 375 / 390 / 430 + 1440
      if (n === 2) {
        await clearMoment(host);
        const fit = [];
        for (const [w, hh] of [[375, 812], [390, 844], [430, 932], [1440, 900]]) {
          await host.setViewport({ width: w, height: hh, deviceScaleFactor: 1, isMobile: w < 1000, hasTouch: w < 1000 }); await sleep(500);
          await host.waitForFunction(() => !!document.querySelector('.final-back'), { timeout: 30000 }).catch(() => {});   // (a mobile ↔ desktop switch RELOADS the page: the end screen is waited for, never a fixed sleep — JAYWALK's scene on the software renderer takes a while)
          const g = await host.evaluate(() => {
            const box = el => { if (!el) return null; const r = [...el.children].map(c => c.getBoundingClientRect()).filter(q => q.width > 0); return r.length ? { l: Math.min(...r.map(q => q.left)), r: Math.max(...r.map(q => q.right)) } : null; };
            const d = document.querySelector('.final-links .final-div'), dv = d ? d.getBoundingClientRect() : null;
            return { W: innerWidth, back: box(document.querySelector('.final-back')), share: box(document.querySelector('.final-share')), div: dv ? dv.left + dv.width / 2 : null, label: (document.querySelector('.final-back span') || {}).textContent };
          });
          const okFit = g.back && g.back.l >= 16 && (g.div == null ? g.back.r <= g.W - 16 : g.back.r <= g.div - 4) && (!g.share || (g.share.l >= g.div + 4 && g.share.r <= g.W - 16));
          fit.push({ w, okFit, g });
          if (SHOTS_FIT) await host.screenshot({ path: `${H.OUT}rm-${id}-foot-${w}x${hh}.png` });
        }
        await host.setViewport(H.VIEW); await sleep(400);
        ok(fit.every(f => f.okFit && f.g.label === 'ROOM'), `${tag}: THE ROOM LINK FITS — ${fit.map(f => `${f.w}: ROOM ${Math.round(f.g.back.l)}–${Math.round(f.g.back.r)}${f.g.div != null ? ` | ${Math.round(f.g.div)} | SHARE ${f.g.share ? `${Math.round(f.g.share.l)}–${Math.round(f.g.share.r)}` : '—'}` : ' (alone)'} of ${f.g.W}`).join(' · ')}`);
      }
      if (n === 2 || id === 'prism') await H.shot(host, `rm-${id}-${n}-podium-390x844`);
      // every guest votes: written while the podium is up; still no start (the host's tap starts it)
      for (const g of guests) ok(await tapBar(g), `${tag}: a guest's REMATCH bar is tappable (the element under its centre)`);
      for (const g of guests) await waitFor(g, (s, m) => s.rv && s.rv[s.uid] === m, `${tag}: a guest's vote written`, 10000, m0);
      const gl = await guests[0].evaluate(() => (document.querySelector('.final-rematch .final-bar-t') || {}).textContent || '');
      await sleep(1500);
      const still = await evalIn(host, s => s.game.matchId);
      ok(gl === 'WAITING FOR THE HOST' && still === m0, `${tag}: every guest voted (the bar reads ${gl}) — still the same match, no auto-start`);
      // the route sampled every 100 ms on every phone, then the host's tap
      for (const p of P) await p.evaluate(() => { window.__rmR = [window.__arcade.route()]; clearInterval(window.__rmT); window.__rmT = setInterval(() => { const r = window.__arcade.route(); if (r !== window.__rmR.at(-1)) window.__rmR.push(r); }, 100); });
      const cdpR = await guests[0].target().createCDPSession(), fwR = await flashWatch(H.browser, cdpR);   // (CITY PART 1: the REMATCH → the next start, every frame)
      const t0 = Date.now();
      ok(await tapBar(host), `${tag}: the host's REMATCH bar is tappable`);
      await sleep(400);
      const toastNow = await host.evaluate(() => [...document.querySelectorAll('.toast, .ui-toast, [class*="toast"]')].map(t => t.textContent.trim()).filter(Boolean).join(' | '));
      if (toastNow) log('host toast', toastNow);
      for (const p of P) await waitFor(p, (s0, m) => { const s = window.__arcade.state; return s.game && s.game.matchId && s.game.matchId !== m && window.__arcade.route() === `game:${s.game.id}:${s.game.matchId}`; }, `${tag}: the next match on screen`, 20000, m0);
      const ms = Date.now() - t0;
      await sleep(700);
      { const fl = await fwR.stop(); ok(fl.frames >= 6 && fl.flash.length === 0, `${tag}: NO PINK FLASH at REMATCH → the next start (${fl.frames} frames; the pinkest ${fl.worst ? `${(fl.worst.pink * 100).toFixed(0)} %` : '—'})`); }
      const m1 = await evalIn(host, s => s.game.matchId), ph = await evalIn(host, s => s.game.phase);
      const R = []; for (const p of P) R.push(await p.evaluate(() => { clearInterval(window.__rmT); return window.__rmR; }));
      const clean = R.every(r => r.length === 2 && r[0] === `game:${id}:${m0}` && r[1] === `game:${id}:${m1}`);
      ok(clean && m1[0] === 'r', `${tag}: REMATCH IN PLACE — the end screen → the next match (${m1}, phase ${ph}) on every phone in ${ms} ms, nothing between: ${R.map(r => r.join(' → ')).join(' | ')}`);
      if (n === 2) await H.shot(guests[0], `rm-${id}-${n}-next-390x844`);
      // A LATE VOTE NEVER GOES IN: the old match's vote (a podium that's gone) → nothing written
      const late = await guests[0].evaluate((c, m) => import('/js/firebase.js').then(fb => fb.get(fb.dbRef(`rooms/${c}/rv`))).then(v => v.val()), H.code, m0);
      ok(!late || !Object.values(late).includes(m0), `${tag}: no old vote left in the room (rv ${JSON.stringify(late)})`);
      // CITY PART 1 — THE LATE REMATCH VOTE, AGAIN (a slow Chromebook, /admin Nov 20 8:58 am): a vote HELD BACK until the next count had begun (the
      // slow phone's write in flight while the room moved on) goes out through the end screen's own writer → the rule refuses it → 0 RULES
      // REFUSED rows, ONE quiet count ('late-vote')
      if (id === GAMES[0]) {
        const q0 = await guests[0].evaluate(() => import('/js/errlog.js').then(m => m.quietCounts()['late-vote'] || 0));
        const r0 = await refusedOn(guests[0]);
        const res = await guests[0].evaluate((c, m) => import('/js/ui/final.js').then(F => F.writeVote(c, window.__arcade.state.uid, m)).then(() => 'written', e => 'refused'), H.code, m0);
        await sleep(1500);
        const q1 = await guests[0].evaluate(() => import('/js/errlog.js').then(m => m.quietCounts()['late-vote'] || 0)), r1 = await refusedOn(guests[0]);
        ok(res === 'refused' && q1 === q0 + 1 && r1.r.length === r0.r.length, `${tag}: A LATE VOTE (held back past the next start) is refused by the rule — 0 RULES REFUSED rows (the alarm list ${r0.r.length} → ${r1.r.length}), 1 quiet count (late-vote ${q0} → ${q1}; ${res})`);
      }
      // back to the room for the next game (the host's BACK TO THE ROOM)
      await host.evaluate(c => import('/js/firebase.js').then(fb => fb.update(fb.dbRef(`rooms/${c}/game`), { phase: 'final', phaseEndsAt: null })), H.code);
      await H.backToLobby(host);
      for (const p of P) await waitFor(p, () => window.__arcade.route() === 'title' && window.__arcade.state.meta && window.__arcade.state.meta.status === 'lobby', `${tag}: back in the room`, 30000);
      await sleep(1500);
    }
    const ref = []; for (const p of P) { const r = await refusedOn(p); r.h = r.h.filter(x => !/^update rooms\/\* \{(jw|hr)\/[^,]*, pt\}$/.test(x) && !/^update rooms\/\* \{rv\/\*\}$/.test(x));   /* (CITY PART 1: + the deliberate late vote above — its quiet line) */ ref.push(r); }   // (THE CONSOLE FIX: two phones stamping a tree in the same instant — the loser's stamp + counter is refused by the rules, EXPECTED + silent; its GO lands in the winner's window)
    if (ref.some(r => r.r.length || r.h.length || r.g)) log('refused', JSON.stringify(ref).slice(0, 1500));   // (which writes — the check's own evidence)
    ok(ref.every(r => !r.r.length && !r.h.length && !r.g), `${n} phones: 0 refused writes on every phone (${ref.map(r => r.r.length + r.h.length + r.g).join(' · ')})`);
  }
});
