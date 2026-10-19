// Lobby: the hush word (the room's code, on a password card) + invite + LOCK THE DOOR (host), live player list, host game picker.
import { h, clear, reducedMotion } from '../ui/dom.js';
import { RANK_COLORS } from '../ui/emblems.js';
import { step } from '../core/ranks.js';
import { neonTick } from '../audio/ambience.js';
import { playerChip, segmented, chips as chipSelect, accessGranted, avatar } from '../ui/components.js';
import { nightStandings } from '../core/night.js';
import { colorHex } from '../config.js';
import { toast } from '../ui/toast.js';
import { APP_NAME, GAMES, MAX_PLAYERS, MIN_PLAYERS } from '../config.js';
import { isHost, setState } from '../store.js';
import { playerOrder, isOnline, idleLeft } from '../core/room-logic.js';
import { ROOM_IDLE_WARN_MS } from '../config.js';
import { dbRef, update as dbUpdate, serverTimestamp, serverNow } from '../firebase.js';
import { leaveRoom, kickPlayer, setDoorLocked } from '../room.js';
import { startGame, onlineCount } from '../host.js';
import { GAME_MODULES } from '../games/registry.js';
import { preloadSheets } from '../games/lazy-view.js';
import { slot } from '../identity.js';
import { openHelp } from '../ui/help.js';
import { sfx } from '../audio/sfx.js';
import { prefetch } from '../audio/music.js';
import { gameArt } from '../ui/game-art.js';
import { logoSvg } from '../ui/logo.js';

// a small padlock (the hush-word card's LOCKED tag and the LOCK THE DOOR row)
const LOCK_SVG = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none"/></svg>';
const greeted = new Set(); // rooms we've already shown the join effect for (this page load)

