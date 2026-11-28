// FREEFALL's TEST PAGE — THE BOT MATCH (FIX C, Group 3; docs/freefall.md "THE TEST PAGE"): `?mode=match&rivals=N` (+ `&spectate=1`) — a
// match against the sims' bots run by the SAME hands the cartridge's match view drives the stage with (view.js: count · adopt · setGhosts ·
// feedGhost · watch · the watch line · the OUT card): the real 3 · 2 · 1 + the names, the bots from GO, after your out → THE LEADER (a tap =
// the next), and when everyone is down → THE RESULTS + REMATCH. `&spectate=1` = no ball of your own: the count, then you follow the leader
// as a real spectator does (the stage's own watch — the ghosts, the tags, THE DEPTH RAIL, the outs, the darkness, the blaze, the
// breakthroughs of the run you watch). NOTHING COUNTS: no server, no database (the page's door is shut). Never in the cartridge (play.js
// loads it alone, lazily). The old bot room (the drag starts the run) is `&room=1` — the look + speed rigs.
import { h } from '../../ui/dom.js';
/** the most bots a page match takes = MATCH_MAX − 1 (match.js — not imported: its graph reaches the console's playlist; tests/freefall-fixc.test.mjs pins it) */
export const RIVALS_MAX = 7;
import { createSim } from './matchsim.js';
import { END_WORDS, standings } from './logic.js';
import { follow, nextFollow } from './ghosts.js';
import { TICK_MS } from './tuning.js';

