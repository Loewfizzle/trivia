// Profiles on the server: automatic creation, name tags, restore keys, renames, the leaderboard opt-out.
//
//   profiles/{pid}: { n, nk, t, a, c, x, r, at, h? }   PUBLIC (name, tag, avatar, colour, XP, rank, hidden-from-boards)
//   uids/{uid}: pid                                    the device ↔ profile link (readable by that uid only)
//   ppriv/{pid}: { kh, at, nameAt, opt?, ban?, uids{uid:at} }   server only
//   pkeys/{keyHash}: pid                               server only — the key itself is never stored
//   tags/{nameKey}/{tag}: pid                          server only — keeps Mike#4821 unique per name
//   rl/{bucket}: { n, t }                              server only — restore attempts per uid / ip
import { createHmac, randomBytes, createHash } from 'node:crypto';
import { ref, val, fb } from './fb.js';
import { ApiError } from './http.js';
import { syncBoards, clearBoardCache } from './lb.js';
import { keyFromBytes, formatKey, normalizeKey } from '../../js/core/pkey.js';
import { nameKey, isOffensive } from '../../js/core/names.js';
import { sanitizeName } from '../../js/core/room-logic.js';
import { NAME_MAX, AVATAR_IDS, COLORS } from '../../js/config.js';

export const RENAME_MS = 24 * 3600_000;
const RESTORE_LIMIT = { uid: 10, ip: 40, windowMs: 3600_000 };

const PID_ALPHA = 'abcdefghijkmnpqrstuvwxyz23456789';
export function newPid() {
  const b = randomBytes(11);
  let s = 'p';
  for (const x of b) s += PID_ALPHA[x & 31];
  return s;
}
export const isPid = s => /^p[a-z2-9]{11}$/.test(String(s || ''));

export const keyHash = raw => createHmac('sha256', fb().pepper).update(`neon-key:${raw}`).digest('hex');

const cleanAvatar = a => (AVATAR_IDS.includes(a) ? a : AVATAR_IDS[0]);
const cleanColor = c => (COLORS.some(x => x.id === c) ? c : COLORS[0].id);

export async function pidOf(uid) {
  const pid = await val(`uids/${uid}`);
  return isPid(pid) ? pid : null;
}

export async function publicProfile(pid) {
  const p = await val(`profiles/${pid}`);
  return p ? { pid, n: p.n, t: p.t, a: p.a, c: p.c, x: p.x || 0, r: p.r || 0, h: !!p.h, at: p.at || 0 } : null;
}

