// Gear button (fixed, every screen) + settings sheet: music / SFX volume, mute,
// haptics, and — while in a room — the hush word and LEAVE ROOM.
import { h } from './dom.js';
import { onCloseAll } from './layers.js';
import { toast } from './toast.js';
import { settings, updateSettings, onSettings } from '../audio/settings.js';
import { sfx } from '../audio/sfx.js';
import { state, isHost, setState } from '../store.js';
import { dbRef, update } from '../firebase.js';
import { leaveRoom } from '../room.js';
import { colorHex, GAMES } from '../config.js';
import { openHelp } from './help.js';
import { segmented, row, tubeButton } from './components.js';
import { openSheet } from './sheet.js';
import { loadProfile } from '../identity.js';
import { MOOD_CHOICES, MOOD_LABEL, moodNow } from '../audio/mood.js';
import { musicNeedsRescue } from '../audio/music.js';
import { metaOf } from '../games/registry.js';
import { lookLockOf } from '../games/cartridge.js';

const GEAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

// (POLISH 5: the OFF look says it — the note dimmed + a crisp slash with a dark edge under it, readable on a bright day sky)
const NOTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><g class="nt"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></g><path class="slash-bg" d="M4 4l16 16"/><path class="slash" d="M4 4l16 16"/></svg>';

let gear;
let musicBtn;
let sheet = null;

function slider(label, key) {
  const out = h('span.set-val');
  const input = h('input.range', {
    type: 'range', min: '0', max: '100', step: '1', value: String(Math.round(settings[key] * 100)), 'aria-label': label,
    oninput: e => { updateSettings({ [key]: Number(e.target.value) / 100 }); paint(); },
    onchange: () => { if (key === 'sfx') sfx('shimmer'); },
  });
  const paint = () => {
    out.textContent = String(Math.round(settings[key] * 100)).padStart(2, '0');
    input.style.setProperty('--p', `${settings[key] * 100}%`);
  };
  paint();
  return h('label.set-row', h('span.label', label), out, input);
}

// MODELS — SPEAKER DELAY: a TV, a soundbar or a Bluetooth speaker adds its own delay the browser can't see; two devices on the same
// station (the same song on the server clock) then sound a beat apart. This device's songs play that much earlier (audio/synced-songs.js).
function speakerRow() {
  const seg = segmented([0, 50, 100, 200, 300].map(v => ({ value: String(v), label: v ? String(v) : 'OFF' })), String(settings.speakerDelay || 0), v => updateSettings({ speakerDelay: Number(v) || 0 }));
  return h('div.set-row.set-mood', h('span.label', 'SPEAKER DELAY (MS)'), seg, h('span.set-hint', 'ON A TV OR SOUNDBAR? IF ITS MUSIC LAGS A PHONE’S, RAISE THIS'));
}
// MUSIC MOOD (both cities): AUTO follows the time of day; a chosen mood plays from that mood's deck in the city that's showing.
// In a lobby the room's song follows the HOST's choice.
function moodRow() {
  const seg = segmented(MOOD_CHOICES.map(v => ({ value: v, label: MOOD_LABEL[v] })), settings.musicMood || 'auto', v => { updateSettings({ musicMood: v }); hint.textContent = hintText(); });
  seg.classList.add('set-mood-seg');
  const hintText = () => (state.code && !isHost() ? 'IN A ROOM THE HOST’S MOOD PLAYS FOR EVERYONE' : (settings.musicMood || 'auto') === 'auto' ? `AUTO FOLLOWS THE TIME OF DAY · NOW ${MOOD_LABEL[moodNow()]}` : 'AUTO GOES BACK TO THE TIME OF DAY');
  const hint = h('span.set-hint', hintText());
  return h('div.set-row.set-mood', h('span.label', 'MUSIC MOOD'), seg, hint);
}

// (SHELL 2.0 A — THE ROW's toggle: the pink neon switch)
function toggle(label, key, invert = false, icon = null) {
  return row({ icon, label, toggle: next => updateSettings({ [key]: invert ? !next : next }), on: invert ? !settings[key] : !!settings[key] });
}

