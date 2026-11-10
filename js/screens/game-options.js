// A GAME's OPTIONS + its START (shared — LOBBY 2.0 A moved it out of lobby.js: today's lobby and the room in the city use the same sheet):
// the host picks a game → its options (segmented · chips · a list · cards) → ≈ N MIN → INITIATE → host.js#startGame (today's start path —
// LOBBY 2.0 B replaces the walk inside, not this). An option with when(players) shows (+ applies) only with that many connected players.
//   openGameOptions(g, { meta, onClose }) → { close }
import { h } from '../ui/dom.js';
import { openSheet, closeAllSheets } from '../ui/sheet.js';
import { segmented, chips as chipSelect } from '../ui/components.js';
import { toast } from '../ui/toast.js';
import { MIN_PLAYERS } from '../config.js';
import { startGame, onlineCount } from '../host.js';
import { metaOf, loadGame } from '../games/registry.js';
import { preloadSheets } from '../games/lazy-view.js';
import { minPlayersOf } from '../games/cartridge.js';
import { openHelp } from '../ui/help.js';
import { prefetch } from '../audio/music.js';

/** vertical single-choice list with a sub-line per choice (PULSE song picker) */
export function optionList(choices, value, onChange) {
  const wrap = h('div.opt-list', { role: 'radiogroup' });
  const paint = () => [...wrap.children].forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === String(value))));
  for (const c of choices) {
    wrap.append(h('button.opt-row', { type: 'button', role: 'radio', dataset: { v: String(c.value) }, onclick: () => { value = c.value; paint(); onChange(c.value); } },
      h('span.opt-dot'), h('span.opt-label', c.label), c.sub ? h('small.opt-sub', c.sub) : null));
  }
  paint();
  return wrap;
}
/** a grid of mode cards: icon, name, a line, the recommended player count (GRIDLOCK's modes) */
export function optionCards(choices, value, onChange) {
  const wrap = h('div.opt-cards', { role: 'radiogroup' });
  const paint = () => [...wrap.children].forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === String(value))));
  for (const c of choices) {
    wrap.append(h('button.opt-card', { type: 'button', role: 'radio', dataset: { v: String(c.value) }, onclick: () => { value = c.value; paint(); onChange(c.value); } },
      c.icon ? h('span.opt-card-icon', { html: c.icon }) : null, h('span.opt-card-label', c.label), c.sub ? h('span.opt-card-sub', c.sub) : null, c.meta ? h('span.opt-card-meta', c.meta) : null));
  }
  paint();
  return wrap;
}

export function openGameOptions(g, { meta = null, onClose = null } = {}) {
  const mod = metaOf(g.id);   // (SHELL 2.0 B1 — THE THIN META: the sheet reads it; the cartridge starts loading now, so INITIATE is quick)
  import('../games/preload.js').then(P => P.wireGame(g.id)).catch(() => {});   // (FRIENDS C: the whole graph at once)
  loadGame(g.id).catch(() => {});
  prefetch(mod.MUSIC);
  preloadSheets(g.id);   // its screen's stylesheets, so the match starts styled at once
  const saved = (meta && meta.settings && meta.settings[g.id]) || {};
  const settings = { ...mod.DEFAULT_SETTINGS, ...saved };
  const players = onlineCount();
  // (PD-2: a CHOICE may carry when(players) too — PRISM DROP's BATTLE needs 2+, so a room of one sees SCORE RUSH + SURVIVAL only; a saved
  //  choice that isn't shown falls back to the first one that is)
  const shownOptions = mod.OPTIONS.filter(o => !o.when || o.when(players))
    .map(o => (o.choices && o.choices.some(c => c.when) ? { ...o, choices: o.choices.filter(c => !c.when || c.when(players)) } : o));
  for (const o of mod.OPTIONS) if (!shownOptions.some(x => x.key === o.key)) settings[o.key] = mod.DEFAULT_SETTINGS[o.key];
  for (const o of shownOptions) {
    const full = mod.OPTIONS.find(x => x.key === o.key);
    if (!full || !full.choices || !full.choices.some(c => c.when) || !o.choices.length || o.type === 'multi') continue;
    if (!o.choices.some(c => String(c.value) === String(settings[o.key]))) settings[o.key] = o.choices[0].value;
  }
  const est = h('span.est');
  const renderEst = () => { const m = mod.estimateMinutes(settings); est.textContent = typeof m === 'string' ? m : `≈ ${m} MIN`; };   // (HE3: a word — HOLD'EM's CASH is "OPEN")
  const startBtn = h('button.btn.btn-primary.btn-xl.btn-block', { type: 'button' }, h('span', 'INITIATE'));
  let sheet = null;
  const close = () => { if (!sheet) return; const s = sheet; sheet = null; s.close(); };
  startBtn.onclick = async () => {
    const min = minPlayersOf(mod, MIN_PLAYERS);   // (THE CARTRIDGE PLUG)
    if (onlineCount() < min) { toast(`NEED ${min}+ CONNECTED PLAYERS`, 'err'); return; }
    startBtn.classList.add('is-busy');
    startBtn.firstChild.textContent = 'BOOTING…';
    try {
      if (await startGame(g.id, settings)) { close(); closeAllSheets(); }   // (SHELL 2.0 B1: the picker under it goes too)
      else { startBtn.classList.remove('is-busy'); startBtn.firstChild.textContent = 'INITIATE'; }
    } catch (e) { toast(String(e.message || e).toUpperCase(), 'err'); startBtn.classList.remove('is-busy'); startBtn.firstChild.textContent = 'INITIATE'; }
  };
  // (SHELL 2.0 A: THE SHEET — the game's name is its title, its tag the small line; INITIATE the one tube main)
  sheet = openSheet({ title: g.name, kicker: g.tag, cls: 'options', theme: g.theme, onClose: () => { sheet = null; if (onClose) onClose(); }, body: [
      h('p.sheet-text', g.blurb),
      h('button.btn.btn-text.help-link', { type: 'button', onclick: () => openHelp(g.id) }, 'HOW TO PLAY ›'),
      shownOptions.map(o => h('div.field',
        h('span.label', o.label, o.hint ? h('small.field-hint', ` · ${o.hint}`) : null),
        o.type === 'multi'
          ? chipSelect(o.choices, [].concat(settings[o.key] || []), v => { settings[o.key] = v; renderEst(); })
          : o.type === 'list'
            ? optionList(o.choices, settings[o.key], v => { settings[o.key] = v; renderEst(); })
            : o.type === 'cards'
              ? optionCards(o.choices, settings[o.key], v => { settings[o.key] = v; renderEst(); })
              : segmented(o.choices, settings[o.key], v => { settings[o.key] = v; renderEst(); }))),
      h('div.options-meta', h('span.mono.dim', 'EST. MATCH LENGTH'), est),
      startBtn,
      h('button.btn.btn-text.btn-block', { type: 'button', onclick: close }, 'CANCEL')] });
  renderEst();
  return { close, el: sheet.el };
}
