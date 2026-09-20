import "server-only";

import { type Connection, type Gateway, connectionFor, gatewayFor } from "@/lib/gateway/client";
import type { AccountState, CorrelationGroup, GatewayAccount, Phase, Programme } from "@/lib/gateway/types";
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
  const { count } = await db().from("gateway_events").select("id", { count: "exact", head: true }).eq("firm_id", firmId).is("seen_at", null).in("event", ["evaluation.breach", "evaluation.disagreement", "behaviour.changed", "correlation.flagged", "account.reconnect_required"]);
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

// Something the firm has to look at: a disagreement with its own decision, or
// a breach it has not yet acted on. Built from the latest signed event per
// account, so it needs no per-account gateway calls.
export type QueueItem = { accountId: string; reference: string; programme: string | null; phase: Phase | null; kind: "disagreement" | "breach"; summary: string; at: string; seen: boolean };
// A trader approaching a programme limit, from the gateway's last sync.
export type WatchItem = { accountId: string; reference: string; programme: string; phase: Phase | null; drawdownPct: number; drawdownLimit: number; profitPct: number; profitTarget: number | null; equity: number | null; currency: string | null };
// An account the gateway cannot currently read.
export type Unread = { accountId: string; reference: string; state: AccountState; since: string | null; error: string | null };

export type Overview = {
  programmes: ProgrammeOverview[];
  unassigned: GatewayAccount[];
  totals: { accounts: number; breached: number; disagreements: number; attention: number; evaluation: number; funded: number };
  queue: QueueItem[];
  watch: WatchItem[];
  unread: Unread[];
  // How current the picture is: the newest sync, and how many accounts were read in the last hour.
  coverage: { lastSyncAt: string | null; readLastHour: number; neverRead: number };
  // Events of note received since the firm last marked everything seen.
  unseen: { breaches: number; disagreements: number; behaviour: number; correlation: number; connection: number };
  // Sets of this firm's accounts trading in lockstep, from the gateway's latest correlation run.
  groups: CorrelationGroup[];
};

export async function overview(c: Ctx): Promise<Overview | null> {
  if (!c.gw) return null;
  const [programmes, accounts, recent, groups] = await Promise.all([c.gw.programmes(), c.gw.accounts(), listEvents(c.firmId, { limit: 300 }), c.gw.correlationGroups()]);
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
  const programmeById = new Map(programmes.map((p) => [p.id, p]));
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const label = (a: GatewayAccount | undefined, fallback: string) => a?.reference || a?.name || fallback;

  // Latest breach and latest disagreement per account, newest event first.
  const seenKind = new Set<string>();
  const queue: QueueItem[] = [];
  for (const e of recent) {
    if (!e.accountId) continue;
    const kind = e.event === "evaluation.disagreement" ? "disagreement" : e.event === "evaluation.breach" ? "breach" : null;
    if (!kind || seenKind.has(`${kind}:${e.accountId}`)) continue;
    seenKind.add(`${kind}:${e.accountId}`);
    const a = accountById.get(e.accountId);
    if (!a) continue;
    const data = (e.payload.data ?? {}) as Record<string, unknown>;
    const summary = kind === "breach"
      ? ((data.rules as { rule: string }[] | undefined) ?? []).map((r) => r.rule).join(", ") || "Rule failure"
      : `You recorded ${String(data.firm ?? "a decision")}; the referee finds ${String(data.gateway ?? "otherwise")}`;
    queue.push({ accountId: a.id, reference: label(a, e.accountId), programme: a.programme_id ? programmeById.get(a.programme_id)?.name ?? null : null, phase: a.phase, kind, summary, at: e.receivedAt, seen: e.seen });
  }
  // Disagreements first (they are the ones only we can tell the firm about), unseen before seen, newest first.
  queue.sort((x, y) => (x.kind === y.kind ? 0 : x.kind === "disagreement" ? -1 : 1) || Number(x.seen) - Number(y.seen) || y.at.localeCompare(x.at));

  // Drawdown used against the programme's limit, from starting balance to
  // current equity. Static drawdown only; a trailing limit needs the peak the
  // gateway does not expose here, so it is judged against the static figure
  // and labelled as such on the page.
  const watch: WatchItem[] = [];
  for (const a of accounts) {
    const p = a.programme_id ? programmeById.get(a.programme_id) : undefined;
    const rules = p?.current?.rules;
    if (!p || !rules?.maxDrawdownPct || !a.starting_balance || a.equity === null) continue;
    const change = (a.equity - a.starting_balance) / a.starting_balance * 100;
    const drawdownPct = Math.max(0, -change);
    if (drawdownPct / rules.maxDrawdownPct < 0.5 || breached.has(a.id)) continue;
    watch.push({ accountId: a.id, reference: label(a, a.id), programme: p.name, phase: a.phase, drawdownPct, drawdownLimit: rules.maxDrawdownPct, profitPct: change, profitTarget: rules.profitTargetPct ?? null, equity: a.equity, currency: a.currency });
  }
  watch.sort((x, y) => y.drawdownPct / y.drawdownLimit - x.drawdownPct / x.drawdownLimit);

  const unread: Unread[] = accounts
    .filter((a) => a.state === "reconnect_required" || a.state === "retrying" || a.state === "pending")
    .map((a) => ({ accountId: a.id, reference: label(a, a.id), state: a.state, since: a.last_sync_at ?? a.created_at, error: a.error?.message ?? null }))
    .sort((x, y) => (x.state === y.state ? 0 : x.state === "reconnect_required" ? -1 : 1));

  const hourAgo = Date.now() - 3600_000;
  const unseen = { breaches: 0, disagreements: 0, behaviour: 0, correlation: 0, connection: 0 };
  for (const e of recent) {
    if (e.seen) continue;
    if (e.event === "evaluation.breach") unseen.breaches++;
    else if (e.event === "evaluation.disagreement") unseen.disagreements++;
    else if (e.event === "behaviour.changed") unseen.behaviour++;
    else if (e.event === "correlation.flagged") unseen.correlation++;
    else if (e.event === "account.reconnect_required" || e.event === "sync.failed") unseen.connection++;
  }

  return {
    programmes: rows,
    unassigned: accounts.filter((a) => !a.programme_id),
    totals: {
      accounts: accounts.length,
      breached: accounts.filter((a) => breached.has(a.id)).length,
      disagreements: [...disagreed.values()].reduce((s, n) => s + n, 0),
      attention: accounts.filter((a) => a.state === "reconnect_required" || a.state === "retrying").length,
      evaluation: accounts.filter((a) => a.phase === "evaluation").length,
      funded: accounts.filter((a) => a.phase === "funded").length,
    },
    queue,
    watch: watch.slice(0, 8),
    unread,
    coverage: {
      lastSyncAt: accounts.reduce<string | null>((m, a) => (a.last_sync_at && (!m || a.last_sync_at > m) ? a.last_sync_at : m), null),
      readLastHour: accounts.filter((a) => a.last_sync_at && new Date(a.last_sync_at).getTime() > hourAgo).length,
      neverRead: accounts.filter((a) => !a.last_sync_at).length,
    },
    unseen,
    groups: [...groups].sort((x, y) => SEV[y.severity] - SEV[x.severity] || y.size - x.size),
  };
}
const SEV: Record<CorrelationGroup["severity"], number> = { block: 3, review: 2, info: 1, none: 0 };
