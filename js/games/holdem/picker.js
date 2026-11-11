// HOLD'EM (HE6) — THE SKIN PICKER: ☰ → Settings → HOLD'EM → TABLE (Ben: docs/games/plan.md "HE6"). Three small LIVE thumbnails — a mini table in
// each skin, drawn from the skin's OWN DATA (skins.js: the room, the rail + its trim, the felt + its light, the betting line, a card back's colour,
// YOUR plate in the accent) — so NOTHING of a skin you haven't chosen downloads (no thumbnail images: CSS only); the chosen one outlined in its
// accent. A tap = settings.heSkin (this phone only) → the table changes LIVE, even mid-hand (view.js#applySkin on the settings' change — no
// reload, the motion plays on). Loaded LAZILY by ui/settings-panel.js (the boot graph never names a game). Its CSS is its own (injected once —
// the settings sheet can open where css/holdem.css isn't loaded). Prefix hep-.
import { h } from '../../ui/dom.js';
import { SKINS, SKIN_IDS, skinOf } from './skins.js';

const CSS = `
.hep { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 2px 0 6px; }
.hep-opt { display: grid; justify-items: center; gap: 6px; padding: 7px 4px 8px; border-radius: 14px; cursor: pointer; min-height: 44px;
  background: rgba(255, 255, 255, 0.03); border: 1.5px solid rgba(255, 255, 255, 0.10); color: var(--text, #fff); font: inherit; }
.hep-opt[aria-pressed='true'] { border-color: var(--a); box-shadow: 0 0 0 1px var(--a), 0 0 14px rgba(var(--ag), 0.45); background: rgba(var(--ag), 0.07); }
.hep-opt b { font: 800 10px/1.15 var(--font-ui); letter-spacing: 0.08em; text-align: center; min-height: 23px; display: grid; align-items: center; }
.hep-opt[aria-pressed='true'] b { color: var(--a); }
.hep-mini { position: relative; width: 74px; height: 104px; border-radius: 10px; overflow: hidden; background: var(--room); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06); }
.hep-rail { position: absolute; left: 9px; right: 9px; top: 14px; bottom: 16px; border-radius: 28px; background: linear-gradient(180deg, rgba(var(--sheen), 0.22), rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.4)), var(--rail);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6); }
.hep-felt { position: absolute; inset: 5px; border-radius: 23px; background: radial-gradient(70% 50% at var(--at), rgba(var(--light), var(--lk)), rgba(var(--light), 0) 100%), radial-gradient(80% 64% at 50% 48%, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, var(--vig)) 100%), var(--felt);
  box-shadow: 0 0 0 1px var(--trim-lo), 0 0 0 1.5px var(--trim), 0 0 6px var(--led), inset 0 0 5px var(--led); }
.hep-line { position: absolute; inset: 6px; border-radius: 18px; border: 1px solid var(--line); box-shadow: 0 0 4px var(--line-glow); }
.hep-card { position: absolute; top: 44%; width: 15%; height: 12px; border-radius: 1.5px; background: var(--stock); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); }
.hep-back { position: absolute; top: 18%; width: 6px; height: 9px; border-radius: 1px; background: var(--back); box-shadow: 0 0 0 0.5px rgba(255, 255, 255, 0.35); }
.hep-you { position: absolute; left: 50%; bottom: 7px; width: 30px; height: 7px; transform: translateX(-50%); border-radius: 3px; background: var(--plate); border: 1px solid var(--a); box-shadow: 0 0 6px rgba(var(--ag), 0.6); }
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  document.head.append(h('style', { 'data-hep': '' }, CSS));
}

/** the mini table's variables — the skin's own data, nothing else */
export function thumbVars(s) {
  return {
    '--room': s.thumb.room, '--a': s.accent.main, '--ag': s.accent.rgb, '--rail': s.rail.base, '--sheen': s.rail.sheen, '--trim': s.rail.trim, '--trim-lo': s.rail.trimLo,
    '--led': s.rail.led, '--felt': s.felt.tint, '--light': s.light.color, '--lk': String(Math.min(0.5, s.light.strength * 1.6)), '--at': s.light.at,
    '--vig': String(s.light.vignette), '--line': s.betline.color, '--line-glow': s.betline.glow, '--stock': s.stock, '--back': s.thumb.back, '--plate': s.plate.bg,
  };
}

/** THE TABLE row's body: the three thumbnails; `current` = the chosen id, `choose(id)` = the setting's write */
export function tablePicker(current, choose) {
  style();
  const cur = skinOf(current).id;
  const opts = SKIN_IDS.map(id => {
    const s = SKINS[id];
    const b = h('button.hep-opt', { type: 'button', 'aria-pressed': String(id === cur), 'aria-label': `${s.name} — ${s.line}`, 'data-skin': id, style: thumbVars(s),
      onclick: () => { for (const o of opts) o.setAttribute('aria-pressed', String(o === b)); choose(id); } },
      h('span.hep-mini', h('i.hep-rail', h('i.hep-felt', h('i.hep-line'),
        h('i.hep-back', { style: { left: '38%' } }), h('i.hep-back', { style: { left: '50%' } }),
        ...[0, 1, 2, 3, 4].map(i => h('i.hep-card', { style: { left: `${4.5 + i * 18.8}%` } })))), h('i.hep-you')),
      h('b', s.name));
    return b;
  });
  return h('div.hep', { role: 'group', 'aria-label': 'Table' }, ...opts);
}
