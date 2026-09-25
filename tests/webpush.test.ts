import { describe, expect, it } from "vitest";
import { b64uDecode, b64uEncode, encryptPush, generateVapidKeys, pointToJwk, pushRequest, vapidAuthorization } from "../src/lib/webpush";

const te = new TextEncoder();

// RFC 8291, section 5: "When I grow up, I want to be a watermelon".
const RFC = {
  auth: "BTBZMqHH6r4Tts7J_aSIgg",
  receiverPublic: "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
  senderPrivate: "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw",
  senderPublic: "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8",
  body:
    "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27ml" +
    "mlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPT" +
    "pK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
};

/** What a browser does with a push: the receiving half of RFC 8291, for round-trip tests. */
async function decryptPush(body: Uint8Array, receiver: CryptoKeyPair, auth: Uint8Array<ArrayBuffer>): Promise<string> {
  const salt = body.slice(0, 16);
  const idlen = body[20];
  const senderPublic = body.slice(21, 21 + idlen);
  const sealed = body.slice(21 + idlen);
  const receiverPublic = new Uint8Array(await crypto.subtle.exportKey("raw", receiver.publicKey));
  const sender = await crypto.subtle.importKey("raw", senderPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: sender }, receiver.privateKey, 256));
  const hkdf = async (s: Uint8Array<ArrayBuffer>, ikm: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>, n: number) =>
    new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: s, info }, await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]), n * 8));
  const info = new Uint8Array([...te.encode("WebPush: info\0"), ...receiverPublic, ...senderPublic]);
  const ikm = await hkdf(auth, shared, info, 32);
  const cek = await hkdf(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, te.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]);
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, sealed));
  expect(plain[plain.length - 1]).toBe(2); // last-record delimiter
  return new TextDecoder().decode(plain.slice(0, -1));
}

describe("web push encryption", () => {
  it("matches the RFC 8291 example byte for byte", async () => {
    const senderPublic = b64uDecode(RFC.senderPublic);
    const out = await encryptPush(te.encode("When I grow up, I want to be a watermelon"), { p256dh: RFC.receiverPublic, auth: RFC.auth }, {
      salt: b64uDecode(RFC.body).slice(0, 16),
      senderPrivateJwk: { ...pointToJwk(senderPublic), d: RFC.senderPrivate },
      senderPublic,
    });
    expect(b64uEncode(out)).toBe(RFC.body);
  });

  it("round-trips with fresh keys, as a browser would decrypt it", async () => {
    const receiver = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
    const auth = crypto.getRandomValues(new Uint8Array(16));
    const p256dh = b64uEncode(new Uint8Array(await crypto.subtle.exportKey("raw", receiver.publicKey)));
    const msg = JSON.stringify({ title: "New rat on the wall", body: "Alex posted a Krysa meme: ÚŽASNÉ" });
    const body = await encryptPush(te.encode(msg), { p256dh, auth: b64uEncode(auth) });
    expect(await decryptPush(body, receiver, auth)).toBe(msg);
  });

  it("refuses payloads push services would reject", async () => {
    await expect(encryptPush(new Uint8Array(4000), { p256dh: RFC.receiverPublic, auth: RFC.auth })).rejects.toThrow(/too large/);
  });

  it("reads base64 with or without padding", () => {
    expect([...b64uDecode("AQID")]).toEqual([1, 2, 3]);
    expect([...b64uDecode("AQ==")]).toEqual([1]);
    expect([...b64uDecode("-_8")]).toEqual([251, 255]);
    expect(b64uEncode(new Uint8Array([251, 255]))).toBe("-_8");
  });
});

describe("VAPID", () => {
  it("signs a token the push service can verify", async () => {
    const keys = await generateVapidKeys();
    const now = Date.UTC(2026, 9, 4, 8, 0);
    const header = await vapidAuthorization("https://push.example.test/send/abc?x=1", keys, "https://example.test", now);
    const m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(header);
    expect(m).not.toBeNull();
    const [, h, c, s, k] = m!;
    expect(k).toBe(keys.publicKey);
    expect(JSON.parse(new TextDecoder().decode(b64uDecode(h)))).toEqual({ typ: "JWT", alg: "ES256" });
    expect(JSON.parse(new TextDecoder().decode(b64uDecode(c)))).toEqual({ aud: "https://push.example.test", exp: now / 1000 + 12 * 3600, sub: "https://example.test" });
    const pub = await crypto.subtle.importKey("raw", b64uDecode(k), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    expect(await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pub, b64uDecode(s), te.encode(`${h}.${c}`))).toBe(true);
  });

  it("builds a complete push request", async () => {
    const keys = await generateVapidKeys();
    const receiver = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
    const target = {
      endpoint: "https://push.example.test/send/abc",
      p256dh: b64uEncode(new Uint8Array(await crypto.subtle.exportKey("raw", receiver.publicKey))),
      auth: b64uEncode(crypto.getRandomValues(new Uint8Array(16))),
    };
    const { url, init } = await pushRequest(target, "{}", keys, "https://example.test", { ttl: 3600, urgency: "high" });
    const headers = init.headers as Record<string, string>;
    expect(url).toBe(target.endpoint);
    expect(init.method).toBe("POST");
    expect(headers["Content-Encoding"]).toBe("aes128gcm");
    expect(headers.TTL).toBe("3600");
    expect(headers.Urgency).toBe("high");
    expect(headers.Authorization).toMatch(/^vapid t=/);
    expect((init.body as Uint8Array).length).toBe(86 + 2 + 1 + 16);
  });
});
