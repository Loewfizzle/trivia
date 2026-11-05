// SHELL 2.0 B2 — THE DISPLAY CHECK (docs/testing.md): is a display attached to this machine? PURE + node built-ins only (no puppeteer —
// the cloud's unit job imports it without the test kit's packages). Re-exported by kit/puppeteer.mjs.
export const NO_DISPLAY = 'no display attached (a no-screen boot)';
/** PURE — the verdict from what the machine said: { attached, reason } (count = the monitors Windows lists as present; null = unknown) */
export function displayVerdict({ platform, count, env }) {
  if (env === '1') return { attached: true, reason: 'DISPLAY_ATTACHED=1' };
  if (env === '0') return { attached: false, reason: NO_DISPLAY };
  if (platform !== 'win32') return { attached: true, reason: 'not Windows (the check is the mini PC\'s)' };
  if (count == null || !Number.isFinite(count)) return { attached: true, reason: 'unknown — the checks run as before' };
  return count > 0 ? { attached: true, reason: `${count} display${count === 1 ? '' : 's'} present` } : { attached: false, reason: NO_DISPLAY };
}
let displayAsk = null;
/** the machine's answer, once a process: Windows' present monitors (PowerShell Get-PnpDevice -Class Monitor -PresentOnly) */
export function displayAttached() {
  displayAsk ||= (async () => {
    let count = null;
    if (process.platform === 'win32' && process.env.DISPLAY_ATTACHED == null) {
      try {
        const { execFileSync } = await import('node:child_process');
        const out = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '@(Get-PnpDevice -Class Monitor -PresentOnly -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "OK" }).Count'], { encoding: 'utf8', timeout: 15000 });
        const n = parseInt(String(out).trim(), 10); count = Number.isFinite(n) ? n : null;
      } catch { count = null; }
    }
    return displayVerdict({ platform: process.platform, count, env: process.env.DISPLAY_ATTACHED });
  })();
  return displayAsk;
}

