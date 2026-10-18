// Firebase Admin for the /api functions (files under api/_lib are not routes).
//
// Production (Vercel environment variables):
//   FIREBASE_SERVICE_ACCOUNT  the service account key JSON (paste the whole file; base64 of it works too)
//   FIREBASE_DATABASE_URL     https://<project>-default-rtdb.firebaseio.com (or the regional URL)
//   KEY_PEPPER                optional: a long random secret for hashing profile keys (default: derived from the key)
//   ADMIN_PIDS                your profile id(s), comma-separated — they may use /admin
// Local tests: FIREBASE_DATABASE_EMULATOR_HOST + FIREBASE_AUTH_EMULATOR_HOST (scripts/serve.mjs --emu sets them).
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';
import { createHash } from 'node:crypto';

let cached = null;

function serviceAccount() {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!raw) return null;
  const text = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const sa = JSON.parse(text);
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  return sa;
}

export const emulated = () => !!process.env.FIREBASE_DATABASE_EMULATOR_HOST;

export function fb() {
  if (cached) return cached;
  let app = getApps()[0];
  let pepper = process.env.KEY_PEPPER || '';
  if (!app) {
    if (emulated()) {
      const project = process.env.GCLOUD_PROJECT || 'demo-arcade';
      app = initializeApp({ projectId: project, databaseURL: `http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}?ns=${project}-default-rtdb` });
      pepper ||= 'emulator-pepper';
    } else {
      const sa = serviceAccount();
      if (!sa) throw Object.assign(new Error('FIREBASE_SERVICE_ACCOUNT is not set'), { status: 503, code: 'unconfigured' });
      if (!process.env.FIREBASE_DATABASE_URL) throw Object.assign(new Error('FIREBASE_DATABASE_URL is not set'), { status: 503, code: 'unconfigured' });
      app = initializeApp({ credential: cert(sa), databaseURL: process.env.FIREBASE_DATABASE_URL });
      pepper ||= createHash('sha256').update(`neon-pepper:${sa.private_key}`).digest('hex');
    }
  } else if (!pepper) {
    pepper = emulated() ? 'emulator-pepper' : createHash('sha256').update(`neon-pepper:${(serviceAccount() || {}).private_key || ''}`).digest('hex');
  }
  cached = { app, db: getDatabase(app), auth: getAuth(app), pepper };
  return cached;
}

export const db = () => fb().db;
export const ref = path => fb().db.ref(path);
export const val = async path => (await fb().db.ref(path).once('value')).val();

export const adminPids = () => String(process.env.ADMIN_PIDS || process.env.ADMIN_PID || '').split(/[\s,]+/).filter(Boolean);
