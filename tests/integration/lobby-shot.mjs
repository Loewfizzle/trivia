// A quick look at the lobby header (sign + room code) on the review sizes: node lobby-shot.mjs "<browser>" ./shots-lobby
import { createHarness, REVIEW_SIZES } from './kit/harness.mjs';

const H = await createHarness({ name: 'lobby', slot: 'l', sizes: REVIEW_SIZES });
let fatal = null;
try {
  const host = await H.createRoom();
  await H.sleep(2500);
  await H.shotAll(host, 'lobby-head');
  await H.cleanText(host, 'lobby', '.lobby-screen');
  H.ok(true, 'LOBBY: rendered');
} catch (e) { fatal = e; }
await H.finish(fatal);
