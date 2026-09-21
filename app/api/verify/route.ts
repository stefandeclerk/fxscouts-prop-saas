import { NextResponse } from "next/server";
import { GatewayError, sealAnchor, verifyRecord, type Verification } from "@/lib/gateway/client";
import { readJson } from "@/lib/route";

export const dynamic = "force-dynamic";

// Public, no sign-in. The gateway's verification routes need no key, so
// this route only relays them and reads an evidence pack for the caller.
// Nothing is stored.

type Item = { label: string; body_hash: string; signature: string; seal_hash?: string };
type Result = Item & (Verification | { error: string });

const HEX = /^[0-9a-f]{64}$/i;

// Every signed record in a pack: anything with body_hash + signature, or a
// seal (seal_hash + signature). Walks the JSON without assuming its layout.
function collect(v: unknown, path: string, out: Item[]) {
  if (Array.isArray(v)) { v.forEach((x, i) => collect(x, `${path}[${i}]`, out)); return; }
  if (!v || typeof v !== "object") return;
  const o = v as Record<string, unknown>;
  if (typeof o.signature === "string" && typeof o.seal_hash === "string") out.push({ label: path || "seal", body_hash: o.seal_hash, signature: o.signature, seal_hash: o.seal_hash });
  else if (typeof o.signature === "string" && typeof o.body_hash === "string") out.push({ label: path || "record", body_hash: o.body_hash, signature: o.signature });
  for (const [k, x] of Object.entries(o)) collect(x, path ? `${path}.${k}` : k, out);
}

// POST { body_hash, signature, seal_hash? } | { pack: <evidence pack JSON as string> }
export async function POST(req: Request) {
  const b = await readJson<{ body_hash?: string; signature?: string; seal_hash?: string; pack?: string }>(req);
  const items: Item[] = [];
  if (typeof b.pack === "string") {
    let parsed: unknown;
    try { parsed = JSON.parse(b.pack); } catch { return NextResponse.json({ error: "That is not a JSON file" }, { status: 400 }); }
    collect(parsed, "", items);
    if (items.length === 0) return NextResponse.json({ error: "No signed records found in this file" }, { status: 400 });
  } else {
    if (!HEX.test(b.body_hash ?? "")) return NextResponse.json({ error: "The hash must be 64 hex characters" }, { status: 400 });
    if (!b.signature?.trim()) return NextResponse.json({ error: "A signature is required" }, { status: 400 });
    items.push({ label: b.seal_hash ? "seal" : "record", body_hash: b.body_hash!.toLowerCase(), signature: b.signature.trim(), seal_hash: b.seal_hash || undefined });
  }
  const results: Result[] = await Promise.all(items.slice(0, 500).map(async (it) => {
    try {
      const v = await verifyRecord(it.body_hash, it.signature, it.seal_hash);
      // Anchors are a newer gateway feature; a gateway without them answers 404, read as "no anchor".
      if (it.seal_hash && v.anchor === undefined) { try { const a = await sealAnchor(it.seal_hash); if (a) { v.anchor = a.anchor; v.verified = a.verified; } } catch { /* anchor unavailable; signature result stands */ } }
      return { ...it, ...v };
    } catch (e) { return { ...it, error: e instanceof GatewayError ? e.message : "Could not reach the gateway" }; }
  }));
  return NextResponse.json({ results, total: items.length });
}
