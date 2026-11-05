// SHELL 2.0 A — ADD-ON (the owner, from the live podium): THE RESULTS ROWS = each player's SLIM CARD — their equipped strip (the art, the
// stepped plate with their name + emblem, the gem) with the place number (01 / 02 / 03) beside it and the score laid over it; the winner's
// strip on top (the rows come best-first). Every results list in every game: ui/components.js#leaderboard draws its rows at once (the plain
// row — nothing waits on this) and upgrades them here. COST (THE FULL-CARD COVER rule's budget — docs/vault.md): ONE shared effect surface
// for the whole list (fx/renderer.js — never a canvas per strip), every strip in its CALM mode (the lobby's, the bench's 8-at-60-fps case).
// A card that isn't approved yet shows as its plain colours (the guest list's rule); a player with no profile → the Gilded plain strip.
//   upgradeBoard(list, rows, players) — once per list; the surface goes when the list leaves the page
import { h } from './dom.js';
import { pubOf } from '../profile/public.js';
import { levelOf } from '../core/levels.js';
import { ITEM } from '../core/items.js';
import { memberLabel } from '../core/member.js';

export async function upgradeBoard(list, rows, players) {
  if (!list || list.dataset.strips) return;
  list.dataset.strips = 'loading';
  const [V, { FX }, { cardVars }, { approvedIds }, { createSurface }, { isDevCard }] = await Promise.all([
    import('../vault/strip.js'), import('../fx/index.js'), import('../progress/look.js'), import('../vault/approved.js'), import('../fx/renderer.js'),
    import('../core/dev-cards.js')]);
  V.vaultSheet();
  let approved = new Set();
  try { approved = new Set((await approvedIds()) || []); } catch { /* the plain colours */ }
  const rowEls = [...list.children];   // (before the surface: its canvas joins the list as a child)
  const surface = createSurface(list, { label: 'results' });
  const strips = [];
  rows.forEach((r, i) => {
    const row = rowEls[i];
    if (!row) return;
    const p = players[r.uid] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
    const pub = pubOf(p), card = (pub && pub.cd) || 'card-gilded', tier = (ITEM[card] || {}).tier || 'common';
    const real = !!(approved.has(card) && V.LOOKS[card]);
    const el = V.stripEl({ card: real ? card : null, tier, plain: real ? null : cardVars(card), name: String((pub && pub.n) || p.name || '').toUpperCase(),
      lv: levelOf((pub && pub.x) || 0), emblem: pub && pub.es, avatar: p.avatar, color: p.color, tube: pub && pub.tb, glow: pub && pub.g, no: pub ? memberLabel(pub.mn) : null });
    if (isDevCard(card) && real) import('../vault/dress.js').then(m => m.oneOfOne(el)).catch(() => {});
    // the row keeps its rank + its score (the count-up runs on the same element); the strip takes the avatar + name's place
    // (the score laid over the strip's top-right with its delta + arrow; a game's note — "3 KO · 2 SENT" — under it)
    const keep = c => row.querySelector(c);
    const score = keep('.lb-score'), note = keep('.lb-note'), lost = keep('.lb-lost');
    const over = h('div.lb-over', keep('.lb-move'), keep('.lb-delta'), score);
    const slot = h('div.lb-card', el, over, note || lost ? h('div.lb-sub', lost, note) : null);
    for (const k of [...row.children]) if (!k.classList.contains('lb-rank')) k.remove();
    row.append(slot);
    row.classList.add('lb-strip');
    const look = V.LOOKS[card];
    if (real && look && look.fx && FX[look.fx]) strips.push(surface.add(el, FX[look.fx], V.fxOpts(card, { seed: i + 1, calm: 1, radius: 12 })));
  });
  list.classList.add('is-strips');
  list.dataset.strips = String(strips.length);
  // (the surface goes with the list: the results screen is replaced at the next game / the room — checked rarely, never in a frame loop)
  const iv = setInterval(() => { if (!list.isConnected) { clearInterval(iv); try { surface.destroy(); } catch { /* fine */ } } }, 2000);
}
