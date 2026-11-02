// CITY 2.0 — THE SPEAKEASY BILLBOARD AS A MESSAGE BOARD (SCHED Group 4; the owner, Nov 1–2 — DECIDED): the automatic HINTS now, the owner's
// typed messages next pass (CITY CONTROLS adds them to the same queue). THE MESSAGE QUEUE = the timetable's `billboard.*` rows (what, when,
// priority, how long); this planner says what the board shows at a moment — a hint takes the WHOLE board for `show` s every `every` s inside
// its window, then the day's game is back (the owner, Nov 2: "short, whole board" — two short lines readable on the iPhone unzoomed, ~70 pt
// wide). Never names a legendary before it comes (an appointment, not a spoiler). PURE + on the city's clock: every phone the same.
import { knob, SCHEDULE } from './harbor-schedule.js';
import { legendsTonight } from './harbor-showcase.js';
import { partyDow } from './party.js';
import { localStart } from './harbor-radio.js';

const NAMES = Object.freeze({ blackbird: 'BLACKBIRD', ufo: 'THE SAUCER', tr3b: 'THE TR-3B', flyby: 'THE F-22s' });
/** the hour as words a 1920s card would print (21.5 → "9:30", 20 → "8") */
const clockWord = h => { const x = ((h % 24) + 24) % 24, H = Math.floor(x) % 12 || 12, M = Math.round((x % 1) * 60); return M ? `${H}:${String(M).padStart(2, '0')}` : `${H}`; };
const evOf = lc => { const hr = lc.h + (lc.mi || 0) / 60 + (lc.s || 0) / 3600; if (hr >= 12) return { y: lc.y, m: lc.m, d: lc.d, hr }; const p = new Date(Date.UTC(lc.y, lc.m - 1, lc.d) - 864e5); return { y: p.getUTCFullYear(), m: p.getUTCMonth() + 1, d: p.getUTCDate(), hr: hr + 24 }; };
const dowOf = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();
const isParty = (y, m, d) => { const pd = partyDow(y, m, d, dowOf(y, m, d)); return pd === 5 || pd === 6; };

/** the queue's rows (the automatic hints now; CITY CONTROLS' typed messages join as rows with kind 'text' next pass) */
export const billboardRows = () => SCHEDULE.filter(r => r.id.startsWith('billboard.') && r.status === 'live').map(r => ({ id: r.id, ...r.knobs }));

/**
 * The hints that may show at a local moment lc ({ y, m, d, h, mi, s }) → [{ id, lines: [a, b], art?, from (evening h), to, prio, every, show }]
 * (inside its window — whether it's ON right now is hintAt's cycle)
 */
