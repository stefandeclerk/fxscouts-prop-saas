import "server-only";

import { type Connection, type Gateway, connectionFor, gatewayFor } from "@/lib/gateway/client";
import type { GatewayAccount, Programme } from "@/lib/gateway/types";
import { db } from "@/lib/server/db";
import { currentFirm, supabaseServer } from "@/lib/supabase/server";

// Everything the pages read. Firm-side state comes from this app's database
// (through the signed-in user's session, so RLS applies); account state
// comes from the gateway through the firm's API key.

type Row = Record<string, unknown>;

export async function firmName(firmId: string): Promise<string> {
  const { data } = await db().from("firms").select("name").eq("id", firmId).maybeSingle();
  return data?.name ?? "Your firm";
}

export type Ctx = { firmId: string; userId: string; role: string; gw: Gateway | null; connection: Connection | null };

export async function ctx(): Promise<Ctx> {
  const s = await currentFirm();
  if (!s) throw new Error("Not signed in");
  const [gw, connection] = await Promise.all([gatewayFor(s.firmId), connectionFor(s.firmId)]);
  return { ...s, gw, connection };
}

// ── Events (webhooks the gateway sent us) ───────────────────────────────────

export type EventRow = { id: number; event: string; accountId: string | null; payload: Row; receivedAt: string; seen: boolean };

export async function listEvents(firmId: string, opts: { accountId?: string; limit?: number } = {}): Promise<EventRow[]> {
  const sb = await supabaseServer();
  let q = sb.from("gateway_events").select("id, event, account_id, payload, received_at, seen_at").eq("firm_id", firmId).order("received_at", { ascending: false }).limit(opts.limit ?? 100);
  if (opts.accountId) q = q.eq("account_id", opts.accountId);
  const { data } = await q;
  return ((data ?? []) as Row[]).map((r) => ({ id: Number(r.id), event: String(r.event), accountId: (r.account_id as string | null) ?? null, payload: (r.payload ?? {}) as Row, receivedAt: String(r.received_at), seen: !!r.seen_at }));
}

export async function unseenCount(firmId: string): Promise<number> {
  const { count } = await db().from("gateway_events").select("id", { count: "exact", head: true }).eq("firm_id", firmId).is("seen_at", null).in("event", ["evaluation.breach", "evaluation.disagreement", "behaviour.changed", "account.reconnect_required"]);
  return count ?? 0;
}

// ── Notes ───────────────────────────────────────────────────────────────────

export type Note = { id: number; kind: string; body: string; createdAt: string; mine: boolean };

export async function listNotes(firmId: string, userId: string, accountId: string): Promise<Note[]> {
  const sb = await supabaseServer();
  const { data } = await sb.from("review_notes").select("id, kind, body, author_id, created_at").eq("firm_id", firmId).eq("account_id", accountId).order("created_at", { ascending: false }).limit(100);
  return ((data ?? []) as Row[]).map((r) => ({ id: Number(r.id), kind: String(r.kind), body: String(r.body), createdAt: String(r.created_at), mine: r.author_id === userId }));
}

// ── Overview ────────────────────────────────────────────────────────────────

export type ProgrammeOverview = {
  programme: Programme;
  accounts: GatewayAccount[];
  byPhase: { evaluation: number; funded: number; none: number };
  attention: number;   // reconnect_required or retrying
  breached: Set<string>;
  disagreements: number;
};

export async function overview(c: Ctx): Promise<{ programmes: ProgrammeOverview[]; unassigned: GatewayAccount[]; recent: EventRow[]; totals: { accounts: number; breached: number; disagreements: number; attention: number } } | null> {
  if (!c.gw) return null;
  const [programmes, accounts, recent] = await Promise.all([c.gw.programmes(), c.gw.accounts(), listEvents(c.firmId, { limit: 300 })]);
  // Breach and disagreement state from the events we've received: the
  // latest breach / disagreement per account, cheap and no per-account calls.
  const breached = new Set<string>();
  const disagreed = new Map<string, number>();
  for (const e of recent) {
    if (!e.accountId) continue;
    if (e.event === "evaluation.breach") breached.add(e.accountId);
    if (e.event === "evaluation.disagreement") disagreed.set(e.accountId, (disagreed.get(e.accountId) ?? 0) + 1);
  }
  const rows: ProgrammeOverview[] = programmes.map((programme) => {
    const mine = accounts.filter((a) => a.programme_id === programme.id);
    return {
      programme,
      accounts: mine,
      byPhase: { evaluation: mine.filter((a) => a.phase === "evaluation").length, funded: mine.filter((a) => a.phase === "funded").length, none: mine.filter((a) => !a.phase).length },
      attention: mine.filter((a) => a.state === "reconnect_required" || a.state === "retrying").length,
      breached: new Set(mine.filter((a) => breached.has(a.id)).map((a) => a.id)),
      disagreements: mine.reduce((s, a) => s + (disagreed.get(a.id) ?? 0), 0),
    };
  });
  return {
    programmes: rows,
    unassigned: accounts.filter((a) => !a.programme_id),
    recent: recent.slice(0, 12),
    totals: {
      accounts: accounts.length,
      breached: accounts.filter((a) => breached.has(a.id)).length,
      disagreements: [...disagreed.values()].reduce((s, n) => s + n, 0),
      attention: accounts.filter((a) => a.state === "reconnect_required" || a.state === "retrying").length,
    },
  };
}
