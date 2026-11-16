// Generates a VAPID key pair for Web Push.
//   node services/lich-worker/scripts/gen-vapid.mjs
// Put the public key in wrangler.toml (VAPID_PUBLIC_KEY) and the private JWK in a secret:
//   npx wrangler secret put VAPID_PRIVATE_JWK
const { subtle } = globalThis.crypto;
const pair = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const raw = new Uint8Array(await subtle.exportKey('raw', pair.publicKey));
const b64u = (b) => Buffer.from(b).toString('base64url');
console.log('VAPID_PUBLIC_KEY =', b64u(raw));
console.log('VAPID_PRIVATE_JWK =', JSON.stringify(await subtle.exportKey('jwk', pair.privateKey)));
