import "server-only";

import type { CorrelationGroup, CorrelationRecord, CustomerSettings } from "@/lib/gateway/types";

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
