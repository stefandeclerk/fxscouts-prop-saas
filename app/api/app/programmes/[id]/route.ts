import { NextResponse } from "next/server";
import { fail, readJson, withGateway } from "@/lib/route";
import type { ProgrammeRules } from "@/lib/gateway/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// POST { rules, effectiveFrom?, note? } → new version
export async function POST(req: Request, ctx: Ctx) {
  const c = await withGateway();
  if (c instanceof NextResponse) return c;
  const { id } = await ctx.params;
  const b = await readJson<{ rules?: ProgrammeRules; effectiveFrom?: string; note?: string }>(req);
  try { return NextResponse.json(await c.gw.newVersion(id, b.rules ?? {}, b.effectiveFrom || null, b.note)); } catch (e) { return fail(e); }
}

// PATCH { name?, active? }
export async function PATCH(req: Request, ctx: Ctx) {
  const c = await withGateway();
  if (c instanceof NextResponse) return c;
  const { id } = await ctx.params;
  const b = await readJson<{ name?: string; active?: boolean }>(req);
  try { return NextResponse.json(await c.gw.updateProgramme(id, b)); } catch (e) { return fail(e); }
}
