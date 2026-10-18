// RUMRUNNER — every number that balances the economy, in one place (scripts/sim-rum.mjs plays bot matches against it).
// Change these, then run `node scripts/sim-rum.mjs` and `node --test tests/rum.test.mjs`.

export const START_CASH = 3000;     // was 2000: one early bust (run caught, load seized) no longer leaves too little to climb back with, and 15-day games get going
export const START_DEBT = 5500;
export const START_CAP = 100;
export const LENGTHS = [15, 20, 30];

// Mr. Vale's daily interest (compounding at the start of each day after the first), by game length
export const INTEREST = { 15: 0.06, 20: 0.05, 30: 0.045 };   // was 7.5 / 6 %: the first five days were a treadmill; idle still ends deep in the red

// the six goods: [id, name, low, high] — the daily price lives between low and high before district, events and the market
export const GOODS = [
  ['shine', 'MOONSHINE', 12, 60],
  ['rum', 'RUM', 70, 240],
  ['gin', 'GIN', 280, 820],
  ['whiskey', 'WHISKEY', 950, 3000],
  ['cigars', 'CIGARS', 2800, 7600],
  ['champ', 'CHAMPAGNE', 7500, 19500],
];

// districts: price tendency per good (× the daily price), the chance a good is on sale there on a given day, risk
//   feds: base chance of a federal tail (only when carrying), hijack: base chance of hijackers (only when carrying)
// sim: tendencies widened (cheapest ~0.6-0.75, dearest ~1.3-1.45; were 0.66-0.8 / 1.22-1.34) so knowing the map pays: the Docks
//   (rum, cigars), the Quarter (shine) and the Rail Yard (gin, whiskey) are where you buy, Uptown / the Strip / the Heights where you
//   sell. feds roughly doubled (were .17 .15 .10 .08 .07 .03) so a loaded truck is tailed every ~4-6 days, and the busy markets
//   (Docks, Uptown) are the risky ones; the Heights stay the safe, dear, fee-charging end of town.
export const DISTRICTS = [
  { id: 'docks', name: 'THE DOCKS', tend: { shine: 1.0, rum: 0.62, gin: 1.0, whiskey: 1.05, cigars: 0.7, champ: 1.1 }, avail: 0.8, feds: 0.3, hijack: 0.06, fee: 0 },
  { id: 'uptown', name: 'UPTOWN', tend: { shine: 1.15, rum: 1.1, gin: 1.2, whiskey: 1.32, cigars: 1.15, champ: 1.3 }, avail: 0.75, feds: 0.26, hijack: 0.02, fee: 0 },
  { id: 'strip', name: 'THE STRIP', tend: { shine: 1.25, rum: 1.25, gin: 1.2, whiskey: 1.1, cigars: 1.1, champ: 1.1 }, avail: 0.85, feds: 0.19, hijack: 0.03, fee: 0, wild: 0.18 },
  { id: 'quarter', name: 'OLD QUARTER', tend: { shine: 0.6, rum: 0.95, gin: 0.85, whiskey: 0.9, cigars: 1.0, champ: 0.9 }, avail: 0.8, feds: 0.15, hijack: 0.04, fee: 0 },
  { id: 'rail', name: 'RAIL YARD', tend: { shine: 0.85, rum: 0.9, gin: 0.7, whiskey: 0.75, cigars: 0.9, champ: 0.85 }, avail: 0.85, feds: 0.13, hijack: 0.11, fee: 0 },
  { id: 'heights', name: 'HARBOR HEIGHTS', tend: { shine: 1.2, rum: 1.15, gin: 1.15, whiskey: 1.35, cigars: 1.4, champ: 1.45 }, avail: 0.7, feds: 0.06, hijack: 0.01, fee: 450 },
];

// the daily random swing (log-uniform between low and high); the Strip swings wider ('wild')
// the shared market: net units bought by everyone in a district move tomorrow's price there by this much per unit,
// relative to a market's depth (units it absorbs before the price moves 100 %), clamped, and fading each day
// (unchanged: 3 players dumping 100 units → -33 % there tomorrow, -17 % the day after; one truck -11 %; a pile-up bottoms at -45 %)
export const MARKET = { depth: 900, clampLo: 0.55, clampHi: 1.7, fade: 0.5 };

