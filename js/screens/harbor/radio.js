// CITY CONTROLS A — THE RADIO (the owner, Nov 2 8:05–10:05 am — DECIDED; mockups Downloads\NEON\city-controls\; docs/harbor/passes/
// city-controls-a.md). Loaded by radio-gate.js ONLY after the server says this profile has a radio (core/harbor-radio.js#ROLES) — nobody
// else ever gets it, not even in the DOM. THE WAY IN: a third 36 pt corner circle UNDER the ☰ (title + lobby), a small brass radio, a PINK
// DOT while one of your moments runs or waits. ONE RADIO over THE CITY BEHIND (the live harbor, blurred — never the mockups' wood), the
// brass panels: the header (NEON SPEAKEASY · RADIO + the NIXIE count), THE BAND SELECTOR (DESK · PROGRAM · LEDGER), then the face:
//   THE DESK     the tuning window = THE SHOWCASE DIAL (HIGH · NORMAL · LOW, the red needle + its knob) · WHO HEARS IT (the AUDIENCE knob:
//                JUST ME · LOBBY ONLY · EVERYONE — CC-B) · THE MOMENTS — brass PATCH JACKS + lamps built FROM THE TIMETABLE (CC-B: no
//                long-press — a small ARRANGE button, off by default, then drag; saved on this device; TAP A LIT JACK → its card with a big
//                STOP / CANCEL) · the strips (ON ITS WAY / WAITING ITS TURN amber · RUNNING pink + STOP) · the
//                DEV / WORKSHOP button (the preview panel — one way in) · CLEAR ALL under the red SAFETY COVER
//   THE PATCH CARD (tap a jack) only what the moment needs → the big brass FIRE (who it goes to + how many) → the lamp: dark = ready ·
//                AMBER blinking = on its way / waiting its turn · PINK = running · GREYED = can't run now (a tap says why + when)
//   THE PROGRAM  (radio-program.js) · THE LEDGER (radio-ledger.js)
// CC-B — THE CREW (role 'crew'): the same desk CUT DOWN — no tuning window, no PROGRAM / LEDGER, no mic: their 11 jacks, a THIS LOBBY ONLY
//   plate, the audience locked to the lobby their phone is in (none: the jacks greyed "join a lobby"), the per-lobby limits on the lamps, the
//   dormant note (the sky moments play once LOBBY 2.0 puts the lobby in the city — queued + recorded now). ONE RADIO PER LOBBY: a crew
//   member who doesn't hold it sees the button DIMMED with a brass LOCK → THE RADIO'S WITH <NAME> TONIGHT + ASK FOR THE RADIO; the holder gets
//   "<NAME> WANTS THE RADIO · HAND IT OVER / KEEP IT"; when it passes to you: THE RADIO'S YOURS. THE OWNER: a tap on a player in a lobby opens
//   their card with the brass CREW switch.
// CC-B — PRESETS (the owner's, tucked away): "SAVE AS A ONE-TAP JACK" under a patch card's FIRE (the owner's CC-B review: "+ SAVE AS
//   PRESET" was confusing) → a small sheet: a NAME (prefilled GAME NIGHT) + "Fires this exact card again with one tap — it becomes a jack in
//   the bottom row." + SAVE → the radio scrolls to the new jack + it flashes once; each preset = ONE jack in its own last row (a small brass plate) → its card: the steps (✕ each), the name, FIRE
//   (every step through the server's own checks — one that can't go now is said, the rest still go), DELETE (a second tap).
// Every action goes to the SERVER (/api/admin radio…), which checks the role + the rules + writes it; this page only draws. Audio is
// polish (radio-sound.js): the desk works silently. 60 fps: the needle, the knobs, the lamps, the plug, the card — transform + opacity.
import { takeLayer } from '../../ui/layers.js';
import { h, reducedMotion } from '../../ui/dom.js';
import { api as apiCall } from '../../profile/api.js';
import { serverNow } from '../../firebase.js';
import * as RD from '../../core/harbor-radio.js';
import { SHOWCASE_LEVELS } from '../../core/harbor-showcase.js';
import { radioSound } from './radio-sound.js';
import { createIntercomDesk } from './radio-intercom.js';
import { state as store, subscribe } from '../../store.js';
import { avatar } from '../../ui/components.js';
import { toast } from '../../ui/toast.js';

const ORDER_KEY = 'nd:rd-order', AUD_KEY = 'nd:rd-aud', BAND_KEY = 'nd:rd-band';
const ls = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* fine */ } } };
const pad3 = n => String(Math.max(0, Math.min(999, n | 0))).padStart(3, '0');
const mmss = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const LEVEL_X = { high: 0.14, normal: 0.5, low: 0.86 };
const AUD_ROT = { me: -50, room: 0, everyone: 50 };
const LV_ROT = { high: -50, normal: 0, low: 50 };
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** the small brass radio glyph (the corner button) */
function glyph() {
  const NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<path class="rd-g-ant" d="M8.5 7.2 15.8 3.4"/><rect class="rd-g-box" x="3.4" y="7.2" width="17.2" height="12.4" rx="2.6"/><circle class="rd-g-spk" cx="9" cy="13.4" r="3.4"/><path class="rd-g-grl" d="M6.6 12.2h4.8M6.2 13.4h5.6M6.6 14.6h4.8"/><circle class="rd-g-dial" cx="16.4" cy="11.6" r="1.6"/><path class="rd-g-dial" d="M14.6 15.6h3.6"/>';
  return s;
}

