/**
 * Web Push without dependencies: VAPID signatures (RFC 8292) and aes128gcm
 * payload encryption (RFC 8291), on WebCrypto only. The notify function (Deno)
 * sends with it, the tests (Node) check it against the RFC's example, and the
 * app only uses `b64uDecode` for its subscription key.
 */

export interface PushTarget {
  endpoint: string;
  /** The browser's public key, base64url (`PushSubscription.toJSON().keys.p256dh`). */
  p256dh: string;
  /** The browser's auth secret, base64url. */
  auth: string;
}

/** The key pair pushes are signed with. Browsers subscribe with `publicKey`. */
export interface VapidKeys {
  /** Uncompressed P-256 point, base64url. */
  publicKey: string;
  privateJwk: JsonWebKey;
}

/** Test hook: a fixed salt and sender key make the output reproducible. */
export interface FixedEncryption {
  salt: Uint8Array;
  senderPrivateJwk: JsonWebKey;
  senderPublic: Uint8Array;
}

export interface PushOptions {
  /** Seconds the push service keeps the message for an offline device. */
  ttl: number;
  urgency?: "very-low" | "low" | "normal" | "high";
  nowMs?: number;
}

type Bytes = Uint8Array<ArrayBuffer>;

const te = new TextEncoder();
const ECDH = { name: "ECDH", namedCurve: "P-256" } as const;
const ECDSA = { name: "ECDSA", namedCurve: "P-256" } as const;
/** One record of 4096 bytes holds the whole message. */
const RECORD_SIZE = 4096;
/** Push services accept 4096 bytes of body; the header and tag take 103. */
export const MAX_PAYLOAD = 3993;

export function b64uEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Accepts base64url or plain base64, with or without padding. */
export function b64uDecode(s: string): Bytes {
  const t = s.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
  const bin = atob(t + "===".slice((t.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(...parts: Uint8Array[]): Bytes {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of parts) {
    out.set(p, i);
    i += p.length;
  }
  return out;
}

/** The x and y of an uncompressed P-256 point (65 bytes), as JWK fields. */
export function pointToJwk(raw: Uint8Array): { kty: "EC"; crv: "P-256"; x: string; y: string } {
  if (raw.length !== 65 || raw[0] !== 4) throw new Error("Not an uncompressed P-256 public key");
  return { kty: "EC", crv: "P-256", x: b64uEncode(raw.slice(1, 33)), y: b64uEncode(raw.slice(33)) };
}

async function hkdf(salt: Bytes, ikm: Bytes, info: Bytes, bytes: number): Promise<Bytes> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, bytes * 8));
}

export async function generateVapidKeys(): Promise<VapidKeys> {
  const pair = (await crypto.subtle.generateKey(ECDSA, true, ["sign", "verify"])) as CryptoKeyPair;
  const publicKey = b64uEncode(new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey)));
  const { kty, crv, x, y, d } = await crypto.subtle.exportKey("jwk", pair.privateKey);
  return { publicKey, privateJwk: { kty, crv, x, y, d } };
}

/** The `Authorization` header for the endpoint's push service, valid for 12 hours. */
export async function vapidAuthorization(endpoint: string, keys: VapidKeys, subject: string, nowMs = Date.now()): Promise<string> {
  const part = (o: object) => b64uEncode(te.encode(JSON.stringify(o)));
  const unsigned = `${part({ typ: "JWT", alg: "ES256" })}.${part({ aud: new URL(endpoint).origin, exp: Math.floor(nowMs / 1000) + 12 * 3600, sub: subject })}`;
  const key = await crypto.subtle.importKey("jwk", keys.privateJwk, ECDSA, false, ["sign"]);
  // WebCrypto signs in the r‖s form JWS expects.
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, te.encode(unsigned)));
  return `vapid t=${unsigned}.${b64uEncode(sig)}, k=${keys.publicKey}`;
}

/** Encrypts one message for one browser: a single aes128gcm record (RFC 8291 with RFC 8188). */
export async function encryptPush(plaintext: Uint8Array, target: Pick<PushTarget, "p256dh" | "auth">, fixed?: FixedEncryption): Promise<Bytes> {
  if (plaintext.length > MAX_PAYLOAD) throw new Error(`Push payload too large (${plaintext.length} bytes)`);
  const uaPublic = b64uDecode(target.p256dh);
  const authSecret = b64uDecode(target.auth);
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, ECDH, false, []);
  let asPrivate: CryptoKey;
  let asPublic: Bytes;
  if (fixed) {
    asPrivate = await crypto.subtle.importKey("jwk", fixed.senderPrivateJwk, ECDH, false, ["deriveBits"]);
    asPublic = new Uint8Array(fixed.senderPublic);
  } else {
    const pair = (await crypto.subtle.generateKey(ECDH, true, ["deriveBits"])) as CryptoKeyPair;
    asPrivate = pair.privateKey;
    asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  }
  const salt = fixed ? new Uint8Array(fixed.salt) : crypto.getRandomValues(new Uint8Array(16));
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asPrivate, 256));
  const ikm = await hkdf(authSecret, shared, concat(te.encode("WebPush: info\0"), uaPublic, asPublic), 32);
  const cek = await hkdf(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, te.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  // 0x02 marks the last (and only) record.
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, concat(plaintext, new Uint8Array([2]))));
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, RECORD_SIZE);
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, sealed);
}

/** Everything `fetch` needs to deliver `payload` to one browser. */
export async function pushRequest(target: PushTarget, payload: string, keys: VapidKeys, subject: string, o: PushOptions): Promise<{ url: string; init: RequestInit }> {
  const body = await encryptPush(te.encode(payload), target);
  return {
    url: target.endpoint,
    init: {
      method: "POST",
      headers: {
        Authorization: await vapidAuthorization(target.endpoint, keys, subject, o.nowMs),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: String(Math.max(0, Math.round(o.ttl))),
        Urgency: o.urgency ?? "normal",
      },
      body,
    },
  };
}