// Host-only chat moderation: "Filter language" (masks profanity on every phone) and "Clear chat" (a second tap confirms — the button itself).
function chatHostRows() {
  if (!state.code || !isHost()) return [];
  const filterOn = () => !!(state.meta && state.meta.settings && state.meta.settings.chat && state.meta.settings.chat.filter);
  const sw = row({ icon: 'chat', label: 'Filter language', on: filterOn(), toggle: next => {
    update(dbRef(`rooms/${state.code}/meta/settings`), { chat: { filter: next } }).catch(e => toast(String(e.message || e), 'err'));
  } });
  const clear = tubeButton('CLEAR CHAT', { kind: 'danger', block: true, confirm: 'TAP AGAIN TO CLEAR THE CHAT', onClick: () => {
    clear.firstChild.textContent = 'CLEARING…';
    import('../chat/chat.js').then(m => m.clearChat()).then(() => { clear.firstChild.textContent = 'CHAT CLEARED'; });
  } });
  return [h('div.sh-sub', 'CHAT · HOST'), sw, clear];
}

// SETTINGS (SHELL 2.0 A — THE SHEET + THE ROWS): sound first, then this phone, the playable games' own controls, the host's chat, the hush
// word, CREDITS last. The menu's rows (LEAVE ROOM, QUIT, END GAME, HOW TO PLAY) live in the ☰ menu only.
/** THE GAME LOOK (games/kit/look.js — lazy: the row fills in once the tiny module is in; AUTO until then) */
function gameLookRow() {
  // (OC1 — THE LOOKS: a game with ONE look plays in it whatever this says — while it's on screen the row says LOCKED + why, never hidden)
  const g = state.game, on = !!(g && state.meta && state.meta.status === 'playing' && state.quit !== g.matchId);
  const lock = on ? lookLockOf(metaOf(g.id)) : null;
  if (lock) {
    const name = (GAMES.find(x => x.id === g.id) || {}).name || 'THIS GAME';
    return h('div.set-row.set-seg.set-look.is-locked',
      h('span.label', 'GAME LOOK'),
      h('span.set-val.set-look-lock', `${lock.toUpperCase()} · LOCKED`),
      h('span.set-hint.set-look-note', `${name} plays at ${lock}`));
  }
  const el = h('div.set-row.set-seg.set-look', h('span.label', 'GAME LOOK'));
  import('../games/kit/look.js').then(LK => {
    el.append(segmented(LK.LOOKS.map(v => ({ value: v, label: LK.LOOK_LABEL[v] })), LK.currentLook(), v => LK.saveLook(v)));
  }).catch(() => {});
  return el;
}
function open() {
  if (sheet) return;
  const playable = id => GAMES.some(g => g.id === id && g.playable);
  sheet = openSheet({ title: 'SETTINGS', cls: 'settings', label: 'Settings', onClose: () => { sheet = null; }, body: [
    h('div.sh-sub', 'SOUND'),
    toggle('Music', 'musicOff', true, 'music'),
    slider('MUSIC VOLUME', 'music'),
    h('div.set-row.set-seg', h('span.label', 'MENU MUSIC'), segmented([{ value: 'mood', label: 'BY TIME' }, { value: 'classic', label: 'CLASSIC' }], settings.menuMusic || 'mood', v => updateSettings({ menuMusic: v }))),
    moodRow(),
    speakerRow(),
    toggle('Sound effects', 'sfxOff', true, 'sound'),
    slider('EFFECTS VOLUME', 'sfx'),
    toggle('Mute everything', 'muted', false, 'sound'),
    h('div.sh-sub', 'THIS PHONE'),
    toggle('Haptics', 'haptics'),
    toggle('Reduced effects', 'reducedFx'),
    toggle('Colour-blind colours', 'colorBlind'),   // (SHELL 2.0 B1 — right in BLUE, close in ORANGE in every game: ui/colorblind.js)
    // (SHELL 2.0 B2 — THE GAME LOOK: AUTO = the real sun · DAY · NIGHT, this phone only, no lock — a change mid-game re-themes at once)
    gameLookRow(),
    toggle('Always night', 'alwaysNight'),
    ...(playable('prism') ? [
      h('div.sh-sub', 'PRISM DROP'),
      h('div.set-row.set-seg', h('span.label', 'CONTROLS'), segmented([{ value: 'gesture', label: 'GESTURES' }, { value: 'buttons', label: 'BUTTONS' }], settings.prismScheme || 'gesture', v => updateSettings({ prismScheme: v }))),
      slider('SWIPE SENSITIVITY', 'prismSens'),
      slider('BUTTON SIZE', 'prismBtn'),
      h('div.set-row.set-seg', h('span.label', 'SLAM BUTTON'), segmented([{ value: 'left', label: 'LEFT' }, { value: 'right', label: 'RIGHT' }], settings.prismSlam || 'right', v => updateSettings({ prismSlam: v }))),
      toggle('Swipe-down slam', 'prismFlick')] : []),
    ...(playable('slip') ? [h('div.sh-sub', 'SLIPSTREAM'), row({ label: 'Your ride', onClick: () => { close(); const me = state.players && state.players[state.uid]; import('../games/slip/ride.js').then(m => m.openRidePicker({ color: colorHex(me ? me.color : 'cyan') })); } })] : []),
    ...(playable('pulse') ? [h('div.sh-sub', 'PULSE'), toggle('Hit sounds', 'pulseHits'), row({ label: 'Recalibrate audio sync', onClick: () => { close(); import('../games/pulse/calibrate.js').then(m => m.openCalibration({ reason: 'PULSE · RECALIBRATE (DO THIS AFTER SWITCHING HEADPHONES)' })); } })] : []),
    ...chatHostRows(),
    state.code ? h('div.set-room', h('span.label', 'HUSH WORD'), h('strong', state.code)) : null,
    h('div.sh-sub', 'ABOUT'),
    row({ icon: 'credits', label: 'Credits', onClick: () => { import('./credits.js').then(m => m.openCredits()).catch(() => {}); } }),
  ] });
}

