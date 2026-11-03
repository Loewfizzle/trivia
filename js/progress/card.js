// THE MEMBERSHIP CARD — THE ORIGINAL GILDED (PROGRESSION A; the owner's mockup progression-membership-card.png A · GILDED): black lacquer,
// a brass double frame, the sunburst, NEON SPEAKEASY + the member's № (their name tag), the emblem in its neon colour, the NAME in brass
// foil (or the name glow they wear), BAND · LEVEL, MEMBER SINCE, the streak's flame. The other looks (Emerald & Brass, Midnight &
// Champagne, Onyx & Rose Gold, Neon Glass, Velvet Room, the old finishes …) = the same card in their palette (core/items.js#look) until
// THE VAULT draws each one. A finger tilts it (transform only); reduced motion = flat.
import { fitName } from '../ui/fit.js';
import { h } from '../ui/dom.js';
import { avatar } from '../ui/components.js';
import { colorHex } from '../config.js';
import { levelInfo } from '../core/levels.js';
import { streakView, streakDay } from '../core/streak.js';
import { GLOW_ART, applyGlow } from '../vault/glows.js';
import { cardVars, glowClass, flameIcon, reduced } from './look.js';
import { memberLabel } from '../core/member.js';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const sinceOf = at => { const d = new Date(at || Date.now()); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

/**
 * pub: the public profile ({ n, t, a, c, x, at, s, sd, cd, g, fd }) or null; local: the device's profile ({ name, avatar, color });
 * opts: { st (pstats.st — the streak as it is), card (a card id to show instead of the worn one), mini, onFlame }
 */
export function gildedCard(pub, local = {}, opts = {}) {
  const p = pub || { n: local.name, a: local.avatar, c: local.color, x: 0 };
  const L = levelInfo(p.x || 0);
  const card = opts.card || p.cd || 'card-gilded';
  const st = opts.st || (p.s ? { n: p.s, d: p.sd || streakDay(Date.now()) } : null);
  const sv = st ? streakView(st, streakDay(opts.now || Date.now())) : null;
  const flame = sv && sv.n ? h('button.pg-card-st', { type: 'button', 'aria-label': `${sv.n}-night streak`, onclick: e => { e.stopPropagation(); if (opts.onFlame) opts.onFlame(); } },
    flameIcon(sv.state === 'frozen' ? 'frozen' : sv.state === 'lit' ? 'lit' : 'waiting', 24), String(sv.n)) : null;
  const glow = glowClass(p.g);
  const el = h('div.pg-card', { class: opts.mini ? 'is-mini' : '', dataset: { card }, style: { ...cardVars(card), '--c': colorHex(p.c || 'magenta') } },
    h('span.pg-card-clip', { 'aria-hidden': 'true' }, h('span.pg-card-sun')),
    opts.mini ? null : h('div.pg-card-top', h('span', 'NEON SPEAKEASY'), h('span.pg-card-no', memberLabel(p.mn) ? `№ ${memberLabel(p.mn)}` : 'GUEST')),
    p.fd && !opts.mini ? h('span.pg-card-fd', 'FOUNDING MEMBER') : null,
    opts.mini ? null : h('div.pg-card-mid',
      h('span.pg-card-emb', avatar(p.a || 'bolt', p.c || 'magenta', 80)),
      h('div.pg-card-id',
        // (THE VAULT 2A: a glow with the new art — GLOW_ART — goes through applyGlow; the rest keep today's class)
        fitName(GLOW_ART[p.g] ? applyGlow(h('div.pg-card-name', (p.n || 'MEMBER').toUpperCase()), p.g) : h('div.pg-card-name', { class: glow ? `is-plain-ink ${glow}` : '' }, (p.n || 'MEMBER').toUpperCase()), { min: 17 }),
        h('div.pg-card-lv', `${L.band.name} · LEVEL ${L.lvl}`))),
    opts.mini ? null : h('div.pg-card-bot',
      h('div.pg-card-since', h('small', 'MEMBER SINCE'), h('b', sinceOf(p.at))),
      flame),
    h('span.pg-card-clip', { 'aria-hidden': 'true' }, h('span.pg-card-sheen')));
  if (!opts.mini && !reduced()) tilt(el);
  return el;
}

// a finger / the mouse tilts the card a little (transform only; back to flat on release)
function tilt(el) {
  const move = e => {
    const r = el.getBoundingClientRect();   // (a pointer event, not a frame loop)
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`); el.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`); el.style.setProperty('--sx', `${(x * 90).toFixed(0)}%`);
  };
  const reset = () => { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--sx', '-30%'); };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', reset);
  el.addEventListener('pointerup', reset);
  el.addEventListener('pointercancel', reset);
}
