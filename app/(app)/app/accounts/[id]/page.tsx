import { notFound, redirect } from "next/navigation";
import TraderDetail, { type TraderBundle } from "@/components/TraderDetail";
import { GatewayError } from "@/lib/gateway/client";
import { ctx, listEvents, listNotes } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TraderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await ctx();
  if (!c.gw) redirect("/app/settings");
  let account;
  try { account = await c.gw.account(id); } catch (e) { if (e instanceof GatewayError && e.status === 404) notFound(); throw e; }
  const [programmes, evaluations, decisions, payoutChecks, sealsRes, trades, notes, events, siblings, correlation] = await Promise.all([
    c.gw.programmes(),
    c.gw.evaluations(id),
    c.gw.decisions(id),
    c.gw.payoutChecks(id),
    c.gw.seals(id),
    c.gw.trades(id, 2000),
    listNotes(c.firmId, c.userId, id),
    listEvents(c.firmId, { accountId: id, limit: 50 }),
    account.phase === "funded" && account.reference ? c.gw.accounts({ reference: account.reference, phase: "evaluation" }) : Promise.resolve([]),
    c.gw.correlations(id),
  ]);
  const b: TraderBundle = { account, programmes, evaluations, decisions, payoutChecks, seals: sealsRes.seals, publicKey: sealsRes.public_key, trades, notes, events, sibling: siblings.find((s) => s.id !== id) ?? null, correlation };
  return <TraderDetail b={b} />;
}