function close() { if (sheet) sheet.close(); }

export function installSettingsPanel() {
  gear = h('button.gear', { type: 'button', 'aria-label': 'Settings', onclick: open, html: GEAR });
  document.body.append(gear);
  // one-tap music on/off: next to the gear on the title, setup and lobby; under the chat button in a game (components.css)
  musicBtn = h('button.music-btn', { type: 'button', html: NOTE, onclick: () => {
    // the music was meant to be ON but had gone quiet (iOS after leaving Safari, a call, the lock screen): this tap brings it back
    // (audio/music.js#musicNeedsRescue restarts it inside the tap) instead of switching it off
    // (POLISH 5, the owner: NO toast — the "MUSIC OFF / ON" pill covered the neon race the tap fires, and you HEAR the change; the
    // button's own look says it, a screen reader hears it (an aria-live line, nothing visual). The one exception: ALL sound muted in
    // settings — a tap that can't play anything shows a short hint in the corner row, clear of the sign)
    if (settings.muted) { mutedHint(); return; }
    if (musicNeedsRescue()) { say('Music on'); return; }
    updateSettings({ musicOff: !settings.musicOff });
    if (!settings.musicOff) musicNeedsRescue();     // switched on: make sure it really plays (still inside the tap)
    say(settings.musicOff ? 'Music off. Effects stay on.' : 'Music on');
  } });
  document.body.append(musicBtn);
  installGameMenu();
  const paint = () => {
    gear.classList.toggle('is-muted', settings.muted);
    musicBtn.classList.toggle('is-off', settings.musicOff || settings.muted);
    musicBtn.setAttribute('aria-pressed', String(!settings.musicOff));
    musicBtn.setAttribute('aria-label', settings.musicOff ? 'Music off — tap to turn it on' : 'Music on — tap to turn it off');
  };
  onSettings(paint);
  paint();
}

export function closeSettings() { close(); }

