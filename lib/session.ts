/**
 * Stateless HMAC-SHA-256 session tokens.
 * Uses Web Crypto API — works in both Edge and Node.js runtimes.
 */

export const SESSION_COOKIE = "wte_admin";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function secret(): string {
  return `${process.env.ADMIN_USERNAME ?? ""}:${process.env.ADMIN_PASSWORD ?? ""}`;
}

async function importKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

function u8toB64(buf: ArrayBuffer): string {
  return btoa(Array.from(new Uint8Array(buf), (b) => String.fromCharCode(b)).join(""));
}

function b64toU8(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** Create a signed session token valid for 7 days. */
export async function createToken(): Promise<string> {
  const payload = btoa(JSON.stringify({ exp: Date.now() + TTL_MS }));
  const key     = await importKey("sign");
  const sig     = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${u8toB64(sig)}`;
}

/** Verify a session token. Returns false if expired or tampered. */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 0) return false;

    const payload = token.slice(0, dot);
    const sig64   = token.slice(dot + 1);

    const { exp } = JSON.parse(atob(payload)) as { exp: number };
    if (typeof exp !== "number" || exp < Date.now()) return false;

    const key     = await importKey("verify");
    const sigBuf  = b64toU8(sig64);
    return crypto.subtle.verify(
      "HMAC",
      key,
      sigBuf.buffer.slice(sigBuf.byteOffset, sigBuf.byteOffset + sigBuf.byteLength) as ArrayBuffer,
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}
