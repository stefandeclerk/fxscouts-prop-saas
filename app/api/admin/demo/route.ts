import { NextResponse } from "next/server";
import { connectionFor, provisionFirm } from "@/lib/gateway/client";
import { firmName } from "@/lib/data";
import { readJson } from "@/lib/route";
import { isStaff } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST { firmId } — load the prop-firm demo world for one firm. Connects the
// firm to the gateway if it is not yet, then asks the gateway (development
// only, internal secret) to seed programmes and traders under that firm's
// customer. Everything comes back through the normal API and webhooks.
export async function POST(req: Request) {
  if (!(await isStaff())) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = await readJson<{ firmId?: string }>(req);
  if (!b.firmId) return NextResponse.json({ error: "firmId required" }, { status: 400 });
  const secret = process.env.GATEWAY_INTERNAL_SECRET;
  if (!secret) return NextResponse.json({ error: "GATEWAY_INTERNAL_SECRET is not set" }, { status: 500 });
  try {
    const conn = (await connectionFor(b.firmId)) ?? (await provisionFirm(b.firmId, await firmName(b.firmId), process.env.APP_URL ?? new URL(req.url).origin));
    const base = (process.env.GATEWAY_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const res = await fetch(`${base}/api/internal/seed-prop`, { method: "POST", headers: { "content-type": "application/json", "x-internal-secret": secret }, body: JSON.stringify({ customer_id: conn.customerId }), cache: "no-store", signal: AbortSignal.timeout(280_000) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: (j as { error?: string }).error ?? `Gateway returned ${res.status}` }, { status: 502 });
    return NextResponse.json(j);
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 502 }); }
}
