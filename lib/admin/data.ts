import "server-only";

import { type Gateway, gatewayFor } from "@/lib/gateway/client";
import type { GatewayAccount } from "@/lib/gateway/types";
import { db } from "@/lib/server/db";

// The owner's view across every firm, through the service role. Only
// reachable when isStaff() says so. Account figures come from the gateway
// per firm, so they are fetched in parallel and tolerate a firm being down.

type Row = Record<string, unknown>;
const str = (v: unknown): string => String(v ?? "");

export type FirmRow = {
  id: string;
  name: string;
  createdAt: string;
  members: number;
  connected: boolean;
  customerId: string | null;
  webhookRegistered: boolean;
  connectedAt: string | null;
  lastEventAt: string | null;
  unseenEvents: number;
  accounts: number | null;   // null = gateway unreachable or not connected
  breached: number;
  rejections24h: number;
};

async function accountsFor(gw: Gateway | null): Promise<GatewayAccount[] | null> {
  if (!gw) return null;
  try { return await gw.accounts(); } catch { return null; }
}

export async function adminFirms(): Promise<FirmRow[]> {
  const d = db();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const [{ data: firms }, { data: members }, { data: conns }, { data: events }, { data: rejections }] = await Promise.all([
    d.from("firms").select("id, name, created_at").order("created_at", { ascending: false }),
    d.from("firm_members").select("firm_id"),
    d.from("gateway_connections").select("firm_id, customer_id, webhook_endpoint_id, connected_at"),
    d.from("gateway_events").select("firm_id, event, account_id, received_at, seen_at").order("received_at", { ascending: false }).limit(5000),
    d.from("webhook_rejections").select("firm_id").gte("received_at", dayAgo),
  ]);
  const rows = (firms ?? []) as Row[];
  const gws = await Promise.all(rows.map((f) => gatewayFor(str(f.id))));
  const accounts = await Promise.all(gws.map(accountsFor));
  return rows.map((f, i) => {
    const id = str(f.id);
    const conn = ((conns ?? []) as Row[]).find((c) => c.firm_id === id);
    const evs = ((events ?? []) as Row[]).filter((e) => e.firm_id === id);
    const breached = new Set(evs.filter((e) => e.event === "evaluation.breach" && e.account_id).map((e) => str(e.account_id)));
    return {
      id, name: str(f.name), createdAt: str(f.created_at),
      members: ((members ?? []) as Row[]).filter((m) => m.firm_id === id).length,
      connected: !!conn, customerId: conn ? str(conn.customer_id) : null, webhookRegistered: !!conn?.webhook_endpoint_id, connectedAt: conn ? str(conn.connected_at) : null,
      lastEventAt: evs[0] ? str(evs[0].received_at) : null,
      unseenEvents: evs.filter((e) => !e.seen_at).length,
      accounts: accounts[i] ? accounts[i]!.length : null,
      breached: accounts[i] ? accounts[i]!.filter((a) => breached.has(a.id)).length : 0,
      rejections24h: ((rejections ?? []) as Row[]).filter((r) => r.firm_id === id).length,
    };
  });
}

export async function adminOverview() {
  const firms = await adminFirms();
  const d = db();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const [{ count: events24 }, { count: rejections24 }, { data: recentRejections }] = await Promise.all([
    d.from("gateway_events").select("id", { count: "exact", head: true }).gte("received_at", dayAgo),
    d.from("webhook_rejections").select("id", { count: "exact", head: true }).gte("received_at", dayAgo),
    d.from("webhook_rejections").select("firm_id, reason, received_at").order("received_at", { ascending: false }).limit(10),
  ]);
  return {
    firms,
    totals: {
      firms: firms.length,
      connected: firms.filter((f) => f.connected).length,
      accounts: firms.reduce((s, f) => s + (f.accounts ?? 0), 0),
      unreachable: firms.filter((f) => f.connected && f.accounts === null).length,
      breached: firms.reduce((s, f) => s + f.breached, 0),
      events24: events24 ?? 0,
      rejections24: rejections24 ?? 0,
    },
    recentRejections: ((recentRejections ?? []) as Row[]).map((r) => ({ firmId: (r.firm_id as string | null) ?? null, reason: str(r.reason), at: str(r.received_at) })),
  };
}

export async function adminFirm(id: string) {
  const d = db();
  const [{ data: firm }, { data: members }, { data: conn }, { data: events }, { count: notes }] = await Promise.all([
    d.from("firms").select("id, name, created_at").eq("id", id).maybeSingle(),
    d.from("firm_members").select("user_id, role, created_at").eq("firm_id", id),
    d.from("gateway_connections").select("customer_id, webhook_endpoint_id, public_key, connected_at").eq("firm_id", id).maybeSingle(),
    d.from("gateway_events").select("id, event, account_id, payload, received_at, seen_at").eq("firm_id", id).order("received_at", { ascending: false }).limit(50),
    d.from("review_notes").select("id", { count: "exact", head: true }).eq("firm_id", id),
  ]);
  if (!firm) return null;
  const gw = await gatewayFor(id);
  let accounts: GatewayAccount[] | null = null, programmes: { id: string; name: string; active: boolean; version: number }[] | null = null, webhookOk: boolean | null = null;
  if (gw) {
    try {
      const [a, p, w] = await Promise.all([gw.accounts(), gw.programmes(), gw.webhooks()]);
      accounts = a; programmes = p.map((x) => ({ id: x.id, name: x.name, active: x.active, version: x.current?.version ?? 0 }));
      webhookOk = !!conn?.webhook_endpoint_id && w.some((x) => x.id === conn.webhook_endpoint_id && x.active);
    } catch { /* gateway unreachable: leave nulls */ }
  }
  return {
    firm: { id: str(firm.id), name: str(firm.name), createdAt: str(firm.created_at) },
    members: ((members ?? []) as Row[]).map((m) => ({ userId: str(m.user_id), role: str(m.role), since: str(m.created_at) })),
    connection: conn ? { customerId: str(conn.customer_id), webhookEndpointId: (conn.webhook_endpoint_id as string | null) ?? null, publicKey: (conn.public_key as string | null) ?? null, connectedAt: str(conn.connected_at) } : null,
    webhookOk,
    accounts, programmes,
    events: ((events ?? []) as Row[]).map((e) => ({ id: Number(e.id), event: str(e.event), accountId: (e.account_id as string | null) ?? null, at: str(e.received_at), seen: !!e.seen_at })),
    notes: notes ?? 0,
  };
}

export async function adminEvents(limit = 300) {
  const d = db();
  const [{ data: events }, { data: firms }] = await Promise.all([
    d.from("gateway_events").select("id, firm_id, event, account_id, payload, received_at, seen_at").order("received_at", { ascending: false }).limit(limit),
    d.from("firms").select("id, name"),
  ]);
  const name = new Map(((firms ?? []) as Row[]).map((f) => [str(f.id), str(f.name)]));
  return ((events ?? []) as Row[]).map((e) => ({ id: Number(e.id), firmId: str(e.firm_id), firmName: name.get(str(e.firm_id)) ?? "?", event: str(e.event), accountId: (e.account_id as string | null) ?? null, data: ((e.payload as Row)?.data ?? {}) as Row, at: str(e.received_at), seen: !!e.seen_at }));
}