export function hintsAt(lc, o = {}) {
  if (!lc || !lc.y) return [];
  const ev = evOf(lc), hr = ev.hr, party = isParty(ev.y, ev.m, ev.d), dow = dowOf(lc.y, lc.m, lc.d), out = [];
  for (const R of billboardRows()) {
    if (R.kind === 'fireworks' && !party && !(ev.m === 10 && ev.d === 31)) {
      const at = knob('fireworks.show').at;
      if (hr >= R.from && hr < at) out.push({ ...R, lines: [R.lines[0], `${R.lines[1]} ${clockWord(at)}`], from: R.from, to: at });
    } else if (R.kind === 'party' && party) {
      const sat = dowOf(ev.y, ev.m, ev.d) === 6, L = sat ? R.sat : R.fri, until = sat ? knob('fireworks.party').at : knob('party.night').from;
      if (hr >= R.from && hr < until) out.push({ ...R, lines: [L[0], `${L[1]} ${clockWord(until)}`], from: R.from, to: until });
    } else if (R.kind === 'lookup') {
      for (const L of legendsTonight(ev.y, ev.m, ev.d, o.level)) {
        const a = L.h - R.lead / 60; if (hr >= a && hr < L.h) { out.push({ ...R, lines: R.lines, from: a, to: L.h }); break; }
      }
    } else if (R.kind === 'postcard' && dow === R.dow && lc.h >= R.from && lc.h < R.to) {
      // (LAST WEEK's: the most recent legendary of the past 7 evenings that isn't the most common one — a small silhouette + its name)
      let pick = null;
      for (let k = 1; k <= 7 && !pick; k++) { const p = new Date(Date.UTC(lc.y, lc.m - 1, lc.d) - k * 864e5), L = legendsTonight(p.getUTCFullYear(), p.getUTCMonth() + 1, p.getUTCDate(), o.level); const x = L.find(q => q.kind === R.prefer) || L[L.length - 1]; if (x) pick = x.kind; }
      if (pick) out.push({ ...R, lines: [R.lines[0], NAMES[pick] || pick.toUpperCase()], art: pick, from: R.from, to: R.to });
    }
  }
  return out.sort((a, b) => b.prio - a.prio);
}
// ------------------------------------------------------------------ CITY CONTROLS A — THE OWNER's MESSAGES (the BILLBOARD jack)
// radio/board on the server → GET /api/admin?live=1 → setOwnerMessages: { id, lines: [a, b], local: { h, mi } | null, repeat: { dows } | null,
// at, until (a NOW message: abs ms), made } — a message takes the whole board for `show` s every `every` s inside its window (`len` min from
// its start; AT A TIME / a REPEAT: in each viewer's OWN local time); the owner's words win over the automatic hints
let OWNER = [];
export function setOwnerMessages(list) { OWNER = Array.isArray(list) ? list.filter(m => m && m.id && Array.isArray(m.lines)) : []; }
export const ownerMessages = () => OWNER;
/** a message's window that holds `ms` (or null): off = the viewer's zone (minutes east) → [w0, w1] abs ms */
export function ownerWindow(m, ms, off = 0) {
  const B = knob('radio.billboard'), span = B.len * 60e3, dayMs = 864e5, offMs = off * 60e3;
  if (!m.local) return m.at != null && ms >= m.at && ms < (m.until || m.at + span) ? [m.at, m.until || m.at + span] : null;
  // (AT A TIME, once: the first such local time from when it was made)
  if (!m.repeat) { const w0 = localStart(m.local, m.made || ms, off); return ms >= w0 && ms < w0 + span ? [w0, w0 + span] : null; }
  // (A REPEAT: today's or yesterday's (a window past midnight) on its days)
  const d0 = Math.floor((ms + offMs) / dayMs) * dayMs - offMs;
  for (const back of [0, 1]) {
    const day = d0 - back * dayMs, w0 = day + (m.local.h * 60 + m.local.mi) * 60e3;
    if (m.repeat.dows.includes(new Date(day + offMs).getUTCDay()) && ms >= w0 && ms < w0 + span) return [w0, w0 + span];
  }
  return null;
}
// CC-B — THE INTERCOM's HEADLINE (audio/intercom.js → setIntercomHead): up on the board the whole time the announcement plays (wins over all)
let IC_HEAD = null;
export function setIntercomHead(lines) { IC_HEAD = Array.isArray(lines) && lines[0] ? [String(lines[0]), String(lines[1] || '')] : null; }
export const intercomHead = () => IC_HEAD;
/** the owner's message ON at abs ms (its spell in the cycle) → { id, lines, own: true } | null */
export function ownerAt(ms, off = 0) {
  if (IC_HEAD) return { id: `ic.${IC_HEAD.join('|')}`, lines: IC_HEAD, art: null, own: true };
  const B = knob('radio.billboard');
  for (const m of OWNER) { const w = ownerWindow(m, ms, off); if (w && (((ms - w[0]) / 1000) % B.every) < B.show) return { id: `own.${m.id}`, lines: m.lines, art: null, own: true }; }
  return null;
}

/** what the board shows at a local moment + abs seconds t: the top hint whose cycle is ON (its `show` s every `every` s, counted from its
 *  window's start on the city's clock) → { id, lines, art? } | null (null: the day's game). CITY CONTROLS A: the owner's messages first
 *  (o.off: the viewer's zone, minutes east) */
export function hintAt(lc, t, o = {}) {
  { const own = ownerAt(t * 1000, o.off || 0); if (own) return own; }
  for (const H of hintsAt(lc, o)) {
    const ev = evOf(lc), into = (ev.hr - H.from) * 3600;
    if (((into % H.every) + H.every) % H.every < H.show) return { id: H.id, lines: H.lines, art: H.art || null };
  }
  return null;
}
