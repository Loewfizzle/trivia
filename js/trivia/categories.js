// Host-selectable trivia categories, mapped to each source's ids.
// An empty selection means MIXED (rotate through all of them).
export const CATEGORIES = [
  { id: 'science', label: 'SCIENCE', otdb: [17, 18, 19, 27], tapi: 'science' },
  { id: 'history', label: 'HISTORY', otdb: [23, 20], tapi: 'history' },
  { id: 'geography', label: 'GEOGRAPHY', otdb: [22], tapi: 'geography' },
  { id: 'screen', label: 'FILM & TV', otdb: [11, 14], tapi: 'film_and_tv' },
  { id: 'music', label: 'MUSIC', otdb: [12], tapi: 'music' },
  { id: 'sports', label: 'SPORTS', otdb: [21], tapi: 'sport_and_leisure' },
  { id: 'arts', label: 'ARTS & LIT', otdb: [10, 25], tapi: 'arts_and_literature' },
  { id: 'general', label: 'GENERAL', otdb: [9], tapi: 'general_knowledge' },
];

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]));

export function selectedCategories(ids) {
  const list = Array.isArray(ids) ? ids : ids && typeof ids === 'object' ? Object.values(ids) : [];
  const chosen = CATEGORIES.filter(c => list.includes(c.id));
  return chosen.length ? chosen : CATEGORIES;
}

// Reverse map for labelling questions from either API.
const OTDB_TO_ID = {};
CATEGORIES.forEach(c => c.otdb.forEach(n => { OTDB_TO_ID[n] = c.id; }));
const TAPI_TO_ID = Object.fromEntries(CATEGORIES.map(c => [c.tapi, c.id]));
export const categoryFromOtdbName = name => {
  const n = String(name || '').toLowerCase();
  if (n.includes('science') || n.includes('animals') || n.includes('mathematic') || n.includes('computer')) return 'science';
  if (n.includes('history') || n.includes('mythology')) return 'history';
  if (n.includes('geography')) return 'geography';
  if (n.includes('film') || n.includes('television')) return 'screen';
  if (n.includes('music')) return 'music';
  if (n.includes('sport')) return 'sports';
  if (n.includes('book') || n.includes('art')) return 'arts';
  return 'general';
};
export const categoryFromTapi = slug => TAPI_TO_ID[slug] || 'general';
export { OTDB_TO_ID };
