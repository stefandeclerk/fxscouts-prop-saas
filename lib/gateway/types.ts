// Shapes returned by the FxScouts Gateway API (/v1), as this app reads them.
// Field names are the gateway's (snake_case). Kept in one place so a
// gateway change is a one-file change here.

export type Phase = "evaluation" | "funded";
export type AccountState = "pending" | "connected" | "syncing" | "retrying" | "reconnect_required" | "disconnected";

export interface GatewayAccount {
  id: string;
  reference: string | null;
  name: string;
  source: "mt4" | "mt5" | "ctrader" | "statement";
  login: string;
  server: string;
  broker: string | null;
  state: AccountState;
  access_level: "investor" | "master" | null;
  schedule: string;
  currency: string | null;
  balance: number | null;
  equity: number | null;
  last_sync_at: string | null;
  next_sync_at: string | null;
  error: { class: string; message: string | null } | null;
  programme_id: string | null;
  phase: Phase | null;
  phase_started_at: string | null;
  starting_balance: number | null;
  created_at: string;
}

export interface BannedWindow { label: string; fromUtc: string; toUtc: string; days?: number[] }

export interface ProgrammeRules {
  profitTargetPct?: number | null;
  maxDailyLossPct?: number | null;
  dailyResetUtc?: string;
  maxDrawdownPct?: number | null;
  drawdownType?: "static" | "trailing";
  maxLot?: number | null;
  weekendHolds?: boolean;
  minTradingDays?: number;
  consistencyPct?: number | null;
  minHoldSeconds?: number | null;
  maxTradesPerDay?: number | null;
  bannedWindows?: BannedWindow[];
  behaviourChangePct?: number;
}

export interface ProgrammeVersion { version: number; rules: ProgrammeRules; effective_from: string; note: string | null; body_hash: string; signature: string | null; created_at: string }

export interface Programme { id: string; name: string; active: boolean; created_at: string; current: ProgrammeVersion | null; versions: ProgrammeVersion[] }

export interface RuleResult {
  rule: string;
  limit: string;
  observed: string;
  status: "pass" | "fail" | "estimated_pass" | "estimated_fail";
  basis: "verified" | "estimated";
  note?: string;
  tradeIds?: string[];
  version?: number;
}

export interface Evaluation { id: number; programme_id: string; version: number; job_id: string | null; evaluated_at: string; verdict: "pass" | "breach" | "incomplete"; results: RuleResult[]; body_hash: string; signature: string | null }

export type DecisionKind = "breach" | "clear" | "payout_approved" | "payout_denied";
export interface Decision { id: string; kind: DecisionKind; rule: string | null; decided_at: string; detail: unknown; evaluation_id: number | null; agrees: boolean | null; disagreement: { firm?: string; gateway?: string; detail?: string } | null; created_at: string }

export interface PayoutFlag { check: string; severity: "info" | "review" | "block"; observed: string; threshold: string; tradeIds: string[] }
export interface BehaviourProfile { trades: number; tradingDays: number; avgLots: number; medianHoldSeconds: number; winRate: number; tradesPerDay: number; quickStrikeShare: number; bestDayShare: number; maxLotEscalation: number; netProfit: number }
export interface PayoutCheck {
  id: string;
  account_id: string;
  created_at: string;
  trades: number;
  rules_version: number | null;
  evaluation_account_id: string | null;
  verdict: "clean" | "flagged";
  profile: BehaviourProfile;
  flags: PayoutFlag[];
  phaseComparison: { evaluation: BehaviourProfile; deltas: Record<string, number>; thresholdPct: number; exceeded: string[] } | null;
  body_hash: string;
  signature: string | null;
}

// A seal's public anchor: the day's Merkle root committed to Bitcoin through
// OpenTimestamps (docs/gateway-spec-public-anchoring.md). Null until the
// nightly anchor run has included the seal.
export interface Anchor { root: string; anchored_at: string; status: "pending" | "confirmed"; block_height: number | null; block_time: string | null }
export interface Seal { seq: number; job_id: string | null; sealed_at: string; deals_count: number; last_deal_utc: string | null; ledger_hash: string; prev_hash: string | null; seal_hash: string; signature: string | null; anchor?: Anchor | null }

