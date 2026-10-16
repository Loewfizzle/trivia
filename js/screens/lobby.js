// Lobby: room code + invite, live player list, host game picker.
import { h, clear } from '../ui/dom.js';
import { playerChip, segmented, chips as chipSelect, accessGranted, avatar } from '../ui/components.js';
import { nightStandings } from '../core/night.js';
import { colorHex } from '../config.js';
import { toast } from '../ui/toast.js';
import { APP_NAME, GAMES, MAX_PLAYERS, MIN_PLAYERS } from '../config.js';
import { isHost } from '../store.js';
import { playerOrder, isOnline } from '../core/room-logic.js';
import { leaveRoom, kickPlayer } from '../room.js';
import { startGame, onlineCount } from '../host.js';
import { GAME_MODULES } from '../games/registry.js';
import { slot } from '../identity.js';
import { openHelp } from '../ui/help.js';
import { sfx } from '../audio/sfx.js';
import { prefetch } from '../audio/music.js';
import { svgEl } from '../ui/dom.js';

// PULSE card art: a neon highway running into a violet horizon, notes riding it (static SVG, no images)
const PULSE_ART = `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
<linearGradient id="pa-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07051a"/><stop offset="0.42" stop-color="#2a1458"/><stop offset="0.46" stop-color="#4b2a8f"/><stop offset="1" stop-color="#05040d"/></linearGradient>
<radialGradient id="pa-sun" cx="0.5" cy="0.44" r="0.4"><stop offset="0" stop-color="#c79bff" stop-opacity="0.9"/><stop offset="1" stop-color="#7c5cff" stop-opacity="0"/></radialGradient>
<linearGradient id="pa-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1238"/><stop offset="1" stop-color="#0a0816"/></linearGradient>
<filter id="pa-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
<rect width="120" height="120" fill="url(#pa-sky)"/><rect width="120" height="120" fill="url(#pa-sun)"/>
<path d="M4 53h8v-14h6v14h5v-22h7v22h6v-9h5v9h8v-17h6v17h4v-26h6v26h6v-12h5v12h8v-19h7v19h8v-10h6v10h4v1H4z" fill="#140c2c"/>
<path d="M60 53 L-10 120 H130 Z" fill="url(#pa-road)"/>
<g stroke-linecap="round" fill="none"><path d="M60 53 L-10 120 M60 53 L130 120" stroke="#36e6ff" stroke-width="1.6" filter="url(#pa-glow)" opacity="0.9"/>
<path d="M60 53 L-10 120 M60 53 L130 120" stroke="#bff6ff" stroke-width="0.7"/>
<path d="M60 53 L37 120 M60 53 L83 120" stroke="#8a72ff" stroke-width="0.8" opacity="0.7"/></g>
<g filter="url(#pa-glow)"><rect x="47" y="70" width="11" height="3" rx="1.5" fill="#a374ff"/><rect x="64" y="88" width="17" height="4.5" rx="2.2" fill="#36e6ff"/><rect x="20" y="104" width="24" height="6" rx="3" fill="#a374ff"/></g>
<rect x="47" y="70" width="11" height="3" rx="1.5" fill="#efe6ff"/><rect x="64" y="88" width="17" height="4.5" rx="2.2" fill="#e8fdff"/><rect x="20" y="104" width="24" height="6" rx="3" fill="#efe6ff"/>
<path d="M0 53.5h120" stroke="#d9c4ff" stroke-width="0.6" opacity="0.8"/></svg>`;
const pulseArt = () => h('div.gc-glyph.gc-art', svgEl(PULSE_ART));

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
    els.night = h('section.lobby-section.night');
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
      els.night,
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
      h('p.night-foot.mono', '3 / 2 / 1 points for finishing 1st / 2nd / 3rd in each game.'));
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
      g.art === 'pulse' ? pulseArt() : h('div.gc-glyph', h('span', g.name.split(' ').map(w => w[0]).join(''))),
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
    const est = h('span.est');
    const renderEst = () => { est.textContent = `≈ ${mod.estimateMinutes(settings)} MIN`; };
    const startBtn = h('button.btn.btn-primary.btn-xl.btn-block', { type: 'button' }, h('span', 'INITIATE'));
    const close = () => { if (!sheet) return; sheet.classList.add('out'); const s = sheet; sheet = null; setTimeout(() => s.remove(), 260); };
    startBtn.onclick = async () => {
      if (onlineCount() < MIN_PLAYERS) { toast(`NEED ${MIN_PLAYERS}+ CONNECTED PLAYERS`, 'err'); return; }
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
        mod.OPTIONS.map(o => h('div.field',
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

