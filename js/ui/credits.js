// SP6 — THE CREDITS SHEET (a CC BY work needs its credit ON the site): a glass sheet from the menu (☰ → CREDITS on the title, in the lobby
// and in a game). ADD A CREDIT: one entry in CREDITS below — { group, title, by, licence, link? } — copy a model's / a recording's line
// exactly as its credits.txt gives it (e.g. art/models/<name>/credits.txt). Groups show in the order they first appear.
import { h } from './dom.js';

// C4c — the harvest display's 3D model (art/models/harvest/credits.txt). Its licence (Tencent Hunyuan 3D 2.1 Community License) asks
// AI-generated content shown publicly to be identified as AI-generated, and does not cover the EU, the UK + South Korea.
// NIGHT-A — LISTED (the owner, Oct 29 4:34 pm: "we don't care about those few countries — it's a hobby project": Hunyuan3D models MAY
// SHIP, with the AI-generated label here). Before any MONEY (the app stores, payments, a paid pack): re-check every Hunyuan asset's terms.
export const HARVEST_MODEL_CREDIT = Object.freeze({ group: '3D MODELS', title: 'Harvest display (AI-generated)', by: 'Generated with Tencent Hunyuan3D 2.1 from a Grok Imagine reference image', licence: 'Tencent Hunyuan 3D 2.1 Community License — AI-generated', link: 'https://huggingface.co/tencent/Hunyuan3D-2.1' });
export const CREDITS = [
  HARVEST_MODEL_CREDIT,   // (NIGHT-A: live — the AI-generated label the licence asks for)
  // 3D MODELS (rendered offline into sprites — scripts/bake-model.mjs + scripts/bake/<recipe>.mjs; the raw models never ship) — word for word from its credits.txt
  // (art/models/<name>/credits.txt): the title, the author, the link, the licence
  { group: '3D MODELS', title: '"UFO" by sebslom', by: 'https://sketchfab.com/3d-models/ufo-75655f43c4fc4c56ab60746caf7119fe', licence: 'Licensed under CC BY 4.0 (http://creativecommons.org/licenses/by/4.0/)', link: 'https://sketchfab.com/3d-models/ufo-75655f43c4fc4c56ab60746caf7119fe' },
  // BNAME: the construction tower's crane (art/models/crane/credits.txt: "Crane by J-Toastie, CC BY 3.0 (poly.pizza)")
  { group: '3D MODELS', title: 'Crane by J-Toastie', by: 'J-Toastie (poly.pizza)', licence: 'CC BY 3.0 (poly.pizza)', link: 'https://poly.pizza/m/gCcpjaxFdv' },
  // SKY-A: every F-22 in the city (the TR-3B's chase, the air show, the missing man, the flyby, the skytypers) — art/models/f22/credits.txt
  { group: '3D MODELS', title: '"F22 Raptor FREE" by NLM', by: 'NLM (@NLM-Group)', licence: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)', link: 'https://sketchfab.com/3d-models/f22-raptor-free-2a64abf0866a405c865466c7642ca689' },
  // NIGHT-A2: City 2.0's EVENING deck (c2-80s-retro-synthwave) — the Pixabay Content License asks no attribution; credited anyway
  { group: 'THE MUSIC', title: '80s Retro Synthwave', by: 'Playsound, Pixabay', licence: 'Pixabay Content License', link: 'https://pixabay.com/music/synthwave-80s-retro-synthwave-186631/' },
  { group: 'THE CITY SOUNDS', title: 'Field recordings + effects', by: 'Freesound contributors (CC0), the Sonniss GDC Game Audio Bundles, Mixkit, Pixabay', licence: 'CC0 · royalty-free licences (edited, cut + re-encoded for the city)' },
  // NIGHT-B — THE STREET PARTY's crowd (the owner's party-crowd folder's credits.txt: none is CC BY — no attribution required — credited
  // anyway, word for word; only these files ship, cut + re-encoded: audio/city/party-*.mp3)
  { group: 'SOUND EFFECTS', title: 'Party-People outdoor 01 (german)', by: 'Pfannkuchn (Freesound)', licence: 'CC0', link: 'https://freesound.org/s/457606/' },
  { group: 'SOUND EFFECTS', title: 'CRWDWalla_Crowd, Walla, Dense Immersive Group of Adults, After or Befor a Show, Exterior, Spanish-Stereo_KSL_KS014', by: 'Sonik Sound Library (Sonniss GDC 2026 bundle)', licence: 'Sonniss GDC Game Audio Bundle licence', link: 'https://archive.org/download/sonniss-gdc-2026-game-audio-bundle-normalized/Sonik%20Sound%20Library%20-%20Spanish%20Wallas/CRWDWalla_Crowd%2C%20Walla%2C%20Dense%20Immersive%20Group%20of%20Adults%2C%20After%20or%20Befor%20a%20Show%2C%20Exterior%2C%20Spanish-Stereo_KSL_KS014.wav' },
  { group: 'SOUND EFFECTS', title: 'WALLA - Crowd laugh and shout - Interior - Louder - 14', by: 'Timothy McHugh (Sonniss GDC 2015 bundle)', licence: 'Sonniss GDC Game Audio Bundle licence', link: 'https://archive.org/download/game-audio-gdc/Sonniss.com%20-%20GDC%20-%20Game%20Audio%20Bundle/Timothy%20McHugh%20-%20Crowd%20Laughter/WALLA%20-%20Crowd%20laugh%20and%20shout%20-%20Interior%20-%20Louder%20-%2014.wav' },
  { group: 'SOUND EFFECTS', title: 'WALLA - Crowd laugh and shout - Interior - Louder - 9', by: 'Timothy McHugh (Sonniss GDC 2015 bundle)', licence: 'Sonniss GDC Game Audio Bundle licence', link: 'https://archive.org/download/game-audio-gdc/Sonniss.com%20-%20GDC%20-%20Game%20Audio%20Bundle/Timothy%20McHugh%20-%20Crowd%20Laughter/WALLA%20-%20Crowd%20laugh%20and%20shout%20-%20Interior%20-%20Louder%20-%209.wav' },
  { group: 'SOUND EFFECTS', title: 'WALLA - Crowd laugh and shout - Interior - Medium - 22', by: 'Timothy McHugh (Sonniss GDC 2015 bundle)', licence: 'Sonniss GDC Game Audio Bundle licence', link: 'https://archive.org/download/game-audio-gdc/Sonniss.com%20-%20GDC%20-%20Game%20Audio%20Bundle/Timothy%20McHugh%20-%20Crowd%20Laughter/WALLA%20-%20Crowd%20laugh%20and%20shout%20-%20Interior%20-%20Medium%20-%2022.wav' },
  { group: 'SOUND EFFECTS', title: 'WALLA - Crowd laugh and shout - Interior - Medium - 30', by: 'Timothy McHugh (Sonniss GDC 2015 bundle)', licence: 'Sonniss GDC Game Audio Bundle licence', link: 'https://archive.org/download/game-audio-gdc/Sonniss.com%20-%20GDC%20-%20Game%20Audio%20Bundle/Timothy%20McHugh%20-%20Crowd%20Laughter/WALLA%20-%20Crowd%20laugh%20and%20shout%20-%20Interior%20-%20Medium%20-%2030.wav' },
  { group: 'SOUND EFFECTS', title: 'Crowd Laughter Interior, Traveling Circus Tent, Small STEREO', by: '2496SoundEffects (Sonniss GDC 2019 bundle)', licence: 'Sonniss GDC Game Audio Bundle licence', link: 'https://archive.org/download/game-audio-gdcpart-5/Sonniss.com%20-%20GDC%202019%20-%20Game%20Audio%20Bundle/2496SoundEffects%20-%20Surround%20at%20the%20Show%202%205.1%20-%20Stereo/Crowd%20Laughter%20Interior%2C%20Traveling%20Circus%20Tent%2C%20Small%20STEREO.wav' },
  { group: 'SOUND EFFECTS', title: 'Laughter1', by: 'paulw2k (Freesound) via Pixabay', licence: 'Pixabay Content License', link: 'https://pixabay.com/sound-effects/people-laughter1-98297/' },
  { group: 'SOUND EFFECTS', title: 'audience_cheers_13', by: 'Soundrangers (Sonniss GDC 2018 bundle)', licence: 'Sonniss GDC Game Audio Bundle licence', link: 'https://archive.org/download/game-audio-gdcpart-4/Sonniss.com%20-%20GDC%202018%20-%20Game%20Audio%20Bundle/Soundrangers%20-%20Audience%20Reactions/audience_cheers_13.wav' },
  { group: 'SOUND EFFECTS', title: 'GAF SFX03 - Audience Reactions - Small Crowd Men, Cheer Applause, Long, Decrescendo, Crescendo, EN - ORTF', by: 'Game Audio Factory (Sonniss GDC 2016 bundle)', licence: 'Sonniss GDC Game Audio Bundle licence', link: 'https://archive.org/download/game-audio-gdcpart-2/Sonniss.com%20-%20GDC%202016-%20Game%20Audio%20Bundle/Game%20Audio%20Factory%20-%20GAFSFX03%20-%20Small%20Crowds%20Outdoors/GAF%20SFX03%20-%20Audience%20Reactions%20-%20Small%20Crowd%20Men%2C%20Cheer%20Applause%2C%20Long%2C%20Decrescendo%2C%20Crescendo%2C%20EN%20-%20ORTF.wav' },
  { group: 'SOUND EFFECTS', title: 'drinks_glasses_touching_003', by: '3maze - Kitchenware (Sonniss GDC 2019 bundle)', licence: 'Sonniss GDC Game Audio Bundle licence', link: 'https://archive.org/download/game-audio-gdcpart-5/Sonniss.com%20-%20GDC%202019%20-%20Game%20Audio%20Bundle/3maze%20-%20Kitchenware/drinks_glasses_touching_003.wav' },
  { group: 'SOUND EFFECTS', title: 'Glass Clinking', by: 'esperri (Freesound) via Pixabay', licence: 'Pixabay Content License', link: 'https://pixabay.com/sound-effects/film-special-effects-glass-clinking-92385/' },
  { group: 'SOUND EFFECTS', title: 'Glasses Clank', by: 'HogantheLogan (Freesound) via Pixabay', licence: 'Pixabay Content License', link: 'https://pixabay.com/sound-effects/household-glasses-clank-14886/' },
  { group: 'SOUND EFFECTS', title: 'people talking at street market', by: 'andrebola (Freesound) via Pixabay', licence: 'Pixabay Content License', link: 'https://pixabay.com/sound-effects/people-people-talking-at-street-market-102974/' },
  { group: 'SOUND EFFECTS', title: 'people talking at bar', by: 'andrebola (Freesound) via Pixabay', licence: 'Pixabay Content License', link: 'https://pixabay.com/sound-effects/people-people-talking-at-bar-72249/' },
  { group: 'THE TYPE', title: 'Orbitron', by: 'Matt McInerney', licence: 'SIL Open Font License 1.1', link: 'https://fonts.google.com/specimen/Orbitron' },
  { group: 'THE TYPE', title: 'Chakra Petch', by: 'Cadson Demak', licence: 'SIL Open Font License 1.1', link: 'https://fonts.google.com/specimen/Chakra+Petch' },
  { group: 'THE TYPE', title: 'JetBrains Mono', by: 'JetBrains', licence: 'SIL Open Font License 1.1', link: 'https://fonts.google.com/specimen/JetBrains+Mono' },
];

