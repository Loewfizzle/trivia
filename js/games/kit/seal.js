// THE SEAL (APP FIXES — Grok 4.1): a game's in-round SECRETS (BLUFF's lies + votes, LAST SIGNAL's answers, OVERCLOCK's words /
// guesses / orders) live OUTSIDE rooms/ — rooms/{CODE} is readable by any signed-in user — in seal/{CODE}/{node}/{match}/{key}/{uid}:
// the owner reads + writes their own; under rooms/ the same path holds only a public { done: true, at } (the "FILED ✓" the others
// see). When the round's time is up (or everyone is in), the host writes game/unseal/{node} = key — PENCILS DOWN: from then on
// nobody writes that round's envelopes (the rules), and only the host may read them (the rules) — then its director goes on with
// the secrets, as before. The pure directors are untouched: sealGate (here, pure) turns "leave the phase" into "unseal first" until
// the host's read of the envelopes has landed. A module opts in with `export const sealed = game => ({ name: 'node/match/key' })`
// (its livePaths names); games/registry.js#livePathsFor adds `my_<name>` (your own envelope, every phone) and `seal_<name>` (the
// round's envelopes — the host, once unsealed). docs/data-model.md "THE SEAL".

/** is this round's node unsealed (pencils down)? */
export const unsealed = (game, node, key) => !!(game && game.unseal && String(game.unseal[node]) === String(key));

/**
 * The director's patch → the patch to write. A patch that LEAVES `phase` before the node's key is unsealed becomes the unseal
 * itself (`{ 'unseal/node': key }`); once unsealed (and the host's live data holds the envelopes — host.js only directs once every
 * live path loaded) the director's own patch goes through.
 */
export function sealGate(game, patch, { node, key, phase }) {
  if (!patch || patch.lobby || game.phase !== phase) return patch;
  const leaves = patch.phase != null && patch.phase !== phase;
  if (!leaves || unsealed(game, node, key)) return patch;
  return { [`unseal/${node}`]: String(key) };
}

/** the public flags + the host's envelopes → one map (an envelope wins; an older client's public node with the secret still counts) */
export function mergeSealed(pub, sealed) {
  const out = {};
  for (const [uid, v] of Object.entries(pub || {})) out[uid] = { ...v };
  for (const [uid, v] of Object.entries(sealed || {})) out[uid] = { ...(out[uid] || {}), ...v };
  return out;
}
