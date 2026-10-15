// Gear button (fixed, every screen) + settings sheet: music / SFX volume, mute,
// haptics, and — while in a room — the room code and LEAVE ROOM.
import { h } from './dom.js';
import { toast } from './toast.js';
import { settings, updateSettings, onSettings } from '../audio/settings.js';
import { sfx } from '../audio/sfx.js';
import { state } from '../store.js';
import { leaveRoom } from '../room.js';
import { APP_NAME, APP_VERSION } from '../config.js';
import { openHelp } from './help.js';

const GEAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

let gear;
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

function toggle(label, key, invert = false) {
  const btn = h('button.switch', {
    type: 'button', role: 'switch',
    onclick: () => { updateSettings({ [key]: !settings[key] }); paint(); },
  }, h('i'));
  const paint = () => btn.setAttribute('aria-checked', String(invert ? !settings[key] : settings[key]));
  paint();
  return h('div.set-row.set-toggle', h('span.label', label), btn);
}

function open() {
  if (sheet) return;
  let leaveArmed = 0;
  const leaveBtn = state.code ? h('button.btn.btn-ghost.btn-block.btn-danger', {
    type: 'button',
    onclick: () => {
      if (Date.now() - leaveArmed < 2500) { close(); leaveRoom(); return; }
      leaveArmed = Date.now();
      leaveBtn.firstChild.textContent = 'TAP AGAIN TO LEAVE';
      setTimeout(() => { if (leaveBtn.isConnected) leaveBtn.firstChild.textContent = 'LEAVE ROOM'; }, 2500);
    },
  }, h('span', 'LEAVE ROOM')) : null;

  sheet = h('div.modal', { onclick: e => { if (e.target === sheet) close(); } },
    h('div.sheet.settings', { role: 'dialog', 'aria-label': 'Settings' },
      h('div.sheet-grip'),
      h('div.set-head', h('div', h('div.sheet-kicker', 'SYSTEM'), h('h2.sheet-title', 'AUDIO // FEEDBACK')),
        h('button.icon-btn', { type: 'button', 'aria-label': 'Close settings', onclick: close }, '×')),
      slider('MUSIC', 'music'),
      slider('EFFECTS', 'sfx'),
      toggle('MUTE ALL', 'muted'),
      toggle('HAPTICS', 'haptics'),
      h('button.btn.btn-ghost.btn-block', { type: 'button', onclick: () => { close(); openHelp(state.game && state.meta && state.meta.status === 'playing' ? state.game.id : undefined); } }, h('span', 'HOW TO PLAY')),
      state.code ? h('div.set-room', h('span.label', 'ROOM'), h('strong', state.code)) : null,
      leaveBtn,
      h('p.set-foot.mono', `${APP_NAME} // v${APP_VERSION}`)));
  document.body.append(sheet);
}

function close() {
  if (!sheet) return;
  const s = sheet;
  sheet = null;
  s.classList.add('out');
  setTimeout(() => s.remove(), 260);
}

export function installSettingsPanel() {
  gear = h('button.gear', { type: 'button', 'aria-label': 'Settings', onclick: open, html: GEAR });
  document.body.append(gear);
  const paint = () => gear.classList.toggle('is-muted', settings.muted);
  onSettings(paint);
  paint();
}

export function closeSettings() { close(); }