let sheet = null;
export function openCredits() {
  closeCredits();
  const groups = [];
  for (const c of CREDITS) { let g = groups.find(x => x.name === c.group); if (!g) groups.push(g = { name: c.group, items: [] }); g.items.push(c); }
  const body = h('div.cr-body', ...groups.map(g => h('section.cr-group', h('h3.cr-head', g.name), ...g.items.map(c =>
    h('div.cr-item', h('b.cr-title', c.link ? h('a', { href: c.link, target: '_blank', rel: 'noopener' }, c.title) : c.title), h('span.cr-by', c.by), h('span.cr-lic', c.licence))))));
  sheet = h('div.modal.cr-modal', { onclick: e => { if (e.target === sheet) closeCredits(); } },
    h('div.sheet.cr-sheet', { role: 'dialog', 'aria-label': 'Credits' },
      h('div.sheet-grip'),
      h('div.set-head', h('div', h('div.sheet-kicker', 'NEON SPEAKEASY'), h('h2.sheet-title', 'CREDITS')),
        h('button.icon-btn', { type: 'button', 'aria-label': 'Close', onclick: closeCredits }, '×')),
      body,
      h('button.btn.btn-primary.btn-block', { type: 'button', onclick: closeCredits }, h('span', 'CLOSE'))));
  document.body.append(sheet);
}
export function closeCredits() {
  if (!sheet) return;
  const s = sheet; sheet = null;
  s.classList.add('out');
  setTimeout(() => s.remove(), 260);
}
