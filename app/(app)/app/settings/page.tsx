import SettingsView from "@/components/SettingsView";
import { ctx, firmName } from "@/lib/data";
import { db } from "@/lib/server/db";
import { AUTH_BYPASS } from "@/lib/supabase/server";
import type { CustomerSettings } from "@/lib/gateway/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const c = await ctx();
  const [name, { data: members }] = await Promise.all([firmName(c.firmId), db().from("firm_members").select("user_id, role, created_at").eq("firm_id", c.firmId)]);
  let webhookOk: boolean | null = null;
  let correlation: CustomerSettings | null = null;
  if (c.gw) {
    if (c.connection?.webhookEndpointId) { try { webhookOk = (await c.gw.webhooks()).some((w) => w.id === c.connection!.webhookEndpointId && w.active); } catch { webhookOk = null; } }
    try { correlation = await c.gw.settings(); } catch { correlation = null; }
  }
  return <SettingsView name={name} connection={c.connection} webhookOk={webhookOk} correlation={correlation} members={(members ?? []).map((m) => ({ userId: m.user_id, role: m.role, since: m.created_at }))} gatewayUrl={process.env.GATEWAY_URL ?? "http://localhost:3000"} bypass={AUTH_BYPASS} />;
}
