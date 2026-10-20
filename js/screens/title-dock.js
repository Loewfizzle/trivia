// THE FLANK — the title's dock (docs/title.md): [ JOIN ring ] [ glass pill: BOARD · GAMES · YOU ] [ HOST ring ], the JOIN panel
// above it, REJOIN / notes, and the title's two corner buttons dressed as tubes of the sign. This module owns the markup, the
// rings and the lighting; title.js owns the behaviour (what JOIN, HOST, BOARD… do) and passes it in as handlers.
import { h } from '../ui/dom.js';

const tube = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><g class="t">${d}</g><g class="c">${d}</g></svg>`;
export const ICON = {
  join: tube('<path d="M5.4 21.2V4.7c0-.8.6-1.4 1.4-1.4h10.4c.8 0 1.4.6 1.4 1.4v16.5"/><path d="M5.4 3.6l8 1.5v15.3l-8 .8"/><path d="M3.2 21.2h17.6"/><circle cx="11.5" cy="12.9" r=".55"/>'),
  board: tube('<path d="M7.6 3.8h8.8v4.4a4.4 4.4 0 0 1-8.8 0z"/><path d="M7.6 5.4H5.3v.9a3 3 0 0 0 2.8 3M16.4 5.4h2.3v.9a3 3 0 0 1-2.8 3"/><path d="M12 12.6v3.5"/><path d="M8.6 20.4h6.8M9.7 20.4l.7-4.3h3.2l.7 4.3"/>'),
  games: tube('<rect x="4" y="4" width="6.8" height="6.8" rx="1.9"/><rect x="13.2" y="4" width="6.8" height="6.8" rx="1.9"/><rect x="4" y="13.2" width="6.8" height="6.8" rx="1.9"/><rect x="13.2" y="13.2" width="6.8" height="6.8" rx="1.9"/>'),
  guest: tube('<path d="M12 2.7l7.9 4.55v9.5L12 21.3l-7.9-4.55v-9.5z"/><circle cx="12" cy="10.1" r="2.5"/><path d="M7.7 16.4c1-2.2 2.5-3.3 4.3-3.3s3.3 1.1 4.3 3.3"/>'),
  go: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5l6.5 6.5-6.5 6.5"/></svg>',
  // the title's corner buttons, as white tubes of the same sign: ☰ (three bars; an X while the menu is open) and the music note
  // (a slash through it while the music is off)
  menu: tube('<g class="bars"><path d="M5.5 7.5h13M5.5 12h13M5.5 16.5h13"/></g><g class="x"><path d="M7 7l10 10M17 7L7 17"/></g>'),
  music: tube('<path d="M9.2 17.6V6.3l9.3-2v11.2"/><circle cx="6.8" cy="17.6" r="2.45"/><circle cx="16.1" cy="15.5" r="2.45"/><path class="sl" d="M4.2 4.2l15.6 15.6"/>'),
};

/** The neon tube ring (HOST and JOIN): four quarter tubes (N · E · O · N clockwise from the top left, so a multi-colour holiday
 *  shows every colour of the sign) under one whole tube (a one-colour sign: no joints); electrode caps where the quarters
 *  meet, two mounting clips, the glass tube underneath. Colours come in as CSS custom properties (--hg/--hb/--hc 1–4). */
export function ringSvg(id) {
  const R = 37, pt = a => `${(R * Math.cos(a)).toFixed(2)} ${(R * Math.sin(a)).toFixed(2)}`;
  const arcs = [0, 1, 2, 3].map(i => { const a0 = (-135 + 90 * i) * Math.PI / 180; return `M${pt(a0)}A${R} ${R} 0 0 1 ${pt(a0 + Math.PI / 2)}`; });
  const both = (cls, w) => `<circle class="${cls} u" r="${R}" stroke-width="${w}"/>${arcs.map((d, i) => `<path class="${cls} m r${i + 1}" d="${d}" stroke-width="${w}"/>`).join('')}`;
  const joints = [-135, -45, 45, 135].map(a => { const r = a * Math.PI / 180; return `<circle cx="${(R * Math.cos(r)).toFixed(2)}" cy="${(R * Math.sin(r)).toFixed(2)}" r="2.7"/>`; }).join('');
  return `<svg class="nd-hring" viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg">
