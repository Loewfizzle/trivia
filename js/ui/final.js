// THE PODIUM's FRAME (SHELL 2.0 A — review-6.md D8, agreed with the Overclock chat): the CONSOLE owns the end-of-match screen's frame — the
// kicker + the WINNER line, the XP box (profile/callouts.js) with the end-of-round moment's order after it ("already yours" / the next unlock,
// THE CARD REVEAL), and THE FOOT — END-SCREEN STANDARD A since CITY F (the bar in the game's accent + the quiet links; below). HOLD'EM IN THE CITY —
// B3 (HE9's Fable review: with 8 slim cards it was cut at 390 × 844, below the fold on the SE / sideways): THE ACTION ROW IS STICKY at the
// screen's foot — ALWAYS ON SCREEN, every game — the frame's last piece (under the XP box when nothing follows it), over a solid backing
// (--fin-bg: a game whose podium isn't the console's dark panel sets its own), with a soft fade + a small MORE BELOW cue while the cards run
// past the fold (measured on a scroll + a resize only; the cue goes once scrolled). NEW GAME lives in the room's dock; REMATCH is the foot's bar.
// A game draws its own BODY inside the frame by exporting finalScene(el, game, state) from its module (OVERCLOCK's "OVERCLOCKED", the
// tube-sign name, the 2-1-3 podium, award chips, SOLO's NEW PERSONAL BEST); without it, the console's default podium rise (3rd, 2nd, 1st).
// The full leaderboard follows the XP box; the button stays at the foot.
import { levelOf } from '../core/levels.js';
import { fitName } from './fit.js';
import { h, vibrate, reducedMotion } from './dom.js';
import { avatar, countUp, leaderboard, burst } from './components.js';
import { colorHex } from '../config.js';
import { isHost, state, setState, subscribe } from '../store.js';
import { backToLobby } from '../host.js';
import { toast } from './toast.js';
import { pgSfx } from '../audio/progress-sfx.js';
import { rankBadge } from './emblems.js';
import { pubOf } from '../profile/public.js';
import { metaOf } from '../games/registry.js';
import { lazyImport } from './lazy-import.js';
import { isAllTied } from '../core/night.js';
import { dbRef, update as dbUpdate } from '../firebase.js';
import { finInk } from '../core/fin-ink.js';

