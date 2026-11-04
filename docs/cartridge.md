# THE CARTRIDGE PLUG — how a game plugs into the console

*(LOBBY 2.0 B — the owner: "the lobby is the console, the games are the cartridges". Written in full in LOBBY 2.0 B Group 3.)*

## What the console gives a game at its start
- `start({ code, matchId, settings, participants, now })` — `now` is the moment the MATCH BEGINS: the room's walk inside (the game start,
  `core/room-show.js#START_MS`) runs before it on every phone. Time the game's first phase from `now`, never from `Date.now()`.
