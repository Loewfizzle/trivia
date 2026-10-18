// Match kit — the per-game test hook (`window.__slip`, `window.__gridlock`…) the E2E suites drive.
// The hook is only installed on `?emu` pages or localhost; a game's view calls installTestHook in mount and
// removeTestHook in unmount (only its own hook is removed, so a second mount never clobbers a newer one).
export const testMode = () => typeof location !== 'undefined' && (/[?&]emu\b/.test(location.search) || location.hostname === 'localhost');

export function installTestHook(name, api, { always = false } = {}) {
  if (!always && !testMode()) return null;
  window[name] = api;
  return api;
}
export function removeTestHook(name, api) {
  if (window[name] === api) delete window[name];
}
