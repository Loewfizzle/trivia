// FRIENDS B — a SOFTWARE PASSKEY for the /api tests (server.test.mjs "PASSKEYS"): a real P-256 key pair, a real attestationObject ("none"),
// real CBOR + COSE, real ECDSA signatures over authenticatorData ‖ sha256(clientDataJSON) — what a phone's authenticator sends, made in Node.
// The browser flow uses Chromium's own VIRTUAL AUTHENTICATOR instead (CDP WebAuthn — e2e-profiles.mjs).
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { isoBase64URL, isoCBOR } from '@simplewebauthn/server/helpers';

const sha = b => createHash('sha256').update(b).digest();
const b64u = b => isoBase64URL.fromBuffer(new Uint8Array(b));

export function softAuthenticator({ rpID = 'localhost', origin = 'http://localhost:5173', uv = true } = {}) {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' });
  const credId = randomBytes(32);
  let counter = 0, userHandle = null;
  const flags = (at) => 0x01 | (uv ? 0x04 : 0) | (at ? 0x40 : 0) | 0x08 | 0x10;   // UP + UV (+ AT) + BE + BS (a synced passkey)
  const cnt = n => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
  const cd = (type, challenge, o = origin) => Buffer.from(JSON.stringify({ type, challenge, origin: o, crossOrigin: false }));
  const cose = () => Buffer.from(isoCBOR.encode(new Map([[1, 2], [3, -7], [-1, 1], [-2, Buffer.from(jwk.x, 'base64url')], [-3, Buffer.from(jwk.y, 'base64url')]])));
  const rpHash = (id = rpID) => sha(Buffer.from(id));
  return {
    id: b64u(credId),
    /** navigator.credentials.create's JSON answer to `options` (o: { origin, rpID, challenge } overrides — the bad cases) */
    create(options, o = {}) {
      userHandle = options.user && options.user.id;
      const lenB = Buffer.alloc(2); lenB.writeUInt16BE(credId.length);
      const authData = Buffer.concat([rpHash(o.rpID || rpID), Buffer.from([flags(true)]), cnt(counter), Buffer.alloc(16), lenB, credId, cose()]);
      const att = Buffer.from(isoCBOR.encode(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]])));
      return { id: b64u(credId), rawId: b64u(credId), type: 'public-key', clientExtensionResults: {}, authenticatorAttachment: 'platform',
        response: { clientDataJSON: b64u(cd('webauthn.create', o.challenge || options.challenge, o.origin || origin)), attestationObject: b64u(att), transports: ['internal', 'hybrid'] } };
    },
    /** navigator.credentials.get's JSON answer (o.counter: force a signature counter — the clone check) */
    get(options, o = {}) {
      counter = o.counter != null ? o.counter : counter + 1;
      const authData = Buffer.concat([rpHash(o.rpID || rpID), Buffer.from([flags(false)]), cnt(counter)]);
      const cdj = cd('webauthn.get', o.challenge || options.challenge, o.origin || origin);
      const sig = sign('sha256', Buffer.concat([authData, sha(cdj)]), privateKey);
      return { id: b64u(credId), rawId: b64u(credId), type: 'public-key', clientExtensionResults: {}, authenticatorAttachment: 'platform',
        response: { clientDataJSON: b64u(cdj), authenticatorData: b64u(authData), signature: b64u(sig), userHandle: o.userHandle !== undefined ? o.userHandle : userHandle } };
    },
  };
}