<defs><filter id="${id}-b1" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="${id}-b2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5.5"/></filter></defs>
<circle class="hr-glass" r="${R}" stroke-width="8"/>
<g class="hr-light">
<g class="hr-g2" filter="url(#${id}-b2)">${both('g', 12)}</g>
<g class="hr-g1" filter="url(#${id}-b1)">${both('g', 6.5)}</g>
${both('b', 5.4)}${both('c', 1.9)}
<path class="hr-hi" d="M${pt(Math.PI * 1.05)}A${R} ${R} 0 0 1 ${pt(Math.PI * 1.42)}" transform="translate(-1 -1.1)"/>
</g>
<g class="hr-joints">${joints}</g>
<g class="hr-clips">${[56, 124].map(d => `<rect x="-3.4" y="-0.95" width="6.8" height="1.9" rx="0.8" transform="translate(${(R * Math.cos(d * Math.PI / 180)).toFixed(2)} ${(R * Math.sin(d * Math.PI / 180)).toFixed(2)}) rotate(${d})"/>`).join('')}</g>
</svg>`;
}

/** The corner buttons wear the sign's tubes on the title only: a white tube icon while the title is up (removed with it: the
 *  lobby, THE BOARD and the games keep their own buttons exactly as they were). */
export function dressCorners(onTitle) {
  const mb = document.querySelector('.menu-btn'), mu = document.querySelector('.music-btn');
  for (const [b, icon] of [[mb, ICON.menu], [mu, ICON.music]]) {
    if (!b) continue;
    const have = b.querySelector('.nd-cic');
    if (onTitle && !have) b.append(h('span.nd-cic', { 'aria-hidden': 'true', html: icon }));
    if (!onTitle) { if (have) have.remove(); b.classList.remove('nd-cl-lit'); }
  }
}

/** Builds the dock. on: { join, board, games, you, host, code: { input, paste, focus, blur, keydown }, go, panelDown, panelUp,
 *  note } — the behaviour, from title.js. Returns { el, els, ringColors(sign), light(i, on), all(on), ringOn(times), ringSet(on),
 *  ringLit(), resetRing(), tabs(), corners(), destroy() }. */
export function createDock(on) {
  const els = {};
  let destroyed = false;
  const tab = (cls, aria, icon, onclick) => h(`button.nd-tab.${cls}`, { type: 'button', 'aria-label': aria, onclick },
    h('span.nd-tab-ic', { html: icon }));
  els.boardTab = tab('nd-tab-board', 'The Board', ICON.board, on.board);
  els.gamesTab = tab('nd-tab-games.nd-link-games', 'The games', ICON.games, on.games);
  els.youTab = tab('nd-tab-you.nd-me', 'Your membership card', ICON.guest, on.you);
  // a ring: a dark glass disc, the neon tube ring, its word inside; its slot carries its colours (the reflection wears them too)
  const ring = (cls, id, word, aria, onclick) => h(`button.nd-ringbtn.${cls}`, { type: 'button', 'aria-label': aria, onclick, dataset: { multi: '0' } },
    h('span.nd-hdisc'),
    h('span.nd-hglow', { 'aria-hidden': 'true' }),
    h('span.nd-hring-wrap', { 'aria-hidden': 'true', html: ringSvg(id) }),
    h('span.nd-host-label', { 'aria-hidden': 'true' }, word));
  // (els.joinTab: the JOIN control, whatever it looks like — title.js's openJoin / outsideDown use it)
  els.joinTab = ring('nd-joinring.nd-joinbtn.nd-tab-join', 'ndj', 'JOIN', 'Join a room', on.join);
  els.joinTab.setAttribute('aria-expanded', 'false');
  els.joinTab.append(h('i.nd-tab-ind', { 'aria-hidden': 'true' }));
  els.host = ring('nd-hostbtn.nd-host', 'ndr', 'HOST', 'Host a game', on.host);
  els.joinSlot = h('div.nd-rslot.nd-rslot-join', h('span.nd-hrefl', { 'aria-hidden': 'true' }), els.joinTab);
  els.hostSlot = h('div.nd-rslot.nd-rslot-host', h('span.nd-hrefl', { 'aria-hidden': 'true' }), els.host);
  // the pill: its shadow, the smoked glass (weather on the glass: rain beads, lightning), the three icons
  els.pill = h('div.nd-pill',
    h('span.nd-bar-shadow', { 'aria-hidden': 'true' }),
    h('span.nd-bar-glass', { 'aria-hidden': 'true' }, h('span.nd-drops'), h('span.nd-strike')),
    els.boardTab, els.gamesTab, els.youTab);
  els.door = h('nav.nd-bar.nd-flank', { 'aria-label': 'Main menu' }, els.joinSlot, els.pill, els.hostSlot);
  // the JOIN panel: one real input under four boxes (native keyboard, autocapitalise, paste, iOS autofill all just work)
  els.code = h('input.nd-code-in', {
    type: 'text', inputmode: 'text', autocapitalize: 'characters', autocomplete: 'off', autocorrect: 'off', spellcheck: false,
    maxLength: 24, 'aria-label': 'Hush word, 4 letters', enterkeyhint: 'go',
    oninput: on.code.input, onpaste: on.code.paste, onfocus: on.code.focus, onblur: on.code.blur, onkeydown: on.code.keydown,
  });
  els.boxes = [0, 1, 2, 3].map(i => h('span.nd-box', { style: { '--i': i } }));
  els.go = h('button.nd-go', { type: 'button', 'aria-label': 'Join with the hush word', onclick: on.go }, h('span', { html: ICON.go }));
  els.msg = h('p.nd-msg', { role: 'status', 'aria-live': 'polite' });
  els.jpanel = h('div.nd-jpanel', { role: 'dialog', 'aria-label': 'Enter the hush word', onpointerdown: on.panelDown, onpointerup: on.panelUp },
    h('span.nd-jp-grip', { 'aria-hidden': 'true' }),
    h('h2.nd-jp-h', 'ENTER THE HUSH WORD'),
    els.msg,
    h('div.nd-jp-row',
      h('label.nd-codebox', { onpointerdown: () => setTimeout(() => els.code.focus(), 0) }, els.code, ...els.boxes),
      els.go));
  // above the dock: REJOIN, and a note (a host that couldn't open, an expired invite)
  els.rejoin = h('div.nd-rejoin');
  els.note = h('button.nd-note', { type: 'button', role: 'status', 'aria-live': 'polite', onclick: on.note });
  const el = h('section.nd-actions', h('div.nd-dk', h('div.nd-above', els.note, els.rejoin), els.jpanel, els.door));

  // HOST wears the sign: its four letters' glow / body / core colours, straight from the sign's own tubes (every holiday, now
  // and later, follows by itself); registered colours, so a change blends. force: re-read even if unchanged (a test hook).
  let ringKey = '';
  function ringColors(sign, force = false) {
    if (!sign) return;
    const letters = [...sign.querySelectorAll('.ndl')];
    if (letters.length < 4) return;
    const pick = (l, cls) => { const p = l.querySelector(`.${cls}`); return p ? getComputedStyle(p).stroke : ''; };
    const cols = letters.slice(0, 4).map(l => ({ g: pick(l, 'ndl-glow1'), b: pick(l, 'ndl-body'), c: pick(l, 'ndl-core') }));
    if (cols.some(c => !c.g || c.g === 'none')) return;
    const key = cols.map(c => `${c.g}/${c.b}/${c.c}`).join('|');
    if (key === ringKey && !force) return;
    ringKey = key;
    const st = els.hostSlot.style;
    cols.forEach((c, i) => { st.setProperty(`--hg${i + 1}`, c.g); st.setProperty(`--hb${i + 1}`, c.b); st.setProperty(`--hc${i + 1}`, c.c); });
    els.host.dataset.multi = new Set(cols.map(c => c.g)).size > 1 ? '1' : '0';
  }

  // the pill's icons and the title's two corner buttons are tubes of the same sign: each answers a letter (BOARD·N, GAMES·E,
  // YOU·O, ☰ + music·N) — on with the power-on and at the catch, off when the logo's last letter dies at dawn, catching the
  // sign's rare flicker; dark glass by day. Driven explicitly, so how the sign is driven can change freely.
  const tabs = () => [els.boardTab, els.gamesTab, els.youTab];
  const corners = () => [...document.querySelectorAll('.menu-btn, .music-btn')];
  function light(i, lit) {
    if (destroyed) return;
    if (i < 3) { const t = tabs()[i]; if (t) t.classList.toggle('is-lit', !!lit); } else corners().forEach(b => b.classList.toggle('nd-cl-lit', !!lit));
  }
  const all = lit => { for (let i = 0; i < 4; i++) light(i, lit); };
  // the rings' light: off (glass) until the power-on, then always lit — they flicker on with the sign's letters, together
  let lit = false;
  const ringSet = v => { if (destroyed) return; for (const r of [els.host, els.joinTab]) r.classList.toggle('is-lit', v); };
  function ringOn(times) {
    if (lit) return;
    lit = true;
    if (!times || !times.length) { ringSet(true); return; }
    times.forEach(([ms, v]) => setTimeout(() => ringSet(v), ms));
  }

  return {
    el, els, ringColors, light, all, ringOn, ringSet,
    ringLit: () => lit,
    resetRing: () => { lit = false; },
    tabs, corners,
    destroy() { destroyed = true; },
  };
}
