// CITY CONTROLS B — THE INTERCOM on the owner's desk (radio.js mounts it; the rules: core/radio-intercom.js; the player: audio/intercom.js).
//   THE MIC       a slim strip with a chrome grille: HOLD TO TALK (≤ `maxS` s — it stops itself), the ON AIR lamp, a level meter + the
//                 seconds while recording. Nothing leaves the phone before SEND.
//   THE REVIEW    (a card over the desk) PLAY BACK (through the PA — this phone only) · the brass lever ON THE BILLBOARD (default ON,
//                 remembered) + the headline (≤ 24 letters; a SUGGESTED line from the browser's own speech recognition where it has one)
//                 · WHO HEARS IT (the desk's knob) · WAIT FOR THE LOBBY / DON'T WAIT · DISCARD · SEND
//   SENT          a strip per announcement still going out: ON ITS WAY / PLAYING + UNSEND (until every phone would have it: `unsend` s)
// iOS: the mic needs the page's permission (asked on the first hold — a hold that ends before it's granted just asks again); MediaRecorder
// gives AAC in MP4 there (Opus in WebM elsewhere); ~48 kbps → ~180 KB for 30 s.
import { h } from '../../ui/dom.js';
import { serverNow } from '../../firebase.js';
import { knob } from '../../core/harbor-schedule.js';
import * as IC from '../../core/radio-intercom.js';
import { AUD_LABEL } from '../../core/harbor-radio.js';
import { intercomFeed, intercomStopped, playAnnouncement } from '../../audio/intercom.js';

const HEAD_KEY = 'nd:rd-ic-head', WAIT_KEY = 'nd:rd-ic-wait';
const ls = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* fine */ } } };
const MIMES = ['audio/mp4', 'audio/mp4;codecs=mp4a.40.2', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
const pickMime = () => { try { return MIMES.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || ''; } catch { return ''; } };
const secs = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const toB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });

