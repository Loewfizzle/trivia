// FREEFALL F5C — THE MIX (docs/games/passes/freefall-f5c.md "THE MIX"): the table's gains against JAYWALK's + the music's duck under the big moments
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SOUNDS, SOUND_IDS, DUCK, DUCK_MS } from '../js/games/freefall/sounds.js';
import { SOUNDS as JW } from '../js/games/jaywalk/sounds.js';

const gain = (T, id) => T.find(s => s.id === id).gain;
test('THE MIX: JAYWALK\'s shared files at JAYWALK\'s own gains; the out-drop LOUDER than JAYWALK\'s (never lost under the bounces); the bounce stays soft; the music ducks under the big moments only', () => {
  for (const id of ['area-arrive', 'new-best']) assert.equal(gain(SOUNDS, id), gain(JW, id), `${id}: as JAYWALK plays it`);
  assert.ok(gain(SOUNDS, 'out-drop') > gain(JW, 'out-drop'), 'RIVAL OUT louder than JAYWALK\'s 0.28');
  assert.ok(gain(SOUNDS, 'bounce') <= 0.5, 'the bounce stays soft');
  for (const id of Object.keys(DUCK_MS)) assert.ok(SOUND_IDS.includes(id), `${id}: a real sound`);
  assert.deepEqual(Object.keys(DUCK_MS).sort(), ['bottom', 'crash', 'last-standing', 'lights-out', 'skylight', 'splashdown']);
  assert.ok(DUCK.level >= 0.3 && DUCK.level <= 0.62, 'within JAYWALK\'s own duck levels (0.3 … 0.62)');
  const st = readFileSync(new URL('../js/games/freefall/stage.js', import.meta.url), 'utf8'), vw = readFileSync(new URL('../js/games/freefall/view.js', import.meta.url), 'utf8');
  assert.ok(st.includes('for (let i = 0; i < cues.length; i++) { const ms = DUCK_MS[cues[i].id]; if (ms) duckFor(ms + (cues[i].delay || 0) * 1000); }'), 'every big cue ducks the music');
  assert.ok(st.includes('destroy() { gone = true; unduck();') && st.includes("lastSaid = false; unduck();"), 'the music always comes back up (a restart, the stage gone)');
  assert.ok(vw.includes('duckMusic(Math.min(ducked, DUCK.level), DUCK.inS)') && vw.includes('duckMusic(ducked, DUCK.outS); ducked = null;'), 'the cartridge: the level found is put back');
});

test('THE CREDITS (F5C): FREEFALL\'s group names every asset it SHIPS (the sounds\' Freesound authors + Kenney, the Particle Pack, Ground 055 S, the Grok-made art) and nothing unused (no Water 001); it shows only where the game is playable', () => {
  const c = readFileSync(new URL('../js/ui/credits.js', import.meta.url), 'utf8'), ff = c.split('\n').filter(l => l.includes("game: 'freefall'")).join('\n');
  for (const who of ['joesh2', 'Sadiquecat', 'Za-Games', 'DaUik', 'Aurelon', 'egomassive', 'Kenney', 'SergeyIonov', 'Sheyvan', 'LilMati', 'kyles', 'Nox_Sound', 'JelleGeus', 'Particle Pack', 'Ground 055 S', 'Grok Imagine', 'JAYWALK']) assert.ok(ff.includes(who), `${who} credited`);
  assert.ok(!/Water 001|3DTextures/i.test(ff), 'Water 001 no longer ships: not credited');
  assert.ok(c.includes('for (const c of CREDITS) { if (c.game && !isPlayable(c.game)) continue;'), 'a hidden game\'s group stays off the public sheet');
});
