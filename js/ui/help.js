// "How to play" sheet: rules for every game, one tab each. Opened from the title screen,
// the lobby (game cards + options sheet) and the settings sheet (any screen, mid-game too).
import { gameArtSvg } from './game-art.js';
import { h } from './dom.js';
import { GAMES } from '../config.js';

// Each game: a one-line goal, then short scannable sections. Keep them phone-sized.
const RULES = {
  cipher: {
    goal: 'Everyone gets the same secret word. Crack it before your friends do.',
    sections: [
      ['HOW A ROUND WORKS', [
        'Type a real word with the keyboard and press ENTER.',
        'Each letter flips to show how close you are (see the colors below).',
        'You get 6 guesses. Words get longer as the rounds go on (5 → 7 letters).',
        'The round ends when everyone is done or the timer runs out.',
      ]],
      ['THE COLORS', 'legend'],
      ['WATCH YOUR RIVALS', [
        'The small boards at the top are your opponents, live — colors only, no letters.',
      ]],
      ['SCORING', [
        'Solve it: 100 points, +25 for each letter over 5.',
        'Speed bonus: up to +100 the faster you solve.',
        'Efficiency: +20 for every guess you didn’t need.',
        'Didn’t solve it? 0 for that round.',
      ]],
    ],
  },
  signal: {
    goal: 'A trivia battle royale. Answer fast, hit your rivals, be the last one standing.',
    sections: [
      ['THE BASICS', [
        'Everyone starts with the same HP (75 / 100 / 150) and 2 shields.',
        'A multiple-choice question appears — you have 15 seconds.',
        'Tap a rival’s card any time to make them your target (⌖).',
      ]],
      ['EACH QUESTION', [
        'Right answer: you strike your target for 10–30 damage. The faster you answer, the harder you hit.',
        'Wrong answer or no answer: you lose a shield. Out of shields? You take 10 damage instead.',
        'Damage goes up every 5 questions (×1.25, ×1.5 …), so things get tense fast.',
      ]],
      ['WINNING', [
        'Hit 0 HP and you’re out — you keep watching as a spectator.',
        'Last player standing wins. After 35 questions, the most HP wins.',
      ]],
      ['TIPS', [
        '“LOCKED ON YOU” shows how many players are targeting you.',
        'Speed matters more than you think — a fast hit does triple a slow one.',
      ]],
    ],
  },
  overclock: {
    goal: 'A gauntlet of 30-second brain challenges. Everyone gets the exact same puzzle.',
    sections: [
      ['THE CHALLENGES', [
        'UNSCRAMBLE — tap the letters in order to rebuild the word.',
        'MEMORY SEQUENCE — watch the nodes light up, then repeat the pattern.',
        'ODD ONE OUT — find the one symbol that’s different, three grids in a row.',
        'QUICK MATH — four quick calculations, normal order of operations.',
        'PATTERN LOCK — type the next number in each sequence.',
        'TRIVIA LIGHTNING — three fast multiple-choice questions.',
        'COLOR CLASH — tap the color of the TEXT, not the color the word spells.',
        'SIGNAL LOCK — wait for the flash, then tap as fast as you can. Too early is a miss.',
        'QUICK COUNT — shapes flash, then vanish. How many of one kind? Off by one earns half.',
        'TRUE OR FALSE — rapid math and facts. Wrong answers cost points.',
        'LEXICON — nine letters: build words. Only your longest one counts.',
        'TIMELINE — tap four items into order (oldest → newest, smallest → biggest…).',
        'CLOSEST CALL — estimate a number. Closer = more points; the closest player gets +60.',
        'REWIRE — rotate tiles to route power from the source to the core. Two circuits.',
        'MISSING LINK — three words share one hidden word (COTTAGE · SWISS · CAKE → CHEESE). Two puzzles.',
        'SPELLCHECK — four spellings, one is right. Five words, one tap each.',
        'MAKE 24 — merge four number tiles with + − × ÷ until one tile says 24. Easy, then hard.',
        'COMPASS — follow the turns in your head, then tap the way you face. Five rounds, each longer.',
        'SORT IT — swipe each card to the side it belongs on. They come faster and faster.',
        'HIGHER OR LOWER — pick the winner of each pair. One wrong pick ends your streak.',
      ]],
      ['SCORING', [
        'Up to 100 points for accuracy (partial credit counts).',
        'Signal Lock is pure speed: faster reactions score more.',
        'Closest Call has no speed bonus — the +60 goes to whoever guessed closest.',
        'Sort It: wrong sorts cost half a point; 10 net right already makes 100.',
        'Compass: the speed bonus only counts your answering time, not the turns playing out.',
        'Get everything right and earn up to +60 for speed.',
        'The final challenge is worth DOUBLE.',
      ]],
      ['GOOD TO KNOW', [
        'Each challenge type explains itself the first time it shows up.',
        'No challenge type repeats within a match (Marathon: at most twice, never back to back).',
        'Quick mode is 6 challenges, Standard 12, Marathon 24.',
        'The leaderboard updates between every challenge.',
      ]],
    ],
  },
  bluff: {
    goal: 'Fool your friends with fake answers — and spot the truth hiding among the lies.',
    sections: [
      ['1 · WRITE A LIE (60 s)', [
        'A strange-but-true fact appears with a blank.',
        'Make up a fake answer believable enough to fool everyone.',
        'If you accidentally type the real answer, you’ll be asked to try another lie.',
      ]],
      ['2 · FIND THE TRUTH (30 s)', [
        'Everyone’s lies and the real answer are shuffled together.',
        'Tap the one you think is true. You can’t pick your own lie.',
        'Tap ♥ on the lie you found funniest.',
      ]],
      ['3 · THE REVEAL', [
        'Each lie is unmasked: who fell for it, then who wrote it.',
        'The real answer comes last — TRUTH VERIFIED.',
      ]],
      ['SCORING', [
        'Find the truth: 1,000 points.',
        'Every player fooled by your lie: 500 points.',
        'Every ♥ your lie gets: 100 points.',
        'The final round is worth TRIPLE.',
      ]],
    ],
  },
};

