// JAYWALK JT2 — the lab's look for THE FRIEND LINE (`jaywalk-lab.mjs --jt2=friend`; the shots → friend/): the NEXT FRIEND's tape on a BUSY ROAD
// lane, FAR (6 lanes ahead — full strength, half the old) vs NEAR (2 lanes ahead — fading; gone at 1), by night + by day, with traffic on it —
// the tape lies under the cars (on the ground, its words depth tested) + the check: friendFade's numbers on the page
export async function looksFriend(p, { ok, sleep, waitFor, OUT, shot }) {
  const L = js => p.evaluate(js);
  for (const look of ['night', 'day']) {
    await L(`(() => { const J = window.__jwLab; J.freeze(false); J.ghosts(0); J.bot(false); J.restart('solo', 'look3'); J.setCamera(8, 'straight', true); J.setLook('${look}'); })()`);
    await sleep(700);
    // (a road lane with a car on it, grass 2 + 6 lanes below — where the kid can stand)
    const lane = await L(`(() => { const J = window.__jwLab; for (let l = 30; l < 800; l++) if (J.lane(l).type === 'road' && J.lane(l - 6).type === 'grass' && J.lane(l - 2).type === 'grass' && J.items(l).items.length >= 2) return l; return -1; })()`);
    ok(lane > 0, `${look}: a busy road lane for the friend line (lane ${lane})`);
    for (const [k, away] of [['far', 6], ['near', 2]]) {
      await p.evaluate((l, a) => { const J = window.__jwLab; J.warp(l - a); J.view.setLines({ best: null, friend: { lane: l, text: 'LIAM · 212' } }); }, lane, away);
      const busy = await waitFor(p, `window.__jwLab.items(${lane}).items.some(c => c.left < 6 && c.left + c.len > 2)`, 30000);
      await L('window.__jwLab.freeze(true)'); await sleep(150);
      if (OUT) await shot(p, `friend/${look}-${k}-${away}-lanes-390.png`);
      ok(busy, `${look} · ${k} (${away} lanes ahead): a vehicle on the friend's lane (shot)`);
      await L('window.__jwLab.freeze(false)');
    }
    await L('window.__jwLab.view.setLines(null)');
  }
  const f = await L("import('/js/games/jaywalk/lines.js').then(m => [6, 4, 2.5, 2, 1, 0].map(a => +m.friendFade(a).toFixed(2)))");
  ok(JSON.stringify(f) === JSON.stringify([1, 1, 0.5, 0.26, 0, 0]), `the fade: 6 · 4 · 2.5 · 2 · 1 · 0 lanes ahead → ${f.join(' · ')}`);
}
