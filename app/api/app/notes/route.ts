import { NextResponse } from "next/server";
import { readJson, session } from "@/lib/route";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// POST { accountId, kind?, body }
export async function POST(req: Request) {
  const s = await session();
  if (s instanceof NextResponse) return s;
  const b = await readJson<{ accountId?: string; kind?: string; body?: string }>(req);
  if (!b.accountId || !b.body?.trim()) return NextResponse.json({ error: "Write something first" }, { status: 400 });
  const kind = ["note", "payout_review", "dispute"].includes(b.kind ?? "") ? b.kind : "note";
  const { error } = await db().from("review_notes").insert({ firm_id: s.firmId, account_id: b.accountId, author_id: s.userId === "bypass" ? null : s.userId, kind, body: b.body.trim() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
