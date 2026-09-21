import "server-only";

import type { CorrelationGroup, CorrelationRecord, CustomerSettings, ProgrammeRules, Report, ReportSummary, Simulation } from "@/lib/gateway/types";

// Stand-in correlation data for building the console before the gateway
// has the feature. Used only when CORRELATION_SAMPLE=true (development) or
// when the gateway answers 404 for the correlation routes, in which case
// the empty fallbacks apply. Shapes follow docs/gateway-spec-account-correlation.md.

const THRESHOLDS = { bucket_seconds: 5, min_matches: 15, min_score: 0.6, min_trades: 20 };

export function sampleCorrelations(accountId: string): CorrelationRecord | null {
  if (process.env.CORRELATION_SAMPLE !== "true") return null;
  return {
    id: `corr_${accountId.slice(0, 8)}`, account_id: accountId, computed_at: new Date(Date.now() - 3600_000 * 5).toISOString(),
    window: { from: new Date(Date.now() - 30 * 86400_000).toISOString(), to: new Date().toISOString() }, trades: 61, verdict: "flagged",
    peers: [
      { account_id: "00000000-0000-0000-0000-00000000a001", reference: "T-2210", kind: "hedged", severity: "block", score: 0.87, both_matches: 53, open_matches: 55, close_matches: 54, volume_similarity: 0.96, trade_ids: ["18873321", "18873402", "18874010", "18874550", "18875102", "18875990", "18876204"] },
      { account_id: "00000000-0000-0000-0000-00000000a002", reference: "T-2214", kind: "mirrored", severity: "review", score: 0.64, both_matches: 39, open_matches: 44, close_matches: 41, volume_similarity: 0.71, trade_ids: ["18873321", "18874010", "18876204", "18877117"] },
    ],
    group: { id: "grp_sample", size: 3 }, thresholds: THRESHOLDS, body_hash: "5f1c9e3a7b2d4e6f8a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f", signature: "sample",
  };
}

export function sampleGroups(): CorrelationGroup[] {
  if (process.env.CORRELATION_SAMPLE !== "true") return [];
  return [{ id: "grp_sample", size: 3, kind: "mixed", severity: "block", accounts: [
    { id: "00000000-0000-0000-0000-00000000a000", reference: "T-2201", name: "Sample A", phase: "evaluation" },
    { id: "00000000-0000-0000-0000-00000000a001", reference: "T-2210", name: "Sample B", phase: "evaluation" },
    { id: "00000000-0000-0000-0000-00000000a002", reference: "T-2214", name: "Sample C", phase: "funded" },
  ] }];
}

export function sampleSettings(): CustomerSettings {
  return { correlation_enabled: true, correlation_bucket_seconds: THRESHOLDS.bucket_seconds, correlation_min_matches: THRESHOLDS.min_matches, correlation_min_score: THRESHOLDS.min_score, correlation_min_trades: THRESHOLDS.min_trades };
}

const ON = () => process.env.CORRELATION_SAMPLE === "true";

function month(offset: number): { from: string; to: string } {
  const d = new Date(); d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0); d.setUTCMonth(d.getUTCMonth() - offset);
  const e = new Date(d); e.setUTCMonth(e.getUTCMonth() + 1);
  return { from: d.toISOString(), to: e.toISOString() };
}

export function sampleReports(): ReportSummary[] {
  if (!ON()) return [];
  return [0, 1, 2].map((i) => ({ id: `rp_sample_${i}`, period: { ...month(i), partial: i === 0 }, generated_at: month(i - 1).from, body_hash: `${i}f1c9e3a7b2d4e6f8a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f`, signature: "sample" }));
}

