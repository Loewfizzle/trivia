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

RULES.agent = {
  goal: 'Everyone gets the same secret word — except the Double Agent, who only knows the category. Find the leak. 4–8 players.',
  sections: [
    ['1 · YOUR CLASSIFIED FILE', [
      'Press and hold your file to read it; let go and it hides again.',
      'You see the secret word — or YOU ARE THE DOUBLE AGENT and only the category.',
      'Tap READY when you have it.',
    ]],
    ['2 · CLUES', [
      'One at a time, everyone types ONE word linked to the secret word.',
      'Too obvious and the agent learns the word. Too vague and you look like the agent.',
      'You can’t say the word itself (or a word containing it), or repeat a clue. Run out of time and your clue is — NO SIGNAL —.',
    ]],
    ['3 · DEBATE & VOTE', [
      'REMOTE: argue it out in the debate chat. SAME ROOM: talk it out loud.',
      'Tap a player to pin them as suspicious — everyone sees your pin.',
      'Then vote for the agent (not yourself). Most votes is accused; a tie means the agent slips away.',
    ]],
    ['4 · THE UNMASKING', [
      'The accused is revealed: INNOCENT, or DOUBLE AGENT.',
      'A caught agent gets 20 seconds to name the secret word and steal the round.',
    ]],
    ['SCORING', [
      'Agent escapes: +200. Caught, but names the word: +150.',
      'Agent caught and misses: every innocent player +100.',
      'Every innocent who voted for the agent: +50 more.',
      'Each round has a new word and a new agent. Most points after the last round wins.',
    ]],
  ],
};

RULES.prism = {
  goal: 'A falling-block battle set to music. Everyone gets the same pieces in the same order. 2–8 players.',
  sections: [
    ['CONTROLS (GESTURES)', [
      'Drag sideways: the piece follows your finger, one column at a time.',
      'Tap the right half to rotate clockwise, the left half to rotate counter-clockwise.',
      'Drag down slowly to soft drop. Flick down fast to drop it instantly. Swipe up to hold a piece for later.',
      'Prefer buttons? ⚙ settings → PRISM DROP → BUTTONS (and the swipe sensitivity / button size).',
    ]],
    ['BATTLE', [
      'Clearing lines sends junk rows to your target: 2 lines = 1, 3 = 2, 4 = 4. Twists hit harder, back-to-back and combos add more, a perfect clear sends 10.',
      'Incoming junk shows on the red bar beside your board and lands about a second later — clear lines first to cancel it.',
      'Tap TARGET to choose: RANDOM, ATTACKERS (whoever is hitting you) or DANGER (whoever is closest to the top).',
      'Knock someone out and you take their badges plus one. Badges make your attacks stronger.',
      'Fill your board to the top and you’re out. Last one standing wins. It speeds up every minute; after 5 minutes junk rises on its own.',
      'Out? Call the winner within 10 seconds — a right call earns game-night points (more the earlier you call it).',
    ]],
    ['SCORE RUSH', [
      'No attacks — everyone plays for points for exactly one song. The match ends on the song’s final beat.',
      'Bigger clears, twists, combos and back-to-back clears score more; every 10 lines the level (and speed) goes up.',
      'Top out and your board resets — your score stays.',
    ]],
    ['TWISTS', [
      'Rotate the T-shaped piece into a tight slot (three of its corners blocked) to score a twist.',
    ]],
  ],
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

const TAB = { prism: 'PD', cipher: 'CB', signal: 'LS', bluff: 'NB', overclock: 'OC', pulse: 'PU', golf: 'NP', agent: 'DA' };

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