export function createLobby() {
  let st, els = {};
  let chips = new Map();
  let kickArmed = { uid: null, at: 0 };
  let sheet = null;

  function inviteUrl() {
    return `${location.origin}${location.pathname}?room=${st.code}`;
  }

  async function share() {
    const url = inviteUrl();
    const text = `Get in here — the hush word is ${st.code}`;
    if (navigator.share) {
      try { await navigator.share({ title: APP_NAME, text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    copy(url);
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('INVITE LINK COPIED', 'ok'); }
    catch {
      const ta = h('textarea', { value: text, style: { position: 'fixed', opacity: '0' } });
      document.body.append(ta); ta.select();
      try { document.execCommand('copy'); toast('INVITE LINK COPIED', 'ok'); } catch { toast(text, 'info', 6000); }
      ta.remove();
    }
  }

  function mount(el, state) {
    st = state;
    el.classList.add('lobby-screen');
    els.code = h('button.room-code', { type: 'button', 'aria-label': `The hush word is ${st.code}. Tap to copy the invite link`, onclick: () => copy(inviteUrl()) },
      [...st.code].map((ch, i) => h('span', { style: { '--i': i } }, ch)));
    // LOCK THE DOOR (host only): new players can't get in with the word; everyone already inside keeps their seat
    els.lock = h('button.switch.hw-switch', { type: 'button', role: 'switch', 'aria-checked': 'false', 'aria-labelledby': 'hw-lock-l', onclick: toggleLock }, h('i'));
    els.lockRow = h('div.hw-lockrow', { hidden: true },
      h('span.hw-lock-ic', { 'aria-hidden': 'true', html: LOCK_SVG }),
      h('span.hw-lock-l', { id: 'hw-lock-l' }, 'LOCK THE DOOR'),
      els.lockNote = h('span.hw-lock-note', 'ANYONE WITH THE WORD'),
      els.lock);
    els.lockTag = h('span.hw-tag', { hidden: true, role: 'status' }, h('span', { 'aria-hidden': 'true', html: LOCK_SVG }), 'LOCKED');
    els.count = h('span.count');
    els.players = h('div.players');
    els.games = h('div.games');
    els.hint = h('p.lobby-hint.mono');
    els.idle = h('div.lobby-idle', { hidden: true, role: 'status' });
    els.idleTimer = setInterval(renderIdle, 5000);
    flickerStop = false; scheduleFlicker();
    els.night = h('section.lobby-section.night');
    els.live = h('div.lobby-live', { hidden: true, role: 'status' });
    el.append(
      h('button.btn.btn-ghost.btn-sm.lobby-leave', { type: 'button', onclick: confirmLeave, 'aria-label': 'Leave room' }, '‹ LEAVE ROOM'),
      h('header.lobby-head',
        (els.sign = h('div.nd-mini', { 'aria-label': APP_NAME, role: 'img' }, h('div.nd-logo-wrap', { html: logoSvg({ id: 'ndl', lit: true, clips: false, blur: 0.7 }) }), h('div.nd-word', 'SPEAKEASY'))),
        els.card = h('div.lobby-room.hw-card',
          h('div.hw-top', h('span.hw-label', 'THE HUSH WORD'), els.lockTag),
          els.code,
          h('span.hw-hint', 'TAP THE WORD TO COPY THE LINK'),
          els.lockRow),
        h('div.lobby-actions',
          h('button.btn.btn-primary.btn-sm', { type: 'button', onclick: share }, '⇪ SHARE INVITE'),
          h('button.btn.btn-ghost.btn-sm', { type: 'button', onclick: () => copy(inviteUrl()) }, 'COPY LINK'))),
      els.live,
      h('section.lobby-section',
        h('div.section-head', h('span.label', 'OPERATIVES'), els.count),
        els.players),
      els.night,
      els.idle,
      h('section.lobby-section',
        h('div.section-head', h('span.label', 'SELECT PROTOCOL')),
        els.hint,
        els.games),
      // (native append() would print a null as the text "null")
      ...(slot !== '1' ? [h('div.lobby-foot', h('span.tag.tag-you', `TEST SLOT ${slot}`))] : []),
      els.chatSlot = h('div.chat-slot'),
    );
    // the chat strip (and all chat code) loads after the lobby is up
    import('../chat/ui.js').then(m => {
      if (!els.chatSlot || !els.chatSlot.isConnected) return;
      els.chatStrip = m.createChatStrip();
      els.chatSlot.replaceChildren(els.chatStrip.el);
    }).catch(e => console.warn('chat', e));
    buildGames();
    if (!greeted.has(st.code)) { greeted.add(st.code); el.classList.add('greet'); accessGranted(st.code); }
    update(state);
  }

  // Game-night leaderboard across every match played in this room.
  function renderNight() {
    const rows = nightStandings(st.night, st.players);
    const sig = JSON.stringify(rows);
    if (els.night.dataset.sig === sig) return;
    els.night.dataset.sig = sig;
    els.night.hidden = !rows.length;
    if (!rows.length) { els.night.replaceChildren(); return; }
    const games = Object.keys(st.night || {}).length;
    els.night.replaceChildren(
      h('div.section-head', h('span.label', 'GAME NIGHT'), h('span.count', `${games} GAME${games === 1 ? '' : 'S'}`)),
      h('ol.night-list', rows.map(r => {
        const p = st.players[r.uid] || { name: r.name, color: 'cyan', avatar: 'ghost' };
        return h('li.night-row', { class: r.leader ? 'is-leader' : null, style: { '--c': colorHex(p.color) } },
          h('span.night-rank', r.leader ? '♛' : String(r.rank)),
          avatar(p.avatar, p.color, 26),
          h('span.night-name', p.name, h('small', `${r.wins} WIN${r.wins === 1 ? '' : 'S'} · ${r.games} PLAYED`)),
          h('span.night-pts', String(r.points)));
      })),
      h('p.night-foot.mono', '3 / 2 / 1 points for finishing 1st / 2nd / 3rd in each game.'
        + (Object.values(st.night || {}).some(e => e && e.b) ? ' Plus PRISM DROP bonuses for calling the winner.' : '')));
  }

  // Rooms close after an hour without a game; the last 10 minutes show a countdown (host: KEEP OPEN).
  function renderIdle() {
    if (!els.idle || !st || !st.meta) return;
    const left = idleLeft(st.meta, serverNow());
    const show = left <= ROOM_IDLE_WARN_MS;
    const mins = Math.max(1, Math.ceil(left / 60_000));
    const sig = show ? `${mins}|${isHost()}` : '';
    if (els.idle.dataset.sig === sig) return;
    els.idle.dataset.sig = sig;
    els.idle.hidden = !show;
    if (!show) { els.idle.replaceChildren(); return; }
    const host = isHost();
    els.idle.replaceChildren(...[
      h('p', h('b', `ROOM CLOSES IN ${mins} MIN`), h('span', host ? 'No game for almost an hour. Start one to keep the room.' : 'No game for almost an hour. Starting one keeps the room open.')),
      host ? h('button.btn.btn-ghost.btn-sm', { type: 'button', onclick: keepOpen }, 'KEEP OPEN') : null,
    ].filter(Boolean));
  }
  function keepOpen() {
    dbUpdate(dbRef(`rooms/${st.code}/meta`), { activeAt: serverTimestamp() })
      .then(() => toast('ROOM KEPT OPEN FOR ANOTHER HOUR', 'ok'))
      .catch(() => toast('COULD NOT REACH THE ROOM', 'err'));
  }

  // the button itself asks for the second tap (it lights up red for a moment), no pop-up
  let leaveArmed = 0, leaveTimer = 0;
  function confirmLeave(e) {
    const btn = e && e.currentTarget;
    if (Date.now() - leaveArmed < 2600) { leaveRoom(); return; }
    leaveArmed = Date.now();
    if (!btn) return;
    btn.classList.add('is-armed');
    btn.textContent = 'TAP AGAIN TO LEAVE';
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => { leaveArmed = 0; btn.classList.remove('is-armed'); btn.textContent = '‹ LEAVE ROOM'; }, 2600);
  }

  function buildGames() {
    clear(els.games);
    els.gameCards = {};
    for (const g of GAMES) {
      const card = h('button.game-card', {
        type: 'button', dataset: { theme: g.theme }, class: g.playable ? null : 'is-locked',
        onclick: () => pickGame(g),
      },
      gameArt(g.id) || h('div.gc-glyph', h('span', g.name.split(' ').map(w => w[0]).join(''))),
      h('div.gc-body',
        h('div.gc-tag', g.tag),
        h('div.gc-name', g.name),
        h('div.gc-blurb', g.blurb)),
      g.playable ? h('div.gc-go', '›') : h('div.gc-lock', h('span', 'LOCKED'), h('small', 'COMING SOON')));
      const wrap = h('div.game-card-wrap', card,
        h('button.gc-help', { type: 'button', 'aria-label': `How to play ${g.name}`, onclick: () => openHelp(g.id) }, '?'));
      els.gameCards[g.id] = card;
      els.games.append(wrap);
    }
  }

  // vertical single-choice list with a sub-line per choice (PULSE song picker)
  function optionList(choices, value, onChange) {
    const wrap = h('div.opt-list', { role: 'radiogroup' });
    const paint = () => [...wrap.children].forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === String(value))));
    for (const c of choices) {
      wrap.append(h('button.opt-row', { type: 'button', role: 'radio', dataset: { v: String(c.value) }, onclick: () => { value = c.value; paint(); onChange(c.value); } },
        h('span.opt-dot'), h('span.opt-label', c.label), c.sub ? h('small.opt-sub', c.sub) : null));
    }
    paint();
    return wrap;
  }

  // a grid of mode cards: icon, name, a line, the recommended player count (GRIDLOCK's modes)
  function optionCards(choices, value, onChange) {
    const wrap = h('div.opt-cards', { role: 'radiogroup' });
    const paint = () => [...wrap.children].forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === String(value))));
    for (const c of choices) {
      wrap.append(h('button.opt-card', { type: 'button', role: 'radio', dataset: { v: String(c.value) }, onclick: () => { value = c.value; paint(); onChange(c.value); } },
        c.icon ? h('span.opt-card-icon', { html: c.icon }) : null, h('span.opt-card-label', c.label), c.sub ? h('span.opt-card-sub', c.sub) : null, c.meta ? h('span.opt-card-meta', c.meta) : null));
    }
    paint();
    return wrap;
  }

  function pickGame(g) {
    if (!g.playable) { toast(`${g.name} // COMING SOON`, 'info'); return; }
    if (!isHost()) { openHelp(g.id); return; } // guests: read up while the host picks
    openOptions(g);
  }

  function openOptions(g) {
    const mod = GAME_MODULES[g.id];
    prefetch(mod.MUSIC);
    preloadSheets(g.id);   // its screen's stylesheets, so the match starts styled at once
    const saved = (st.meta && st.meta.settings && st.meta.settings[g.id]) || {};
    const settings = { ...mod.DEFAULT_SETTINGS, ...saved };
    // an option with when(players) only shows (and only applies) with that many connected players
    const shownOptions = mod.OPTIONS.filter(o => !o.when || o.when(onlineCount()));
    for (const o of mod.OPTIONS) if (!shownOptions.includes(o)) settings[o.key] = mod.DEFAULT_SETTINGS[o.key];
    const est = h('span.est');
    const renderEst = () => { est.textContent = `≈ ${mod.estimateMinutes(settings)} MIN`; };
    const startBtn = h('button.btn.btn-primary.btn-xl.btn-block', { type: 'button' }, h('span', 'INITIATE'));
    const close = () => { if (!sheet) return; sheet.classList.add('out'); const s = sheet; sheet = null; setTimeout(() => s.remove(), 260); };
    startBtn.onclick = async () => {
      const min = Math.max(MIN_PLAYERS, mod.MIN_PLAYERS || 0);
      if (onlineCount() < min) { toast(`NEED ${min}+ CONNECTED PLAYERS`, 'err'); return; }
      startBtn.classList.add('is-busy');
      startBtn.firstChild.textContent = 'BOOTING…';
      try {
        if (await startGame(g.id, settings)) close();
        else { startBtn.classList.remove('is-busy'); startBtn.firstChild.textContent = 'INITIATE'; }
      }
      catch (e) { toast(String(e.message || e).toUpperCase(), 'err'); startBtn.classList.remove('is-busy'); startBtn.firstChild.textContent = 'INITIATE'; }
    };
    sheet = h('div.modal', { dataset: { theme: g.theme }, onclick: e => { if (e.target === sheet) close(); } },
      h('div.sheet.options',
        h('div.sheet-grip'),
        h('div.sheet-kicker', g.tag),
        h('h2.sheet-title', g.name),
        h('p.sheet-text', g.blurb),
        h('button.btn.btn-text.help-link', { type: 'button', onclick: () => openHelp(g.id) }, 'HOW TO PLAY ›'),
        shownOptions.map(o => h('div.field',
          h('span.label', o.label, o.hint ? h('small.field-hint', ` · ${o.hint}`) : null),
          o.type === 'multi'
            ? chipSelect(o.choices, [].concat(settings[o.key] || []), v => { settings[o.key] = v; renderEst(); })
            : o.type === 'list'
              ? optionList(o.choices, settings[o.key], v => { settings[o.key] = v; renderEst(); })
              : o.type === 'cards'
                ? optionCards(o.choices, settings[o.key], v => { settings[o.key] = v; renderEst(); })
                : segmented(o.choices, settings[o.key], v => { settings[o.key] = v; renderEst(); }))),
        h('div.options-meta', h('span.mono.dim', 'EST. MATCH LENGTH'), est),
        startBtn,
        h('button.btn.btn-text.btn-block', { type: 'button', onclick: close }, 'CANCEL')));
    renderEst();
    document.body.append(sheet);
  }

  // a match is running and this phone stepped out of it: say so, offer to watch, keep the game list closed
  function renderLive() {
    const live = !!(st.meta && st.meta.status === 'playing' && st.game);
    els.live.hidden = !live;
    els.games.classList.toggle('is-locked', live);
    if (!live) return;
    const g = GAMES.find(x => x.id === st.game.id);
    const sig = st.game.matchId;
    if (els.live.dataset.sig === sig) return;
    els.live.dataset.sig = sig;
    els.live.replaceChildren(
      h('div.lobby-live-t', h('span.label', 'GAME IN PROGRESS'), h('b', g ? g.name : 'A GAME')),
      h('p', 'You stepped out. You’ll be dealt into the next game.'),
      h('button.btn.btn-ghost.btn-sm', { type: 'button', onclick: () => setState({ quit: null }) }, 'WATCH'));
  }

  // LOCK THE DOOR: one tap; the rules make it real (a refused seat is the only proof that matters)
  let lockBusy = false;
  async function toggleLock() {
    if (lockBusy || !isHost()) return;
    lockBusy = true;
    const on = !(st.meta && st.meta.locked === true);
    els.lock.setAttribute('aria-checked', String(on)); // feels instant; update() repaints from the room if it didn't stick
    sfx(on ? 'lock' : 'tap');
    try { await setDoorLocked(on); toast(on ? 'DOOR LOCKED' : 'DOOR OPEN', 'ok'); }
    catch (e) { toast('COULDN’T REACH THE DOOR — TRY AGAIN', 'err'); }
    lockBusy = false;
    renderLock();
  }
  function renderLock() {
    const locked = !!(st.meta && st.meta.locked === true);
    els.card.classList.toggle('is-locked', locked);
    els.lockTag.hidden = !locked;
    els.lockRow.hidden = !isHost();
    if (!lockBusy) els.lock.setAttribute('aria-checked', String(locked));
    els.lockNote.textContent = locked ? 'NO NEW PLAYERS' : 'ANYONE WITH THE WORD';
  }

  function update(state) {
    st = state;
    renderLock();
    renderLive();
    renderNight();
    renderIdle();
    const host = isHost();
    const order = playerOrder(st.players);
    els.count.textContent = `${order.length}/${MAX_PLAYERS}`;
    if (chips.size && order.some(uid => !chips.has(uid))) sfx('playerJoined');

    // keyed player list
    const seen = new Set();
    order.forEach((uid, i) => {
      seen.add(uid);
      const p = st.players[uid];
      const offline = !isOnline(st.presence, uid);
      const pub = st.pub && p.pid ? st.pub[p.pid] : null;
      const sig = JSON.stringify([p.name, p.color, p.avatar, offline, st.meta && st.meta.hostId === uid, host, kickArmed.uid === uid, pub && pub.t, pub && pub.r, uid === st.uid && pub ? [pub.x, pub.s] : null]);
      let entry = chips.get(uid);
      if (!entry || entry.sig !== sig) {
        const kickBtn = host && uid !== st.uid
          ? h('button.kick', { type: 'button', 'aria-label': `Kick ${p.name}`, onclick: () => onKick(uid) }, kickArmed.uid === uid ? 'KICK?' : '✕')
          : null;
        const chip = playerChip(p, { you: uid === st.uid, host: st.meta && st.meta.hostId === uid, offline, right: kickBtn });
        chip.classList.add('player');
        chip.dataset.uid = uid;
        if (pub && pub.r >= 3) chip.classList.add(`rk-glow-${pub.r}`);
        if (uid === st.uid && pub) {
          // you: a mini membership card (step, progress, streak); tap opens the card
          const sp = step(pub.x || 0);
          chip.classList.add('is-me-card');
          chip.style.setProperty('--rk', RANK_COLORS[sp.i]);
          chip.querySelector('.chip-body').append(h('div.chip-xp', h('span', sp.name), h('span.chip-xp-bar', h('i', { style: { transform: `scaleX(${sp.frac})` } })), pub.s >= 2 ? h('span', `${pub.s}🔥`) : null, h('span.chip-xp-card', 'CARD')));
          chip.addEventListener('click', e => { if (e.target.closest('button')) return; import('./profile.js').then(m => m.openCard()); });
        }
        if (entry) { entry.el.replaceWith(chip); }
        else chip.classList.add('enter');
        entry = { el: chip, sig };
        chips.set(uid, entry);
      }
      if (els.players.children[i] !== entry.el) els.players.insertBefore(entry.el, els.players.children[i] || null);
    });
    for (const [uid, entry] of chips) {
      if (!seen.has(uid)) { entry.el.classList.add('leave'); setTimeout(() => entry.el.remove(), 300); chips.delete(uid); }
    }
    // empty slots
    els.players.querySelectorAll('.slot-empty').forEach(n => n.remove());
    for (let i = order.length; i < Math.max(MIN_PLAYERS, Math.min(4, MAX_PLAYERS)); i++) {
      els.players.append(h('div.slot-empty', h('span', 'AWAITING SIGNAL…')));
    }

    const online = onlineCount();
    els.hint.textContent = host
      ? online < MIN_PLAYERS ? `> NEED ${MIN_PLAYERS}+ CONNECTED PLAYERS. SHARE THE HUSH WORD.` : '> YOU ARE HOST. PICK A GAME.'
      : `> WAITING FOR ${(st.players[st.meta && st.meta.hostId] || {}).name || 'HOST'} TO PICK A GAME…`;
    els.games.classList.toggle('is-guest', !host);
    if (!host && sheet) { sheet.remove(); sheet = null; }
  }

  function onKick(uid) {
    if (kickArmed.uid === uid && Date.now() - kickArmed.at < 3000) {
      kickArmed = { uid: null, at: 0 };
      kickPlayer(uid).then(() => toast('PLAYER DISCONNECTED', 'ok')).catch(() => toast('KICK FAILED', 'err'));
      return;
    }
    kickArmed = { uid, at: Date.now() };
    update(st);
    setTimeout(() => { if (kickArmed.uid === uid) { kickArmed = { uid: null, at: 0 }; update(st); } }, 3000);
  }

  // every ~20–40 s one letter of the sign gives a tiny, realistic flicker (the title does the same)
  let flickerTimer = 0, flickerStop = false;
  function scheduleFlicker() {
    if (reducedMotion()) return;
    clearTimeout(flickerTimer);
    flickerTimer = setTimeout(() => {
      if (flickerStop || !els.sign || !els.sign.isConnected) return;
      const letters = [...els.sign.querySelectorAll('.ndl')];
      const l = letters[Math.floor(Math.random() * letters.length)];
      if (l) {
        const seq = [0, 60, 95, 130, 190];
        seq.forEach((ms, k) => setTimeout(() => { if (!flickerStop) l.classList.toggle('off', !(k % 2 === 1 || k === seq.length - 1)); }, ms));
        neonTick();
      }
      scheduleFlicker();
    }, 20000 + Math.random() * 20000);
  }

  function unmount() {
    flickerStop = true; clearTimeout(flickerTimer);
    clearInterval(els.idleTimer);
    if (sheet) { sheet.remove(); sheet = null; }
    if (els.chatStrip) { els.chatStrip.destroy(); els.chatStrip = null; }
  }

  return { mount, update, unmount };
}

