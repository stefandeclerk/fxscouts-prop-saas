import { NextResponse } from "next/server";
import { fail, withGateway } from "@/lib/route";

export const dynamic = "force-dynamic";

// GET → the gateway's signed evidence pack, as a download.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const c = await withGateway();
  if (c instanceof NextResponse) return c;
  const { id } = await ctx.params;
  try {
    const body = await c.gw.evidence(id);
    return new NextResponse(body, { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="evidence-${id}-${new Date().toISOString().slice(0, 10)}.json"` } });
  } catch (e) { return fail(e); }
}
