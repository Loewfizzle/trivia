// THE /board LINK PREVIEW's rows (FR7 FIXES B — Group 1): seeds the LOCAL EMULATORS ONLY with eight made-up players (no real username),
// each wearing a card, three counted PRISM DROP matches each → THE BOARD has real-looking rows; then `node tests/integration/og-board-shot.mjs`
// shoots the velvet board → assets/og-board.jpg. Never the live database (the emulator hosts are forced below).
//   node scripts/seed-og-board.mjs        (the emulators on :9000 / :9099 — `cd tests/integration && npm run emulators`)
process.env.FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'demo-arcade';
process.env.MATCH_GAP_MS = '20000';
const { ref, fb } = await import('../api/_lib/fb.js');
const { profileAction } = await import('../api/profile.js');
const { processReport } = await import('../api/report.js');
const { finalGame } = await import('../tests/fixtures/finals.mjs');
const { extractMatch } = await import('../js/core/match-report.js');
const { deleteApp } = await import('firebase-admin/app');

// made-up names only (never a real player's)
const P = [
  ['og-1', 'VELVETFOX', 'magenta', 'crown', 'card-marquee-gold'],
  ['og-2', 'NIGHTOWL', 'cyan', 'moon', 'card-aurora'],
  ['og-3', 'JAZZHANDS', 'yellow', 'star', 'card-gold'],
  ['og-4', 'NEONKID', 'green', 'bolt', 'card-neonglass'],
  ['og-5', 'MOONSHINE', 'violet', 'ghost', 'card-velvet'],
  ['og-6', 'DIAMONDJO', 'blue', 'diamond', 'card-sapphire'],
  ['og-7', 'LUCKYSTAR', 'orange', 'target', 'card-inferno'],
  ['og-8', 'RUMRUNNER', 'red', 'wave', 'card-noir'],
];
const NODES = ['vault/lab', 'profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'lb', 'results', 'rooms', 'seats', 'members', 'audit'];
await ref('/').update(Object.fromEntries(NODES.map(n => [n, null])));
let clock = Date.now() - 40 * 60_000;
const pid = {};
for (const [uid, name, color, avatar, card] of P) {
  const r = await profileAction(uid, { action: 'ensure', name, avatar, color }, '', clock);
  pid[uid] = r.pid || (r.profile && r.profile.pid);
  if (!pid[uid]) pid[uid] = (await (await import('../api/_lib/fb.js')).val(`uids/${uid}`));
  await ref(`pstats/${pid[uid]}/it/${card}`).set(clock);
  await ref(`profiles/${pid[uid]}/cd`).set(card);
}
// the owner's APPROVE marks for these eight cards (as live — docs/vault-lab-marks.md) on THE EMULATOR, so the strips draw their real art
await ref('vault/lab').update(Object.fromEntries(P.map(p => [p[4], { m: 'approve', note: '', at: clock, by: 'og-seed', v: 1 }])));
const NIGHT = { 1: 3, 2: 2, 3: 1 };
let n = 0;
async function match(uids) {
  const code = `OG${'ABCDEFGHJK'[n % 10]}${'LMNPQRSTUV'[Math.floor(n / 10) % 10]}`; n++;
  const game = finalGame('prism', uids, {});
  game.phaseStartAt = clock;
  const ranks = extractMatch(game, {});
  const night = { g: 'prism', at: clock, p: {}, n: {} };
  const names = Object.fromEntries(P.map(p => [p[0], p[1]]));
  for (const [u, r] of Object.entries(ranks.rows)) { night.p[u] = NIGHT[r.rank] || 0; night.n[u] = names[u]; }
  await ref(`rooms/${code}`).set({
    meta: { hostId: uids[0], status: 'playing', createdAt: clock, activeAt: clock },
    players: Object.fromEntries(uids.map((u, i) => [u, { name: names[u], color: 'cyan', avatar: 'bolt', joinedAt: i, pid: pid[u] }])),
    game, night: { [game.matchId]: night },
  });
  const res = await processReport(uids[0], { code, matchId: game.matchId }, clock);
  return res.status;
}
// three rounds, two tables of four, the winners rotating (the order = the finishing order)
const ROUNDS = [[['og-1', 'og-2', 'og-3', 'og-4'], ['og-5', 'og-6', 'og-7', 'og-8']],
  [['og-1', 'og-5', 'og-2', 'og-6'], ['og-3', 'og-7', 'og-4', 'og-8']],
  [['og-1', 'og-3', 'og-5', 'og-7'], ['og-2', 'og-4', 'og-6', 'og-8']],
  [['og-2', 'og-1', 'og-6', 'og-5'], ['og-4', 'og-3', 'og-8', 'og-7']]];
for (const tables of ROUNDS) {
  clock += 3 * 60_000;
  for (const t of tables) console.log(t.join(' '), await match(t));
}
console.log('seeded', Object.keys(pid).length, 'players');
await deleteApp(fb().app);
process.exit(0);
