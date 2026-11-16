# PARKED — the frozen games' browser tests (FIXES R2, THE REVIEW B1 option (b) "keep compatible", the owner Nov 15)

Seven E2Es, six look previews and three probes for games on `js/config.js#FROZEN_IDS` (NEON PAR, PULSE, DOUBLE AGENT, SLIPSTREAM, GRIDLOCK,
HIGH STAKES, RUMRUNNER). **Nothing runs them and they cannot pass**: `host.js#startGame` refuses a game that isn't playable and
`games/registry.js#loadGame` refuses a frozen id (an emulator-only `&frozen=1` loads one on purpose). They were built for the retired lobby.

They are parked, not deleted (THE FROZEN CONTRACT — docs/cartridge.md): the pure `logic.js` + `director.js` of every frozen game stay
importable and their whole-match sims (`tests/<id>*.test.mjs`) stay green; views, CSS, these E2Es, previews and help are NOT maintained.

A game that comes back (`playable: true` — it leaves FROZEN_IDS by itself) moves its files back up to `tests/integration/`, fixes their
`./kit/` imports, ports its view to the room in the city, and makes its E2E pass again — in that same pass.
