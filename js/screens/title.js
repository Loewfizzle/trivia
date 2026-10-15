import { h } from '../ui/dom.js';
import { APP_NAME } from '../config.js';
import { setState } from '../store.js';
import { slot } from '../identity.js';
import { openHelp } from '../ui/help.js';

export function createTitle() {
  let inviteEl;
  function mount(el, st) {
    const words = APP_NAME.split(' ');
    el.classList.add('title-screen');
    inviteEl = h('div.invite');
    el.append(
      h('div.title-top', slot !== '1' ? h('span.tag.tag-you', `TEST SLOT ${slot}`) : null),
      h('div.logo-wrap',
        h('div.logo-ring'),
        h('h1.logo', { 'aria-label': APP_NAME },
          words.map((w, i) => h('span.logo-line', { 'data-text': w, style: { '--i': i } }, w)))),
      inviteEl,
      h('div.title-actions',
        h('button.btn.btn-primary.btn-xl', { type: 'button', onclick: () => setState({ view: 'setup', setupMode: 'host' }) }, h('span', 'HOST GAME')),
        h('button.btn.btn-ghost.btn-xl', { type: 'button', onclick: () => setState({ view: 'setup', setupMode: 'join' }) }, h('span', 'JOIN GAME'))),
      h('button.btn.btn-text.title-help', { type: 'button', onclick: () => openHelp() }, 'HOW TO PLAY'),
      h('p.title-foot.mono', '2–8 PLAYERS · ONE PHONE EACH · ANYWHERE'),
    );
    update(st);
  }
  let shown = null;
  function update(st) {
    // Only rebuild when the invite changes — the title is now visible while Firebase is still
    // starting up, and replacing the card mid-tap would swallow the tap.
    const sig = `${st.invite || ''}|${st.inviteExpired || ''}`;
    if (sig === shown) return;
    shown = sig;
    inviteEl.replaceChildren();
    if (st.inviteExpired) {
      inviteEl.append(h('div.invite-card.is-expired', { role: 'status' },
        h('span.mono.dim', 'INVITE EXPIRED'), h('strong', `ROOM ${st.inviteExpired}`),
        h('span.invite-note', 'That room has closed. Host a new game, or ask your friend for a fresh code.')));
      return;
    }
    if (st.invite) {
      inviteEl.append(h('button.invite-card', { type: 'button', onclick: () => setState({ view: 'setup', setupMode: 'join' }) },
        h('span.mono.dim', 'INVITE DETECTED'), h('strong', `ROOM ${st.invite}`), h('span.invite-go', 'TAP TO JOIN ›')));
    }
  }
  return { mount, update };
}
