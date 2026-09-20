import { NextResponse } from "next/server";
import { session } from "@/lib/route";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// POST → mark every event seen.
export async function POST() {
  const s = await session();
  if (s instanceof NextResponse) return s;
  await db().from("gateway_events").update({ seen_at: new Date().toISOString() }).eq("firm_id", s.firmId).is("seen_at", null);
  return NextResponse.json({ ok: true });
}
