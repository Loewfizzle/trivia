// CITY CONTROLS A — THE PROGRAM (the radio's middle face; mockup 3): a printed RADIO LISTING on cream paper, built FROM THE DAY CHART
// (core/harbor-daychart.js — the same planners the city runs; never a hand-made list):
//   TONIGHT (or TODAY before 3 pm)  THREE SECTIONS (the owner's PROGRESSION A review, Nov 2): ON NOW (a live dot) · COMING UP (full strength,
//                                   a countdown on each) · EARLIER TONIGHT at the bottom, COLLAPSED to one line (greyed, its tags too);
//                                   a row moves between them as time passes (repainted in place — the scroll kept); the legendaries tagged
//                                   LEGEND (the owner only: a spoiler), YOURS in pink (his moments, his billboard messages, his intercom)
//   THE WEEK                         the legendaries a night, the party nights in red
//   YOUR QUEUE                       what he set AT A TIME + the billboard's messages + the REPEATS — CANCEL, or EDIT a message
import { h } from '../../ui/dom.js';
import { dayChart, clockOf, DAY_FROM, DAY_TO } from '../../core/harbor-daychart.js';
import { legendsTonight } from '../../core/harbor-showcase.js';
import { jackDef, phaseOf, localStart } from '../../core/harbor-radio.js';
import { ownerWindow } from '../../core/harbor-billboard.js';

const DOW = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = n => String(n).padStart(2, '0');
// (what goes on the listing: the city's real moments, never the background — the patrols, the medium tier, the workers)
const KEEP = new Set(['legendary', 'windows', 'fireworks', 'party', 'raid', 'holiday']);
const chartMemo = new Map();
function chartFor(key, level, off) { const k = `${key}|${level}|${off}`; if (!chartMemo.has(k)) { if (chartMemo.size > 12) chartMemo.clear(); chartMemo.set(k, dayChart(key, { off, level })); } return chartMemo.get(k); }

/** the city's evening as the phone sees it: { key (its local date — before 4 am, yesterday's), hNow (hours on that day's clock) } */
function cityDay(now) {
  const d = new Date(now), hr = d.getHours() + d.getMinutes() / 60;
  const day = hr < DAY_FROM ? new Date(d.getTime() - 864e5) : d;
  return { key: `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`, hNow: hr < DAY_FROM ? hr + 24 : hr, date: day };
}
/** a phrase for a listing row (the scenes' + the shows' plain names) */
/** EARLIER TONIGHT opened (kept across the poll's repaints) */
let earlierOpen = false;
/** a countdown: "in 6 min" · "in 1 h 20" */
const inOf = hrs => { const m = Math.max(1, Math.round(hrs * 60)); return m < 60 ? `in ${m} min` : `in ${Math.floor(m / 60)} h${m % 60 ? ` ${pad(m % 60)}` : ''}`; };
const nice = s => s.replace(/^THE BOSS’s BLUE TV \(his room\)$/, 'The boss’s TV').replace(/^A DANCE BREAK \((.+)\)$/, 'A dance break · $1');