// POLISH 5 — the music button's words for screen readers only (visually hidden), and the muted hint
let sr = null, hint = null, hintT = 0;
function say(text) {
  if (!sr) { sr = h('div.mh-sr', { role: 'status', 'aria-live': 'polite' }); document.body.append(sr); }
  sr.textContent = '';
  requestAnimationFrame(() => { if (sr) sr.textContent = text; });
}
/** ALL sound is muted: the tap can't play anything — "SOUND IS OFF — SETTINGS" beside the button for 2.6 s (a tap opens settings) */
function mutedHint() {
  say('All sound is muted. Turn it on in settings.');
  if (!hint) { hint = h('button.mh-hint', { type: 'button', onclick: () => { hideHint(); open(); } }, 'SOUND IS OFF — SETTINGS'); document.body.append(hint); }
  hint.classList.remove('is-out'); requestAnimationFrame(() => hint && hint.classList.add('is-in'));
  clearTimeout(hintT); hintT = setTimeout(hideHint, 2600);
}
function hideHint() { if (!hint) return; const el = hint; hint = null; el.classList.remove('is-in'); el.classList.add('is-out'); setTimeout(() => el.remove(), 300); }

// ---------------------------------------------------------------- the in-game menu
// In a game the corner holds two buttons: ☰ (this menu) and the music on/off. The menu drops down a glass panel with
// CHAT (unread count; locked during play in some games), HOW TO PLAY, SETTINGS and THIS GAME (QUIT TO LOBBY, and for
// the host END GAME FOR EVERYONE). Outside games the title, lobby and THE BOARD keep the gear + music pair.
let menuBtn = null, menuPanel = null, chatMod = null, chatUi = null, cueEl = null, cueKind = null;
// 9d — EXTRA ROWS at the menu's BOTTOM + a CUE on ☰ (the owner: "move the TEST pill into the menu … at the bottom, call it ADMIN —
// that way it's not taking up anything on my screen"): the Harbor's preview panel registers its ADMIN row here (admins only), and
// while a preview is on, a small coloured dot on ☰ says so (JUST ME green, EVERYONE pink) — never a forced city mistaken for the real one
const menuExtras = new Map();
/** a row for the menu's bottom: render({ close }) → an element (or null), or null to remove it */
export function setMenuExtra(id, render) { if (render) menuExtras.set(id, render); else menuExtras.delete(id); }
/** the cue on ☰: 'me' | 'all' | null */
export function setMenuCue(kind) { cueKind = kind || null; if (cueEl) { cueEl.hidden = !cueKind; cueEl.dataset.k = cueKind || ''; } if (menuBtn) menuBtn.setAttribute('aria-label', cueKind ? `Menu — a preview is on (${cueKind === 'me' ? 'just me' : 'everyone'})` : 'Menu'); }
function installGameMenu() {
  const dot = h('i.mb-dot', { hidden: true });
  cueEl = h('i.mb-cue', { hidden: !cueKind, dataset: { k: cueKind || '' }, 'aria-hidden': 'true' });
  menuBtn = h('button.menu-btn', { type: 'button', 'aria-label': 'Menu', 'aria-expanded': 'false', onclick: () => (menuPanel ? closeMenu() : openMenu()) },
    h('span.mb-bars', h('i'), h('i'), h('i')), dot, cueEl);
  document.body.append(menuBtn);
  import('../chat/chat.js').then(m => {
    chatMod = m;
    const paintDot = () => { dot.hidden = !m.chat.unread || m.locked(); };   // (THE CHAT LOCK: no unread dot for a chat you can't open)
    m.onChat(paintDot);
    paintDot();
  }).catch(() => {});
  import('../chat/ui.js').then(m => { chatUi = m; }).catch(() => {});
}

