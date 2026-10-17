// Lobby: room code + invite, live player list, host game picker.
import { h, clear } from '../ui/dom.js';
import { playerChip, segmented, chips as chipSelect, accessGranted, avatar } from '../ui/components.js';
import { nightStandings } from '../core/night.js';
import { colorHex } from '../config.js';
import { toast } from '../ui/toast.js';
import { APP_NAME, GAMES, MAX_PLAYERS, MIN_PLAYERS } from '../config.js';
import { isHost } from '../store.js';
import { playerOrder, isOnline, idleLeft } from '../core/room-logic.js';
import { ROOM_IDLE_WARN_MS } from '../config.js';
import { dbRef, update as dbUpdate, serverTimestamp, serverNow } from '../firebase.js';
import { leaveRoom, kickPlayer } from '../room.js';
import { startGame, onlineCount } from '../host.js';
import { GAME_MODULES } from '../games/registry.js';
import { slot } from '../identity.js';
import { openHelp } from '../ui/help.js';
import { sfx } from '../audio/sfx.js';
import { prefetch } from '../audio/music.js';
import { gameArt } from '../ui/game-art.js';
import { logoSvg } from '../ui/logo.js';

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
    const text = `Join my ${APP_NAME} room ${st.code}`;
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
    els.code = h('button.room-code', { type: 'button', 'aria-label': `Room code ${st.code}, tap to copy invite link`, onclick: () => copy(inviteUrl()) },
      [...st.code].map((ch, i) => h('span', { style: { '--i': i } }, ch)));
    els.count = h('span.count');
    els.players = h('div.players');
    els.games = h('div.games');
    els.hint = h('p.lobby-hint.mono');
    els.idle = h('div.lobby-idle', { hidden: true, role: 'status' });
    els.idleTimer = setInterval(renderIdle, 5000);
    els.night = h('section.lobby-section.night');
    el.append(
      h('button.btn.btn-ghost.btn-sm.lobby-leave', { type: 'button', onclick: confirmLeave, 'aria-label': 'Leave room' }, '‹ LEAVE ROOM'),
      h('header.lobby-head',
        h('div.nd-mini', { 'aria-label': APP_NAME, role: 'img' }, h('div.nd-logo-wrap', { html: logoSvg({ id: 'ndl', lit: true, clips: false, blur: 0.7 }) }), h('div.nd-word', 'SPEAKEASY')),
        h('div.lobby-room',
          h('span.label', 'ROOM CODE'),
          els.code),
        h('div.lobby-actions',
          h('button.btn.btn-primary.btn-sm', { type: 'button', onclick: share }, '⇪ SHARE INVITE'),
          h('button.btn.btn-ghost.btn-sm', { type: 'button', onclick: () => copy(inviteUrl()) }, 'COPY LINK'))),
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

  function pickGame(g) {
    if (!g.playable) { toast(`${g.name} // COMING SOON`, 'info'); return; }
    if (!isHost()) { openHelp(g.id); return; } // guests: read up while the host picks
    openOptions(g);
  }

  function openOptions(g) {
    const mod = GAME_MODULES[g.id];
    prefetch(mod.MUSIC);
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
              : segmented(o.choices, settings[o.key], v => { settings[o.key] = v; renderEst(); }))),
        h('div.options-meta', h('span.mono.dim', 'EST. MATCH LENGTH'), est),
        startBtn,
        h('button.btn.btn-text.btn-block', { type: 'button', onclick: close }, 'CANCEL')));
    renderEst();
    document.body.append(sheet);
  }

  function update(state) {
    st = state;
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
      const sig = JSON.stringify([p.name, p.color, p.avatar, offline, st.meta && st.meta.hostId === uid, host, kickArmed.uid === uid]);
      let entry = chips.get(uid);
      if (!entry || entry.sig !== sig) {
        const kickBtn = host && uid !== st.uid
          ? h('button.kick', { type: 'button', 'aria-label': `Kick ${p.name}`, onclick: () => onKick(uid) }, kickArmed.uid === uid ? 'KICK?' : '✕')
          : null;
        const chip = playerChip(p, { you: uid === st.uid, host: st.meta && st.meta.hostId === uid, offline, right: kickBtn });
        chip.classList.add('player');
        chip.dataset.uid = uid;
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
      ? online < MIN_PLAYERS ? `> NEED ${MIN_PLAYERS}+ CONNECTED PLAYERS. SHARE THE CODE.` : '> YOU ARE HOST. PICK A GAME.'
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

  function unmount() {
    clearInterval(els.idleTimer);
    if (sheet) { sheet.remove(); sheet = null; }
    if (els.chatStrip) { els.chatStrip.destroy(); els.chatStrip = null; }
  }

  return { mount, update, unmount };
}

