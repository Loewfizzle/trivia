// A stand-in for js/audio/engine.js for the SFX probe: hands the game's synth an OfflineAudioContext whose
// destination stands for the SFX bus, so an effect can be rendered and measured without a gesture or speakers.
// (An offline context reports 'suspended' until it renders; the synths only play on a 'running' one, so it is proxied.)
let ctx = null, bus = null;
export function setOffline(c) {
  ctx = new Proxy(c, { get: (o, k) => (k === 'state' ? 'running' : typeof o[k] === 'function' ? o[k].bind(o) : o[k]) });
  bus = c.createGain(); bus.gain.value = 1; bus.connect(c.destination);
}
export const getContext = () => ctx;
export const getSfxBus = () => bus;
export const getMusicBus = () => bus;
export const isUnlocked = () => true;
export const onUnlock = () => () => {};
export const onResume = () => () => {};
export const onVisibility = () => () => {};
export const installAudio = () => {};
