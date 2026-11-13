// THE PODIUM's FRAME (SHELL 2.0 A — review-6.md D8, agreed with the Overclock chat): the CONSOLE owns the end-of-match screen's frame — the
// kicker + the WINNER line, the XP box (profile/callouts.js) with the end-of-round moment's order after it ("already yours" / the next unlock,
// THE CARD REVEAL), and ONE button: BACK TO THE ROOM, THE NEON TUBE's main (docs/harbor/refs/shell/podium-back.png). HOLD'EM IN THE CITY —
// B3 (HE9's Fable review: with 8 slim cards it was cut at 390 × 844, below the fold on the SE / sideways): THE ACTION ROW IS STICKY at the
// screen's foot — ALWAYS ON SCREEN, every game — the frame's last piece (under the XP box when nothing follows it), over a solid backing
// (--fin-bg: a game whose podium isn't the console's dark panel sets its own), with a soft fade + a small MORE BELOW cue while the cards run
// past the fold (measured on a scroll + a resize only; the cue goes once scrolled). No other rematch / lobby buttons here: the rematch vote +
// NEW GAME live in the room's dock.
// A game draws its own BODY inside the frame by exporting finalScene(el, game, state) from its module (OVERCLOCK's "OVERCLOCKED", the
// tube-sign name, the 2-1-3 podium, award chips, SOLO's NEW PERSONAL BEST); without it, the console's default podium rise (3rd, 2nd, 1st).
// The full leaderboard follows the XP box; the button stays at the foot.
import { levelOf } from '../core/levels.js';
import { fitName } from './fit.js';
import { h, vibrate, reducedMotion } from './dom.js';
import { avatar, countUp, leaderboard, burst } from './components.js';
import { colorHex } from '../config.js';
import { isHost, state, setState } from '../store.js';
import { backToLobby } from '../host.js';
import { toast } from './toast.js';
import { pgSfx } from '../audio/progress-sfx.js';
import { rankBadge } from './emblems.js';
import { pubOf } from '../profile/public.js';
import { metaOf } from '../games/registry.js';
import { lazyImport } from './lazy-import.js';
import { isAllTied } from '../core/night.js';

const GHOST = { name: 'GHOST', color: 'cyan', avatar: 'ghost' };

/**
 * rows: [{ uid, rank, score, note? }] sorted best-first.
 * winnerLine(name): subtitle for a single winner.
 * scoreLabel: small caption under podium scores (e.g. 'HP').
 */
