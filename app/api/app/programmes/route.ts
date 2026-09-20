import { NextResponse } from "next/server";
import { fail, readJson, withGateway } from "@/lib/route";
import type { ProgrammeRules } from "@/lib/gateway/types";

export const dynamic = "force-dynamic";

// POST { name, rules, note? } → new programme on the gateway
export async function POST(req: Request) {
  const c = await withGateway();
  if (c instanceof NextResponse) return c;
  const b = await readJson<{ name?: string; rules?: ProgrammeRules; note?: string }>(req);
  if (!b.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  try { return NextResponse.json(await c.gw.createProgramme(b.name.trim(), b.rules ?? {}, b.note), { status: 201 }); } catch (e) { return fail(e); }
}
