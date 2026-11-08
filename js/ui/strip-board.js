// SHELL 2.0 A — ADD-ON (the owner, from the live podium): THE RESULTS ROWS = each player's SLIM CARD — their equipped strip (the art, the
// stepped plate with their name + emblem, the gem) with the place number (01 / 02 / 03) beside it and the score laid over it; the winner's
// strip on top (the rows come best-first). Every results list in every game: ui/components.js#leaderboard draws its rows at once (the plain
// row — nothing waits on this) and upgrades them here. COST (THE FULL-CARD COVER rule's budget — docs/vault.md): ONE shared effect surface
// for the whole list (fx/renderer.js — never a canvas per strip), every strip in its CALM mode (the lobby's, the bench's 8-at-60-fps case).
// A card that isn't approved yet shows as its plain colours (the guest list's rule); a player with no profile → the Gilded plain strip.
//   upgradeBoard(list, rows, players) — once per list; the surface goes when the list leaves the page
// DFIX2 — SLIM CARDS EVERYWHERE A PLAYER LIST SHOWS (Ben, Nov 8): the pieces are shared — stripKit() loads them once, stripFor() draws ONE
// player's card from any public face (a room player's profile, a friend's card, your own `me`), stripFx() puts its motion on a shared surface.
// THE DAILIES' SCORES (js/screens/daily.js) draws its tables through these three — never a second strip system.
import { h } from './dom.js';
import { pubOf } from '../profile/public.js';
import { levelOf } from '../core/levels.js';
import { ITEM } from '../core/items.js';
import { memberLabel } from '../core/member.js';

let kitP = null;
/** everything a slim-card list needs, loaded once a page: the vault's strips + looks, the effects, the plain palettes, the APPROVED set, the surface */
export function stripKit() {
  if (kitP) return kitP;
  kitP = (async () => {
    const [V, { FX }, { cardVars }, { approvedIds }, { createSurface }, { isOneOfOne }] = await Promise.all([
      import('../vault/strip.js'), import('../fx/index.js'), import('../progress/look.js'), import('../vault/approved.js'), import('../fx/renderer.js'),
      import('../core/dev-cards.js')]);
    V.vaultSheet();
    let approved = new Set();
    try { approved = new Set((await approvedIds()) || []); } catch { /* the plain colours */ }
    return { V, FX, cardVars, approved, createSurface, isOneOfOne };
  })();
  return kitP;
}

/**
 * ONE player's slim card. pub = their public face ({ n, x | l, cd, es, tb, g, mn, a, c } — profiles/{pid}, a friend's card, your `me`), p = the room
 * node's fallbacks ({ name, color, avatar }). An unapproved card → its plain colours; no card → the Gilded plain strip; the NAME always whole.
 * → { el, card, real }
 */
export function stripFor(K, pub, p = {}) {
  const card = (pub && pub.cd) || 'card-gilded', tier = (ITEM[card] || {}).tier || 'common';
  const real = !!(K.approved.has(card) && K.V.LOOKS[card]);
  const lv = pub && pub.x != null ? levelOf(pub.x || 0) : (pub && pub.l) || levelOf(0);
  const el = K.V.stripEl({ card: real ? card : null, tier, plain: real ? null : K.cardVars(card), name: String((pub && pub.n) || p.name || '').toUpperCase(),
    lv, emblem: pub && pub.es, avatar: p.avatar || (pub && pub.a), color: p.color || (pub && pub.c), tube: pub && pub.tb, glow: pub && pub.g, no: pub ? memberLabel(pub.mn) : null });
  if (K.isOneOfOne(card) && real) import('../vault/dress.js').then(m => m.oneOfOne(el)).catch(() => {});
  return { el, card, real };
}
/** the card's motion on a shared surface — its effect, CALM, the strip's corner radius; a plain / still card adds nothing → the slot | null */
export function stripFx(K, surface, strip, seed = 1) {
  const look = K.V.LOOKS[strip.card];
  if (!strip.real || !look || !look.fx || !K.FX[look.fx]) return null;
  return surface.add(strip.el, K.FX[look.fx], K.V.fxOpts(strip.card, { seed, calm: 1, radius: 12 }));
}

export async function upgradeBoard(list, rows, players) {
  if (!list || list.dataset.strips) return;
  list.dataset.strips = 'loading';
  const K = await stripKit();
  const rowEls = [...list.children];   // (before the surface: its canvas joins the list as a child)
  const surface = K.createSurface(list, { label: 'results' });
  const strips = [];
  rows.forEach((r, i) => {
    const row = rowEls[i];
    if (!row) return;
    const p = players[r.uid] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
    const s = stripFor(K, pubOf(p), p);
    // the row keeps its rank + its score (the count-up runs on the same element); the strip takes the avatar + name's place
    // (FRIENDS B — the owner's podium test: the score's bubble covered "Nº 0002" + the gem → the SCORE leaves the card: it sits in the stats
    //  line UNDER the card — at its right end, beside the game's note ("3 KO · 2 SENT · 1 BADGES"), in a bigger number font; the delta + arrow with it)
    const keep = c => row.querySelector(c);
    const score = keep('.lb-score'), note = keep('.lb-note'), lost = keep('.lb-lost');
    const pts = h('span.lb-pts', keep('.lb-move'), keep('.lb-delta'), score);
    const slot = h('div.lb-card', s.el, h('div.lb-sub', lost, note, pts));
    for (const k of [...row.children]) if (!k.classList.contains('lb-rank')) k.remove();
    row.append(slot);
    row.classList.add('lb-strip');
    const fx = stripFx(K, surface, s, i + 1);
    if (fx) strips.push(fx);
  });
  list.classList.add('is-strips');
  list.dataset.strips = String(strips.length);
  // (the surface goes with the list: the results screen is replaced at the next game / the room — checked rarely, never in a frame loop)
  const iv = setInterval(() => { if (!list.isConnected) { clearInterval(iv); try { surface.destroy(); } catch { /* fine */ } } }, 2000);
}