export function createFinal({ rows, players, me, presence, winnerLine, scoreLabel = '', kicker = 'MATCH COMPLETE', extra = null }) {
  const cancelers = [];
  // the global boards: personal bests, world ranks, XP, rank-ups (js/profile/callouts.js) — loaded on demand, never in the way
  const rcSlot = h('div.rc-slot');
  let rc = null, gone = false;
  const g = state.game;
  if (state.code && g && g.matchId && g.participants && g.participants[me]) {
    lazyImport(import('../profile/callouts.js'), '../profile/callouts.js').then(m => { if (gone) return; rc = m.attachCallouts(state.code, g); rcSlot.append(rc.el); }).catch(() => {});
  }
  // THE BODY: the game's own scene (finalScene) — or the console's podium
  const mod = g && metaOf(g.id);   // (the cartridge — loaded: its match just ended here)
  let body = null;
  if (mod && typeof mod.finalScene === 'function') {
    body = h('div.final-body', { dataset: { game: g.id } });
    try { mod.finalScene(body, g, state); } catch (e) { console.warn('[final] finalScene', e); body = null; }
  }
  const podium = h('div.podium');
  const places = [rows[1], rows[0], rows[2]];
  const delays = { 1: 2400, 2: 1300, 3: 500 };
  places.forEach((r, i) => {
    if (!r) { podium.append(h('div.pod.pod-empty')); return; }
    const p = players[r.uid] || GHOST;
    const place = i === 1 ? 1 : i === 0 ? 2 : 3;
    const scoreEl = h('div.pod-score', '0');
    // (THE VAULT 1B — the winner's FULL CARD on a tap, when they wear an approved one)
    const pub = place === 1 ? pubOf(p) : null, cd = pub && pub.cd;
    // (FRIENDS A — tap ANY other player on the podium → their card with ADD FRIEND under it; your own winner's card as before)
    const other = r.uid !== state.uid && p.pid;
    const openCard = other ? () => lazyImport(import('../profile/friends-ui.js'), '../profile/friends-ui.js').then(F => F.openTheirCard({ pid: p.pid, name: p.name, color: p.color, avatar: p.avatar, pub: pubOf(p) })).catch(() => {})
      : cd ? () => lazyImport(import('../vault/full.js'), '../vault/full.js').then(F => F.openFullCard(cd, { name: p.name, lv: pub.x != null ? levelOf(pub.x) : 1, avatar: p.avatar, color: p.color, at: pub.at, pub })).catch(() => {}) : null;
    podium.append(h(`div.pod.pod-${place}`, { style: { '--c': colorHex(p.color), '--d': `${delays[place]}ms` } },
      h('div.pod-who', openCard ? { role: 'button', tabindex: '0', 'aria-label': `${p.name}'s card`, onclick: openCard, onkeydown: e => { if (e.key === 'Enter') openCard(); } } : {}, avatar(p.avatar, p.color, place === 1 ? 64 : 46), fitName(h('div.pod-name', p.name, rankBadge(pubOf(p), { tag: false })), { min: 10 }),
        h('div.pod-score-wrap', scoreEl, scoreLabel ? h('small', scoreLabel) : null)),
      h('div.pod-block', h('span', String(r.rank)))));
    // (PFIX-B — PRISM's optional 15: a score given as text — SURVIVAL's "2:31" — shows as it is, where the raw seconds used to count up)
    if (r.scoreText != null) setTimeout(() => { scoreEl.textContent = r.scoreText; }, delays[place] + 200);
    else setTimeout(() => cancelers.push(countUp(scoreEl, 0, r.score, 1000)), delays[place] + 200);
  });
  const winner = rows[0] && (players[rows[0].uid] || GHOST);
  const tied = rows.filter(r => r.rank === 1).length > 1;
  // (HOLD'EM IN THE CITY — B4: EVERYONE TIED = ALL TIED — nobody 1st: no winner sting, no burst; the night gives a draw — core/night.js#isAllTied)
  const allTied = isAllTied(rows);
  // (SHELL 2.0 B1 — THE SOLO LANE: a room of one — no winner, no placing: SOLO RUN + the score; a game's own finalScene shows its solo body)
  const solo = !!(g && Object.keys(g.participants || {}).length === 1);
  const word = solo ? 'SOLO RUN' : allTied ? 'ALL TIED' : tied ? 'DEADLOCK' : 'WINNER';
  // ONE button for everyone: the host's tap brings the whole room back (THE WALK BACK OUT); a guest's walks them back alone (the others
  // stay on the podium — the same as ☰ → QUIT TO THE ROOM)
  const back = h('button.btn.btn-primary.btn-block.final-back', { type: 'button', onclick: () => {
    if (back.classList.contains('is-busy')) return;
    if (isHost()) { back.classList.add('is-busy'); Promise.resolve(backToLobby()).catch(err => { back.classList.remove('is-busy'); toast('Couldn’t go back', 'err', { sub: String((err && err.message) || err) }); }); return; }
    if (state.game && state.game.matchId) setState({ quit: state.game.matchId });
  } }, h('span', 'BACK TO THE ROOM'));
  // (B3: the cue above the sticky button — a drawn chevron + MORE BELOW, shown only while the frame scrolls on and you haven't scrolled yet)
  const more = h('div.final-more', { 'aria-hidden': 'true' }, h('i.final-chev'), h('span', 'MORE BELOW'));
  // (PLAY NOW — a SOLO room's foot: PLAY AGAIN (the same game + options, THE SOLO START) + BACK TO THE CITY (the solo room closed like a QUIT);
  //  no REMATCH VOTE, no banner plane, no night standings for one. Read through host.js's hub — this lazy chunk imports no new export)
  const PN = globalThis.__nsPlayNow;
  const soloRoom = !!(PN && PN.isSolo && PN.isSolo());
  let foot = back;
  if (soloRoom) {
    const busy = b => b.classList.contains('is-busy');
    const again = h('button.btn.btn-primary.btn-block.final-again', { type: 'button', onclick: () => {
      if (busy(again) || busy(leave)) return;
      again.classList.add('is-busy');
      Promise.resolve(PN.again()).then(ok => { if (!ok) again.classList.remove('is-busy'); }, () => again.classList.remove('is-busy'));
    } }, h('span', 'PLAY AGAIN'));
    const leave = h('button.btn.btn-ghost.btn-block.final-city', { type: 'button', onclick: () => {
      if (busy(again) || busy(leave)) return;
      leave.classList.add('is-busy');
      Promise.resolve(PN.leave()).catch(() => leave.classList.remove('is-busy'));
    } }, h('span', 'BACK TO THE CITY'));
    foot = h('div.final-solo', again, leave);
  }
  const actions = h('div.final-actions', more, foot);
  let hostShown = null;
  function refresh() { hostShown = isHost(); back.dataset.host = hostShown ? '1' : '0'; }
  refresh();
  // (FRIENDS B — B4: a body that already shows the top three (OVERCLOCK's 2-1-3 podium, the console's own) → the results list starts at 4th;
  //  a solo run / a room of ≤ 3 has no list then; a body that shows NO podium says so — el.dataset.podium = 'none' (OVERCLOCK's NOBODY
  //  SCORED) → the whole list)
  //  (HE4: a body that shows EVERY place itself — HOLD'EM's places / ledger as slim cards — says el.dataset.podium = 'all' → no list here)
  const top3 = !body || body.dataset.podium !== 'none';
  const listRows0 = body && body.dataset.podium === 'all' ? [] : top3 ? rows.slice(3) : rows;
  const listRows = allTied ? listRows0.map(r => ({ ...r, rank: '=' })) : listRows0;   // (B4: everyone level — '=' for all, nobody 01)
  const el = h('div.panel-full.final', solo ? { class: 'is-solo' } : allTied ? { class: 'is-alltied' } : null,
    h('div.sheet-kicker', kicker),
    h('div.winner', h('div.winner-title', { 'data-text': word, class: tied ? 'is-tied' : null }, word),
      h('div.winner-name', solo ? `${winner ? winner.name : ''}${rows[0] && rows[0].score != null ? ` · ${rows[0].scoreText || rows[0].score}` : ''}`.toUpperCase() : allTied ? 'NOBODY TAKES FIRST' : tied ? 'SHARED VICTORY' : winnerLine(winner ? winner.name : ''))),
    body || podium,
    rcSlot,
    extra,
    listRows.length ? leaderboard(listRows, players, { me, presence, stagger: 60 }) : null,
    actions);
  // (B3: is there more below the fold? — on a scroll + whenever the frame or a piece of it changes size: the XP box lands late, the rows
  //  stagger in; never in a frame loop)
  const measure = () => {
    if (gone) return;
    el.classList.toggle('has-more', el.scrollHeight - el.clientHeight - el.scrollTop > 6);
    if (el.scrollTop > 12) el.classList.add('is-scrolled');
  };
  el.addEventListener('scroll', measure, { passive: true });
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
  if (ro) { ro.observe(el); for (const c of el.children) ro.observe(c); }
  const mt = setTimeout(measure, 900);
  // (FRIENDS B — THE END SCREEN TAKES THE GAME'S COLOUR: the cartridge's ACCENT tints the frame's main tube; missing = the pink)
  if (mod && typeof mod.ACCENT === 'string' && /^#[0-9a-f]{6}$/i.test(mod.ACCENT)) { el.classList.add('has-accent'); el.style.setProperty('--fin', mod.ACCENT); }
  // (FRIENDS B — B2: THE VICTORY MUSIC waits for the BODY: app.js#musicFor plays the podium music once this frame is on screen — never during
  //  the last round's answer screen. Local state, keyed by the match — a refresh on the podium remounts the frame and sets it again)
  if (g && g.matchId && state.podium !== g.matchId) queueMicrotask(() => { if (!gone && state.podium !== g.matchId) setState({ podium: g.matchId }); });
  const t = setTimeout(() => {
    el.classList.add('crowned');
    // (FRIENDS B — the winner sting = THE PODIUM SOUNDS' xylophone flourish (was the synth arpeggio); a cartridge with OWN_VICTORY_SOUND
    //  plays its own — OVERCLOCK's fanfare — so the console stays quiet: never two winner sounds — B2)
    if (allTied) return;   // (B4: a draw — no winner sting, no buzz, no confetti)
    if (!(mod && mod.OWN_VICTORY_SOUND)) pgSfx('victory');
    if (rows[0] && rows[0].uid === me) vibrate([40, 60, 40, 60, 120]);
    const c = rows[0] && players[rows[0].uid];
    burst(el, [c ? colorHex(c.color) : '#3dff8b', '#f3ff3a', '#ff2bd6', '#00f0ff'], 48);
  }, reducedMotion() ? 0 : 2500);
  return { el, refresh, destroy() { gone = true; clearTimeout(t); clearTimeout(mt); if (ro) ro.disconnect(); cancelers.forEach(c => c()); if (rc) rc.destroy(); } };
}
