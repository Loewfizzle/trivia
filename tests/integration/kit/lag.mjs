// A SLOW LINE for ONE test phone (JAYWALK H4B — e2e-jaywalk-match.mjs --lag): every WebSocket frame the page sends is held `up` ms, every
// frame it receives `down` ms — in order, on the emulators only (Chromium's own network throttle does not slow WebSockets). The database
// client's whole line runs over one socket, so this delays the phone's writes, their acks and its listeners alike — a real slow phone.
//   const H = await createHarness({ …, beforeLoad: installLag });   await setLag(page, 900, 900);   await setLag(page, 0, 0);
export async function installLag(page) {
  await page.evaluateOnNewDocument(() => {
    const N = window.WebSocket, lag = window.__lag = { up: 0, down: 0, sent: 0, got: 0 };
    class SlowSocket extends N {
      constructor(...a) {
        super(...a);
        let h = null, outAt = 0, inAt = 0;
        const real = N.prototype.send, self = this;
        this.send = d => {
          lag.sent++;
          const now = performance.now(), t = Math.max(outAt, now + lag.up); outAt = t;
          if (t - now <= 0.5) return real.call(self, d);
          setTimeout(() => { if (self.readyState === 1) real.call(self, d); }, t - now);
        };
        N.prototype.addEventListener.call(this, 'message', e => {
          lag.got++;
          if (!h) return;
          const now = performance.now(), t = Math.max(inAt, now + lag.down); inAt = t;
          if (t - now <= 0.5) h.call(self, e); else setTimeout(() => { if (h) h.call(self, e); }, t - now);
        });
        Object.defineProperty(this, 'onmessage', { configurable: true, get: () => h, set: f => { h = f; } });
      }
    }
    window.WebSocket = SlowSocket;
  });
}
/** this phone's line from now on: `up` ms on what it sends, `down` ms on what it receives (0, 0 = a fast line again) */
export const setLag = (page, up, down = up) => page.evaluate((u, d) => { window.__lag.up = u; window.__lag.down = d; return { ...window.__lag }; }, up, down);