export function sampleReport(id: string): Report | null {
  const s = sampleReports().find((r) => r.id === id);
  if (!s) return null;
  return {
    ...s, schema: 1,
    accounts: { at_start: 412, at_end: 447, connected: 61, disconnected: 26, by_phase_at_end: { evaluation: 310, funded: 122, none: 15 }, access: { investor: 447, master: 0 }, servers: { live: 447, demo: 0 } },
    coverage: { sync_jobs: 38104, succeeded: 37910, failed: 194, accounts_read_every_day: 401, median_minutes_between_reads: 58, deals_ingested: 91230, trades_reconciled: 44870 },
    programmes: [
      { id: "p1", name: "100k two-step · phase 1", versions_published: [{ version: 3, effective_from: s.period.from, body_hash: "abc" }], accounts_at_end: 210, evaluations: 6120, latest_verdict_at_end: { pass: 164, breach: 39, incomplete: 7 }, first_breaches_in_period: 31, breaches_by_rule: { maxDailyLoss: 12, maxDrawdown: 9, minHoldSeconds: 6, consistency: 4 }, estimated_only_breaches: 5 },
      { id: "p2", name: "Funded · 100k", versions_published: [], accounts_at_end: 122, evaluations: 3540, latest_verdict_at_end: { pass: 118, breach: 4, incomplete: 0 }, first_breaches_in_period: 3, breaches_by_rule: { maxDailyLoss: 3 }, estimated_only_breaches: 3 },
    ],
    payout_checks: { run: 88, clean: 61, flagged: 27, flags_by_check: { consistency: 11, quick_strike: 8, lot_cap: 5, size_escalation: 3, correlated_account: 2 }, by_severity: { info: 14, review: 19, block: 6 } },
    behaviour: { alerts: 9, by_metric: { avgLots: 5, medianHoldSeconds: 3, winRate: 1 } },
    correlations: { runs: 31, accounts_flagged_at_end: 7, groups_at_end: 2, by_kind: { mirrored: 4, hedged: 3 }, newly_flagged: 3, cleared: 1 },
    integrity: { seals: 38104, chain_breaks: 0, anchors: 31, anchored_seals: 38104, confirmed_seals: 37890, first_seal: s.period.from, last_seal: s.period.to },
    events: { delivered: 1204, failed: 3, by_type: { "evaluation.breach": 31, "behaviour.changed": 9, "correlation.flagged": 3, "sync.failed": 194 } },
  };
}

export function sampleSimulation(programmeId: string, rules: ProgrammeRules): Simulation | null {
  if (!ON()) return null;
  return {
    programme_id: programmeId, simulated_at: new Date().toISOString(), current_version: 2, rules, from: null, accounts: 210,
    summary: { before: { pass: 164, breach: 39, incomplete: 7 }, after: { pass: 171, breach: 32, incomplete: 7 }, pass_to_breach: 4, breach_to_pass: 11, unchanged: 195 },
    by_rule: [
      { rule: "maxLot", before_fail: 9, after_fail: 2, newly_fail: 0, newly_pass: 7 },
      { rule: "maxDailyLoss", before_fail: 12, after_fail: 16, newly_fail: 4, newly_pass: 0 },
      { rule: "minHoldSeconds", before_fail: 6, after_fail: 2, newly_fail: 0, newly_pass: 4 },
    ],
    changed: [
      { account_id: "00000000-0000-0000-0000-00000000b001", reference: "T-1150", phase: "evaluation", before: "pass", after: "breach", rules_changed: [{ rule: "maxDailyLoss", before: "estimated_pass", after: "estimated_fail", observed: "4.6% on 12 Aug", trade_ids: ["18873321", "18873402"] }] },
      { account_id: "00000000-0000-0000-0000-00000000b002", reference: "T-1103", phase: "evaluation", before: "breach", after: "pass", rules_changed: [{ rule: "maxLot", before: "fail", after: "pass", observed: "max 6.00 lots", trade_ids: ["18874010"] }] },
      { account_id: "00000000-0000-0000-0000-00000000b003", reference: "T-1077", phase: "evaluation", before: "breach", after: "pass", rules_changed: [{ rule: "minHoldSeconds", before: "fail", after: "pass", observed: "8 trades under 60 s", trade_ids: ["18875102", "18875990"] }] },
    ],
    body_hash: "9a1c9e3a7b2d4e6f8a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f", signature: "sample",
  };
}
