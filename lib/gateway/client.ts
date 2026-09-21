import "server-only";

import { decrypt, encrypt, toBytea } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";
import type { Anchor, BatchResult, CorrelationGroup, CorrelationRecord, CustomerSettings, Decision, DecisionKind, Evaluation, GatewayAccount, PayoutCheck, Programme, ProgrammeRules, Report, ReportSummary, Seal, Simulation, Trade } from "@/lib/gateway/types";
import { sampleCorrelations, sampleGroups, sampleReport, sampleReports, sampleSettings, sampleSimulation } from "@/lib/gateway/sample";

// The gateway API, as this app calls it. One instance per firm, holding
// that firm's API key; only server code can construct one. The app never
// reads the gateway's database: everything comes through these calls.

const BASE = () => (process.env.GATEWAY_URL ?? "http://localhost:3000").replace(/\/$/, "");

export class GatewayError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export class Gateway {
  constructor(private apiKey: string) {}

  private async call<T>(method: string, path: string, body?: unknown, raw = false): Promise<T> {
    const res = await fetch(`${BASE()}/api/v1${path}`, {
      method,
      headers: { authorization: `Bearer ${this.apiKey}`, ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (raw) return (await res.text()) as unknown as T;
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new GatewayError(res.status, (json as { error?: { message?: string } }).error?.message ?? `Gateway returned ${res.status}`);
    return json as T;
  }

  // Accounts
  accounts(q: { programme_id?: string; phase?: string; state?: string; reference?: string } = {}) {
    const qs = new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]).toString();
    return this.call<{ accounts: GatewayAccount[] }>("GET", `/accounts${qs ? `?${qs}` : ""}`).then((r) => r.accounts);
  }
  account(id: string) { return this.call<GatewayAccount>("GET", `/accounts/${id}`); }
  updateAccount(id: string, patch: Record<string, unknown>) { return this.call<GatewayAccount>("PATCH", `/accounts/${id}`, patch); }
  batchConnect(body: Record<string, unknown>) { return this.call<BatchResult>("POST", "/accounts/batch", body); }
  sync(id: string) { return this.call<{ queued: boolean }>("POST", `/accounts/${id}/sync`); }
  disconnect(id: string) { return this.call<{ ok: boolean }>("DELETE", `/accounts/${id}`); }
  trades(id: string, limit = 200) { return this.call<{ trades: Trade[]; next: string | null }>("GET", `/accounts/${id}/trades?limit=${limit}`).then((r) => r.trades); }

  // Programmes
  programmes() { return this.call<{ programmes: Programme[] }>("GET", "/programmes").then((r) => r.programmes); }
  programme(id: string) { return this.call<Programme & { accounts: { id: string; name: string; reference: string | null; phase: string | null; state: string }[] }>("GET", `/programmes/${id}`); }
  createProgramme(name: string, rules: ProgrammeRules, note?: string) { return this.call<Programme>("POST", "/programmes", { name, rules, note }); }
  updateProgramme(id: string, patch: { name?: string; active?: boolean }) { return this.call<Programme>("PATCH", `/programmes/${id}`, patch); }
  newVersion(id: string, rules: ProgrammeRules, effective_from?: string | null, note?: string) { return this.call<{ version: number }>("POST", `/programmes/${id}/versions`, { rules, effective_from: effective_from ?? undefined, note }); }

  // Judgements
  evaluations(id: string, limit = 50) { return this.call<{ evaluations: Evaluation[] }>("GET", `/accounts/${id}/evaluations?limit=${limit}`).then((r) => r.evaluations); }
  evaluateNow(id: string) { return this.call<Evaluation>("POST", `/accounts/${id}/evaluations`); }
  decisions(id: string) { return this.call<{ decisions: Decision[] }>("GET", `/accounts/${id}/decisions`).then((r) => r.decisions); }
  recordDecision(id: string, kind: DecisionKind, rule?: string | null, detail?: unknown) { return this.call<Decision>("POST", `/accounts/${id}/decisions`, { kind, rule: rule ?? undefined, detail }); }
  payoutChecks(id: string) { return this.call<{ payout_checks: PayoutCheck[] }>("GET", `/accounts/${id}/payout-checks`).then((r) => r.payout_checks); }
  runPayoutCheck(id: string) { return this.call<PayoutCheck>("POST", `/accounts/${id}/payout-checks`); }
  seals(id: string) { return this.call<{ public_key: string | null; seals: Seal[] }>("GET", `/accounts/${id}/seals`); }
  evidence(id: string) { return this.call<string>("GET", `/accounts/${id}/evidence`, undefined, true); }

  // Correlations. A gateway without this feature yet answers 404; that reads
  // as "no record" here so the rest of the console keeps working.
  correlations(id: string) { return this.optional(() => this.call<{ record: CorrelationRecord | null }>("GET", `/accounts/${id}/correlations`).then((r) => r.record), () => sampleCorrelations(id)); }
  correlationHistory(id: string, limit = 20) { return this.optional(() => this.call<{ records: CorrelationRecord[] }>("GET", `/accounts/${id}/correlations/history?limit=${limit}`).then((r) => r.records), () => []); }
  correlationGroups() { return this.optional(() => this.call<{ groups: CorrelationGroup[] }>("GET", "/correlations/groups").then((r) => r.groups), () => sampleGroups()); }
  runCorrelations() { return this.call<{ queued: boolean }>("POST", "/correlations/run"); }
  settings() { return this.optional(() => this.call<CustomerSettings>("GET", "/settings"), () => sampleSettings()); }
  updateSettings(patch: Partial<CustomerSettings>) { return this.call<CustomerSettings>("PATCH", "/settings", patch); }

  // Reports and simulation: same 404 tolerance as correlations.
  reports(limit = 24) { return this.optional(() => this.call<{ reports: ReportSummary[] }>("GET", `/reports?limit=${limit}`).then((r) => r.reports), () => sampleReports()); }
  report(id: string) { return this.optional(() => this.call<Report>("GET", `/reports/${id}`), () => sampleReport(id)); }
  reportDownload(id: string) { return this.call<string>("GET", `/reports/${id}/download`, undefined, true); }
  requestReport(period: string) { return this.call<{ id: string }>("POST", "/reports", { period }); }
  simulate(programmeId: string, rules: ProgrammeRules, from?: string | null) { return this.optional(() => this.call<Simulation>("POST", `/programmes/${programmeId}/simulate`, { rules, from: from ?? null }), () => sampleSimulation(programmeId, rules)); }

  private async optional<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
    if (process.env.CORRELATION_SAMPLE === "true") return fallback();
    try { return await fn(); } catch (e) { if (e instanceof GatewayError && e.status === 404) return fallback(); throw e; }
  }

