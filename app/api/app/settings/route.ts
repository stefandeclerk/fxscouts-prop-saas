import { NextResponse } from "next/server";
import { provisionFirm } from "@/lib/gateway/client";
import { firmName } from "@/lib/data";
import { readJson, session } from "@/lib/route";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// POST { action: 'rename', name } | { action: 'connect' }
export async function POST(req: Request) {
  const s = await session();
  if (s instanceof NextResponse) return s;
  const b = await readJson<{ action?: string; name?: string }>(req);
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
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