// THE ☰ MENU (SHELL 2.0 A — docs/harbor/refs/shell/shell-look.png): THE SHEET with big glass rows — Your card (your name on the right) ·
// How to play · Settings · Sound effects (a toggle) · The Lab (admins: "N need you") · Admin (admins — the server said so) · Leave room (in a
// room: the red-edged danger row, a second tap confirms). In a game: CHAT (HIDDEN while the game locks chat — never greyed) + the game's rows
// (QUIT TO THE ROOM, the host's END GAME).
function myName() {
  const p = state.code && state.players && state.players[state.uid];
  if (p && p.name) return String(p.name).toUpperCase();
  const lp = loadProfile();
  return lp && lp.name ? String(lp.name).toUpperCase() : '';
}
function openMenu() {
  menuReturn = false;
  if (menuPanel) return;
  const inRoom = !!state.code;
  const playing = inRoom && state.meta && state.meta.status === 'playing' && state.game && state.quit !== state.game.matchId;
  const rows = [];
  // (THE CHAT LOCK — SHELL 2.0 A: a game that locks chat HIDES the row for the match; DOUBLE AGENT's same-room mode has its own chat)
  if (playing && !document.body.classList.contains('da-inline-chat') && chatMod && chatUi && !chatMod.locked()) {
    const n = chatMod.chat.unread;
    rows.push(row({ icon: 'chat', label: 'Chat', value: n ? `${Math.min(99, n)} new` : null, cls: 'gm-chat', onClick: () => { closeMenu(); chatUi.openChat(); } }));
  }
  // (SHELL 2.0 B1 — ‹ BACK ON EVERY NESTED SHEET, the owner 9:15 am: SHELL 2.0 A closed the menu before opening these, so they came up
  //  top-level with only an ×. HOW TO PLAY + SETTINGS now open ON the menu (‹ = back to it, × = everything); YOUR CARD is a full screen —
  //  the menu steps aside and the card's own ‹ BACK brings it back (backToMenu))
  rows.push(row({ icon: 'card', label: 'Your card', value: myName(), cls: 'gm-card', onClick: () => { closeMenu(); menuReturn = true; if (inRoom) import('../screens/profile.js').then(m => m.openCard()); else setState({ view: 'profile' }); } }));
  rows.push(row({ icon: 'help', ic: '#5fe3ff', label: 'How to play', cls: 'gm-help', onClick: () => { openHelp(playing ? state.game.id : undefined); } }));
  rows.push(row({ icon: 'settings', ic: '#b48cff', label: 'Settings', cls: 'gm-settings', onClick: () => { open(); } }));
  rows.push(row({ icon: 'sound', ic: '#4dff9a', label: 'Sound effects', cls: 'gm-sfx', on: !settings.sfxOff && !settings.muted, toggle: next => updateSettings(next ? { sfxOff: false, muted: false } : { sfxOff: true }) }));
  // (9d: the registered extras — THE LAB, ADMIN, the CITY PREVIEW (admins only, after the server said so) — outside a game)
  if (!playing) for (const render of menuExtras.values()) { let el = null; try { el = render({ close: closeMenu }); } catch { el = null; } if (el) rows.push(el); }
  if (playing) {
    rows.push(row({ icon: 'quit', ic: '#ffc23d', label: 'Quit to the room', sub: 'The others keep playing', cls: 'gm-quit', confirm: 'TAP AGAIN TO QUIT', onClick: () => { closeMenu(); setState({ quit: state.game.matchId }); toast('You left the game', 'info', { ms: 3200, sub: 'You’ll be dealt into the next one.' }); } }));
    if (isHost()) rows.push(row({ icon: 'end', label: 'End game for everyone', danger: true, cls: 'gm-end', confirm: 'TAP AGAIN TO END IT', onClick: () => { closeMenu(); import('../host.js').then(m => m.backToLobby()); } }));
  } else if (inRoom) {
    // (LOBBY 2.0 B — the owner's ADD-ON: LEAVE ROOM in the menu while in a room — red-edged, a second tap confirms; not during a match: QUIT first)
    rows.push(row({ icon: 'leave', label: 'Leave room', danger: true, cls: 'gm-leave', confirm: 'TAP AGAIN TO LEAVE', onClick: () => { closeMenu(); leaveRoom(); } }));
  }
  menuPanel = openSheet({ title: 'MENU', cls: 'gm', label: 'Menu', onClose: () => { menuPanel = null; paintBtn(false); }, body: h('div.sh-row-list', ...rows) });
  paintBtn(true);
}
function paintBtn(on) { if (!menuBtn) return; menuBtn.setAttribute('aria-expanded', String(on)); menuBtn.classList.toggle('is-open', on); }
function closeMenu() { if (menuPanel) menuPanel.close(); }
export { closeMenu };
// (a full screen opened from the menu — YOUR CARD — calls this from its ‹ BACK: true = the menu is back on top)
let menuReturn = false;
export function backToMenu() { if (!menuReturn) return false; menuReturn = false; openMenu(); return true; }
export function forgetMenuReturn() { menuReturn = false; }
onCloseAll(() => { closeMenu(); forgetMenuReturn(); });   // (FR6 FIXES A — B1: the ☰ menu closes at the game start)