  // Webhooks
  webhooks() { return this.call<{ webhooks: { id: string; url: string; events: string[]; active: boolean }[] }>("GET", "/webhooks").then((r) => r.webhooks); }
  createWebhook(url: string, events: string[]) { return this.call<{ id: string; secret: string }>("POST", "/webhooks", { url, events }); }
  deleteWebhook(id: string) { return this.call<{ ok: boolean }>("DELETE", `/webhooks/${id}`); }
}

// Public routes, no API key: anyone holding a record can check it.
export type Verification = { valid: boolean; anchor?: Anchor | null; path?: { side: "left" | "right"; hash: string }[]; verified?: boolean };

export async function verifyRecord(body_hash: string, signature: string, seal_hash?: string): Promise<Verification> {
  const res = await fetch(`${BASE()}/api/v1/verify`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body_hash, signature, seal_hash }), cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new GatewayError(res.status, `Gateway returned ${res.status}`);
  return (await res.json()) as Verification;
}

export async function sealAnchor(seal_hash: string): Promise<{ anchor: Anchor | null; verified: boolean } | null> {
  const res = await fetch(`${BASE()}/api/v1/seals/${seal_hash}/anchor`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new GatewayError(res.status, `Gateway returned ${res.status}`);
  return (await res.json()) as { anchor: Anchor | null; verified: boolean };
}

export async function gatewayPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE()}/api/v1/public-key`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    const j = (await res.json()) as { public_key: string | null };
    return j.public_key;
  } catch { return null; }
}

// ── Per-firm connection ─────────────────────────────────────────────────────

export type Connection = { customerId: string; webhookEndpointId: string | null; publicKey: string | null; connectedAt: string };

export async function connectionFor(firmId: string): Promise<Connection | null> {
  const { data } = await db().from("gateway_connections").select("customer_id, webhook_endpoint_id, public_key, connected_at").eq("firm_id", firmId).maybeSingle();
  return data ? { customerId: data.customer_id, webhookEndpointId: data.webhook_endpoint_id, publicKey: data.public_key, connectedAt: data.connected_at } : null;
}

// The firm's gateway client, or null until the firm is connected.
export async function gatewayFor(firmId: string): Promise<Gateway | null> {
  const { data } = await db().from("gateway_connections").select("api_key_enc, key_version").eq("firm_id", firmId).maybeSingle();
  if (!data) return null;
  return new Gateway(await decrypt(data.api_key_enc));
}

// First use: create the firm's customer and key on the gateway through its
// bootstrap route (needs the gateway's INTERNAL_SECRET), store the key
// encrypted, and register our webhook receiver.
export async function provisionFirm(firmId: string, firmName: string, appBaseUrl: string): Promise<Connection> {
  const existing = await connectionFor(firmId);
  if (existing) return existing;
  const secret = process.env.GATEWAY_INTERNAL_SECRET;
  if (!secret) throw new Error("GATEWAY_INTERNAL_SECRET is not set");
  const res = await fetch(`${BASE()}/api/internal/bootstrap`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-internal-secret": secret },
    body: JSON.stringify({ name: firmName }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const j = (await res.json().catch(() => ({}))) as { customer_id?: string; api_key?: string; error?: string };
  if (!res.ok || !j.customer_id || !j.api_key) throw new Error(`Gateway bootstrap failed: ${j.error ?? res.status}`);

  const gw = new Gateway(j.api_key);
  let webhookId: string | null = null, webhookSecret: string | null = null;
  try {
    const wh = await gw.createWebhook(`${appBaseUrl.replace(/\/$/, "")}/api/gateway/webhook?firm=${firmId}`, ["*"]);
    webhookId = wh.id; webhookSecret = wh.secret;
  } catch (e) {
    console.error("[provision] webhook registration failed:", e);
  }
  const publicKey = await gatewayPublicKey();
  const { error } = await db().from("gateway_connections").insert({
    firm_id: firmId, customer_id: j.customer_id, api_key_enc: toBytea(await encrypt(j.api_key)),
    webhook_endpoint_id: webhookId, webhook_secret_enc: webhookSecret ? toBytea(await encrypt(webhookSecret)) : null, public_key: publicKey,
  });
  if (error) throw new Error(`Could not store the gateway connection: ${error.message}`);
  return { customerId: j.customer_id, webhookEndpointId: webhookId, publicKey, connectedAt: new Date().toISOString() };
}

export async function webhookSecretFor(firmId: string): Promise<string | null> {
  const { data } = await db().from("gateway_connections").select("webhook_secret_enc").eq("firm_id", firmId).maybeSingle();
  return data?.webhook_secret_enc ? decrypt(data.webhook_secret_enc) : null;
}
