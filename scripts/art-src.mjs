// RAW ART OFF GIT (the inbox, Nov 26 2026 — the owner; built in FREEFALL F3B): RAW SOURCES — 3D models (.glb / .gltf / .fbx / .blend / .obj),
// texture masters, .psd / .kra, audio masters (.wav / .flac) — live OUTSIDE the repo, in ONE folder: NS_ART_SRC (default
// C:\Users\benja\Downloads\NEON\art-src), one sub-folder an area. ONLY the BAKED outputs the site loads go into git
// (tests/repo-growth.test.mjs is the guard). Every bake / asset script finds its sources through this file (Python: scripts/art_src.py —
// the same rule) and FAILS WITH A CLEAR MESSAGE when a source is missing — never silently.
// The sources that were ALREADY in git before the rule (art/models/…) stay where they are (taking them out does not shrink history): a
// source is looked for in NS_ART_SRC first, then at its old place in the repo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** THE ONE PATH SETTING: where the raw sources live (the environment's NS_ART_SRC, else the owner's folder) */
export const ART_SRC = process.env.NS_ART_SRC || 'C:\\Users\\benja\\Downloads\\NEON\\art-src';

/**
 * a raw source by its name — the repo-style path a recipe has always used ('art/models/ufo/ufo-01-sebslom.glb') or one inside the
 * sources' folder ('models/ufo/x.glb'): <NS_ART_SRC>/models/ufo/… first, then the file already in git at that old place.
 * → its absolute path. Missing in both places: an Error that names both + the setting.
 */
export function rawSource(name) {
  const rel = String(name).replace(/\\/g, '/').replace(/^\.?\//, ''), inner = rel.replace(/^art\//, '');
  if (path.isAbsolute(name) && fs.existsSync(name)) return name;
  const outside = path.join(ART_SRC, ...inner.split('/')), legacy = path.join(ROOT, ...rel.split('/'));
  if (fs.existsSync(outside)) return outside;
  if (fs.existsSync(legacy)) return legacy;
  throw new Error(`RAW ART OFF GIT — the source "${name}" is missing: looked in ${outside} (NS_ART_SRC = ${ART_SRC}) and at its old place in the repo (${legacy}). Put the raw file under NS_ART_SRC — only the baked outputs go into git.`);
}
