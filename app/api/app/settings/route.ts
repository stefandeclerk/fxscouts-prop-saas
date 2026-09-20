import { NextResponse } from "next/server";
import { provisionFirm } from "@/lib/gateway/client";
import { firmName } from "@/lib/data";
import { fail, readJson, session, withGateway } from "@/lib/route";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// POST { action: 'rename', name } | { action: 'connect' } | { action: 'correlation', enabled, bucket_seconds, min_matches, min_score, min_trades }
export async function POST(req: Request) {
  const s = await session();
  if (s instanceof NextResponse) return s;
  const b = await readJson<{ action?: string; name?: string; enabled?: boolean; bucket_seconds?: unknown; min_matches?: unknown; min_score?: unknown; min_trades?: unknown }>(req);
  if (b.action === "rename") {
    if (!b.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    await db().from("firms").update({ name: b.name.trim() }).eq("id", s.firmId);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "connect") {
    try {
      const base = process.env.APP_URL ?? new URL(req.url).origin;
      const conn = await provisionFirm(s.firmId, await firmName(s.firmId), base);
      return NextResponse.json(conn);
    } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 502 }); }
  }
  if (b.action === "correlation") {
    const c = await withGateway();
    if (c instanceof NextResponse) return c;
    const n = (v: unknown) => (v === undefined || v === null || v === "" ? undefined : Number(v));
    const patch = { correlation_enabled: typeof b.enabled === "boolean" ? b.enabled : undefined, correlation_bucket_seconds: n(b.bucket_seconds), correlation_min_matches: n(b.min_matches), correlation_min_score: n(b.min_score), correlation_min_trades: n(b.min_trades) };
    if ((patch.correlation_bucket_seconds ?? 1) < 1 || (patch.correlation_min_matches ?? 5) < 5) return NextResponse.json({ error: "Bucket must be at least 1 second and matches at least 5" }, { status: 400 });
    try { return NextResponse.json(await c.gw.updateSettings(patch)); } catch (e) { return fail(e); }
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
