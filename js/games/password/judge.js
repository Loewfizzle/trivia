// THE PASSWORD — THE JUDGE on the phone (PW1 — docs/password.md "The server flow"): every answer comes from /api/daily (api/_lib/pw.js) — the
// phone never holds a word it hasn't been told. ONE shape the view talks to, so the preview (a local fake with fixed test words) and the real
// game plug in alike:
//   judge.start()      → { startedAt, done (a score, when today's run is finished), run (the run so far — a resume) }
//   judge.guess(word)  → { door, n, marks, solved, failed, word?, next?, done, finishedAt? }   (throws ApiFail 'not_a_word' | 'finished' | 'closed')
//   judge.finish()     → { score, stand, outcome }  (the server scores from ITS record; a retry gets the stored score back)
//   judge.canType(w)   → the phone's PRE-CHECK against the public data/words/valid-5.json (the server checks again)
// Everything goes through js/profile/api.js (fetch + the ID token — no database socket: THE PARKED DATABASE never wakes for a daily).
import { api } from '../../profile/api.js';
import { cleanWord } from './logic.js';

export const GAME_ID = 'password';
let validP = null;
/** the public spelling list (loaded once; the server is the judge of record — a missing list = everything passes the pre-check) */
export function loadValid() {
  return (validP ||= fetch(new URL('../../../data/words/valid-5.json', import.meta.url)).then(r => r.json()).then(s => new Set(String(s).toUpperCase().match(/.{5}/g) || [])).catch(() => null));
}
export function createApiJudge() {
  let valid = null;
  loadValid().then(v => { valid = v; });
  return {
    kind: 'api',
    async start() { const r = await api('daily', { action: 'start', game: GAME_ID }); return { startedAt: r.startedAt, done: r.done, run: r.run, day: r.day }; },
    async guess(word) { return api('daily', { action: 'guess', game: GAME_ID, word: cleanWord(word) }); },
    async finish() { return api('daily', { action: 'finish', game: GAME_ID, result: null }); },
    canType(w) { const c = cleanWord(w); return !!c && (!valid || valid.has(c)); },
  };
}