/** the count's length before GO (ms) — the cartridge's own: 3 · 2 · 1 shows from 3 s out */
export const COUNT_MS = 3600;
/** the view's own numbers (view.js — not imported: the page's graph never reaches the console): an OUT's card · a finish's · watch after */
const OUT_SHOW_MS = 2300, MADE_SHOW_MS = 3600, WATCH_AFTER_MS = OUT_SHOW_MS + 500;
/** the results come this long after the last player is down (the last moment is seen) */
const RESULTS_AFTER_MS = 1600;
const ordinal = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10] || 'TH'}`;

/** startBotMatch(app, createStage, stageOpts, { rivals, spectate, seed }) → { state(), stop() } */
export function startBotMatch(app, createStage, base, { rivals = 3, spectate = false, seed: fixed = '' } = {}) {
  const N = Math.max(1, Math.min(RIVALS_MAX, Math.floor(Number(rivals)) || 1));
  let outShown = false, S = null, sim = null, seed = '', t0 = 0, playAt = 0, adopted = false, myRes = null, outAt = 0, followUid = '', followPick = '', watchKey = '', results = null, card = null, timer = 0, downAt = 0, gone = false, round = 0;
  const me = { uid: 'me', name: (base.name && base.name()) || 'YOU' };
  function begin() {
    round++;
    if (S) { try { S.destroy(); } catch { /* fine */ } }
    if (card) { card.remove(); card = null; }
    seed = fixed || base.newSeed();
    sim = createSim(seed, N); nameList = null;
    adopted = false; myRes = null; outAt = 0; outShown = false; followUid = ''; followPick = ''; watchKey = ''; results = null; downAt = 0;
    S = createStage(app, { ...base.opts, seed, mode: 'match', match: true, rivals: 0, onEnd, onWatchTap });
    S.setMatch(true);   // (the cartridge's own first call: the match's look — no opening title, no DRAG TO SPIN)
    playAt = 0;   // (the count starts once the stage has drawn its warm frame — a cold load never eats the 3 · 2 · 1)
    clearInterval(timer); timer = setInterval(pump, 100); pump();
  }
  // the names under the count: you first, then the bots (the cartridge's order)
  // (ONE list a round — the HUD redraws the names only when the list changes; a phone with no profile name is just YOU, never "YOU · YOU")
  let nameList = null;
  const names = () => nameList || (nameList = [...(spectate ? [] : [me.name === 'YOU' ? { name: 'YOU', hex: '#ff4fa8', me: false } : { name: String(me.name).toUpperCase(), hex: '#ff4fa8', me: true }]), ...sim.players.map(p => ({ name: p.name, hex: p.hex, me: false }))]);
  function onEnd(res) { if (!myRes) { myRes = res; outAt = performance.now(); } return { own: false, watch: true }; }
  function onWatchTap() { const rows = S.ghostRows(); const next = nextFollow(rows, followUid); if (next) { followPick = next; followUid = next; S.watch(next); } }
  function pump() {
    if (gone || !S) return;
    if (!playAt) { const H = window[base.opts.hook], st = H && H.state ? H.state() : null; if (!st || !(st.warmed || (st.info && st.info.frames > 30))) return; playAt = performance.now() + COUNT_MS; }
    const now = performance.now(), left = playAt - now;
    // THE COUNT (view.js#drawCount): 3 · 2 · 1 · GO, the names under it
    const txt = left < -700 ? '' : left <= 0 ? 'GO' : left > 3000 ? '' : String(Math.ceil(left / 1000));
    S.count(txt, txt ? names() : null);
    if (!adopted && left <= 0) {
      adopted = true; t0 = playAt;
      S.adopt({ seed, t0, spectate });
      S.setGhosts(sim.players);
    }
    if (!adopted) return;
    // the bots' proof nodes as they stand at the world's tick → their ghosts (feedGhost: each chunk once)
    const tick = Math.floor((now - t0) / TICK_MS), nodes = sim.reveal(tick);
    for (const p of sim.players) S.feedGhost(p.uid, nodes[p.uid]);
    const rows = S.ghostRows(), others = rows.filter(r => !r.me), live = others.filter(r => !r.over);
    // OUT (view.js#afterOut): the cause's words, then WATCH THE LEADER — a spectator follows from GO
    if (myRes && !outShown) {
      outShown = true;
      const made = myRes.made;
      S.outCard({ kicker: made ? 'THE BOTTOM' : myRes.cause === 'cap' ? 'THE BELL' : 'OUT', words: made ? END_WORDS.made : END_WORDS[myRes.cause] || 'THE END', floors: myRes.floor, made, ms: made ? MADE_SHOW_MS : OUT_SHOW_MS });
    }
    const watching = spectate || (myRes && now - outAt >= (myRes.made ? MADE_SHOW_MS : WATCH_AFTER_MS));
    if (watching && others.length) {
      const f = follow(others, followPick || followUid);
      if (f && f !== followUid) { followUid = f; followPick = ''; S.watch(f); }
      const F = others.find(x => x.uid === followUid), fl = F && S.watching() === F.uid && S.watchFloor() >= 0 ? S.watchFloor() : F ? F.floor : 0;
      let line = F ? (live.length ? `WATCHING ${F.name} · ${fl}` : `${F.name} · FLOOR ${fl}`) : '';
      if (live.length > 1 || (F && F.over)) line += '\nTAP FOR THE NEXT';
      if (line !== watchKey) { watchKey = line; S.watchLine(line); }
    }
    // everyone down → THE RESULTS
    const allDown = !live.length && (spectate || !!myRes);
    if (allDown && !downAt) downAt = now;
    if (downAt && !results && now - downAt >= RESULTS_AFTER_MS) showResults();
  }
  function showResults() {
    const rows = [...sim.players.map(p => { const r = sim.results[p.uid]; return { uid: p.uid, name: p.name, hex: p.hex, floor: r.floor, tick: r.tick, blazes: r.blazes, made: r.made }; }),
      ...(spectate || !myRes ? [] : [{ uid: me.uid, name: 'YOU', hex: '#ff4fa8', floor: myRes.floor, tick: myRes.tick, blazes: myRes.blazes, made: myRes.made, me: true }])];
    const ranked = standings(rows.map(r => ({ uid: r.uid, floor: r.floor, tick: r.tick, blazes: r.blazes })));
    const by = Object.fromEntries(rows.map(r => [r.uid, r]));
    results = ranked.map(x => ({ ...by[x.uid], rank: x.rank }));
    S.watchLine(''); watchKey = '';
    const mine = results.find(r => r.me);
    const head = spectate ? 'YOU WATCHED' : mine ? (mine.rank === 1 ? 'YOU WON' : `YOU CAME ${ordinal(mine.rank)}`) : 'THE MATCH';
    const again = h('button.ff-again.ff-bm-again', { type: 'button', onclick: () => { if (!gone) begin(); } }, h('span.ff-again-t', 'REMATCH'));
    card = h('div.ff-bm', { role: 'dialog', 'aria-label': 'The match' },
      h('div.ff-bm-k', 'THE MATCH · NOTHING COUNTS'),
      h('div.ff-bm-h', head),
      h('ol.ff-bm-list', ...results.map(r => h(`li${r.me ? '.is-me' : ''}${r.rank === 1 ? '.is-first' : ''}`, { style: { '--c': r.hex } },
        h('span.ff-bm-n', ordinal(r.rank)), h('span.ff-bm-name', r.name), h('b.ff-bm-v', `${r.floor}`), h('small.ff-bm-w', r.made ? 'THE BOTTOM' : 'FLOORS')))),
      h('div.ff-bm-foot', again, h('a.ff-link.ff-city.ff-bm-home', { href: '/' }, h('span', 'HOME'))));
    const st = app.querySelector('.ff-stage');
    if (st) { st.classList.add('is-final'); st.append(card); }   // (the podium's own class: the HUD's words + the match's lines put away under it)
  }
  begin();
  const api = {
    state: () => ({ round, seed, n: N, spectate, adopted, results, follow: followUid, watching: S ? S.watching() : '', line: watchKey, my: myRes ? { floor: myRes.floor, cause: myRes.cause } : null, rows: S ? S.ghostRows().map(r => ({ uid: r.uid, name: r.name, floor: r.floor, over: r.over, me: !!r.me })) : [], stage: S ? S.matchState() : null }),
    stage: () => S,
    stop() { gone = true; clearInterval(timer); if (S) S.destroy(); },
  };
  return api;
}