// (CITY F — END-SCREEN STANDARD A: the foot's icons — drawn lines, currentColor; the bar's replay arrow, the links' share / home / room)
const FIN_ICONS = {
  again: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M20 3.5v4.8h-4.8"/>',
  share: '<path d="M12 15V3.8"/><path d="M7.6 8 12 3.6 16.4 8"/><path d="M5 12.5v6.5h14v-6.5"/>',
  city: '<path d="M3.8 11.2 12 4l8.2 7.2"/><path d="M6.3 9.4V20h11.4V9.4"/><path d="M10 20v-5.2h4V20"/>',
  room: '<path d="M14.5 5.5 8 12l6.5 6.5"/><path d="M8.6 12H20"/>',
};
function finIcon(id) {
  const i = h('i.final-ico', { 'aria-hidden': 'true' });
  i.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${FIN_ICONS[id]}</svg>`;
  return i;
}

const GHOST = { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
const FIN_PINK = '#ff2bd6';   // (the console's pink — THE NEON TUBE's — when a cartridge names no ACCENT)

/**
 * rows: [{ uid, rank, score, note? }] sorted best-first.
 * winnerLine(name): subtitle for a single winner.
 * scoreLabel: small caption under podium scores (e.g. 'HP').
 */
export function createFinal({ rows, players, me, presence, winnerLine, scoreLabel = '', kicker = 'MATCH COMPLETE', extra = null }) {
  const cancelers = [], refreshers = [];
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
  // CITY F — END-SCREEN STANDARD A (the owner's pick, Nov 17 — Downloads\NEON\endscreen-standard-A.jpg): ONE foot for EVERY game's end screen,
  // built HERE (no game keeps its own copy): ONE big SOLID bar in the GAME's ACCENT (the cartridge's ACCENT; the console's pink without one —
  // THE SHELL's one named exception to THE NEON TUBE: the screen's MAIN button in the game's colour) + under it QUIET icon links, no boxes.
  //   SOLO (PLAY NOW's solo room / a room of one): the bar = PLAY AGAIN (the replay icon) · the links = SHARE (when the cartridge shares) ·
  //   CITY (BACK TO THE CITY — a solo room) or BACK TO THE ROOM (a room of one).
  //   A MATCH: the bar = REMATCH — the host's tap = host.js#rematch (the same game + settings, everyone in); a guest's tap = THEIR VOTE
  //   (rv/{uid} = this match — the room's ring counts it after the walk back; again = take it back) → the bar says WAITING FOR THE HOST +
  //   the votes, never dead · the links = BACK TO THE ROOM (the host's brings the room back; a guest walks back alone) · SHARE.
  // Dark text on the accent when it reads ≥ 4.5 : 1, white otherwise (finInk). Every control: data-press (the podium is a game's screen —
  // the implicit press is off there) / SHARE data-gesture (Safari's own share sheet), a 44 pt tap area.
  const PN = globalThis.__nsPlayNow;
  const soloRoom = !!(PN && PN.isSolo && PN.isSolo());
  const oneRoom = !soloRoom && !!PN && solo && isHost() && Object.keys(players || {}).length === 1;
  const busy = b => !!b && b.classList.contains('is-busy');
  const backTap = () => {
    if (busy(back)) return;
    if (isHost()) { back.classList.add('is-busy'); Promise.resolve(backToLobby()).catch(err => { back.classList.remove('is-busy'); toast('Couldn’t go back', 'err', { sub: String((err && err.message) || err) }); }); return; }
    if (state.game && state.game.matchId) setState({ quit: state.game.matchId });
  };
  const back = h('button.final-link.final-back', { type: 'button', 'data-press': true, onclick: backTap }, finIcon('room'), h('span', 'BACK TO THE ROOM'));
  // (PLAY NOW — PLAY AGAIN = the same game + options, THE SOLO START (JAYWALK H3 — THE INSTANT AGAIN: a cartridge with `soloAgain` starts its
  //  next run with NO walk inside — games/kit/again.js, loaded with the podium); BACK TO THE CITY = the solo room closed like a QUIT. Read
  //  through host.js's hub (__nsPlayNow) — this lazy chunk imports no new export)
  const instant = (soloRoom || oneRoom) && mod && typeof mod.soloAgain === 'function' ? lazyImport(import('../games/kit/again.js'), '../games/kit/again.js').catch(() => null) : null;
  let leave = null, bar = null;
  if (soloRoom || oneRoom) {
    bar = h('button.final-bar.final-again', { type: 'button', 'data-press': true, onclick: () => {
      if (busy(bar) || busy(leave)) return;
      bar.classList.add('is-busy');
      Promise.resolve(instant ? instant.then(A => (A ? A.instantAgain() : false)) : false).then(ok => ok || PN.again()).then(ok => { if (!ok) bar.classList.remove('is-busy'); }, () => bar.classList.remove('is-busy'));
    } }, finIcon('again'), h('span.final-bar-t', (mod && typeof mod.AGAIN_LABEL === 'string' && mod.AGAIN_LABEL) || 'PLAY AGAIN'));
    leave = soloRoom ? h('button.final-link.final-city', { type: 'button', 'data-press': true, onclick: () => {
      if (busy(bar) || busy(leave)) return;
      leave.classList.add('is-busy');
      Promise.resolve(PN.leave()).catch(() => leave.classList.remove('is-busy'));
    } }, finIcon('city'), h('span', 'CITY')) : back;
  } else {
    // A MATCH: REMATCH — the host starts it; a guest votes (the votes = the room's rv for THIS match, mirrored in state.rv)
    const sub = h('span.final-bar-s');
    bar = h('button.final-bar.final-rematch', { type: 'button', 'data-press': true, onclick: () => rematchTap() }, finIcon('again'), h('span.final-bar-t', 'REMATCH'), sub);
    let voting = false;
    const votes = () => { const m = g && g.matchId, rv = state.rv || {}, ids = Object.keys(players || {}).filter(u => u !== (state.meta && state.meta.hostId)); return { n: ids.filter(u => rv[u] === m).length, of: ids.length, mine: !!(m && rv[state.uid] === m) || pendingVote === m }; };
    let pendingVote = null;
    const paint = () => {
      if (gone) return;
      const v = votes(), host = isHost(), t = bar.querySelector('.final-bar-t');
      const label = host ? 'REMATCH' : v.mine ? 'WAITING FOR THE HOST' : 'REMATCH';
      const line = v.n > 0 ? `${v.n} OF ${v.of} WANT${v.n === 1 && v.of !== 1 ? 'S' : ''} A REMATCH` : host ? '' : v.mine ? 'YOUR VOTE IS IN' : '';
      if (t.textContent !== label) t.textContent = label;
      if (sub.textContent !== line) sub.textContent = line;
      bar.classList.toggle('is-voted', !host && v.mine);
      bar.setAttribute('aria-label', host ? `Rematch — the same game, everyone in${v.n ? ` (${line.toLowerCase()})` : ''}` : v.mine ? 'You voted for a rematch — waiting for the host. Tap to take it back' : 'Vote for a rematch');
    };
    const rematchTap = () => {
      if (busy(bar) || busy(back)) return;
      if (isHost()) {
        bar.classList.add('is-busy');
        lazyImport(import('../host.js'), '../host.js').then(m => m.rematch()).then(ok => { if (!ok) bar.classList.remove('is-busy'); }, () => bar.classList.remove('is-busy'));
        return;
      }
      const m = g && g.matchId;
      if (voting || !m || !state.code) return;
      voting = true;
      const mine = votes().mine;
      pendingVote = mine ? null : m; paint();
      // (THE RULES-LAG: on rules before CITY F's re-publish a podium vote is refused → it WAITS on this phone (sessionStorage) and goes in
      //  once the room is back with its REMATCH ring — screens/room-city.js reads it)
      dbUpdate(dbRef(`rooms/${state.code}`), { [`rv/${state.uid}`]: mine ? null : m }).then(() => { try { sessionStorage.removeItem('ns:rv-wait'); } catch { /* fine */ } }, () => {
        try { if (mine) sessionStorage.removeItem('ns:rv-wait'); else sessionStorage.setItem('ns:rv-wait', `${state.code}|${m}`); } catch { /* fine */ }
      }).finally(() => { voting = false; paint(); });
    };
    paint();
    refreshers.push(paint);
    cancelers.push(subscribe(paint));   // (the votes + the host move live — every phone's mirrored rv)
  }
  const canShare = !!(mod && typeof mod.shareRun === 'function' && g && g.participants && g.participants[me]);
  // (JAYWALK BEFORE THE FLIP — a game whose card uploads at the tap: a slow first tap reads PREPARING…; 'ready' = the link is made but the
  //  tap's user activation was spent on the upload (iOS) — the link reads SHARE again, lit, and the NEXT tap shares at once)
  const shareT = h('span', 'SHARE');
  const share = canShare ? h('button.final-link.final-share', { type: 'button', 'data-gesture': true, onclick: () => {
    if (busy(share)) return;
    share.classList.add('is-busy'); share.classList.remove('is-ready');
    const slow = setTimeout(() => { shareT.textContent = 'PREPARING…'; }, 250);
    Promise.resolve(mod.shareRun(g, state)).then(how => {
      if (how === 'saved') toast('Your run is saved', 'ok', { sub: 'The image is in your downloads.' });
      else if (how === 'copied') toast('Link copied', 'ok', { sub: 'The image is saved too.' });
      else if (how === 'failed') toast('Couldn’t draw the image', 'warn');
      else if (how === 'ready') share.classList.add('is-ready');
    }, () => toast('Couldn’t draw the image', 'warn')).finally(() => { clearTimeout(slow); shareT.textContent = 'SHARE'; share.classList.remove('is-busy'); });
  } }, finIcon('share'), shareT) : null;
  // (the quiet links: SOLO = SHARE · CITY; a MATCH = BACK TO THE ROOM · SHARE; no share → the way out alone, centred)
  const out = soloRoom || oneRoom ? leave : back;
  const linkList = soloRoom || oneRoom ? [share, out] : [out, share];
  const links = h('div.final-links', ...linkList.filter(Boolean).flatMap((x, i) => (i ? [h('i.final-div', { 'aria-hidden': 'true' }), x] : [x])));
  const foot = h('div.final-foot', bar, links);
  // (B3: the cue above the sticky foot — a drawn chevron + MORE BELOW, shown only while the frame scrolls on and you haven't scrolled yet)
  const more = h('div.final-more', { 'aria-hidden': 'true' }, h('i.final-chev'), h('span', 'MORE BELOW'));
  const actions = h('div.final-actions', more, foot);
  let hostShown = null;
  function refresh() { hostShown = isHost(); back.dataset.host = hostShown ? '1' : '0'; for (const f of refreshers) f(); }
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
  // (CITY F: the bar's text — dark on the accent where it reads ≥ 4.5 : 1, white where the accent is too dark; the console's pink without one)
  el.style.setProperty('--fin-ink', finInk(mod && /^#[0-9a-f]{6}$/i.test(String(mod.ACCENT || '')) ? mod.ACCENT : FIN_PINK));
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
