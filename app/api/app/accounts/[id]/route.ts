import { NextResponse } from "next/server";
import { fail, readJson, withGateway } from "@/lib/route";
import type { DecisionKind } from "@/lib/gateway/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const KINDS = new Set(["breach", "clear", "payout_approved", "payout_denied"]);

// POST { action: sync | evaluate | payout_check | correlate | decision | disconnect, kind?, rule? }
export async function POST(req: Request, ctx: Ctx) {
  const c = await withGateway();
  if (c instanceof NextResponse) return c;
  const { id } = await ctx.params;
  const b = await readJson<{ action?: string; kind?: string; rule?: string }>(req);
  try {
    switch (b.action) {
      case "sync": return NextResponse.json(await c.gw.sync(id));
      case "evaluate": return NextResponse.json(await c.gw.evaluateNow(id));
      case "payout_check": return NextResponse.json(await c.gw.runPayoutCheck(id));
      case "correlate": return NextResponse.json(await c.gw.runCorrelations());   // firm-wide; every account is re-scored
      case "decision":
        if (!KINDS.has(b.kind ?? "")) return NextResponse.json({ error: "Choose a decision" }, { status: 400 });
        return NextResponse.json(await c.gw.recordDecision(id, b.kind as DecisionKind, b.rule?.trim() || null, { source: "prop-app", user: c.s.userId }));
      case "disconnect": return NextResponse.json(await c.gw.disconnect(id));
      default: return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) { return fail(e); }
}

// PATCH { name?, reference?, programme_id?, phase?, starting_balance?, schedule? }
export async function PATCH(req: Request, ctx: Ctx) {
  const c = await withGateway();
  if (c instanceof NextResponse) return c;
  const { id } = await ctx.params;
  const b = await readJson<Record<string, unknown>>(req);
  const patch: Record<string, unknown> = {};
  if (typeof b.name === "string" && b.name.trim()) patch.name = b.name.trim();
  if (typeof b.reference === "string") patch.reference = b.reference.trim();
  if (b.programme_id !== undefined) patch.programme_id = b.programme_id || null;
  if (b.phase !== undefined) patch.phase = b.phase || null;
  if (b.starting_balance !== undefined) patch.starting_balance = b.starting_balance === "" || b.starting_balance === null ? null : Number(b.starting_balance) || null;
  if (typeof b.schedule === "string" && b.schedule) patch.schedule = b.schedule;
  try { return NextResponse.json(await c.gw.updateAccount(id, patch)); } catch (e) { return fail(e); }
}
