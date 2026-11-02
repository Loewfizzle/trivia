// THE DAY CHART (SCHED Group 5) — the city's day hour by hour + the year view, drawn from core/harbor-daychart.js (the timetable + the
// planners the city runs). Mounted by /daychart (daychart.html, admins only) and by /admin (its card). Phone first: one column at 390,
// NEON GLASS cards, the categories as coloured chips. Prefix dc-.
import { h } from '../ui/dom.js';
import { dayChart, yearView, clockOf } from '../core/harbor-daychart.js';
import { SHOWCASE_LEVELS, showcaseOf } from '../core/harbor-showcase.js';
import { thanksgiving } from '../core/sky.js';

const CATS = Object.freeze({
  legendary: ['LEGENDARY', '#ff4fd8'], medium: ['MEDIUM', '#7df9ff'], sky: ['THE PATROL', '#9fb4ff'], windows: ['WINDOWS', '#ffb45c'],
  workers: ['WORKERS', '#c9b48a'], party: ['PARTY', '#ff2e97'], fireworks: ['FIREWORKS', '#ffd25a'], raid: ['THE RAID', '#ff5a5a'],
  holiday: ['HOLIDAY', '#7dff6a'], billboard: ['BILLBOARD', '#f3c06a'],
});
const pad = n => String(n).padStart(2, '0');
const keyOf = dt => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
/** the next date (from today, local) that is weekday dow */
const nextDow = (dow, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7 || 7)); return d; };
/** THE SAMPLE DAYS (the owner's list): a Tuesday, a Saturday party night, a lazy Sunday afternoon, a holiday night, a stormy winter day */
export function sampleDays(now = new Date()) {
  const y = now.getFullYear(), tg = thanksgiving(y), tgD = new Date(y, tg.m - 1, tg.d), hol = tgD > now ? tgD : new Date(y, 9, 31) > now ? new Date(y, 9, 31) : new Date(y + 1, 9, 31);
  return [
    { id: 'today', label: 'TODAY', key: keyOf(now) },
    { id: 'tue', label: 'A TUESDAY', key: keyOf(nextDow(2, now)) },
    { id: 'sat', label: 'A SATURDAY PARTY NIGHT', key: keyOf(nextDow(6, now)) },
    { id: 'sun', label: 'A LAZY SUNDAY', key: keyOf(nextDow(0, now)), from: 10, to: 19 },
    { id: 'hol', label: hol.getMonth() === 9 ? 'HALLOWEEN NIGHT' : 'THANKSGIVING', key: keyOf(hol) },
    { id: 'storm', label: 'A STORMY WINTER DAY', key: keyOf(nextDow(2, new Date(y + (now.getMonth() >= 1 ? 1 : 0), 0, 12))), wx: { storm: true, rain: 0.9, wind: 12, snow: 0.3 } },
  ];
}