// city-wide price news (spikes and crashes): how many a day, how big
export const NEWS = { perDay: [0, 1, 1, 1, 2, 2], spike: [3, 5], crash: [0.25, 0.4], spikeShare: 0.5 };
// rumours about tomorrow's news: how often they are right
export const RUMOR_TRUE = 0.7;

// weather: odds per day and its effect (feds × chance, run + odds, prices at the docks + rail yard when shipments are delayed)
export const WEATHER = {
  clear: { odds: 0.3, feds: 1.3, run: -0.1 },
  rain: { odds: 0.3, feds: 1.0, run: 0.05 },
  fog: { odds: 0.22, feds: 0.7, run: 0.18 },
  storm: { odds: 0.18, feds: 0.8, run: 0.1, delay: 1.25 },
};

// personal events: base chances per day (× by length), the cap per day
export const EVENTS = {
  scale: { 15: 1.2, 20: 1.2, 30: 1.25 },   // was 1.12 / 1.0 / 0.85: the long games were nearly risk-free (a tail every 10+ days); now ~4.5-5.5 everywhere
  maxPerDay: 2,
  find: 0.06, rumor: 0.11, garage: 0.06,
  tip: 0.2,                       // + chance of a federal tail per tip-off against you
  vale: { over: 1.5, overdue: 0.5, chance: 0.55, take: 0.45, payShare: 0.3 },   // debt > over × start, or debt left after this share of the match
  // vale was { over 2.0, overdue 0.55, chance 0.4, take 0.3 }: never paying cost a trader nothing; now his men come sooner, more often
  // and take more (never paying: ~-10 % at 15 days, -25 % at 20, -60 % at 30), while paying late is still fine
};

// the feds: RUN odds (+ weather + armour), what a failed run costs; BRIBE price (share of cargo value) and odds; DUMP loses it all
export const FEDS = { run: 0.4, armor: 0.25, runMax: 0.92, fineShare: 0.15, fineBase: 100, seize: 0.7, bribe: 0.1, bribeMin: 100, bribeOdds: 0.9 };
// was { run .55, armor .2, fineShare .12, fineBase 300, seize .6, bribe .3, bribeMin 200 }: running was the better bet on average and
//   a 30 % bribe was never worth it, so caution never paid. Now RUN is a real gamble (~45 % odds, 70 % of the load if it fails — with
//   armour in the fog it is the smart play), a BRIBE is cheap but needs cash on hand (~17 % of the load expected), and the small fine
//   floor no longer bankrupts a first-week truck of moonshine.
// hijackers: HAND OVER loses this share; FLOOR IT: these odds (+ armour) to lose nothing, else twice the share
export const HIJACK = { share: 0.3, floor: 0.3, armor: 0.35 };   // was floor .5 / armour .25: flooring it was a coin flip worth the same as handing over; now it pays only with armour
// hidden compartments keep this share of what would be lost
export const HIDDEN_KEEP = 0.5;
// a lucky find: units of a good (by tier)
export const FIND = { units: [5, 16] };   // was 8-26: a lucky crate of cigars or champagne in the first week decided whole matches

// upgrades: price; where you can buy them; a garage event offers one at a discount
export const UPGRADES = {
  truck1: { name: 'BIGGER TRUCK', price: 2500, cap: 50, at: ['rail'] },   // was 3500: now pays back inside a 15-day match too
  truck2: { name: 'FREIGHT TRUCK', price: 10000, cap: 100, at: ['rail'], needs: 'truck1' },   // was 12000
  armor: { name: 'ARMORED TRUCK', price: 7000, at: ['rail', 'docks'] },
  hidden: { name: 'HIDDEN COMPARTMENTS', price: 3200, at: ['docks', 'rail'] },
  warehouse: { name: 'HIDDEN WAREHOUSE', price: 5000, at: ['quarter'] },
  cop: { name: 'CROOKED COP', price: 1500, fee: 250, feds: 0.5, at: ['quarter', 'uptown'] },
};
export const GARAGE_DISCOUNT = 0.3;

// TIP OFF THE FEDS: the price is a share of the target's fortune, at least this
export const TIPOFF = { share: 0.04, min: 300, max: 25000 };