export interface Trade {
  trade_id: string; position_id: string; symbol: string; side: "buy" | "sell"; volume: number;
  open_time_utc: string; close_time_utc: string; open_price: number; close_price: number;
  pips: number; gross: number; commission: number; swap: number; net: number; hold_minutes: number; close_reason: string | null;
}

export interface BatchResult { created: number; failed: number; results: ({ ok: true } & GatewayAccount | { ok: false; login: string | null; reference: string | null; error: string })[] }

// Account correlation: accounts of this firm traded from one source, judged
// on trade timing alone (docs/gateway-spec-account-correlation.md).
export type CorrelationKind = "mirrored" | "hedged" | "mixed";
export type CorrelationSeverity = "none" | "info" | "review" | "block";
export interface CorrelationPeer {
  account_id: string; reference: string | null; kind: CorrelationKind; severity: CorrelationSeverity;
  score: number; both_matches: number; open_matches: number; close_matches: number; volume_similarity: number;
  trade_ids: string[];   // this account's trades that matched
}
export interface CorrelationRecord {
  id: string; account_id: string; computed_at: string; window: { from: string; to: string }; trades: number;
  verdict: "clean" | "flagged"; peers: CorrelationPeer[]; group: { id: string; size: number } | null;
  thresholds: CorrelationThresholds; body_hash: string; signature: string | null;
}
export interface CorrelationGroup { id: string; size: number; kind: CorrelationKind; severity: CorrelationSeverity; accounts: { id: string; reference: string | null; name: string; phase: Phase | null }[] }
export interface CorrelationThresholds { bucket_seconds: number; min_matches: number; min_score: number; min_trades: number }
export interface CustomerSettings { correlation_enabled: boolean; correlation_bucket_seconds: number; correlation_min_matches: number; correlation_min_score: number; correlation_min_trades: number }

// Signed periodic report (docs/gateway-spec-periodic-reports.md). Counts
// only, from the gateway's own records; nothing per account.
export interface ReportSummary { id: string; period: { from: string; to: string; partial: boolean }; generated_at: string; body_hash: string; signature: string }
export interface Report extends ReportSummary {
  schema: number;
  accounts: { at_start: number; at_end: number; connected: number; disconnected: number; by_phase_at_end: { evaluation: number; funded: number; none: number }; access: { investor: number; master: number }; servers: { live: number; demo: number } };
  coverage: { sync_jobs: number; succeeded: number; failed: number; accounts_read_every_day: number; median_minutes_between_reads: number | null; deals_ingested: number; trades_reconciled: number };
  programmes: { id: string; name: string; versions_published: { version: number; effective_from: string; body_hash: string }[]; accounts_at_end: number; evaluations: number; latest_verdict_at_end: { pass: number; breach: number; incomplete: number }; first_breaches_in_period: number; breaches_by_rule: Record<string, number>; estimated_only_breaches: number }[];
  payout_checks: { run: number; clean: number; flagged: number; flags_by_check: Record<string, number>; by_severity: { info: number; review: number; block: number } };
  behaviour: { alerts: number; by_metric: Record<string, number> };
  correlations: { runs: number; accounts_flagged_at_end: number; groups_at_end: number; by_kind: Record<string, number>; newly_flagged: number; cleared: number };
  integrity: { seals: number; chain_breaks: number; anchors: number; anchored_seals: number; confirmed_seals: number; first_seal: string | null; last_seal: string | null };
  events: { delivered: number; failed: number; by_type: Record<string, number> };
}

// Rule simulation (docs/gateway-spec-rule-simulation.md): what a proposed
// rule set would have concluded for the accounts on a programme.
export type Verdict = Evaluation["verdict"];
export interface Simulation {
  programme_id: string; simulated_at: string; current_version: number; rules: ProgrammeRules; from: string | null; accounts: number;
  summary: { before: Record<Verdict, number>; after: Record<Verdict, number>; pass_to_breach: number; breach_to_pass: number; unchanged: number };
  by_rule: { rule: string; before_fail: number; after_fail: number; newly_fail: number; newly_pass: number }[];
  changed: { account_id: string; reference: string | null; phase: Phase | null; before: Verdict; after: Verdict; rules_changed: { rule: string; before: RuleResult["status"]; after: RuleResult["status"]; observed: string; trade_ids: string[] }[] }[];
  body_hash: string; signature: string | null;
}