export function paint({ st, now, cancel, edit }) {
  const T = now(), off = -new Date(T).getTimezoneOffset(), level = (st && st.showcase) || 'high';
  const { key, hNow, date } = cityDay(T);
  const C = chartFor(key, level, off), evening = hNow >= 15;
  const dayH = ms => { const x = (ms - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 3600e3; return x; };
  // TONIGHT: the city's rows + YOURS (his moments + messages on this day)
  const rows = C.items.filter(i => KEEP.has(i.cat) && !/^LIGHTS OUT/.test(i.label) && !/BOSS pulls/.test(i.label) && (evening ? i.h1 > 15 : true))
    .map(i => ({ h0: i.h0, h1: i.h1, label: nice(i.label), tag: i.cat === 'legendary' ? 'leg' : null }));
  const mine = (st && st.moments || []).filter(m => m.mine && m.state !== 'stopped');
  for (const m of mine) {
    const S0 = m.local ? localStart(m.local, m.made || m.at, off) : m.at, j = jackDef(m.jack), h0 = dayH(S0);
    if (h0 < DAY_FROM - 0.01 || h0 > DAY_TO) continue;
    rows.push({ h0, h1: dayH(m.until), label: `${j ? j.label[0] + j.label.slice(1).toLowerCase() : m.jack}${m.text ? ` “${m.text}”` : ''}${m.aud === 'me' ? ' · just me' : m.aud === 'room' ? ` · lobby only ${m.room || ''}` : ' · everyone'}`, tag: 'you' });
  }
  for (const b of (st && st.board) || []) {
    for (const probe of [T, T + 3600e3 * 6, T + 3600e3 * 12]) {
      const w = ownerWindow(b, probe, off); if (!w) continue;
      const h0 = dayH(w[0]); if (h0 < DAY_FROM || h0 > DAY_TO) break;
      rows.push({ h0, h1: dayH(w[1]), label: `Billboard · “${b.lines.filter(Boolean).join(' · ')}”`, tag: 'you' }); break;
    }
  }
  // (the intercom he sent AT A TIME / IN 10 MIN: YOURS on the listing too)
  for (const m of (st && st.intercom) || []) {
    if (m.state === 'stopped') continue;
    const h0 = dayH(m.at); if (h0 < DAY_FROM - 0.01 || h0 > DAY_TO) continue;
    rows.push({ h0, h1: dayH(m.until), label: `Intercom${m.head ? ` · “${m.head}”` : ''}${m.aud === 'me' ? ' · just me' : m.aud === 'room' ? ` · lobby only ${m.room || ''}` : ' · everyone'}`, tag: 'you' });
  }
  rows.sort((a, b) => a.h0 - b.h0);
  const clock = r => clockOf(r.h0).toUpperCase().replace(':00 ', ' ').replace(/^12 AM$/, 'MIDNIGHT');
  const tags = r => [r.tag === 'you' ? h('i.you', 'YOURS') : null, r.tag === 'leg' ? h('i.leg', 'LEGEND') : null];
  const onNow = rows.filter(r => r.h0 <= hNow && hNow < r.h1), coming = rows.filter(r => r.h0 > hNow), earlier = rows.filter(r => r.h1 <= hNow);
  const sec = (k, kids) => h('div.rd-prsec', { dataset: { sec: k } }, ...kids);
  const parts = [];
  if (onNow.length) parts.push(sec('now', [h('div.rd-prk', 'ON NOW'), ...onNow.map(r => h('div.rd-pr.is-now', h('b', h('i.rd-live', { 'aria-hidden': 'true' }), 'NOW'), h('span', r.label), ...tags(r)))]));
  parts.push(sec('next', [h('div.rd-prk', 'COMING UP'), ...(coming.length ? coming.map(r => h('div.rd-pr', h('b', clock(r)), h('span', r.label, h('small.rd-in', inOf(r.h0 - hNow))), ...tags(r)))
    : [h('div.rd-pr', h('span', rows.length ? 'That’s the night — nothing more on the program.' : 'A quiet one — nothing big on the program.'))])]));
  if (earlier.length) {
    const label = () => `${earlier.length} EARLIER ${earlierOpen ? '▴' : '▾'}`;
    const lab = h('span', label());
    const box = h('div.rd-prsec.rd-early', { class: earlierOpen ? 'is-open' : '', dataset: { sec: 'earlier' } },
      h('button.rd-prk.rd-earbtn', { type: 'button', 'aria-expanded': String(earlierOpen), onclick: e => { earlierOpen = !earlierOpen; box.classList.toggle('is-open', earlierOpen); e.currentTarget.setAttribute('aria-expanded', String(earlierOpen)); lab.textContent = label(); } }, lab),
      ...earlier.map(r => h('div.rd-pr.is-past', h('b', clock(r)), h('span', r.label), ...tags(r))));
    parts.push(box);
  }
  const tonight = h('section.rd-paper', h('h4', `${evening ? 'TONIGHT' : 'TODAY'} · ${DOW[date.getDay()]}`, h('em', `${MON[date.getMonth()]} ${date.getDate()} · your time`)), ...parts);

  // THE WEEK: the legendaries a night (the showcase's own list), the party nights red
  const week = [];
  for (let k = 0; k < 7; k++) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + k), dk = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const n = legendsTonight(d.getFullYear(), d.getMonth() + 1, d.getDate(), level).length, party = chartFor(dk, level, off).party;
    week.push(h('div', { class: party ? 'party' : '', title: party ? 'a party night' : '' }, DOW[d.getDay()].slice(0, 3), h('small', String(n))));
  }
  const weekCard = h('section.rd-paper', h('h4', 'THE WEEK', h('em', 'legendaries a night · party nights in red')), h('div.rd-wk', ...week));

  // YOUR QUEUE: his moments still to come + the billboard's messages (now · at a time · repeat)
  const q = [];
  for (const m of mine) {
    if (phaseOf(m, T) === 'done') continue;
    const j = jackDef(m.jack), when = m.local ? `${m.local.h % 12 || 12}:${pad(m.local.mi)} ${m.local.h < 12 ? 'AM' : 'PM'}` : phaseOf(m, T) === 'run' ? 'NOW' : clockOf(dayH(m.at)).toUpperCase();
    q.push(h('div.rd-pr', h('b', when), h('span', `${j ? j.label : m.jack}${m.text ? ` “${m.text}”` : ''}`), h('i.you', 'YOURS'),
      h('button.rd-qx', { type: 'button', onclick: () => cancel.moment(m.id) }, phaseOf(m, T) === 'run' ? 'STOP' : 'CANCEL')));
  }
  for (const m of (st && st.intercom) || []) {
    if (m.state === 'stopped' || !(T < m.at)) continue;
    q.push(h('div.rd-pr', h('b', clockOf(dayH(m.at)).toUpperCase()), h('span', `Intercom${m.head ? ` “${m.head}”` : ''} · ${(m.dur || 0).toFixed(1)} s`), h('i.you', 'YOURS'),
      cancel.intercom ? h('button.rd-qx', { type: 'button', onclick: () => cancel.intercom(m.id) }, 'CANCEL') : null));
  }
  for (const b of (st && st.board) || []) {
    const when = b.repeat ? `${b.repeat.dows.map(d => DOW[d].slice(0, 3)).join(' ')} ${b.local.h % 12 || 12}:${pad(b.local.mi)}` : b.local ? `${b.local.h % 12 || 12}:${pad(b.local.mi)} ${b.local.h < 12 ? 'AM' : 'PM'}` : 'NOW';
    q.push(h('div.rd-pr', h('b', when), h('span', `Billboard · “${b.lines.filter(Boolean).join(' · ')}”${b.repeat ? ' · every week' : ''}`),
      h('button.rd-qx', { type: 'button', onclick: () => edit(b) }, 'EDIT'), h('button.rd-qx', { type: 'button', onclick: () => cancel.board(b.id) }, 'CANCEL')));
  }
  const queue = h('section.rd-paper', h('h4', 'YOUR QUEUE', h('em', q.length ? 'tap to edit · cancel' : '')), ...(q.length ? q : [h('div.rd-pr', h('span', 'Nothing queued — fire a moment AT A TIME or post to the billboard from the desk.'))]));
  return [tonight, weekCard, queue];
}
