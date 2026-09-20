import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

// AES-256-GCM for the gateway API keys we store. APP_ENCRYPTION_KEY is 64
// hex characters; never change it once a key has been stored.

const IV_LENGTH = 12;

async function importKey(): Promise<CryptoKey> {
  const hex = process.env.APP_ENCRYPTION_KEY ?? "";
  if (hex.length !== 64) throw new Error("APP_ENCRYPTION_KEY must be 64 hex characters");
  return crypto.subtle.importKey("raw", Buffer.from(hex, "hex"), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encrypt(text: string): Promise<Buffer> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
  return Buffer.concat([Buffer.from(iv), Buffer.from(ct)]);
}

export async function decrypt(blob: Buffer | string): Promise<string> {
  // PostgREST returns bytea as "\x" + hex.
  const buf = typeof blob === "string" ? (blob.startsWith("\\x") ? Buffer.from(blob.slice(2), "hex") : Buffer.from(blob, "base64")) : blob;
  const key = await importKey();
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(buf.subarray(0, IV_LENGTH)) }, key, new Uint8Array(buf.subarray(IV_LENGTH)));
  return new TextDecoder().decode(plain);
}

export function toBytea(buf: Buffer): string {
  return "\\x" + buf.toString("hex");
}

// Gateway webhook signature: X-Gateway-Signature: sha256=<hmac hex of the raw body>.
export function verifyGatewaySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const a = Buffer.from(expected), b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}
