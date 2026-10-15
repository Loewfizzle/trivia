// Lobby: room code + invite, live player list, host game picker.
import { h, clear } from '../ui/dom.js';
import { playerChip, segmented, chips as chipSelect, accessGranted } from '../ui/components.js';
import { toast } from '../ui/toast.js';
import { APP_NAME, GAMES, MAX_PLAYERS, MIN_PLAYERS } from '../config.js';
import { isHost } from '../store.js';
import { playerOrder, isOnline } from '../core/room-logic.js';
import { leaveRoom, kickPlayer } from '../room.js';
import { startGame, onlineCount } from '../host.js';
import { GAME_MODULES } from '../games/registry.js';
import { slot } from '../identity.js';
import { sfx } from '../audio/sfx.js';
import { prefetch } from '../audio/music.js';

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
    el.append(
      h('header.lobby-head',
        h('div.lobby-room',
          h('span.label', 'ROOM CODE'),
          els.code),
        h('div.lobby-actions',
          h('button.btn.btn-primary.btn-sm', { type: 'button', onclick: share }, '⇪ SHARE INVITE'),
          h('button.btn.btn-ghost.btn-sm', { type: 'button', onclick: () => copy(inviteUrl()) }, 'COPY LINK'))),
      h('section.lobby-section',
        h('div.section-head', h('span.label', 'OPERATIVES'), els.count),
        els.players),
      h('section.lobby-section',
        h('div.section-head', h('span.label', 'SELECT PROTOCOL')),
        els.hint,
        els.games),
      h('div.lobby-foot',
        h('button.btn.btn-text', { type: 'button', onclick: confirmLeave }, 'LEAVE ROOM'),
        slot !== '1' ? h('span.tag.tag-you', `TEST SLOT ${slot}`) : null),
    );
    buildGames();
    if (!greeted.has(st.code)) { greeted.add(st.code); el.classList.add('greet'); accessGranted(st.code); }
    update(state);
  }

  let leaveArmed = 0;
  function confirmLeave() {
    if (Date.now() - leaveArmed < 2500) { leaveRoom(); return; }
    leaveArmed = Date.now();
    toast('TAP AGAIN TO LEAVE', 'warn', 2400);
  }

  function buildGames() {
    clear(els.games);
    els.gameCards = {};
    for (const g of GAMES) {
      const card = h('button.game-card', {
        type: 'button', dataset: { theme: g.theme }, class: g.playable ? null : 'is-locked',
        onclick: () => pickGame(g),
      },
      h('div.gc-glyph', h('span', g.name.split(' ').map(w => w[0]).join(''))),
      h('div.gc-body',
        h('div.gc-tag', g.tag),
        h('div.gc-name', g.name),
        h('div.gc-blurb', g.blurb)),
      g.playable ? h('div.gc-go', '›') : h('div.gc-lock', h('span', 'LOCKED'), h('small', 'COMING SOON')));
      els.gameCards[g.id] = card;
      els.games.append(card);
    }
  }

  function pickGame(g) {
    if (!g.playable) { toast(`${g.name} // COMING SOON`, 'info'); return; }
    if (!isHost()) { toast('ONLY THE HOST PICKS THE GAME', 'info'); return; }
    openOptions(g);
  }

  function openOptions(g) {
    const mod = GAME_MODULES[g.id];
    prefetch(mod.MUSIC);
    const saved = (st.meta && st.meta.settings && st.meta.settings[g.id]) || {};
    const settings = { ...mod.DEFAULT_SETTINGS, ...saved };
    const est = h('span.est');
    const renderEst = () => { est.textContent = `≈ ${mod.estimateMinutes(settings)} MIN`; };
    const startBtn = h('button.btn.btn-primary.btn-xl.btn-block', { type: 'button' }, h('span', 'INITIATE'));
    const close = () => { if (!sheet) return; sheet.classList.add('out'); const s = sheet; sheet = null; setTimeout(() => s.remove(), 260); };
    startBtn.onclick = async () => {
      if (onlineCount() < MIN_PLAYERS) { toast(`NEED ${MIN_PLAYERS}+ CONNECTED PLAYERS`, 'err'); return; }
      startBtn.classList.add('is-busy');
      startBtn.firstChild.textContent = 'BOOTING…';
      try { await startGame(g.id, settings); close(); }
      catch (e) { toast(String(e.message || e).toUpperCase(), 'err'); startBtn.classList.remove('is-busy'); startBtn.firstChild.textContent = 'INITIATE'; }
    };
    sheet = h('div.modal', { dataset: { theme: g.theme }, onclick: e => { if (e.target === sheet) close(); } },
      h('div.sheet.options',
        h('div.sheet-grip'),
        h('div.sheet-kicker', g.tag),
        h('h2.sheet-title', g.name),
        h('p.sheet-text', g.blurb),
        mod.OPTIONS.map(o => h('div.field',
          h('span.label', o.label, o.hint ? h('small.field-hint', ` · ${o.hint}`) : null),
          o.type === 'multi'
            ? chipSelect(o.choices, [].concat(settings[o.key] || []), v => { settings[o.key] = v; renderEst(); })
            : segmented(o.choices, settings[o.key], v => { settings[o.key] = v; renderEst(); }))),
        h('div.options-meta', h('span.mono.dim', 'EST. MATCH LENGTH'), est),
        startBtn,
        h('button.btn.btn-text.btn-block', { type: 'button', onclick: close }, 'CANCEL')));
    renderEst();
    document.body.append(sheet);
  }

  function update(state) {
    st = state;
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
    if (sheet) { sheet.remove(); sheet = null; }
  }

  return { mount, update, unmount };
}

