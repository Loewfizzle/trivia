// THE PODIUM's FRAME (SHELL 2.0 A — review-6.md D8, agreed with the Overclock chat): the CONSOLE owns the end-of-match screen's frame — the
// The long notes: docs/games/jaywalk-notes.md
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
import { dbRef, update as dbUpdate, expectRefusal } from '../firebase.js';
/** CITY PART 1 — THE LATE REMATCH VOTE, AGAIN (/admin Nov 20 8:58 am, a slow Chromebook: RULES REFUSED rooms/*{rv/*}): a vote is written only
 *  while THIS match's end screen is up, but a slow phone's write can land AFTER the room left 'final' (its mirror had not seen the move yet) —
 *  the rule refuses it (correctly). That refusal is EXPECTED: a quiet count ('late-vote' — THE QUIET COUNTS), never a RULES REFUSED row */
export function writeVote(code, uid, value) {
  expectRefusal(`rooms/${code}/rv/${uid}`, 'a late rematch vote (the room had moved on)', 8000, 'late-vote');
  return dbUpdate(dbRef(`rooms/${code}`), { [`rv/${uid}`]: value });
}
import { finInk } from '../core/fin-ink.js';
import { finHeader, finFrame, neonOf, fitHeader } from './fin-neon.js';

// (CITY F — END-SCREEN STANDARD A: the foot's icons — drawn lines, currentColor; the bar's replay arrow, the links' share / home / room)
const FIN_ICONS = {
  again: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M20 3.5v4.8h-4.8"/>',
  share: '<path d="M12 15V3.8"/><path d="M7.6 8 12 3.6 16.4 8"/><path d="M5 12.5v6.5h14v-6.5"/>',
  city: '<path d="M3.8 11.2 12 4l8.2 7.2"/><path d="M6.3 9.4V20h11.4V9.4"/><path d="M10 20v-5.2h4V20"/>',
  // (CITY G — the reviewer's item (1): "← BACK TO THE ROOM" ran through the centre divider at 390 — now ROOM with a DOOR, solo CITY's shape)
  room: '<path d="M6 20V4h12v16"/><path d="M3.5 20h17"/><path d="M14.6 12.4h.01"/>',
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
export function createFinal({ rows, players, me, presence, winnerLine, scoreLabel = '', kicker = 'MATCH COMPLETE', extra = null, game = null, mode = null }) {
  const cancelers = [], refreshers = [];
  // the global boards: personal bests, world ranks, XP, rank-ups (js/profile/callouts.js) — loaded on demand, never in the way
  const rcSlot = h('div.rc-slot'), xpFoot = h('div.final-xp');   // (THE XP LINE AS THE FOOTER — the frame's last line, under SHARE · HOME)
  let rc = null, gone = false;
  // (THE CONSOLE FIX: `game` = the match as the game scored it on this phone — a podium that waited for a live run reads the nodes, never an …
  const g = game || state.game;
  if (state.code && g && g.matchId && g.participants && g.participants[me]) {
    lazyImport(import('../profile/callouts.js'), '../profile/callouts.js').then(m => { if (gone) return; rc = m.attachCallouts(state.code, g); rcSlot.append(rc.el); if (rc.foot) xpFoot.append(rc.foot); }).catch(() => {});
  }
  // THE BODY: the game's own scene (finalScene) — or the console's podium
  const mod = g && metaOf(g.id);   // (the cartridge — loaded: its match just ended here)
  let body = null;
  if (mod && typeof mod.finalScene === 'function') {
    body = h('div.final-body', { dataset: { game: g.id } });
    try { mod.finalScene(body, g, state); } catch (e) { console.warn('[final] finalScene', e); body = null; }
  }
  // (F5B — THE END-SCREEN BOARD, a per-game OPT-IN: a cartridge's END_BOARD = { b, word, avg } → ONE shared block (ui/end-board.js — lazy)
  //  under its body: solo = the board's top 3 (THE WORLD · a FRIENDS tick), a match = its own top 3. No END_BOARD = nothing here — the frame as it was)
  //  THE END-BOARD SWITCH-ON (Nov 27): the cartridge's END_BOARD may say `on(game)` (false = not this match — PRISM DROP's SCORE RUSH only,
  //  OVERCLOCK's QUICK only) + `match: false` (solo only — a body whose own podium IS the match's top 3: OVERCLOCK's 2-1-3)
  const ebSolo = !!(g && Object.keys(g.participants || {}).length === 1);
  const ebCfg = mod && mod.END_BOARD, ebThis = (() => { try { return !!ebCfg && (typeof ebCfg.on !== 'function' || !!ebCfg.on(g)) && (ebSolo || ebCfg.match !== false); } catch { return false; } })();
  const eb = ebThis && g && (!ebSolo || (g.participants || {})[me]) ? h('div.final-eb') : null;
  let ebH = null;
  if (eb) lazyImport(import('./end-board.js'), './end-board.js').then(m => { if (!gone) ebH = m.mountEndBoard(eb, mod.END_BOARD, { rows, players, me, solo: ebSolo, pubOf }); }).catch(() => eb.remove());
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
  // CITY F — END-SCREEN STANDARD A (the owner's pick, Nov 17 — Downloads\NEON\endscreen-standard-A.jpg): ONE foot for EVERY game's end screen, …
  const PN = globalThis.__nsPlayNow;
  const soloRoom = !!(PN && PN.isSolo && PN.isSolo());
  const oneRoom = !soloRoom && !!PN && solo && isHost() && Object.keys(players || {}).length === 1;
  const busy = b => !!b && b.classList.contains('is-busy');
  const backTap = () => {
    if (busy(back)) return;
    if (isHost()) { back.classList.add('is-busy'); Promise.resolve(backToLobby()).catch(err => { back.classList.remove('is-busy'); toast('Couldn’t go back', 'err', { sub: String((err && err.message) || err) }); }); return; }
    if (state.game && state.game.matchId) setState({ quit: state.game.matchId });
  };
  const back = h('button.final-link.final-back', { type: 'button', 'data-press': true, 'data-pad': 'b', 'aria-label': 'Back to the room', onclick: backTap }, finIcon('room'), h('span', 'ROOM'));
  // (PLAY NOW — PLAY AGAIN = the same game + options, THE SOLO START (JAYWALK H3 — THE INSTANT AGAIN: a cartridge with `soloAgain` starts its …
  const instant = (soloRoom || oneRoom) && mod && typeof mod.soloAgain === 'function' ? lazyImport(import('../games/kit/again.js'), '../games/kit/again.js').catch(() => null) : null;
  let leave = null, bar = null;
  if (soloRoom || oneRoom) {
    bar = h('button.final-bar.final-again', { type: 'button', 'data-press': true, 'data-pad': 'a', onclick: () => {
      if (busy(bar) || busy(leave)) return;
      bar.classList.add('is-busy');
      Promise.resolve(instant ? instant.then(A => (A ? A.instantAgain() : false)) : false).then(ok => ok || PN.again()).then(ok => { if (!ok) bar.classList.remove('is-busy'); }, () => bar.classList.remove('is-busy'));
    } }, finIcon('again'), h('span.final-bar-t', (mod && typeof mod.AGAIN_LABEL === 'string' && mod.AGAIN_LABEL) || 'PLAY AGAIN'));
    leave = soloRoom ? h('button.final-link.final-city', { type: 'button', 'data-press': true, 'data-pad': 'b', onclick: () => {
      if (busy(bar) || busy(leave)) return;
      leave.classList.add('is-busy');
      Promise.resolve(PN.leave()).catch(() => leave.classList.remove('is-busy'));
    } }, finIcon('city'), h('span', 'HOME')) : back;   // (THE CITY POLISH PASS: a solo end screen's way out reads HOME — the house icon stays; a match keeps ROOM)
  } else {
    // A MATCH: REMATCH — the host starts it; a guest votes (the votes = the room's rv for THIS match, mirrored in state.rv)
    const sub = h('span.final-bar-s');
    bar = h('button.final-bar.final-rematch', { type: 'button', 'data-press': true, 'data-pad': 'a', onclick: () => rematchTap() }, finIcon('again'), h('span.final-bar-t', 'REMATCH'), sub);
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
        // (CITY G — REMATCH IN PLACE: straight into the same game's count on every phone — no city, no room screen in between)
        lazyImport(import('../host.js'), '../host.js').then(m => m.rematch({ inPlace: true })).then(ok => { if (!ok) bar.classList.remove('is-busy'); }, () => bar.classList.remove('is-busy'));
        return;
      }
      const m = g && g.matchId;
      if (voting || !m || !state.code) return;
      voting = true;
      const mine = votes().mine;
      pendingVote = mine ? null : m; paint();
      // (CITY G — A LATE VOTE NEVER GOES IN (/admin RULES REFUSED rooms/*{rv/*}, Nov 17 10:27 pm): CITY F queued a refused vote on the phone and …
      const live = () => !gone && state.code && state.game && state.game.matchId === m && state.game.phase === 'final';
      if (!live()) { voting = false; pendingVote = null; paint(); return; }
      writeVote(state.code, state.uid, mine ? null : m).catch(() => { if (pendingVote === m) pendingVote = null; })
        .finally(() => { voting = false; paint(); });
    };
    paint();
    refreshers.push(paint);
    cancelers.push(subscribe(paint));   // (the votes + the host move live — every phone's mirrored rv)
  }
  const canShare = !!(mod && typeof mod.shareRun === 'function' && g && g.participants && g.participants[me]) && (() => { try { return typeof mod.shareOk !== 'function' || mod.shareOk(g, me) !== false; } catch { return true; } })();   // (FREEFALL FIX C — N2: a game may say no card fits this podium)
  // (JAYWALK BEFORE THE FLIP — a game whose card uploads at the tap: a slow first tap reads PREPARING…; 'ready' = the link is made but the …
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
  const foot = h('div.final-foot', bar, links, xpFoot);
  // (B3: the cue above the sticky foot — a drawn chevron + MORE BELOW, shown only while the frame scrolls on and you haven't scrolled yet)
  const more = h('div.final-more', { 'aria-hidden': 'true' }, h('i.final-chev'), h('span', 'MORE BELOW'));
  const actions = h('div.final-actions', more, foot);
  let hostShown = null;
  function refresh() { hostShown = isHost(); back.dataset.host = hostShown ? '1' : '0'; for (const f of refreshers) f(); }
  refresh();
  // (FRIENDS B — B4: a body that already shows the top three (OVERCLOCK's 2-1-3 podium, the console's own) → the results list starts at 4th; …
  const top3 = !body || body.dataset.podium !== 'none';
  // (THE END-BOARD SWITCH-ON: a MATCH with the block on → the block's TOP 3 + the YOU line from 4th down ARE the list — the console's own stays away)
  const listRows0 = (body && body.dataset.podium === 'all') || (eb && !ebSolo) ? [] : top3 ? rows.slice(3) : rows;
  const listRows = allTied ? listRows0.map(r => ({ ...r, rank: '=' })) : listRows0;   // (B4: everyone level — '=' for all, nobody 01)
  // (CITY PART 2 — THE END NEON: a game with a NEON row + a `mode` ('SOLO' / 'MATCH') → the header "<GAME> · <MODE>" in its sign's colours — …
  const neonKick = mode != null && g && neonOf(g.id) ? finHeader(g.id, mode) : null;
  // (THE END-BOARD SWITCH-ON — FREEFALL F5B's named call, now the block's: the personal-best / world-rank PLAQUES fold into YOUR BEST + the
  //  block (css: .final.has-eb .rc-plaque) — the XP line stays; nothing scrolls)
  const el = h('div.panel-full.final', { class: [solo ? 'is-solo' : allTied ? 'is-alltied' : '', eb ? 'has-eb' : ''].filter(Boolean).join(' ') || null },
    neonKick ? h('div.sheet-kicker.fn-kick', neonKick) : h('div.sheet-kicker', kicker),
    h('div.winner', h('div.winner-title', { 'data-text': word, class: tied ? 'is-tied' : null }, word),
      h('div.winner-name', solo ? `${winner ? winner.name : ''}${rows[0] && rows[0].score != null ? ` · ${rows[0].scoreText || rows[0].score}` : ''}`.toUpperCase() : allTied ? 'NOBODY TAKES FIRST' : tied ? 'SHARED VICTORY' : winnerLine(winner ? winner.name : ''))),
    body || podium,
    eb,
    rcSlot,
    extra,
    listRows.length ? leaderboard(listRows, players, { me, presence, stagger: 60 }) : null,
    actions);
  // (B3: is there more below the fold? — on a scroll + whenever the frame or a piece of it changes size: the XP box lands late, the rows …
  const measure = () => {
    if (gone) return;
    el.classList.toggle('has-more', el.scrollHeight - el.clientHeight - el.scrollTop > 6);
    if (el.scrollTop > 12) el.classList.add('is-scrolled');
    unslice();
  };
  // (CITY H1 — THE FADE NEVER SLICES A BOX: while MORE BELOW shows, a plaque / [data-box] the foot would cut moves down WHOLE under it — docs/title.md)
  let gap = null;
  function unslice() {
    if (!el.classList.contains('has-more') || el.classList.contains('is-scrolled') || !el.isConnected) return;
    if (gap) gap.style.height = '0px';
    const foot = actions.getBoundingClientRect().top;   // (a box above it running under it is cut; its LAID-OUT place: minus a sliding-in transform)
    for (const b of el.querySelectorAll('.rc-plaque, [data-box]')) {
      const r = b.getBoundingClientRect(); let dy = 0; try { const t = getComputedStyle(b).transform; if (t && t !== 'none') dy = new DOMMatrixReadOnly(t).m42; } catch { /* fine */ }
      const top = r.top - dy, bot = r.bottom - dy;
      if (r.height && top < foot - 1 && bot > foot + 1) { if (!gap) gap = h('div.final-gap', { 'aria-hidden': 'true' }); if (gap.nextElementSibling !== b) b.before(gap); gap.style.height = `${Math.ceil(foot + 4 - top)}px`; break; }
    }
  }
  el.addEventListener('scroll', measure, { passive: true });
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
  if (ro) { ro.observe(el); for (const c of el.children) ro.observe(c); }
  const mt = setTimeout(measure, 900);
  // (FRIENDS B — THE END SCREEN TAKES THE GAME'S COLOUR: the cartridge's ACCENT tints the frame's main tube; missing = the pink)
  // (THE FREEFALL CITY PASS: END_ACCENT — the end screen's own colour where it is not the game's: JAYWALK's sneaker red)
  const acc = mod && [mod.END_ACCENT, mod.ACCENT].find(c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c));
  if (acc) { el.classList.add('has-accent'); el.style.setProperty('--fin', acc); }
  if (g) finFrame(el, g.id);   // (THE END NEON: WINNER + DEADLOCK (a shared win) in gold, SOLO RUN + ALL TIED in the game's accent — the game's NEON row)
  if (neonKick) cancelers.push(fitHeader(neonKick.parentElement));   // (THE END NEON: the WINNER title in gold, SOLO RUN / DEADLOCK in the game's accent — the game's NEON row)
  // (CITY F: the bar's text — dark on the accent where it reads ≥ 4.5 : 1, white where the accent is too dark; the console's pink without one)
  el.style.setProperty('--fin-ink', finInk(acc || FIN_PINK));
  // (FRIENDS B — B2: THE VICTORY MUSIC waits for the BODY: app.js#musicFor plays the podium music once this frame is on screen — never during …
  if (g && g.matchId && state.podium !== g.matchId) queueMicrotask(() => { if (!gone && state.podium !== g.matchId) setState({ podium: g.matchId }); });
  const t = setTimeout(() => {
    el.classList.add('crowned');
    // (FRIENDS B — the winner sting = THE PODIUM SOUNDS' xylophone flourish (was the synth arpeggio); a cartridge with OWN_VICTORY_SOUND …
    if (allTied) return;   // (B4: a draw — no winner sting, no buzz, no confetti)
    if (!(mod && mod.OWN_VICTORY_SOUND)) pgSfx('victory');
    if (rows[0] && rows[0].uid === me) vibrate([40, 60, 40, 60, 120]);
    const c = rows[0] && players[rows[0].uid];
    burst(el, [c ? colorHex(c.color) : '#3dff8b', '#f3ff3a', '#ff2bd6', '#00f0ff'], 48);
  }, reducedMotion() ? 0 : 2500);
  return { el, refresh, destroy() { gone = true; clearTimeout(t); clearTimeout(mt); if (ro) ro.disconnect(); cancelers.forEach(c => c()); if (rc) rc.destroy(); if (ebH) ebH.destroy(); } };
}
