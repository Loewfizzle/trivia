import { h } from '../ui/dom.js';
import { APP_NAME, APP_TAGLINE, APP_VERSION } from '../config.js';
import { setState } from '../store.js';
import { slot } from '../identity.js';

export function createTitle() {
  let inviteEl;
  function mount(el, st) {
    const words = APP_NAME.split(' ');
    el.classList.add('title-screen');
    inviteEl = h('div.invite');
    el.append(
      h('div.title-top', h('span.mono.dim', `SYS//v${APP_VERSION}`), slot !== '1' ? h('span.tag.tag-you', `TEST SLOT ${slot}`) : null),
      h('div.logo-wrap',
        h('div.logo-ring'),
        h('h1.logo', { 'aria-label': APP_NAME },
          words.map((w, i) => h('span.logo-line', { 'data-text': w, style: { '--i': i } }, w))),
        h('p.tagline.mono', '> ', APP_TAGLINE, h('span.caret', '_'))),
      inviteEl,
      h('div.title-actions',
        h('button.btn.btn-primary.btn-xl', { type: 'button', onclick: () => setState({ view: 'setup', setupMode: 'host' }) }, h('span', 'HOST GAME')),
        h('button.btn.btn-ghost.btn-xl', { type: 'button', onclick: () => setState({ view: 'setup', setupMode: 'join' }) }, h('span', 'JOIN GAME'))),
      h('p.title-foot.mono', '2–8 PLAYERS · ONE PHONE EACH · ANYWHERE'),
    );
    update(st);
  }
  function update(st) {
    inviteEl.replaceChildren();
    if (st.invite) {
      inviteEl.append(h('button.invite-card', { type: 'button', onclick: () => setState({ view: 'setup', setupMode: 'join' }) },
        h('span.mono.dim', 'INVITE DETECTED'), h('strong', `ROOM ${st.invite}`), h('span.invite-go', 'TAP TO JOIN ›')));
    }
  }
  return { mount, update };
}