/** mount the chart into `root` (an element) → { destroy } */
export function mountDayChart(root, o = {}) {
  const st = { day: 'today', level: 'high', view: 'day', date: null, ...o };
  const off = -new Date().getTimezoneOffset();
  function render() {
    const days = sampleDays(), pick = days.find(d => d.id === st.day) || days[0], key = st.date || pick.key;
    const head = h('div.dc-head',
      h('div.dc-tabs', ...[['day', 'THE DAY'], ['year', 'THE YEAR']].map(([v, l]) => h('button.dc-tab', { type: 'button', class: st.view === v ? 'is-on' : '', onclick: () => { st.view = v; render(); } }, l))),
      h('div.dc-tabs.dc-levels', h('span.dc-dim', 'THE SHOWCASE'), ...SHOWCASE_LEVELS.map(lv => h('button.dc-tab', { type: 'button', class: st.level === lv ? 'is-on' : '', onclick: () => { st.level = lv; render(); } }, lv.toUpperCase()))));
    if (st.view === 'year') { root.replaceChildren(head, yearCard(new Date().getFullYear() + (new Date().getMonth() >= 10 ? 1 : 0), st.level)); return; }
    const C = dayChart(key, { off, level: st.level, wx: pick.wx });
    const picks = h('div.dc-days', ...days.map(d => h('button.dc-day', { type: 'button', class: st.day === d.id && !st.date ? 'is-on' : '', onclick: () => { st.day = d.id; st.date = null; render(); } }, d.label)),
      h('input.dc-date', { type: 'date', value: key, 'aria-label': 'Any date', onchange: e => { if (e.target.value) { st.date = e.target.value; render(); } } }));
    const legend = h('div.dc-legend', ...Object.entries(CATS).map(([k, [l, c]]) => h('span.dc-chip', { style: { '--c': c } }, l)));
    const from = pick.from != null && !st.date ? pick.from : 6, to = pick.to != null && !st.date ? pick.to : 26;
    const hours = [];
    for (let hr = from; hr < to; hr++) {
      const its = C.items.filter(i => i.h0 >= hr && i.h0 < hr + 1);
      const med = its.filter(i => i.cat === 'medium'), rest = its.filter(i => i.cat !== 'medium');
      const on = C.items.filter(i => i.h0 < hr && i.h1 > hr && i.cat !== 'medium' && i.cat !== 'billboard');   // (still running from before)
      hours.push(h('div.dc-hour', { class: rest.some(i => i.big) ? 'is-big' : '' },
        h('div.dc-h', clockOf(hr).replace(':00', '')),
        h('div.dc-its',
          ...rest.map(i => h('div.dc-it', { style: { '--c': CATS[i.cat][1] }, class: i.big ? 'is-big' : '' }, h('b', clockOf(i.h0)), ' ', i.label)),
          med.length ? h('div.dc-it.dc-med', { style: { '--c': CATS.medium[1] } }, `${med.length} medium moment${med.length > 1 ? 's' : ''} (${med.map(i => clockOf(i.h0).replace(/ (am|pm)/, '')).join(', ')})`) : null,
          on.length ? h('div.dc-on', `on: ${[...new Set(on.map(i => i.label))].join(' · ')}`) : null)));
    }
    root.replaceChildren(head, picks,
      h('section.dc-card', ...C.summary.map((s, i) => h(i ? 'p.dc-sum' : 'h2.dc-title', s)), pick.wx && !st.date ? h('p.dc-sum.dc-warn', 'THE WEATHER: a storm (rain, gale, wet snow) — the fireworks called off, the promenade thin') : null),
      legend, h('section.dc-card.dc-hours', ...hours),
      h('p.dc-foot', 'Built from THE CITY TIMETABLE + the planners the city runs (core/harbor-daychart.js) — your local time zone. Admins only: the legendaries’ times are a spoiler.'));
  }
  function yearCard(year, lv) {
    const Y = yearView(year, { level: lv }), names = Object.keys(Y.totals);
    const L = showcaseOf(lv).legend;
    return h('section.dc-card',
      h('h2.dc-title', `${year} AT ${lv.toUpperCase()} — HOW OFTEN THE RARE THINGS COME`),
      h('p.dc-sum', `Legendaries: ${L.weeknight.join('–')} a weeknight, up to ${L.partyMax} a party night (from ${clockOf(L.partyFrom)}). scripts/sim-sched.mjs: the odds a 45-s prime-time visit catches one.`),
      h('div.dc-table', h('div.dc-tr.dc-th', h('span', ''), ...names.map(n => h('span', n.replace(/^THE /, '')))),
        ...Y.months.map(M => h('div.dc-tr', h('span', ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][M.m - 1]), ...names.map(n => h('span', String(M.counts[n] || 0))))),
        h('div.dc-tr.dc-th', h('span', 'YEAR'), ...names.map(n => h('span', String(Y.totals[n]))))));
  }
  render();
  return { destroy() { root.replaceChildren(); }, render };
}