/** Claims a 4-digit tag for a name: `prefer` if it's free under that name, else a random free one. */
export async function allocTag(nk, pid, prefer = null) {
  const tryTag = async t => {
    const r = await ref(`tags/${encodeKey(nk)}/${t}`).transaction(cur => (cur == null || cur === pid ? pid : undefined));
    return r.committed && r.snapshot.val() === pid;
  };
  if (prefer && await tryTag(prefer)) return prefer;
  for (let i = 0; i < 40; i++) {
    const t = String(1000 + (randomBytes(2).readUInt16BE(0) % 9000));
    if (await tryTag(t)) return t;
  }
  // a very popular name: walk the whole range
  const taken = (await val(`tags/${encodeKey(nk)}`)) || {};
  for (let n = 1000; n <= 9999; n++) if (!taken[n] && await tryTag(String(n))) return String(n);
  throw new ApiError(409, 'name_full', 'Too many players have this name — try another.');
}
async function releaseTag(nk, t, pid) {
  if (!nk || !t) return;
  await ref(`tags/${encodeKey(nk)}/${t}`).transaction(cur => (cur === pid ? null : undefined));
}
// RTDB keys can't hold . # $ [ ] /
export const encodeKey = s => String(s).replace(/[.#$[\]/%]/g, c => `%${c.charCodeAt(0).toString(16)}`) || '_';

/** A fresh restore key: returns the formatted key (shown to the player once; only its hash is stored). */
export async function newKey(pid) {
  const raw = keyFromBytes(randomBytes(12));
  const kh = keyHash(raw);
  const old = await val(`ppriv/${pid}/kh`);
  const patch = { [`pkeys/${kh}`]: pid, [`ppriv/${pid}/kh`]: kh, [`ppriv/${pid}/keyAt`]: Date.now() };
  if (old && old !== kh) patch[`pkeys/${old}`] = null;
  await ref('/').update(patch);
  return formatKey(raw);
}

/**
 * The caller's profile, created on first contact from their name / avatar / colour (existing players get one the
 * same way on their next visit). A changed avatar or colour is applied at once; a changed name goes through rename().
 * → { pid, profile, key? (only when just created), renamed?, rename? { blocked, until } }
 */
export async function ensureProfile(uid, info = {}, now = Date.now()) {
  const name = sanitizeName(info.name, NAME_MAX) || 'Player';
  const a = cleanAvatar(info.avatar), c = cleanColor(info.color);
  let pid = await pidOf(uid);
  if (pid) {
    const prof = await val(`profiles/${pid}`);
    if (prof) {
      const patch = {};
      if (info.avatar && prof.a !== a) patch.a = a;
      if (info.color && prof.c !== c) patch.c = c;
      if (Object.keys(patch).length) await ref(`profiles/${pid}`).update(patch);
      const out = { pid };
      if (info.name && sanitizeName(info.name, NAME_MAX) && prof.n !== name) {
        try { await rename(pid, name, { now }); out.renamed = true; } catch (e) {
          if (e.code !== 'rename_limit') throw e;
          out.rename = { blocked: true, until: e.extra.until };
        }
      }
      out.profile = await publicProfile(pid);
      return out;
    }
  }
  // create: claim the uid link first so two racing calls from one device can't make two profiles
  const fresh = newPid();
  const link = await ref(`uids/${uid}`).transaction(cur => (cur == null ? fresh : undefined));
  if (!link.committed) {
    pid = link.snapshot.val();
    if (isPid(pid) && await val(`profiles/${pid}/n`)) return { pid, profile: await publicProfile(pid) };
  }
  pid = link.committed ? fresh : pid;
  const nk = nameKey(name);
  const t = await allocTag(nk, pid);
  await ref('/').update({
    [`uids/${uid}`]: pid,
    [`profiles/${pid}`]: { n: name, nk, t, a, c, x: 0, r: 0, at: now },
    [`ppriv/${pid}/at`]: now,
    [`ppriv/${pid}/nameAt`]: 0,
    [`ppriv/${pid}/uids/${uid}`]: now,
  });
  const key = await newKey(pid);
  return { pid, profile: await publicProfile(pid), key, created: true };
}

/** Changes a profile's name (once a day unless forced by an admin; leaving an offensive name is always allowed). */
export async function rename(pid, input, { force = false, now = Date.now() } = {}) {
  const name = sanitizeName(input, NAME_MAX);
  if (!name) throw new ApiError(400, 'bad_name', 'Enter a name.');
  const prof = await val(`profiles/${pid}`);
  if (!prof) throw new ApiError(404, 'no_profile');
  if (prof.n === name) return publicProfile(pid);
  const nk = nameKey(name);
  // capitals / spacing only: free, the tag can't clash
  if (nk === prof.nk) { await ref(`profiles/${pid}/n`).set(name); return publicProfile(pid); }
  const nameAt = (await val(`ppriv/${pid}/nameAt`)) || 0;
  if (!force && !isOffensive(prof.n) && nameAt && now - nameAt < RENAME_MS) {
    throw new ApiError(429, 'rename_limit', 'Board names change once a day.', { until: nameAt + RENAME_MS });
  }
  const t = await allocTag(nk, pid, prof.t);           // Mike#4821 → Michael#4821 when #4821 is free for Michael
  await ref('/').update({ [`profiles/${pid}/n`]: name, [`profiles/${pid}/nk`]: nk, [`profiles/${pid}/t`]: t, [`ppriv/${pid}/nameAt`]: now });
  await releaseTag(prof.nk, prof.t, pid);
  clearBoardCache();
  return publicProfile(pid);
}

async function limited(bucket, max, now) {
  const r = await ref(`rl/${bucket}`).transaction(cur => {
    const x = cur && now - cur.t < RESTORE_LIMIT.windowMs ? cur : { n: 0, t: now };
    if (x.n >= max) return undefined;
    return { n: x.n + 1, t: x.t };
  });
  return !r.committed;
}

/** Links this device to the profile a key belongs to. A blank profile this device made on its own is removed. */
export async function restore(uid, input, ip = '', now = Date.now()) {
  const raw = normalizeKey(input);
  if (!raw) throw new ApiError(400, 'bad_key', 'That doesn’t look like a profile key (NEON-XXXX-XXXX-XXXX).');
  if (await limited(`u_${uid}`, RESTORE_LIMIT.uid, now) || (ip && await limited(`i_${createHash('sha256').update(ip).digest('hex').slice(0, 24)}`, RESTORE_LIMIT.ip, now))) {
    throw new ApiError(429, 'restore_limit', 'Too many attempts. Try again in an hour.');
  }
  const pid = await val(`pkeys/${keyHash(raw)}`);
  if (!isPid(pid) || !(await val(`profiles/${pid}/n`))) throw new ApiError(404, 'no_key', 'No profile has that key.');
  const old = await pidOf(uid);
  await ref('/').update({ [`uids/${uid}`]: pid, [`ppriv/${pid}/uids/${uid}`]: now });
  if (old && old !== pid) await dropIfBlank(old, uid);
  return { pid, profile: await publicProfile(pid) };
}

/** A profile that never finished a match is deleted when its device restores another one (frees the tag). */
async function dropIfBlank(pid, uid) {
  const [stats, prof, priv] = await Promise.all([val(`pstats/${pid}`), val(`profiles/${pid}`), val(`ppriv/${pid}`)]);
  const played = stats && stats.g && Object.values(stats.g).some(g => g && g.p > 0);
  const others = Object.keys((priv && priv.uids) || {}).filter(u => u !== uid);
  if (played || others.length) { if (priv && priv.uids) await ref(`ppriv/${pid}/uids/${uid}`).remove(); return; }
  const patch = { [`profiles/${pid}`]: null, [`ppriv/${pid}`]: null, [`pstats/${pid}`]: null };
  if (priv && priv.kh) patch[`pkeys/${priv.kh}`] = null;
  await ref('/').update(patch);
  if (prof) await releaseTag(prof.nk, prof.t, pid);
}

/** "Show me on global leaderboards" on/off (off: stats still count, every board entry is removed). */
export async function setShown(pid, show) {
  const ban = !!(await val(`ppriv/${pid}/ban`));
  await ref('/').update({ [`ppriv/${pid}/opt`]: show ? null : true, [`profiles/${pid}/h`]: (!show || ban) ? true : null });
  await syncBoards(pid);
}

export async function privateInfo(pid) {
  const p = (await val(`ppriv/${pid}`)) || {};
  return { shown: !p.opt, banned: !!p.ban, nameAt: p.nameAt || 0, renameAt: p.nameAt ? p.nameAt + RENAME_MS : 0, keyAt: p.keyAt || 0 };
}
