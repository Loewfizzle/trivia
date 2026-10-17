// Host / join form: name, color, avatar (+ room code when joining).
import { h } from '../ui/dom.js';
import { avatar } from '../ui/components.js';
import { toast } from '../ui/toast.js';
import { sfx } from '../audio/sfx.js';
import { COLORS, AVATAR_IDS, NAME_MAX, colorHex } from '../config.js';
import { setState } from '../store.js';
import { loadProfile, saveProfile } from '../identity.js';
import { createRoom, joinRoom } from '../room.js';
import { firebaseReady } from '../firebase.js';
import { normalizeCode, sanitizeName } from '../core/room-logic.js';

export function createSetup() {
  let profile, mode, busy = false;
  let els = {};

  function mount(el, st) {
    mode = st.setupMode;
    const saved = loadProfile() || {};
    profile = {
      name: saved.name || '',
      color: saved.color || COLORS[Math.floor(Math.random() * COLORS.length)].id,
      avatar: saved.avatar || AVATAR_IDS[Math.floor(Math.random() * AVATAR_IDS.length)],
    };
    el.classList.add('setup-screen');

    els.code = h('input.input.input-code', {
      type: 'text', inputmode: 'text', autocapitalize: 'characters', autocomplete: 'off', autocorrect: 'off', spellcheck: false,
      maxLength: 4, placeholder: '····', 'aria-label': 'Room code', value: st.invite || '',
      oninput: e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); },
    });
    els.name = h('input.input', {
      type: 'text', maxLength: NAME_MAX, placeholder: 'CALLSIGN', autocomplete: 'nickname', autocapitalize: 'characters',
      spellcheck: false, value: profile.name, 'aria-label': 'Display name',
      oninput: e => { profile.name = e.target.value; renderPreview(); },
      onkeydown: e => { if (e.key === 'Enter') e.target.blur(); },
    });
    els.colors = h('div.swatches', { role: 'radiogroup', 'aria-label': 'Color' });
    for (const c of COLORS) {
      els.colors.append(h('button.swatch', {
        type: 'button', role: 'radio', 'aria-label': c.id, dataset: { id: c.id }, style: { '--c': c.hex },
        onclick: () => { profile.color = c.id; renderPicks(); },
      }));
    }
    els.avatars = h('div.avatars', { role: 'radiogroup', 'aria-label': 'Avatar' });
    for (const id of AVATAR_IDS) {
      els.avatars.append(h('button.avatar-pick', {
        type: 'button', role: 'radio', 'aria-label': id, dataset: { id },
        onclick: () => { profile.avatar = id; renderPicks(); },
      }));
    }
    els.preview = h('div.preview');
    els.go = h('button.btn.btn-primary.btn-xl.btn-block', { type: 'button', onclick: submit },
      h('span', mode === 'host' ? 'CREATE ROOM' : mode === 'edit' ? 'SAVE' : 'CONNECT'));

    el.append(
      h('header.bar',
        h('button.icon-btn', { type: 'button', 'aria-label': 'Back', onclick: () => { try { sessionStorage.setItem('nd:back', '1'); } catch { /* fine */ } setState({ view: 'title' }); } }, '‹'),
        h('div.bar-title', mode === 'host' ? 'HOST // NEW ROOM' : mode === 'edit' ? 'PROFILE // EDIT' : 'JOIN // ENTER CODE')),
      h('div.form',
        mode === 'join' ? h('label.field', h('span.label', 'ROOM CODE'), els.code) : null,
        h('label.field', h('span.label', 'CALLSIGN'), els.name),
        h('div.field', h('span.label', 'SIGNAL COLOR'), els.colors),
        h('div.field', h('span.label', 'AVATAR'), els.avatars),
        els.preview),
      h('div.form-cta', els.err = h('p.form-error', { role: 'alert', hidden: true }), els.go));
    renderPicks();
    if (mode === 'join' && !st.invite) setTimeout(() => els.code.focus(), 350);
  }

  function renderPicks() {
    for (const b of els.colors.children) b.setAttribute('aria-checked', String(b.dataset.id === profile.color));
    for (const b of els.avatars.children) {
      b.replaceChildren(avatar(b.dataset.id, profile.color, 30));
      b.setAttribute('aria-checked', String(b.dataset.id === profile.avatar));
    }
    els.avatars.style.setProperty('--c', colorHex(profile.color));
    renderPreview();
  }

  function renderPreview() {
    const name = sanitizeName(profile.name, NAME_MAX) || 'CALLSIGN';
    els.preview.replaceChildren(
      h('span.mono.dim', 'ID PREVIEW'),
      h('div.preview-card', { style: { '--c': colorHex(profile.color) } }, avatar(profile.avatar, profile.color, 44), h('strong', name)));
  }

  async function submit() {
    if (busy) return;
    els.err.hidden = true;
    const name = sanitizeName(profile.name, NAME_MAX);
    if (!name) { toast('ENTER A CALLSIGN', 'err'); els.name.focus(); return; }
    let code = null;
    if (mode === 'join') {
      code = normalizeCode(els.code.value);
      if (!code) { toast('ROOM CODES ARE 4 LETTERS', 'err'); els.code.focus(); return; }
    }
    const p = { ...profile, name };
    saveProfile(p);
    if (mode === 'edit') { sfx('lock'); try { sessionStorage.setItem('nd:back', '1'); } catch { /* fine */ } setState({ view: 'title' }); return; }
    busy = true;
    els.go.classList.add('is-busy');
    els.go.firstChild.textContent = mode === 'host' ? 'ALLOCATING…' : 'CONNECTING…';
    try {
      // Firebase loads in the background while the title screen is up; wait for it here if needed.
      await Promise.race([firebaseReady, new Promise((_, rej) => setTimeout(() => rej(new Error('network')), 20000))]);
      if (mode === 'host') await createRoom(p);
      else await joinRoom(code, p);
      setState({ invite: '' });
    } catch (e) {
      const msg = String((e && e.message) || e);
      // Firebase errors are cryptic; our own messages are written for people.
      const friendly = /permission|network|unavailable/i.test(msg) ? 'Couldn’t reach the game servers. Check your connection and try again.' : msg;
      els.err.textContent = friendly;
      els.err.hidden = false;
      sfx('invalid');
      busy = false;
      els.go.classList.remove('is-busy');
      els.go.firstChild.textContent = mode === 'host' ? 'CREATE ROOM' : 'CONNECT';
    }
  }

  return { mount, update() {} };
}
