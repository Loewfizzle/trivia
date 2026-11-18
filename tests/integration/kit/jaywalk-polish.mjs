// JAYWALK THE POLISH PASS — the lab's looks for this pass (`jaywalk-lab.mjs --polish[=share|lines]`; the shots → share/ · lines/)
//   share: THE CAUSE LINE's DARK BAND — a real run's end in the lab (a car · the water · the blackout / the fog) BY NIGHT + BY DAY: the game's own
//          frame grab (night.js#snap, as view.js takes it) → the game's own card (share.js#drawRunMiddle on kit/share-run.js#drawRunCard) at its
//          1080 × 1350, the 540 × 675 the link carries, and the link-preview size (a 390 pt phone, two a row) + a check: the band under the words
//          is dark on every frame (the brightest included)
//   lines: THE LINES' WORDS OVER THE TRAFFIC — YOUR BEST / a friend's line on a road lane, a vehicle passing over the words (both looks)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export async function looksShare(p, { ok, sleep, waitFor, OUT }) {
  const L = js => p.evaluate(js);
  const cards = [];
  for (const look of ['night', 'day']) {
    for (const what of ['car', 'water', 'wall']) {
      await L(`(() => { const J = window.__jwLab; J.bot(false); J.restart('solo', 'look3'); J.setCamera(8, 'straight', true); J.setLook('${look}'); J.hop('u'); })()`);
      await sleep(900);
      const lane = await p.evaluate(w => { const J = window.__jwLab;
        if (w === 'car') return J.find('road', 24);
        if (w === 'water') { for (let l = 24; l < 400; l++) if (J.lane(l).type === 'water' && J.lane(l - 1).type === 'grass') return l; return J.find('water', 24); }
        return J.find('grass', 30); }, what);
      await p.evaluate((l, w) => window.__jwLab.warp(w === 'wall' ? l : l, { safe: false }), lane, what);
      const over = await waitFor(p, 'window.__jwLab.state().over', what === 'wall' ? 60000 : 25000);
      await sleep(460);   // (view.js#SHOT_MS — the frame a beat after the hit)
      const r = await p.evaluate(async () => {
        const J = window.__jwLab, v = J.view, s = J.state();
        const [S, K] = await Promise.all([import('/js/games/jaywalk/share.js'), import('/js/games/kit/share-run.js')]);
        await Promise.all(['900 66px Orbitron', '700 64px "Chakra Petch"'].map(f => document.fonts.load(f)));
        const cv = await new Promise(res => v.snap(res, 1080, 1080));
        const shot = cv ? { canvas: cv, line: s.line, lanes: s.best, kidY: (v.kidScreenY() * cv.full - cv.top) / cv.height, kidX: v.kidScreenX() } : null;
        const card = K.drawRunCard({ ...S.jwRunCard({ mode: 'solo', results: { u: { l: Math.max(1, s.best) } } }, { uid: 'u', name: 'BEN' }), line: s.line }, (c, box, k) => S.drawRunMiddle(c, box, k, shot), S.JW_CARD);
        // the band's darkness: the band's own pixels — under the words' row, left of the words (the glow's edge excluded): the mean luminance
        const c2 = card.getContext('2d'), B = S.JW_CARD.box, px = c2.getImageData(B.x + 6, B.y + 6, 26, 92 + 20).data;
        let lum = 0; for (let i = 0; i < px.length; i += 4) lum += (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
        const half = document.createElement('canvas'); half.width = 540; half.height = 675; half.getContext('2d').drawImage(card, 0, 0, 540, 675);
        window.__polishCards = (window.__polishCards || []).concat([card]);
        return { line: s.line, cause: s.cause, shot: !!shot, lum: lum / (px.length / 4), full: card.toDataURL('image/png'), half: half.toDataURL('image/png') };
      });
      ok(over && r.shot && r.lum < 0.2, `THE CAUSE LINE's BAND — ${look}, ${what} → "${r.line}": the run's own frame on the card, the band under the words dark (luminance ${r.lum.toFixed(3)})`);
      if (OUT) {
        mkdirSync(join(OUT, 'share'), { recursive: true });
        writeFileSync(join(OUT, 'share', `${look}-${what}-1080x1350.png`), Buffer.from(r.full.split(',')[1], 'base64'));
        writeFileSync(join(OUT, 'share', `${look}-${what}-540x675.png`), Buffer.from(r.half.split(',')[1], 'base64'));
      }
      cards.push(`${look} · ${r.line}`);
    }
  }
  // THE LINK PREVIEW: the six cards as a chat shows them (≈ 176 pt wide on a 390 pt phone — two a row)
  if (OUT) {
    await p.evaluate(() => {
      const o = document.createElement('div'); o.id = 'pcards';
      o.style.cssText = 'position:fixed;inset:0;z-index:99;background:#0b0716;display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px;align-content:start;justify-items:center';
      for (const cv of window.__polishCards) { cv.style.cssText = 'width:176px;height:220px;border-radius:12px'; o.append(cv); }
      document.body.append(o);
    });
    await sleep(300); await p.screenshot({ path: join(OUT, 'share', 'preview-cards-390x844.png') });
    await L("document.getElementById('pcards').remove(); window.__polishCards = []");
  }
  return cards;
}

// THE LINES' WORDS OVER THE TRAFFIC: YOUR BEST (gold) on a road lane + a friend's (pink) on the next, the kid two lanes below; the shot is
// taken as a TRUCK (3 cells) and then any vehicle passes over the words — by night + by day
export async function looksLines(p, { ok, sleep, waitFor, OUT, shot }) {
  const L = js => p.evaluate(js);
  for (const look of ['night', 'day']) {
    await L(`(() => { const J = window.__jwLab; J.bot(false); J.restart('solo', 'look3'); J.setCamera(8, 'straight', true); J.setLook('${look}'); J.hop('u'); })()`);
    await sleep(700);
    const lane = await p.evaluate(() => { const J = window.__jwLab; for (let l = 20; l < 400; l++) if (J.lane(l).type === 'road' && J.lane(l + 1).type === 'road' && J.lane(l - 1).type !== 'water' && J.lane(l - 2).type === 'grass' && J.items(l).items.some(q => q.len >= 3)) return l; return -1; });
    ok(lane > 0, `a road lane with a truck, a road above it, grass two below (lane ${lane})`);
    await p.evaluate(l => { const J = window.__jwLab; J.warp(l - 2); J.view.setLines({ best: { lane: l - 1, text: 'YOUR BEST · 143' }, friend: { lane: l, text: 'LIAM · 212' } }); }, lane);
    // (a line marks the FAR edge of its lane — the words lie on the lane above it: YOUR BEST at lane-1 sits on `lane`, LIAM's on lane+1)
    for (const [k, l] of [['truck', lane], ['car', lane], ['car-above', lane + 1]]) {   // (a vehicle across the screen's centre column — where the words are)
      const seen = await waitFor(p, `window.__jwLab.items(${l}).items.some(c => ${k === 'truck' ? 'c.len >= 3 && ' : k === 'car' ? 'c.len < 3 && ' : ''}c.left < 4.6 && c.left + c.len > 4.4)`, 30000);
      await sleep(30);
      if (OUT) await shot(p, `lines/${look}-${k}-over-the-words.png`);
      ok(seen, `${look}: a ${k} over the words of the line on lane ${l} (shot)`);
    }
  }
  await L("window.__jwLab.view.setLines(null)");
}
