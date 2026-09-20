import { NextResponse, type NextRequest } from "next/server";
import { webhookSecretFor } from "@/lib/gateway/client";
import { verifyGatewaySignature } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// POST /api/gateway/webhook?firm=<id> — the gateway's signed deliveries.
// The signature is checked against the secret the gateway gave us when the
// endpoint was registered; anything that does not verify is dropped.
export async function POST(req: NextRequest) {
  const firmId = req.nextUrl.searchParams.get("firm");
  if (!firmId) return NextResponse.json({ error: "firm required" }, { status: 400 });
  const raw = await req.text();
  const secret = await webhookSecretFor(firmId);
  if (!secret || !verifyGatewaySignature(raw, req.headers.get("x-gateway-signature"), secret)) {
    await db().from("webhook_rejections").insert({ firm_id: firmId, reason: secret ? "bad_signature" : "unknown_firm" }).then(() => undefined, () => undefined);
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }
  let payload: { event?: string; account_id?: string | null } = {};
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { error } = await db().from("gateway_events").insert({ firm_id: firmId, event: String(payload.event ?? "unknown"), account_id: payload.account_id ?? null, payload });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