export function createRadio({ role = 'owner', remote = () => null, roomCode = () => null, api = apiCall, sheetsReady = Promise.resolve(), onGone = null } = {}) {
  let destroyed = false, open = false, modal = null, sheet = null, st = null, stAt = 0, pollT = 0, tickT = 0, busy = false;
  let band = ls.get(BAND_KEY) || 'desk', aud = role === 'crew' ? 'room' : (RD.AUDIENCES.includes(ls.get(AUD_KEY)) ? ls.get(AUD_KEY) : 'everyone'), room = null;
  let card = null, cover = false, coverT = 0, arrange = false, bubble = null, err = '';
  let order = Array.isArray(ls.get(ORDER_KEY)) ? ls.get(ORDER_KEY) : null;
  const sfx = radioSound();
  const isOwner = role === 'owner';
  // CC-B — THE INTERCOM (the owner's): the mic strip, the review card, the sent strips (radio-intercom.js)
  let ic = null;
  // (FRIENDS A — THE CREW INTERCOM: the crew's own mic for THEIR room, only while the owner's switch is ON — the server's state says crewIc.on)
  const crewIc = () => !isOwner && !!(st && st.crewIc && st.crewIc.on);
  const icDesk = () => { if (!ic && (isOwner || crewIc())) ic = createIntercomDesk({ sfx, crew: !isOwner, act: (b, snd) => act(b, snd), who: () => (isOwner ? { aud, room, line: audLine() } : { aud: 'room', room: roomCode(), line: `${audLine()} · ${st && st.crewIc ? st.crewIc.left : 0} clips left tonight` }), setCard: c => { card = c; render(); }, render: () => render(), st: () => st }); return ic; };

  // ---------------------------------------------------------------- THE CORNER BUTTON
  const dot = h('i.rd-dot', { hidden: true });
  const lockG = h('i.rd-lockg', { 'aria-hidden': 'true' });
  const btn = h('button.rd-btn', { type: 'button', 'aria-label': 'The radio — fire the city’s moments', onclick: () => { sfx.play('band'); show(); } }, glyph(), dot, lockG);
  document.body.append(btn);
  const mineLive = () => (st && st.moments || []).filter(m => m.mine && (RD.phaseOf(m, serverNow()) === 'q' || RD.phaseOf(m, serverNow()) === 'run'));
  const lobbyOf = () => (!isOwner && st && st.lobby ? st.lobby : null);
  const lockedOut = () => { const L = lobbyOf(); return !!(L && !L.out && L.holder && !L.mine); };
  let prevMine = null;
  const paintDot = () => {
    dot.hidden = !mineLive().length;
    btn.classList.toggle('is-locked', lockedOut());
    const L = lobbyOf();
    // THE RADIO'S YOURS: it passed to this phone (a hand-over, the holder left, the host changed)
    if (L && !L.out) { if (L.mine && prevMine === false) { toast('THE RADIO’S YOURS', 'ok'); sfx.play('jackIn'); } prevMine = !!L.mine; } else prevMine = null;
    paintAsk();
  };

  // ---------------------------------------------------------------- THE SERVER (polled: every 3 s open, every 20 s closed + visible)
  async function refresh() {
    if (destroyed || busy) return;
    try {
      const body = { action: 'radioState' }; const rc = roomCode(); if (role === 'crew' && rc) body.room = rc;
      st = await api('admin', body); stAt = serverNow(); err = '';
      if (st.role !== role && st.role) role = st.role;
      feedDesk(); feedIntercom(); paintDot();
      // (CC-B review fix 1 — THE SCROLL JUMP: never rebuild under a finger or a still-moving list; a paper face repaints IN PLACE)
      if (open && !card && !(ic && ic.busy()) && !scrolling()) { if (band !== 'desk' && isOwner) paintPaper(); else render(); } else if (open) paintLive();
    } catch (e) { if (e && e.status === 403) { destroy(); return; } }
  }
  function schedule() {
    clearTimeout(pollT); if (destroyed) return;
    pollT = setTimeout(async () => { if (document.visibilityState === 'visible') await refresh(); schedule(); }, open ? 3000 : 20000);
  }
  // the owner's own moments played on THIS phone at once (JUST ME + the city's — the cached GET catches up for everyone else)
  function feedDesk() { const r = remote(); if (r && r.deskMoments) r.deskMoments((st && st.moments || []).filter(m => m.mine && m.aud !== 'room' && m.state !== 'stopped')); }
  // (PROGRESSION B's add-on — THE INTERCOM's WHEN: his own JUST ME announcements still to come reach this phone's player from the poll too —
  //  one he scheduled before a reload plays at its time; intercom.js keeps one copy per id)
  function feedIntercom() {
    const L = ((st && st.intercom) || []).filter(m => m.aud === 'me' && m.state !== 'stopped' && m.until > serverNow());
    if (L.length) import('../../audio/intercom.js').then(m => m.intercomFeed('desk', L)).catch(() => {});
  }
  async function act(body, okSound) {
    busy = true;
    try { const r = await api('admin', body); if (okSound) sfx.play(okSound); busy = false; await refresh(); return r; }
    catch (e) { busy = false; sfx.play('denied'); throw e; }
  }

  // ---------------------------------------------------------------- open / close
  let rdRelease = null;
  async function show() {
    if (open || destroyed) return;
    await sheetsReady;
    open = true; card = null; cover = false; arrange = false;
    modal = h('div.rd-modal', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'The radio' });
    const back = h('div.rd-back', { onpointerup: e => { if (e.target === back) hide(); } });
    sheet = h('div.rd-sheet');
    modal.append(back, sheet);
    // (SHELL 2.0 A — ONE Esc: the desk on THE LAYER STACK; Esc closes an open card first, then the desk — one step at a time)
    rdRelease = takeLayer(modal, { close: () => { if (card) { card = null; render(); } else hide(); } });
    document.body.append(modal); document.body.classList.add('rd-open');
    render();
    requestAnimationFrame(() => modal && modal.classList.add('is-in'));
    clearInterval(tickT); tickT = setInterval(paintLive, 500);
    refresh(); schedule();
    // swipe down from the top of the sheet closes it
    let y0 = null;
    sheet.addEventListener('pointerdown', e => { touching = true; y0 = sheet.scrollTop <= 0 && !card ? e.clientY : null; });
    sheet.addEventListener('pointerup', e => { touching = false; scrollAt = performance.now(); if (y0 != null && e.clientY - y0 > 90) hide(); y0 = null; });
    sheet.addEventListener('pointercancel', () => { touching = false; scrollAt = performance.now(); });
    // (iOS: a finger that scrolls fires pointercancel, then the list coasts — the touch + scroll events say when it has really stopped)
    sheet.addEventListener('touchstart', () => { touching = true; }, { passive: true });
    sheet.addEventListener('touchend', () => { touching = false; scrollAt = performance.now(); }, { passive: true });
    sheet.addEventListener('scroll', () => { scrollAt = performance.now(); }, { passive: true });
  }
  function hide() {
    if (!open) return;
    open = false; card = null; clearInterval(tickT);
    const m = modal; modal = null; sheet = null;
    if (rdRelease) { rdRelease(); rdRelease = null; }
    document.body.classList.remove('rd-open');
    if (m) { m.classList.remove('is-in'); setTimeout(() => m.remove(), 260); }
    schedule();
  }

  // ---------------------------------------------------------------- the pieces
  const plate = (t, cls = '') => h(`span.rd-plate${cls}`, t);
  function nixie(n, digits = 3) { return h('span.rd-nixie', ...pad3(n).slice(-digits).split('').map(d => h('span', d))); }
  function header() {
    const here = st && st.here != null ? st.here : null;
    // (FRIENDS C — the crew's header crowded at 390: THIS LOBBY ONLY beside the brand clipped "NEON SPEAKEASY ·" — it is the brand's third line now)
    return h('header.rd-head', { class: isOwner ? '' : 'is-crew' },
      h('div.rd-brand', h('b', 'NEON SPEAKEASY ·'), h('b', 'RADIO'), isOwner ? null : h('span.rd-plate.rd-lobplate', 'THIS LOBBY ONLY')),
      isOwner ? h('div.rd-count', { 'aria-label': `${here == null ? 'unknown' : here} people in the city now (an estimate)` }, nixie(here || 0), h('small', 'IN', h('br'), 'THE', h('br'), 'CITY')) : null,
      h('button.rd-x', { type: 'button', 'aria-label': 'Close the radio', onclick: () => { sfx.play('band'); hide(); } }, '✕'));
  }
  function bandSel() {
    const faces = isOwner ? [['desk', 'DESK'], ['program', 'PROGRAM'], ['ledger', 'LEDGER']] : [['desk', 'DESK']];
    if (faces.length < 2) return null;
    return h('nav.rd-band', { 'aria-label': 'The radio’s faces' }, ...faces.map(([id, l]) => h('button.rd-bb', { type: 'button', class: band === id ? 'is-on' : '', 'aria-pressed': String(band === id),
      onclick: () => { if (band === id) return; sfx.play('band'); band = id; ls.set(BAND_KEY, id); card = null; render(); } }, l)));
  }

  // ---------------------------------------------------------------- THE DESK
  function tuning() {
    const lv = st && st.showcase || 'high';
    const setLv = v => { if (v === lv || !isOwner) return; sfx.play('tick'); st.showcase = v; render(); act({ action: 'radioDial', level: v }).catch(e => { err = e.message; render(); }); };
    const next = () => setLv(SHOWCASE_LEVELS[(SHOWCASE_LEVELS.indexOf(lv) + 1) % SHOWCASE_LEVELS.length]);
    const audNext = () => {
      if (!isOwner) return;
      const i = RD.AUDIENCES.indexOf(aud), n = RD.AUDIENCES[(i + 1) % RD.AUDIENCES.length];
      sfx.play('tick'); aud = n; ls.set(AUD_KEY, n); if (n === 'room') pickRoom(); else render();
    };
    return h('section.rd-face.rd-tune-face',
      h('div.rd-tune', { role: 'radiogroup', 'aria-label': 'The showcase dial — how much of the city’s rare stuff' },
        h('i.rd-ticks'), h('i.rd-needle', { style: { transform: `translateX(${(LEVEL_X[lv] * 100).toFixed(1)}cqw)` } }),
        h('div.rd-sc', ...SHOWCASE_LEVELS.map(v => h('button.rd-lv', { type: 'button', role: 'radio', 'aria-checked': String(v === lv), class: v === lv ? 'is-on' : '', onclick: () => setLv(v) }, v.toUpperCase())))),
      h('div.rd-knobs',
        h('div.rd-kw', h('button.rd-knob', { type: 'button', 'aria-label': `Showcase: ${lv} — turn`, style: { '--r': `${LV_ROT[lv]}deg` }, onclick: next }), h('span.rd-kl', 'SHOWCASE')),
        h('div.rd-who', plate('WHO HEARS IT'), h('b', '● ', RD.AUD_LABEL[aud], aud === 'room' && room ? ` · ${room}` : ''),
          h('small.rd-auds', ...RD.AUDIENCES.flatMap((a, i) => [i ? ' · ' : null, h('span', { class: a === aud ? 'is-on' : '' }, RD.AUD_LABEL[a].toLowerCase())]).filter(Boolean)),
          aud === 'room' ? h('em.rd-note', 'every phone in that lobby sees it (~2 s)') : null),
        h('div.rd-kw', h('button.rd-knob', { type: 'button', 'aria-label': `Audience: ${RD.AUD_LABEL[aud]} — turn`, style: { '--r': `${AUD_ROT[aud]}deg` }, onclick: audNext, disabled: !isOwner }), h('span.rd-kl', 'AUDIENCE'))));
  }
  function pickRoom() {
    const rooms = st && st.rooms || [];
    card = { kind: 'rooms', rooms }; render();
  }
  const jackList = () => {
    const J = (st && st.jacks) || [];
    if (!order) return J;
    const pos = id => { const i = order.indexOf(id); return i < 0 ? 999 + J.findIndex(j => j.id === id) : i; };
    return [...J].sort((a, b) => pos(a.id) - pos(b.id));
  };
  /** a jack's lamp now: 'run' · 'q' · 'grey' · '' */
  function lamp(j) {
    const now = serverNow(), ms = (st && st.moments || []).filter(m => m.jack === j.id && m.state !== 'stopped');
    if (ms.some(m => RD.phaseOf(m, now) === 'run')) return 'run';
    if (ms.some(m => RD.phaseOf(m, now) === 'q')) return 'q';
    if (crewBlock(j)) return 'grey';
    return j.run && !j.run.ok ? 'grey' : '';
  }
  function moments() {
    const J = jackList();
    const grid = h('div.rd-jacks', { class: `${arrange ? 'is-arrange' : ''}` }, ...J.map(j => {
      const L = lamp(j);
      const cell = h('button.rd-jack', { type: 'button', dataset: { jack: j.id, lamp: L }, class: L ? `is-${L}` : '', 'aria-label': `${j.label}${L === 'run' ? ' — running' : L === 'q' ? ' — on its way' : L === 'grey' ? ` — ${j.run.note}` : ''}` },
        h('i.rd-lamp'), h('i.rd-hole', h('i.rd-plug')), h('span.rd-jl', j.label));
      // (CC-B — the owner: "thumb-scrolling set them wiggling": NO long-press; a tap is a tap, a scroll is a scroll — the button's own
      // click only fires for a tap that didn't scroll; drag only in ARRANGE mode)
      cell.addEventListener('pointerdown', e => { if (arrange) dragStart(e, j.id, cell); });
      cell.addEventListener('click', () => { if (!arrange) tapJack(j, cell); });
      return cell;
    }));
    const P = isOwner && st && st.presets || [];
    const presetRow = P.length ? h('div.rd-prow', h('span.rd-plate.rd-pplate', 'PRESETS'), h('div.rd-jacks.rd-presets', ...P.map(p => h('button.rd-jack.is-preset', { type: 'button', dataset: { preset: p.id }, 'aria-label': `Preset ${p.name} — ${p.steps.length} steps`, onclick: () => { sfx.play('jackIn'); card = { kind: 'preset', id: p.id, err: '', armed: false }; render(); } },
      h('i.rd-lamp'), h('i.rd-hole', h('i.rd-plug')), h('span.rd-jl', p.name))))) : null;
    return h('section.rd-face.rd-moments',
      h('div.rd-fh', plate('THE MOMENTS'), h('button.rd-done', { type: 'button', class: arrange ? 'is-on' : '', 'aria-pressed': String(arrange), onclick: () => { arrange = !arrange; sfx.play('tick'); render(); } }, arrange ? 'DONE' : 'ARRANGE')),
      grid, presetRow, arrange ? h('p.rd-hint', 'Drag a jack to its place — saved on this phone.') : null);
  }
  // ARRANGE → DRAG (pointer events; the cell under the finger takes its place; saved per owner on this device)
  function dragStart(e, id, cell) {
    e.preventDefault(); cell.setPointerCapture && cell.setPointerCapture(e.pointerId); cell.classList.add('is-drag');
    const move = ev => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY), tgt = el && el.closest && el.closest('.rd-jack');
      if (!tgt || tgt === cell || !tgt.dataset.jack) return;
      const ids = jackList().map(j => j.id), a = ids.indexOf(id), b = ids.indexOf(tgt.dataset.jack);
      ids.splice(a, 1); ids.splice(b, 0, id); order = ids; ls.set(ORDER_KEY, order);
      const grid = cell.parentNode; if (b > a) tgt.after(cell); else tgt.before(cell); void grid;
    };
    const up = () => { cell.classList.remove('is-drag'); cell.removeEventListener('pointermove', move); cell.removeEventListener('pointerup', up); cell.removeEventListener('pointercancel', up); };
    cell.addEventListener('pointermove', move); cell.addEventListener('pointerup', up); cell.addEventListener('pointercancel', up);
  }
  function tapJack(j, cell) {
    const L = lamp(j);
    if (L === 'grey') { sfx.play('denied'); showBubble(cell, `${j.label} · NOT NOW`, (crewBlock(j) || (j.run && j.run.note) || '').replace(/^.*?·\s*/, '').toLowerCase()); return; }
    // CC-B — EASIER TO TURN OFF (the owner): a LIT jack (amber / pink) opens its card again with a big STOP (running) / CANCEL (queued)
    if ((L === 'run' || L === 'q') && litOf(j).length) { sfx.play('jackIn'); card = { kind: 'lit', jack: j }; render(); return; }
    openJack(j);
  }
  function openJack(j) {
    sfx.play('jackIn');
    card = { kind: 'jack', jack: j, text: '', colour: 'ffffff', show: 'short', dance: 'mix', when: 'now', time: '20:00', lines: ['', ''], dows: [5], err: '' };
    render();
  }
  /** THE PROGRAM's EDIT: the billboard's card, filled in with the message (POST saves it in place) */
  function editBoard(b) {
    const j = (st && st.jacks || []).find(x => x.id === 'billboard'); if (!j) return;
    sfx.play('jackIn'); band = 'desk';
    card = { kind: 'jack', jack: j, text: '', colour: 'ffffff', show: 'short', dance: 'mix', when: b.repeat ? 'repeat' : b.local ? 'at' : 'now', time: b.local ? `${String(b.local.h).padStart(2, '0')}:${String(b.local.mi).padStart(2, '0')}` : '20:00', lines: [b.lines[0] || '', b.lines[1] || ''], dows: b.repeat ? b.repeat.dows.slice() : [5], err: '', editId: b.id };
    render();
  }
  function showBubble(cell, title, sub) {
    if (bubble) bubble.remove();
    const r = cell.getBoundingClientRect(), sr = sheet.getBoundingClientRect();
    bubble = h('div.rd-bub', { role: 'status' }, h('b', title), h('small', sub));
    bubble.style.left = `${Math.max(12, Math.min(sr.width - 220, r.left - sr.left + r.width / 2 - 110))}px`;
    bubble.style.top = `${r.top - sr.top + sheet.scrollTop - 58}px`;
    sheet.append(bubble);
    setTimeout(() => { if (bubble) { bubble.remove(); bubble = null; } }, 3200);
  }
  // THE STRIPS: what you fired that is on its way / waiting its turn (AMBER) or running (PINK + STOP)
  function strips() {
    const now = serverNow(), mine = (st && st.moments || []).filter(m => (m.mine || isOwner) && m.state !== 'stopped' && RD.phaseOf(m, now) !== 'done').sort((a, b) => a.at - b.at).slice(0, 3);
    if (!mine.length) return null;
    return h('div.rd-strips', ...mine.map(m => {
      const j = RD.jackDef(m.jack), ph = RD.phaseOf(m, now), label = j ? j.label : m.jack, words = m.text ? `“${m.text}”` : '';
      const where = m.aud === 'room' ? `lobby only ${m.room || ''}` : RD.AUD_LABEL[m.aud].toLowerCase();
      const sub = ph === 'run' ? `${words ? `${words} · ` : ''}${where}${m.mine ? '' : ' · fired by the crew'}`
        : m.at - now > (m.aud === 'room' ? 4000 : 60000) ? `waiting its turn — at ${RD.clockIn(m.at)}` : m.aud === 'room' ? 'the lobby in ~2 s' : m.aud === 'me' ? 'on this phone now' : 'the whole city within ~45 s';
      return h('div.rd-strip', { class: ph === 'run' ? 'is-run' : 'is-q', dataset: { id: m.id } },
        h('i.rd-lamp'),
        h('div', h('b', `${label} · ${ph === 'run' ? `RUNNING ${mmss((now - m.at) / 1000)}` : 'ON ITS WAY'}`), h('small', sub)),
        (m.mine || isOwner) ? h('button.rd-stop', { type: 'button', onclick: () => { sfx.play('jackOut'); act({ action: 'radioStop', id: m.id }).catch(e => { err = e.message; render(); }); } }, ph === 'run' ? 'STOP' : 'CANCEL') : null);
    }));
  }
  function clearAll() {
    if (!isOwner) return null;
    const press = () => { if (!cover) return; sfx.play('fire'); cover = false; clearTimeout(coverT); act({ action: 'radioClearAll' }).catch(e => { err = e.message; render(); }); render(); };
    const flip = () => { cover = !cover; sfx.play(cover ? 'coverOpen' : 'coverClose'); clearTimeout(coverT); if (cover) coverT = setTimeout(() => { cover = false; sfx.play('coverClose'); if (open && !card) render(); }, 5000); render(); };
    return h('div.rd-clear', { class: cover ? 'is-open' : '' },
      h('button.rd-cbtn', { type: 'button', tabindex: cover ? '0' : '-1', 'aria-hidden': String(!cover), onclick: press }, 'CLEAR ALL'),
      h('button.rd-cover', { type: 'button', 'aria-label': cover ? 'Close the safety cover' : 'Lift the safety cover over CLEAR ALL', onclick: flip }, h('i'), h('span', cover ? 'PRESS TO STOP EVERYTHING YOU FIRED' : 'CLEAR ALL')));
  }
  // CC-B — THE CREW's lock: the radio's with someone else in this lobby
  let askedAt = 0;
  function lockFace(L) {
    const rc = store.radioCrew || {}, mineAsk = rc.ask && rc.ask.uid === store.uid && rc.ask.at > serverNow() - 120e3;
    const name = L.holderName || 'ANOTHER CREW MEMBER';
    return h('section.rd-face.rd-lockface', h('i.rd-biglock', { 'aria-hidden': 'true' }),
      h('h3', `THE RADIO’S WITH ${name.toUpperCase()} TONIGHT`),
      h('p', 'Whoever hosts runs the show in this lobby. Host your own lobby to take the mic.'),
      L.nope ? h('p.rd-hint', `${name.toUpperCase()} KEPT IT — maybe later.`) : null,
      mineAsk || (askedAt && serverNow() - askedAt < 120e3 && !L.nope) ? h('p.rd-asked', `ASKED — WAITING FOR ${name.toUpperCase()}`)
        : h('button.rd-fire.rd-askbtn', { type: 'button', onclick: () => { askedAt = serverNow(); sfx.play('fire'); act({ action: 'radioAsk', room: roomCode() }).catch(e => { askedAt = 0; err = e.message; render(); }); render(); } }, 'ASK FOR THE RADIO'),
      err ? h('p.rd-err', { role: 'alert' }, err) : null);
  }
  // the holder's prompt (on the page even with the radio closed): <NAME> WANTS THE RADIO · HAND IT OVER / KEEP IT
  let askEl = null, askKey = '';
  function paintAsk() {
    const L = lobbyOf(), rc = store.radioCrew || {}, ask = rc.ask, on = !!(L && L.mine && ask && ask.uid !== store.uid && ask.at > serverNow() - 120e3);
    const key = on ? `${ask.uid}|${ask.at}` : '';
    if (key === askKey) return;
    askKey = key; if (askEl) { askEl.remove(); askEl = null; }
    if (!on) return;
    const answer = give => { sfx.play(give ? 'fire' : 'jackOut'); if (askEl) { askEl.remove(); askEl = null; } act({ action: 'radioHand', room: roomCode(), give }).catch(e => toast(e.message, 'warn')); };
    askEl = h('div.rd-askcard', { role: 'alertdialog', 'aria-label': `${ask.name} wants the radio` }, h('b', `${String(ask.name).toUpperCase()} WANTS THE RADIO`),
      h('div', h('button.rd-cancel', { type: 'button', onclick: () => answer(false) }, 'KEEP IT'), h('button.rd-fire', { type: 'button', onclick: () => answer(true) }, 'HAND IT OVER')));
    document.body.append(askEl); sfx.play('band');
  }
  // the crew's block on a jack (no lobby · the lobby's limits + the cooldown) → a note or null
  function crewBlock(j) {
    if (isOwner) return null;
    if (!roomCode()) return 'JOIN A LOBBY — THE CREW FIRES IN THE LOBBY THEY’RE IN';
    const c = RD.crewCheck(j.id, st && st.limits, serverNow());
    return c.ok ? null : c.note;
  }
  function desk() {
    if (!isOwner) { const L = lobbyOf(); if (lockedOut()) return [lockFace(L)]; }
    return [
      isOwner ? tuning() : null,
      isOwner || crewIc() ? icDesk().strip() : null,
      isOwner || crewIc() ? h('div.rd-icsent', icDesk().sent()) : null,
      moments(),
      !isOwner ? h('p.rd-dormant', h('b', 'THIS LOBBY ONLY'), ' · every phone in your lobby sees it, in a couple of seconds') : null,
      strips(),
      err ? h('p.rd-err', { role: 'alert' }, err) : null,
      clearAll(),
      isOwner && remote() ? h('button.rd-dev', { type: 'button', onclick: () => { const r = remote(); hide(); if (r && r.open) setTimeout(() => r.open(), 280); } }, 'DEV · THE WORKSHOP') : null,
    ];
  }

  // ---------------------------------------------------------------- THE PATCH CARD (+ the room list)
  const audLine = () => {
    if (!isOwner) { const P = store.players || {}, n = Object.keys(P).length; return `Goes to THIS LOBBY · ${roomCode() || '—'}${n ? ` · ${n} here` : ''} — every phone in this room sees it`; }
    if (aud === 'me') return 'A preview on this phone only';
    if (aud === 'room') { const r = (st && st.rooms || []).find(x => x.code === room); return `Goes to LOBBY ONLY · ${room || '—'}${r ? ` · ${r.online || r.players} on` : ''}`; }
    const n = st && st.here; return `Goes to ${RD.AUD_LABEL[aud]}${n != null ? ` · ${n} in the city` : ''}`;
  };
  /** a jack's moments this desk may still stop / cancel (yours — the owner: every one) */
  const litOf = j => { const now = serverNow(); return (st && st.moments || []).filter(m => m.jack === j.id && m.state !== 'stopped' && (m.mine || isOwner) && RD.phaseOf(m, now) !== 'done').sort((a, b) => a.at - b.at); };
  const closeX = (label = 'Close') => h('button.rd-cx', { type: 'button', 'aria-label': label, onclick: () => { sfx.play('jackOut'); const back = card && card.fromChip; card = null; if (back) hide(); else render(); } }, '✕');
  function litCard() {
    const j = card.jack, now = serverNow(), L = litOf(j);
    const where = m => (m.aud === 'room' ? `LOBBY ONLY · ${m.room || ''}` : RD.AUD_LABEL[m.aud]);
    return h('div.rd-card.rd-lit', { role: 'dialog', 'aria-label': `${j.label} — stop or cancel` }, h('i.rd-grab'),
      h('h3', h('i.rd-lamp', { class: L.some(m => RD.phaseOf(m, now) === 'run') ? 'is-run' : 'is-q' }), j.label, closeX('Close the card')),
      ...(L.length ? L.map(m => {
        const ph = RD.phaseOf(m, now);
        return h('div.rd-litrow', { dataset: { id: m.id } },
          h('div.rd-litwhat', h('b', ph === 'run' ? `RUNNING · ${mmss((now - m.at) / 1000)}` : `ON ITS WAY · ${RD.clockIn(m.at).toUpperCase()}`), h('small', `${m.text ? `“${m.text}” · ` : ''}${where(m)}${m.mine ? '' : ' · fired by the crew'}`)),
          h('button.rd-bigstop', { type: 'button', class: ph === 'run' ? 'is-stop' : 'is-cancel', onclick: () => { sfx.play('jackOut'); card = null; act({ action: 'radioStop', id: m.id }).catch(e => { err = e.message; render(); }); render(); } }, ph === 'run' ? 'STOP' : 'CANCEL'));
      }) : [h('p.rd-hint', 'Nothing left to stop here.')]),
      h('button.rd-cancel', { type: 'button', onclick: () => openJack(j) }, `FIRE ANOTHER ${j.label}`));
  }
  // (LOBBY FIXES — THE PLAYER CARD: the desk's own "THEIR CARD" is gone — a player tap opens THEIR card (room-city.js) with the owner's CREW row
  //  at its foot (screens/crew-row.js); the radio never opens from a player tap)
  function roomCard() {
    const rooms = card.rooms || [];
    return h('div.rd-card', h('i.rd-grab'), h('h3', h('i.rd-lamp'), 'LOBBY ONLY', closeX('Close the lobby list')),
      h('p.rd-hint', 'Pick a lobby. The intercom plays there now; sky moments once the lobby is the live city (LOBBY 2.0).'),
      rooms.length ? h('div.rd-rooms', ...rooms.map(r => h('button.rd-room', { type: 'button', class: r.code === room ? 'is-on' : '', onclick: () => { room = r.code; sfx.play('tick'); card = null; render(); } },
        h('b', r.code), h('span', `${r.online || 0} of ${r.players} on · ${r.status === 'playing' ? (r.game || 'a game').toUpperCase() : 'THE LOBBY'}`)))) : h('p.rd-empty', 'NO LOBBIES OPEN RIGHT NOW'),
      h('button.rd-cancel', { type: 'button', onclick: () => { if (!room) { aud = 'everyone'; ls.set(AUD_KEY, aud); } card = null; render(); } }, 'BACK'));
  }
  function jackCard() {
    const c = card, j = c.jack, sec = (lab, ...k) => h('div.rd-sec', h('div.rd-lb', ...lab), ...k);
    const seg = (opts, val, set) => h('div.rd-seg', ...opts.map(([v, l]) => h('button', { type: 'button', class: v === val ? 'is-on' : '', 'aria-pressed': String(v === val), onclick: () => { sfx.play('tick'); set(v); render(); } }, l)));
    const parts = [];
    if (j.card === 'words') {
      const inp = h('input.rd-inp', { type: 'text', maxlength: '24', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', enterkeyhint: 'done', value: c.text, 'aria-label': 'The words', placeholder: 'HAPPY BIRTHDAY',
        oninput: e => { c.text = e.target.value.toUpperCase().slice(0, 24); e.target.value = c.text; cnt.textContent = `${c.text.length} / 24`; pv.textContent = c.text || 'YOUR WORDS'; pv.classList.toggle('is-ph', !c.text); } });
      const cnt = h('em', `${c.text.length} / 24`), pv = h('b', { class: c.text ? '' : 'is-ph' }, c.text || 'YOUR WORDS');
      parts.push(sec(['THE WORDS', cnt], inp),
        sec([j.id === 'skywrite' ? 'THE COLOUR' : 'THE BANNER', j.id === 'skywrite' ? h('em', 'the smoke by day · the drones after dark') : null],
          j.id === 'skywrite' ? h('div.rd-sw', ...RD.COLOURS.map(col => h('button', { type: 'button', class: col === c.colour ? 'is-on' : '', style: { '--c': col === 'rainbow' ? 'conic-gradient(#ff2e97,#ffd25a,#7dff6a,#2ee6ff,#b36bff,#ff2e97)' : `#${col}` }, 'aria-label': col === 'rainbow' ? 'rainbow' : `#${col}`, 'aria-pressed': String(col === c.colour), onclick: () => { c.colour = col; sfx.play('tick'); render(); } }))) : null),
        h('div.rd-prev', { class: `is-${j.id}${c.colour === 'rainbow' ? ' is-rainbow' : ''}`, style: j.id === 'skywrite' && c.colour !== 'rainbow' ? { '--smoke': `#${c.colour || 'ffffff'}` } : null }, pv, h('small', 'PREVIEW')));   // (CC-B: the preview in the smoke colour picked)
    }
    if (j.card === 'fireworks') parts.push(sec(['THE SHOW'], seg([['short', 'SHORT · ~90 S'], ['full', 'FULL · ~5 MIN']], c.show, v => { c.show = v; })));
    if (j.card === 'dance') parts.push(sec(['THE DANCE'], seg(RD.DANCES.map(d => [d, d.toUpperCase()]), c.dance, v => { c.dance = v; })));
    if (j.card === 'billboard') {
      const line = i => h('input.rd-inp.rd-line', { type: 'text', maxlength: '12', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', value: c.lines[i], 'aria-label': `Line ${i + 1}`, placeholder: i ? '8 PM' : 'GAME NIGHT',
        oninput: e => { c.lines[i] = e.target.value.toUpperCase().slice(0, 12); e.target.value = c.lines[i]; const el = bb.children[i]; el.textContent = c.lines[i] || (i ? '8 PM' : 'GAME NIGHT'); el.classList.toggle('is-ph', !c.lines[i]); } });
      const bb = h('div.rd-board-face', ...[0, 1].map(i => h('b', { class: c.lines[i] ? '' : 'is-ph' }, c.lines[i] || (i ? '8 PM' : 'GAME NIGHT'))));
      parts.push(sec(['TWO LINES', h('em', '12 letters a line')], line(0), line(1)),
        h('div.rd-board', bb, h('small', 'ON THE SPEAKEASY’s BILLBOARD')));
    }
    if (j.card !== 'billboard') parts.push(h('p.rd-note2', j.note || ''));
    // WHEN: NOW · AT A TIME (each viewer's own time) · REPEAT (the billboard)
    const whens = [['now', 'NOW'], ['at', 'AT A TIME'], ...(j.card === 'billboard' ? [['repeat', 'REPEAT']] : [])];
    parts.push(sec(['WHEN', h('em', 'in each viewer’s own time')], seg(whens, c.when, v => { c.when = v; }),
      c.when !== 'now' ? h('input.rd-inp.rd-time', { type: 'time', value: c.time, 'aria-label': 'The local time', onchange: e => { c.time = e.target.value || c.time; } }) : null,
      c.when === 'repeat' ? h('div.rd-dows', ...DOW.map((d, i) => h('button', { type: 'button', class: c.dows.includes(i) ? 'is-on' : '', 'aria-pressed': String(c.dows.includes(i)), onclick: () => { c.dows = c.dows.includes(i) ? c.dows.filter(x => x !== i) : [...c.dows, i]; sfx.play('tick'); render(); } }, d.slice(0, 2)))) : null));
    if (c.err) parts.push(h('p.rd-err', { role: 'alert' }, c.err));
    const fire = h('button.rd-fire', { type: 'button', disabled: !!c.sending, onclick: () => fireIt() }, j.card === 'billboard' ? 'POST' : 'FIRE');
    return h('div.rd-card', { role: 'dialog', 'aria-label': `${j.label} — the patch card` }, h('i.rd-grab'),
      h('h3', h('i.rd-lamp'), j.label, closeX('Unplug — close the card')),
      ...parts, fire, h('p.rd-who2', j.card === 'billboard' ? 'The speakeasy’s billboard · everyone on the city' : audLine()),
      isOwner && !c.editId ? saveBlock(c) : null);
  }
  // ---- PRESETS: this card's set-up as a step
  function stepOf(c) {
    const j = c.jack, [hh, mi] = String(c.time || '20:00').split(':').map(Number), local = c.when !== 'now' ? { h: hh, mi } : null;
    if (j.card === 'billboard') return { kind: 'board', body: { lines: c.lines, local, repeat: c.when === 'repeat' ? { dows: c.dows } : null } };
    return { kind: 'fire', body: { jack: j.id, aud, room: aud === 'room' ? room : null, text: c.text, colour: c.colour, show: c.show, dance: c.dance, local } };
  }
  const stepLine = st => {
    const b = st.body || {}, at = b.local ? ` · at ${String(b.local.h).padStart(2, '0')}:${String(b.local.mi).padStart(2, '0')}` : ' · now', rep = b.repeat ? ` · every ${b.repeat.dows.map(d => DOW[d].slice(0, 2)).join(' ')}` : '';
    if (st.kind === 'board') return `BILLBOARD “${(b.lines || []).filter(Boolean).join(' / ')}”${at}${rep}`;
    const jd = RD.jackDef(b.jack);
    return `${jd ? jd.label : b.jack}${b.text ? ` “${b.text}”` : ''}${b.show ? ` (${b.show})` : ''} → ${b.aud === 'room' ? `LOBBY ONLY ${b.room || ''}` : RD.AUD_LABEL[b.aud] || ''}${at}`;
  };
  function saveBlock(c) {
    if (!c.save) return h('button.rd-savepre', { type: 'button', onclick: () => { sfx.play('tick'); c.save = true; if (c.preName == null) c.preName = 'GAME NIGHT'; render(); } }, 'SAVE AS A ONE-TAP JACK');
    const save = async () => {
      const name = (c.preName || '').trim() || 'GAME NIGHT';
      c.err = '';
      try {
        const before = new Set(((st && st.presets) || []).map(x => x.id));
        const r = await act({ action: 'radioPreset', op: 'add', name, step: stepOf(c) }, 'fire');
        st.presets = r.presets;
        const nu = (r.presets || []).find(x => !before.has(x.id)) || (r.presets || []).slice(-1)[0];
        card = null; render();
        if (nu) showNewJack(nu.id);
      } catch (e) { c.err = e.message; render(); }
    };
    const inp = h('input.rd-inp', { type: 'text', maxlength: '16', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'The new jack’s name', value: c.preName || '',
      oninput: e => { c.preName = e.target.value.toUpperCase().slice(0, 16); e.target.value = c.preName; }, onkeydown: e => { if (e.key === 'Enter') save(); } });
    return h('div.rd-sec.rd-saveto', h('div.rd-lb', 'SAVE AS A ONE-TAP JACK'),
      h('label.rd-savename', h('span', 'NAME'), inp),
      h('p.rd-hint', 'Fires this exact card again with one tap — it becomes a jack in the bottom row.'),
      h('div.rd-cadd', h('button.rd-savepre', { type: 'button', onclick: () => { c.save = false; render(); } }, 'NEVER MIND'), h('button.rd-done', { type: 'button', onclick: save }, 'SAVE')));
  }
  /** after a save: the desk scrolls to the new jack (the bottom row) and it flashes once */
  function showNewJack(id) {
    requestAnimationFrame(() => {
      const el = sheet && sheet.querySelector(`.rd-jack[data-preset="${id}"]`);
      if (!el) return;
      try { el.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch { el.scrollIntoView(); }
      el.classList.add('is-flash');
      setTimeout(() => el.classList.remove('is-flash'), 1400);
      sfx.play('jackIn');
    });
  }
  function presetCard() {
    const c = card, p = ((st && st.presets) || []).find(x => x.id === c.id);
    if (!p) return h('div.rd-card', h('h3', h('i.rd-lamp'), 'PRESET', closeX()), h('p.rd-hint', 'That preset is gone.'));
    const go = body => act({ action: 'radioPreset', ...body }, 'tick').then(r => { st.presets = r.presets; render(); }).catch(e => { c.err = e.message; render(); });
    const nm = h('input.rd-inp', { type: 'text', maxlength: '16', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', value: p.name, 'aria-label': 'The preset’s name',
      onchange: e => { const v = e.target.value.toUpperCase().trim(); if (v && v !== p.name) go({ op: 'name', id: p.id, name: v }); } });
    return h('div.rd-card.rd-precard', { role: 'dialog', 'aria-label': `Preset ${p.name}` }, h('i.rd-grab'),
      h('h3', h('i.rd-lamp'), p.name, closeX('Close the preset')),
      h('div.rd-sec', h('div.rd-lb', 'THE NAME'), nm),
      h('div.rd-sec', h('div.rd-lb', 'THE STEPS', h('em', 'in this order')),
        ...p.steps.map((st2, i) => h('div.rd-step', h('span', h('b', `${i + 1}`), stepLine(st2)), h('button.rd-stepx', { type: 'button', 'aria-label': `Remove step ${i + 1}`, onclick: () => go({ op: 'drop', id: p.id, i }) }, '✕')))),
      c.results ? h('div.rd-sec', ...c.results.map(r => h('p', { class: r.ok ? 'rd-hint' : 'rd-err' }, `${r.ok ? '✓' : '✗'} ${r.jack ? (RD.jackDef(r.jack) || { label: r.jack }).label : 'BILLBOARD'}${r.ok ? ' — on its way' : ` — ${r.why}`}`))) : null,
      c.err ? h('p.rd-err', { role: 'alert' }, c.err) : null,
      h('button.rd-fire', { type: 'button', disabled: !!c.sending, onclick: async () => { c.sending = true; render(); try { const r = await act({ action: 'radioPresetFire', id: p.id }, 'fire'); c.results = r.results; c.err = ''; } catch (e) { c.err = e.message; } c.sending = false; render(); } }, c.sending ? 'FIRING…' : 'FIRE THE PRESET'),
      h('button.rd-cancel', { type: 'button', class: c.armed ? 'is-armed' : '', onclick: () => { if (!c.armed) { c.armed = true; render(); return; } card = null; go({ op: 'delete', id: p.id }); } }, c.armed ? 'SURE? DELETE IT' : 'DELETE THE PRESET'));
  }
  async function fireIt() {
    const c = card; if (!c || c.sending) return;
    const j = c.jack, [hh, mi] = String(c.time || '20:00').split(':').map(Number), local = c.when !== 'now' ? { h: hh, mi } : null;
    if (isOwner && aud === 'room' && !room && j.card !== 'billboard') { c.err = 'PICK A LOBBY ON THE AUDIENCE KNOB FIRST'; render(); return; }
    c.sending = true; c.err = ''; render();
    try {
      if (j.card === 'billboard') await act({ action: c.editId ? 'radioBoardEdit' : 'radioBoard', id: c.editId || undefined, lines: c.lines, local, repeat: c.when === 'repeat' ? { dows: c.dows } : null }, 'fire');
      else await act({ action: 'radioFire', jack: j.id, aud: isOwner ? aud : 'room', room: isOwner ? room : roomCode(), text: c.text, colour: c.colour, show: c.show, dance: c.dance, local }, 'fire');
      card = null; render();
    } catch (e) { c.sending = false; c.err = (e && e.message) || 'Couldn’t fire it.'; render(); }
  }

  // ---------------------------------------------------------------- the faces
  let faces = { program: null, ledger: null };
  // (CC-B review fix 1: a finger on the sheet, or the list still moving (≤ 900 ms since its last scroll) → the poll leaves it alone)
  let touching = false, scrollAt = 0;
  const scrolling = () => touching || performance.now() - scrollAt < 900;
  const paperArgs = () => ({ st, api, act, sfx, refresh, now: serverNow, edit: editBoard,
    cancel: { moment: id => { sfx.play('jackOut'); act({ action: 'radioStop', id }).catch(e => { err = e.message; render(); }); }, board: id => { sfx.play('jackOut'); act({ action: 'radioBoardCancel', id }).catch(e => { err = e.message; render(); }); },
      intercom: id => { sfx.play('jackOut'); act({ action: 'radioUnsend', id }).then(() => { if (refresh) refresh(); }).catch(e => { err = e.message; render(); }); } } });
  /** THE PROGRAM / THE LEDGER on a poll: the paper's rows replaced IN PLACE — the sheet (the scrolling box) is never rebuilt, its scroll kept */
  function paintPaper() {
    const holder = sheet && sheet.querySelector('.rd-paperwrap[data-face]');
    const m = faces[band];
    if (!holder || holder.dataset.face !== band || !m) { render(); return; }
    if (band === 'ledger') return;   // (the ledger keeps its own 30-s memo + its own in-place fills: nothing to repaint on a poll)
    const keep = sheet.scrollTop;
    holder.replaceChildren(...m.paint(paperArgs()));
    sheet.scrollTop = keep;
  }
  async function face(id) {
    if (!faces[id]) { try { const m = await import(id === 'program' ? './radio-program.js' : './radio-ledger.js'); faces[id] = m; } catch (e) { console.warn('[radio]', id, e); } }
    return faces[id];
  }
  function render() {
    if (!sheet) return;
    const kids = [header(), bandSel()];
    if (band === 'desk' || !isOwner) kids.push(...desk());
    else {
      // (a loaded face paints SYNCHRONOUSLY — a "Tuning in…" placeholder for a frame used to clamp the kept scroll to the top: the jump)
      const loaded = faces[band];
      const holder = h('div.rd-paperwrap', { dataset: { face: band } }, ...(loaded ? loaded.paint(paperArgs()) : [h('p.rd-hint', 'Tuning in…')]));
      kids.push(holder);
      if (!loaded) face(band).then(m => { if (!m || !sheet || !holder.isConnected) return; const keep = sheet.scrollTop; holder.replaceChildren(...m.paint(paperArgs())); sheet.scrollTop = keep; });
    }
    const keep = sheet.scrollTop;
    sheet.replaceChildren(...kids.filter(Boolean));
    // THE PATCH CARD over the desk (on the modal — never inside the scrolling, transformed sheet); a re-render keeps it up (no second slide)
    const old = modal && modal.querySelector('.rd-cardwrap'), was = !!(old && old.classList.contains('is-in'));
    if (old) old.remove();
    if (card && modal) {
      const over = h('div.rd-cardwrap', { class: was ? 'is-in' : '', onpointerup: e => { if (e.target === over) { sfx.play('jackOut'); card = null; render(); } } }, card.kind === 'rooms' ? roomCard() : card.kind === 'lit' ? litCard() : card.kind === 'mic' ? (icDesk().card() || h('div')) : card.kind === 'preset' ? presetCard() : jackCard());
      modal.append(over); if (!was) requestAnimationFrame(() => requestAnimationFrame(() => over.classList.add('is-in')));
    }
    sheet.scrollTop = keep;
  }
  /** the live bits between polls: the lamps + the strips' timers (no rebuild of the cards) */
  function paintLive() {
    if (!sheet || card || band !== 'desk') return;
    for (const el of sheet.querySelectorAll('.rd-jack')) { const j = (st && st.jacks || []).find(x => x.id === el.dataset.jack); if (!j) continue; const L = lamp(j); if (el.dataset.lamp !== L) { el.dataset.lamp = L; el.className = `rd-jack${L ? ` is-${L}` : ''}`; } }
    { const box = sheet.querySelector('.rd-icsent'); if (box && ic) box.replaceChildren(...[ic.sent()].filter(Boolean)); }
    const old = sheet.querySelector('.rd-moments + .rd-strips'), nu = strips();
    if (old && nu) old.replaceWith(nu); else if (old) old.remove(); else if (nu) { const mo = sheet.querySelector('.rd-moments'); if (mo) mo.after(nu); }
    paintDot();
  }

  let storeKey = '', storeT = 0;
  const unsub = subscribe(() => {
    const k = JSON.stringify([store.code, store.meta && store.meta.hostId, Object.keys(store.players || {}).sort(), store.radioCrew || null]);
    if (k === storeKey) return; storeKey = k;
    paintAsk(); clearTimeout(storeT); storeT = setTimeout(() => refresh(), 250);
  });
  // (body.rd-owner = the owner's phone: a room player's card shows the CREW row — screens/crew-row.js. LOBBY FIXES: no tap hooks here any more —
  //  the capture-phase chip taps + 'ns:owner-card' opened THIS panel over every player tap on the owner's phone)
  if (isOwner) document.body.classList.add('rd-owner');
  const onVis = () => { if (document.visibilityState === 'visible') refresh(); };
  document.addEventListener('visibilitychange', onVis);
  refresh(); schedule();

  function destroy() {
    destroyed = true; clearTimeout(pollT); clearInterval(tickT); clearTimeout(coverT); if (ic) ic.destroy();
    document.removeEventListener('visibilitychange', onVis);
    unsub(); clearTimeout(storeT); if (askEl) askEl.remove(); document.body.classList.remove('rd-owner');
    if (modal) modal.remove(); btn.remove(); document.body.classList.remove('rd-open');
    if (onGone) try { onGone(); } catch { /* fine */ }   // (SHELL 2.0 B2: the gate forgets it — a later ON loads a fresh one)
  }
  return {
    open: show, close: hide, destroy, refresh,
    /** (tests) the state + what the desk shows */
    debug: () => ({ role, open, band, aud, room, card: card ? (card.kind === 'jack' ? card.jack.id : card.kind) : null, cover, arrange, ic: ic ? ic.debug() : null, jacks: (st && st.jacks || []).map(j => ({ id: j.id, lamp: lamp(j) })), moments: st ? st.moments.length : 0, here: st ? st.here : null }),
    setBand(b) { band = b; render(); }, setAud(a, r) { aud = a; room = r || room; render(); },
    lobby: () => (st && st.lobby) || null,
  };
}
