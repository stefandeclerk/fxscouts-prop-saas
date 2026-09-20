import { NextResponse } from "next/server";
import { gatewayFor } from "@/lib/gateway/client";
import { readJson } from "@/lib/route";
import { encrypt, toBytea } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";
import { isStaff } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST { action: 'rename', name } | { action: 'reregister_webhook', appUrl? }
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isStaff())) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { id } = await ctx.params;
  const b = await readJson<{ action?: string; name?: string; appUrl?: string }>(req);
  if (b.action === "rename") {
    if (!b.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    await db().from("firms").update({ name: b.name.trim() }).eq("id", id);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "reregister_webhook") {
    const gw = await gatewayFor(id);
    if (!gw) return NextResponse.json({ error: "Firm is not connected" }, { status: 409 });
    const base = (b.appUrl ?? process.env.APP_URL ?? new URL(req.url).origin).replace(/\/$/, "");
    try {
      const { data: conn } = await db().from("gateway_connections").select("webhook_endpoint_id").eq("firm_id", id).maybeSingle();
      if (conn?.webhook_endpoint_id) { try { await gw.deleteWebhook(conn.webhook_endpoint_id); } catch { /* may already be gone */ } }
      const wh = await gw.createWebhook(`${base}/api/gateway/webhook?firm=${id}`, ["*"]);
      await db().from("gateway_connections").update({ webhook_endpoint_id: wh.id, webhook_secret_enc: toBytea(await encrypt(wh.secret)) }).eq("firm_id", id);
      return NextResponse.json({ ok: true, endpointId: wh.id });
    } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 502 }); }
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
