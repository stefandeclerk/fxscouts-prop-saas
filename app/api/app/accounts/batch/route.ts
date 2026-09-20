import { NextResponse } from "next/server";
import { fail, readJson, withGateway } from "@/lib/route";

export const dynamic = "force-dynamic";

// POST { platform, rows, programmeId?, phase?, schedule?, server? }
// Rows: "login, investor password, server, reference, name, starting balance", one per line.
export async function POST(req: Request) {
  const c = await withGateway();
  if (c instanceof NextResponse) return c;
  const b = await readJson<{ platform?: string; rows?: string; programmeId?: string; phase?: string; schedule?: string; server?: string }>(req);
  if (b.platform !== "mt4" && b.platform !== "mt5") return NextResponse.json({ error: "Choose MT4 or MT5" }, { status: 400 });
  const lines = (b.rows ?? "").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  if (lines.length === 0) return NextResponse.json({ error: "Paste at least one row" }, { status: 400 });
  const accounts = lines.map((l) => l.split(/[,;\t]/).map((x) => x.trim())).filter(([login]) => !/^login$/i.test(login ?? "")).map(([login, investorPassword, server, reference, name, startingBalance]) => ({
    login, investorPassword, server: server || b.server || "", reference: reference || undefined, name: name || undefined, starting_balance: startingBalance ? Number(startingBalance) || undefined : undefined,
  }));
  try {
    const r = await c.gw.batchConnect({ platform: b.platform, programme_id: b.programmeId || undefined, phase: b.phase || undefined, schedule: b.schedule || "hourly", historyRange: "all", accounts });
    return NextResponse.json(r);
  } catch (e) { return fail(e); }
}
