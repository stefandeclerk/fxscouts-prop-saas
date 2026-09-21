import { NextResponse } from "next/server";
import { fail, withGateway } from "@/lib/route";

export const dynamic = "force-dynamic";

// GET → the signed report as a download.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const c = await withGateway();
  if (c instanceof NextResponse) return c;
  const { id } = await ctx.params;
  try {
    const body = await c.gw.reportDownload(id);
    return new NextResponse(body, { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="report-${id}.json"` } });
  } catch (e) { return fail(e); }
}
