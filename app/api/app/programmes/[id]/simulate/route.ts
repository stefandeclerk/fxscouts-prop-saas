import { NextResponse } from "next/server";
import { fail, readJson, withGateway } from "@/lib/route";
import type { ProgrammeRules } from "@/lib/gateway/types";

export const dynamic = "force-dynamic";

// POST { rules, from? } → what these rules would have concluded for the programme's accounts. Writes nothing.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const c = await withGateway();
  if (c instanceof NextResponse) return c;
  const { id } = await ctx.params;
  const b = await readJson<{ rules?: ProgrammeRules; from?: string | null }>(req);
  try {
    const sim = await c.gw.simulate(id, b.rules ?? {}, b.from || null);
    if (!sim) return NextResponse.json({ error: "The gateway does not offer rule simulation yet" }, { status: 501 });
    return NextResponse.json(sim);
  } catch (e) { return fail(e); }
}
