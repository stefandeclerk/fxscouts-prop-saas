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

export interface Seal { seq: number; job_id: string | null; sealed_at: string; deals_count: number; last_deal_utc: string | null; ledger_hash: string; prev_hash: string | null; seal_hash: string; signature: string | null }

export interface Trade {
  trade_id: string; position_id: string; symbol: string; side: "buy" | "sell"; volume: number;
  open_time_utc: string; close_time_utc: string; open_price: number; close_price: number;
  pips: number; gross: number; commission: number; swap: number; net: number; hold_minutes: number; close_reason: string | null;
}

export interface BatchResult { created: number; failed: number; results: ({ ok: true } & GatewayAccount | { ok: false; login: string | null; reference: string | null; error: string })[] }