RULES.pulse = {
  goal: 'A rhythm race down a neon highway. Everyone plays the same song at the same moment — hit the notes on the beat.',
  sections: [
    ['HOW TO PLAY', [
      'Notes ride the three lanes toward you. Tap a lane the moment its note crosses the glowing line.',
      'Two notes side by side (Hard): tap both lanes together.',
      'The first time on a new phone, a 10-second “tap along” check syncs your audio. Switched headphones? Recalibrate in ⚙ settings.',
    ]],
    ['TIMING', [
      'PERFECT within 45 ms, GREAT 90 ms, GOOD 135 ms — later than that is a MISS.',
      'Random taps with no note nearby cost a few points.',
    ]],
    ['SCORING', [
      'PERFECT 100 · GREAT 70 · GOOD 40 points, times your combo multiplier.',
      'Every 10 notes in a row raises the multiplier, up to ×4. A miss resets it.',
    ]],
    ['ECHO BONUS', [
      'After each song: the game plays a short rhythm on the lanes. Listen, then play it back from memory.',
      'Three rounds, each one longer. Right lane + right timing = points.',
    ]],
  ],
};

RULES.golf = {
  goal: 'Neon mini golf: everyone plays the same hole at the same time. Fewest strokes over the course wins.',
  sections: [
    ['HOW TO PUTT', [
      'Touch your ball and drag back, like a slingshot. The dotted line shows where it goes; the ring shows the power.',
      'Let go to putt. Drag back onto the ball to cancel.',
      'Drag anywhere else to look around; pinch to zoom. The camera snaps back when you aim.',
    ]],
    ['THE RULES', [
      'At most 6 strokes per hole. Not in by then = 7.',
      'Off the edge: +1 stroke, and you’re back where you putted from.',
      'Once more than half the players are in the cup, everyone else gets 30 seconds.',
      'The other balls are ghosts: you see them, but they never touch yours.',
    ]],
    ['POWER-UPS (ZONE 2+)', [
      'Roll over one to pick it up. You hold one at a time; tap it to arm it for your next shot.',
      'GHOST: through walls (not over the edge). STICKY: stops dead at the first wall. MAGNET: the cup pulls the ball in.',
    ]],
    ['SABOTAGE', [
      'Birdie or better, or the best score on a hole, earns one sabotage on the next hole.',
      'FOG, WOBBLE (their aim drifts) or SHAKE. It lasts until their next shot ends (8 seconds at most).',
    ]],
    ['YOUR BALL', [
      'Pick a color, finish and trail from the lobby or the ball button during a hole. It’s saved on your phone.',
    ]],
  ],
};

const LEGEND = [
  ['2', 'A', 'Right letter, right spot'],
  ['1', 'B', 'In the word, wrong spot'],
  ['0', 'C', 'Not in the word'],
];

const TAB = { cipher: 'CB', signal: 'LS', bluff: 'NB', overclock: 'OC', pulse: 'PU', golf: 'NP' };

let sheet = null;

function body(id) {
  const r = RULES[id];
  return [
    h('p.help-goal', r.goal),
    ...r.sections.map(([title, items]) => h('section.help-section',
      h('h3.help-h', title),
      items === 'legend'
        ? h('ul.help-legend', LEGEND.map(([s, ch, label]) => h('li', h('span.help-tile', { dataset: { s } }, ch), h('span', label))))
        : h('ul.help-list', items.map(t => h('li', t))))),
  ];
}

export function openHelp(gameId = 'cipher') {
  closeHelp();
  let current = RULES[gameId] ? gameId : 'cipher';
  const content = h('div.help-body');
  const tabs = h('div.help-tabs', { role: 'tablist' });
  const name = h('h2.sheet-title');
  const show = id => {
    current = id;
    const g = GAMES.find(x => x.id === id);
    sheet.dataset.theme = g.theme;
    name.textContent = g.name;
    [...tabs.children].forEach(b => b.setAttribute('aria-selected', String(b.dataset.id === id)));
    content.replaceChildren(...body(id));
    content.scrollTop = 0;
  };
  for (const g of GAMES) {
    tabs.append(h('button.help-tab', { type: 'button', role: 'tab', dataset: { id: g.id, theme: g.theme }, onclick: () => show(g.id), 'aria-label': g.name, title: g.name }, gameArtSvg(g.id) || TAB[g.id]));
  }
  sheet = h('div.modal.help-modal', { onclick: e => { if (e.target === sheet) closeHelp(); } },
    h('div.sheet.help', { role: 'dialog', 'aria-label': 'How to play' },
      h('div.sheet-grip'),
      h('div.set-head', h('div', h('div.sheet-kicker', 'HOW TO PLAY'), name),
        h('button.icon-btn', { type: 'button', 'aria-label': 'Close', onclick: closeHelp }, '×')),
      tabs,
      content,
      h('button.btn.btn-primary.btn-block', { type: 'button', onclick: closeHelp }, h('span', 'GOT IT'))));
  document.body.append(sheet);
  show(current);
}

export function closeHelp() {
  if (!sheet) return;
  const s = sheet;
  sheet = null;
  s.classList.add('out');
  setTimeout(() => s.remove(), 260);
}
