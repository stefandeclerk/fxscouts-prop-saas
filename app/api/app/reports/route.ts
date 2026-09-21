import { NextResponse } from "next/server";
import { fail, readJson, withGateway } from "@/lib/route";

export const dynamic = "force-dynamic";

// POST { period: "yyyy-mm" } → asks the gateway for a report on the month so far.
export async function POST(req: Request) {
  const c = await withGateway();
  if (c instanceof NextResponse) return c;
  const b = await readJson<{ period?: string }>(req);
  if (!/^\d{4}-\d{2}$/.test(b.period ?? "")) return NextResponse.json({ error: "Period must be yyyy-mm" }, { status: 400 });
  try { return NextResponse.json(await c.gw.requestReport(b.period!)); } catch (e) { return fail(e); }
}
