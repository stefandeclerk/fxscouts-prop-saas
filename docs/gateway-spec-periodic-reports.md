# Gateway spec — signed periodic reports

Status: draft for the Gateway repo. Prop Monitor lists and renders reports;
it computes nothing.

## 1. Purpose

A monthly, signed statement of what the Gateway observed for one customer:
how many accounts it read, how often, what it concluded and what it
flagged. Produced automatically from the Gateway's own records — no input
from the firm is needed and none is used. A firm hands it to a
certification body or auditor, or quotes it ("independently monitored,
n breaches confirmed, m payout checks run"); anyone can verify it against
the public key like any other record.

Figures come only from: accounts, sync jobs, evaluations, rule versions,
payout checks, behaviour alerts, correlation records and seals. Firm
decisions are deliberately excluded — a report must mean the same thing
for a firm that records decisions and one that never does.

## 2. Periods

Calendar months, UTC. A report for month M is generated on the 1st of
M+1 at 01:00 UTC, after that night's anchoring. On demand, a report may be
generated for the current month to date (`partial: true`) — it is signed
like any other and superseded by the final one.

One final report per customer per month. Regeneration is not allowed;
an error in the generator means a new schema version and a new report
with a note, never a silent overwrite.

## 3. Content

```json
{
  "id": "rp_…",
  "schema": 1,
  "customer_id": "…",
  "period": { "from": "2026-08-01T00:00:00Z", "to": "2026-09-01T00:00:00Z", "partial": false },
  "generated_at": "2026-09-01T01:00:12Z",

  "accounts": {
    "at_start": 412, "at_end": 447, "connected": 61, "disconnected": 26,
    "by_phase_at_end": { "evaluation": 310, "funded": 122, "none": 15 },
    "access": { "investor": 447, "master": 0 },
    "servers": { "live": 447, "demo": 0 }
  },

  "coverage": {
    "sync_jobs": 38104, "succeeded": 37910, "failed": 194,
    "accounts_read_every_day": 401,
    "median_minutes_between_reads": 58,
    "deals_ingested": 91230, "trades_reconciled": 44870
  },

  "programmes": [
    {
      "id": "…", "name": "100k two-step · phase 1",
      "versions_published": [ { "version": 3, "effective_from": "…", "body_hash": "…" } ],
      "accounts_at_end": 210,
      "evaluations": 6120,
      "latest_verdict_at_end": { "pass": 164, "breach": 39, "incomplete": 7 },
      "first_breaches_in_period": 31,
      "breaches_by_rule": { "maxDailyLoss": 12, "maxDrawdown": 9, "minHoldSeconds": 6, "consistency": 4 },
      "estimated_only_breaches": 5
    }
  ],

  "payout_checks": {
    "run": 88, "clean": 61, "flagged": 27,
    "flags_by_check": { "consistency": 11, "quick_strike": 8, "lot_cap": 5, "size_escalation": 3, "correlated_account": 2 },
    "by_severity": { "info": 14, "review": 19, "block": 6 }
  },

  "behaviour": { "alerts": 9, "by_metric": { "avgLots": 5, "medianHoldSeconds": 3, "winRate": 1 } },

  "correlations": {
    "runs": 31, "accounts_flagged_at_end": 7, "groups_at_end": 2,
    "by_kind": { "mirrored": 4, "hedged": 3 }, "newly_flagged": 3, "cleared": 1
  },

  "integrity": {
    "seals": 38104, "chain_breaks": 0,
    "anchors": 31, "anchored_seals": 38104, "confirmed_seals": 37890,
    "first_seal": "…", "last_seal": "…"
  },

  "events": { "delivered": 1204, "failed": 3, "by_type": { "evaluation.breach": 31, "behaviour.changed": 9, "correlation.flagged": 3, "…": 0 } },

  "body_hash": "…", "signature": "…"
}
```

Definitions:

- `first_breaches_in_period`: accounts whose first-ever `breach` verdict on
  that programme fell in the period. Counts an account once.
- `breaches_by_rule`: rules with status `fail` in those first breaches;
  `estimated_only_breaches` counts first breaches whose only failed rules
  were `estimated_fail`.
- `accounts_read_every_day`: accounts with at least one successful sync on
  every UTC day they were connected during the period.
- `chain_breaks`: seals whose `prev_hash` does not equal the previous seal's
  `seal_hash`. Must be 0; any other value is an operator incident.
- `events.by_type`: webhook deliveries attempted, per event type.

Every figure is a count or a median; no per-account data, no names, no
references. The report is safe to publish.

## 4. Data model

```sql
create table reports (
  id            text primary key,           -- rp_…
  customer_id   uuid not null references customers(id),
  schema        int not null,
  period_from   timestamptz not null,
  period_to     timestamptz not null,
  partial       boolean not null,
  generated_at  timestamptz not null default now(),
  body          jsonb not null,
  body_hash     text not null,
  signature     text not null,
  unique (customer_id, period_from, partial) deferrable
);
```

A partial report is replaced when a new partial is requested (one
partial per customer per month); the final is written once.

## 5. Jobs

- `generate_reports`: 1st of the month 01:00 UTC, every customer, previous
  month. Emits `report.ready`.
- On demand: `POST /reports` with `period` = the current month → partial.
  Rate-limited to one per hour per customer.

Generation runs in one read transaction with a snapshot so all counts
refer to the same instant.

## 6. API (`/api/v1`, keyed)

| Route | Returns |
|---|---|
| `GET /reports?limit=24` | `{ public_key, reports: [ { id, period, partial, generated_at, body_hash, signature } ] }` newest first, no bodies |
| `GET /reports/{id}` | the full report |
| `GET /reports/{id}/download` | same, `content-disposition: attachment; filename="report-<customer>-<yyyy-mm>.json"` |
| `POST /reports` `{ period: "2026-09" }` | `202 { id }` (current month only; earlier months are always final already) |

Webhook `report.ready`: `{ event, account_id: null, data: { report_id, period, partial, body_hash, signature } }`.

Verification: `POST /api/v1/verify` with the report's `body_hash` and
`signature`, as for any record.

## 7. Operator admin

Reports generated per month, failures, customers without a report.

## 8. Prop Monitor side (for reference)

- New nav item **Reports** → `/app/reports`: list of months; one report
  rendered as tables (accounts, coverage, per programme, payout checks,
  behaviour, linked accounts, integrity); "Download signed report";
  "Generate for this month so far".
- Types `ReportSummary`, `Report`; client `reports()`, `report(id)`,
  `reportDownload(id)`, `requestReport(period)`.
- Events page: `report.ready`.