/** o: { sfx, act (body, sound) → server, who () → { aud, room, line }, setCard (card | null), render (), st () } */
export function createIntercomDesk(o) {
  const K = knob('radio.intercom');
  let rec = null;                        // the recording in progress: { mr, stream, chunks, t0, meter, sr, transcript, timer, raf }
  let take = null;                       // the last recording: { blob, mime, dur, url, transcript }
  let preview = null;                    // PLAY BACK's handle
  let err = '';

  // ---------------------------------------------------------------- recording
  async function start(e) {
    if (rec || take && take.sending) return;
    e && e.preventDefault && e.preventDefault();
    err = '';
    const want = { held: true };
    rec = { want, t0: 0, chunks: [], level: 0 };
    paintStrip();
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch (x) { rec = null; err = x && x.name === 'NotAllowedError' ? 'THE MIC IS BLOCKED — ALLOW IT IN THE BROWSER’S SETTINGS' : 'NO MIC ON THIS DEVICE'; o.sfx.play('denied'); paintStrip(); return; }
    if (!want.held) { stream.getTracks().forEach(t => t.stop()); rec = null; err = 'HOLD THE BUTTON WHILE YOU TALK'; paintStrip(); return; }   // (the permission prompt took the hold)
    const mime = pickMime();
    let mr;
    try { mr = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: K.kbps * 1000 }); }
    catch { try { mr = new MediaRecorder(stream); } catch { stream.getTracks().forEach(t => t.stop()); rec = null; err = 'THIS BROWSER CAN’T RECORD'; paintStrip(); return; } }
    rec = { ...rec, mr, stream, mime: mr.mimeType || mime || 'audio/webm', t0: performance.now() };
    const chunks = rec.chunks;   // (the LAST chunk arrives after the release — Safari may give everything there: never through `rec`)
    mr.ondataavailable = ev => { if (ev.data && ev.data.size) chunks.push(ev.data); };
    mr.start(250);
    // the level meter (its own small context: the city's audio graph is never touched by the mic)
    try {
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC(), an = ac.createAnalyser(); an.fftSize = 512;
      ac.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      rec.meter = { ac, an, buf };
    } catch { /* a meter is polish */ }
    // a suggested headline (where the browser can listen too — never required)
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) { const r = new SR(); r.lang = 'en-US'; r.interimResults = false; r.continuous = true; r.onresult = ev => { let t = ''; for (const x of ev.results) t += `${x[0].transcript} `; if (rec) rec.transcript = t; else if (take) take.transcript = t; }; r.onerror = () => {}; r.start(); rec.sr = r; }
    } catch { /* fine */ }
    o.sfx.play('fire');
    rec.timer = setTimeout(() => stop(), K.maxS * 1000);
    const frame = () => {
      if (!rec || !rec.mr) return;
      const el = (performance.now() - rec.t0) / 1000;
      if (rec.meter) { const { an, buf } = rec.meter; an.getByteTimeDomainData(buf); let pk = 0; for (const v of buf) pk = Math.max(pk, Math.abs(v - 128)); rec.level = Math.min(1, pk / 90); }
      paintMeter(el);
      rec.raf = requestAnimationFrame(frame);
    };
    rec.raf = requestAnimationFrame(frame);
    paintStrip();
  }
  function stop() {
    if (!rec) return;
    if (!rec.mr) { rec.want.held = false; return; }      // (still asking for the mic)
    const r = rec; rec = null;
    clearTimeout(r.timer); cancelAnimationFrame(r.raf);
    const dur = Math.min(K.maxS, (performance.now() - r.t0) / 1000);
    r.mr.onstop = () => {
      r.stream.getTracks().forEach(t => t.stop());
      try { if (r.meter) r.meter.ac.close(); } catch { /* fine */ }
      try { if (r.sr) r.sr.stop(); } catch { /* fine */ }
      if (dur < K.minS) { err = 'HOLD THE BUTTON WHILE YOU TALK'; paintStrip(); return; }
      const blob = new Blob(r.chunks, { type: r.mime });
      take = { blob, mime: r.mime, dur, transcript: r.transcript || '', head: null, headOn: ls.get(HEAD_KEY, true), wait: ls.get(WAIT_KEY, true) };
      o.sfx.play('jackIn');
      o.setCard({ kind: 'mic' });
      // the suggestion lands a moment after the release (the recognizer's last result)
      setTimeout(() => { if (take && take.head == null && take.transcript) { take.head = IC.suggestHead(take.transcript); o.render(); } }, 900);
    };
    try { r.mr.stop(); } catch { r.mr.onstop(); }
    paintStrip();
  }

  // ---------------------------------------------------------------- THE MIC strip
  let stripEl = null, meterEl = null, timeEl = null;
  function strip() {
    const recording = !!(rec && rec.mr), asking = !!(rec && !rec.mr);
    const bars = Array.from({ length: 14 }, () => h('i'));
    meterEl = h('span.rd-meter', { 'aria-hidden': 'true' }, ...bars);
    timeEl = h('b.rd-mic-t', recording ? `${secs((performance.now() - rec.t0) / 1000)} / ${secs(K.maxS)}` : `UP TO ${K.maxS} S`);
    const btn = h('button.rd-mic-btn', { type: 'button', class: recording ? 'is-on' : asking ? 'is-ask' : '', 'aria-label': 'The intercom: hold to talk' },
      h('i.rd-mic-grille', { 'aria-hidden': 'true' }), h('span.rd-mic-l', h('i.rd-onair'), recording ? 'ON AIR · LET GO' : asking ? 'ALLOW THE MIC…' : 'HOLD TO TALK'), meterEl, timeEl);
    btn.addEventListener('pointerdown', e => { try { btn.setPointerCapture(e.pointerId); } catch { /* fine */ } start(e); });
    btn.addEventListener('pointerup', () => stop());
    btn.addEventListener('pointercancel', () => stop());
    btn.addEventListener('contextmenu', e => e.preventDefault());
    btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
    btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') stop(); });
    stripEl = h('section.rd-face.rd-mic', h('div.rd-fh', h('span.rd-plate', 'THE INTERCOM'), h('em', 'your voice to the city')), btn, err ? h('p.rd-err', { role: 'alert' }, err) : null);
    return stripEl;
  }
  function paintStrip() { if (stripEl && stripEl.isConnected) stripEl.replaceWith(strip()); }
  function paintMeter(el) {
    if (timeEl) timeEl.textContent = `${secs(el)} / ${secs(K.maxS)}`;
    if (!meterEl) return;
    const n = meterEl.children.length, lv = rec ? rec.level : 0;
    for (let i = 0; i < n; i++) meterEl.children[i].style.opacity = i / n < lv ? '1' : '0.18';
  }

  // ---------------------------------------------------------------- THE REVIEW card
  function card() {
    if (!take) return null;
    const t = take, W = o.who(), head = t.head == null ? '' : t.head;
    const inp = h('input.rd-inp', { type: 'text', maxlength: String(K.head), autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', enterkeyhint: 'done', value: head, 'aria-label': 'The headline', placeholder: 'GAME NIGHT AT 8',
      disabled: !t.headOn, oninput: e => { t.head = e.target.value.toUpperCase().slice(0, K.head); e.target.value = t.head; cnt.textContent = `${t.head.length} / ${K.head}`; const L = IC.headLines(t.head); pa.textContent = L[0] || 'YOUR'; pb.textContent = L[1] || (L[0] ? '' : 'HEADLINE'); } });
    const cnt = h('em', `${head.length} / ${K.head}`), L = IC.headLines(head);
    const pa = h('b', L[0] || 'YOUR'), pb = h('b', L[1] || (L[0] ? '' : 'HEADLINE'));
    const lever = h('button.rd-lever', { type: 'button', role: 'switch', 'aria-checked': String(t.headOn), class: t.headOn ? 'is-on' : '', 'aria-label': 'On the billboard',
      onclick: () => { t.headOn = !t.headOn; ls.set(HEAD_KEY, t.headOn); o.sfx.play('tick'); o.render(); } }, h('i.rd-lever-arm'), h('span', t.headOn ? 'ON' : 'OFF'));
    const seg = (opts, val, set) => h('div.rd-seg', ...opts.map(([v, l]) => h('button', { type: 'button', class: v === val ? 'is-on' : '', 'aria-pressed': String(v === val), onclick: () => { o.sfx.play('tick'); set(v); o.render(); } }, l)));
    return h('div.rd-card.rd-miccard', { role: 'dialog', 'aria-label': 'The intercom — review before sending' }, h('i.rd-grab'),
      h('h3', h('i.rd-lamp'), 'THE INTERCOM', h('button.rd-cx', { type: 'button', 'aria-label': 'Discard + close', onclick: () => discard() }, '✕')),
      h('div.rd-take', h('b', `${t.dur.toFixed(1)} S`), h('small', 'recorded — nothing has left this phone'),
        h('button.rd-play', { type: 'button', class: preview ? 'is-on' : '', onclick: () => playBack() }, preview ? '■ STOP' : '▶ PLAY BACK')),
      h('div.rd-sec', h('div.rd-lb', 'ON THE BILLBOARD', h('em', t.headOn ? 'the headline while it plays' : 'voice only')), lever),
      t.headOn ? h('div.rd-sec', h('div.rd-lb', 'THE HEADLINE', cnt), inp, h('div.rd-board', h('div.rd-board-face', pa, pb), h('small', 'ON THE SPEAKEASY’s BILLBOARD'))) : null,
      h('div.rd-sec', h('div.rd-lb', 'IN A GAME', h('em', 'phones mid-game')), seg([[true, 'WAIT FOR THE LOBBY'], [false, 'DON’T WAIT']], t.wait, v => { t.wait = v; ls.set(WAIT_KEY, v); })),
      t.err ? h('p.rd-err', { role: 'alert' }, t.err) : null,
      h('div.rd-two', h('button.rd-cancel', { type: 'button', onclick: () => discard() }, 'DISCARD'), h('button.rd-fire', { type: 'button', disabled: !!t.sending, onclick: () => send() }, t.sending ? 'SENDING…' : 'SEND')),
      h('p.rd-who2', W.line));
  }
  function playBack() {
    if (!take) return;
    if (preview) { preview.stop(); preview = null; o.render(); return; }
    o.sfx.play('band');
    preview = playAnnouncement({ id: 'preview', at: serverNow(), dur: take.dur, head: null }, { local: take.blob });
    preview.onEnd = () => { preview = null; o.render(); };
    o.render();
  }
  function discard() { if (preview) { preview.stop(); preview = null; } take = null; o.sfx.play('jackOut'); o.setCard(null); }
  async function send() {
    const t = take; if (!t || t.sending) return;
    const W = o.who();
    if (W.aud === 'room' && !W.room) { t.err = 'PICK A LOBBY ON THE AUDIENCE KNOB FIRST'; o.render(); return; }
    if (preview) { preview.stop(); preview = null; }
    t.sending = true; t.err = ''; o.render();
    try {
      const b64 = await toB64(t.blob);
      const r = await o.act({ action: 'radioIntercom', aud: W.aud, room: W.room || undefined, wait: t.wait, head: t.headOn ? (t.head || '') : '', mime: t.mime, dur: Math.round(t.dur * 100) / 100, b64 }, 'fire');
      take = null; o.setCard(null);
      // the owner's own phone plays it at once (the others: their lobby's socket / the city's feed)
      if (r && r.intercom) intercomFeed('desk', [r.intercom]);
    } catch (e) { t.sending = false; t.err = (e && e.message) || 'Couldn’t send it.'; o.render(); }
  }

  // ---------------------------------------------------------------- SENT: ON ITS WAY / PLAYING + UNSEND
  function sent() {
    const now = serverNow(), L = ((o.st() && o.st().intercom) || []).filter(m => m.state !== 'stopped' && (now < m.until || m.unsend)).slice(-3);
    if (!L.length) return null;
    return h('div.rd-strips', ...L.map(m => {
      const ph = now < m.at ? 'q' : now < m.until ? 'run' : 'done', can = IC.canUnsend(m, now);
      return h('div.rd-strip', { class: ph === 'run' ? 'is-run' : 'is-q', dataset: { ic: m.id } }, h('i.rd-lamp'),
        h('div', h('b', `INTERCOM · ${ph === 'run' ? 'PLAYING' : ph === 'q' ? 'ON ITS WAY' : 'SENT'}`), h('small', `${m.dur.toFixed(1)} s · ${m.aud === 'room' ? `lobby only ${m.room || ''}` : AUD_LABEL[m.aud].toLowerCase()}${m.head ? ` · “${m.head}”` : ''}${m.wait ? '' : ' · don’t wait'}`)),
        can ? h('button.rd-stop', { type: 'button', onclick: () => { o.sfx.play('jackOut'); intercomStopped(m.id); o.act({ action: 'radioUnsend', id: m.id }).catch(() => {}); } }, 'UNSEND') : null);
    }));
  }

  return {
    strip, card, sent,
    /** while recording the desk never rebuilds the strip (the hold would be lost) */
    busy: () => !!rec,
    has: () => !!take,
    destroy() { if (rec) { try { rec.mr && rec.mr.stop(); } catch { /* fine */ } try { rec.stream && rec.stream.getTracks().forEach(t => t.stop()); } catch { /* fine */ } rec = null; } if (preview) preview.stop(); },
    debug: () => ({ recording: !!(rec && rec.mr), take: take ? { dur: take.dur, mime: take.mime, bytes: take.blob.size, headOn: take.headOn, head: take.head, wait: take.wait } : null, err }),
  };
}
