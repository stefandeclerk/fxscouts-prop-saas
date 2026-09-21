# Gateway spec — rule simulation (preview a rulebook change)

Status: draft for the Gateway repo. Prop Monitor shows the result in the
programme editor before a new version is saved.

## 1. Purpose

Before a firm publishes a new version of a programme's rules, show what
the change would have done to the accounts already on it: who would have
passed instead of breached, who would have breached instead of passed,
and which rule drives the difference. The firm changes rules with the
consequences in front of it, and the preview is on the record.

Nothing is written to the ledger by a simulation. It reads the same trades
and runs the same evaluator as a real evaluation; the only difference is
the rules it is handed.

## 2. What is simulated

Given a programme and a proposed rule set:

1. Take every account currently on the programme (any phase, any state
   with trades; disconnected accounts included since their history is
   what matters).
2. For each account, run `evaluate(trades, rules)` twice: once with the
   rules in force today (the current version, or per-trade versions as a
   real evaluation would use) → **before**; once with the proposed rules
   applied to *all* trades in the window → **after**.
3. Compare the verdicts and the per-rule results.

The evaluator is the existing one; this spec adds a mode that takes rules
as an argument instead of reading the programme's versions, and a caller
that runs it in memory without inserting an `evaluations` row.

Optional `from` limits the trades used to those closed after a date, for
firms that want "what if this had applied since the 1st".

## 3. API

### `POST /programmes/{id}/simulate`

```json
{ "rules": { …ProgrammeRules… }, "from": "2026-08-01T00:00:00Z" | null }
```

Response, synchronous (target < 10 s for 1 000 accounts; above that the
Gateway returns `202 { job_id }` and the result is fetched from
`GET /programmes/{id}/simulate/{job_id}` — same body once ready):

```json
{
  "programme_id": "…",
  "simulated_at": "…",
  "current_version": 3,
  "rules": { … },                       // as received, normalised
  "from": null,
  "accounts": 210,
  "summary": {
    "before": { "pass": 164, "breach": 39, "incomplete": 7 },
    "after":  { "pass": 171, "breach": 32, "incomplete": 7 },
    "pass_to_breach": 4,
    "breach_to_pass": 11,
    "unchanged": 195
  },
  "by_rule": [
    { "rule": "maxLot", "before_fail": 9, "after_fail": 2, "newly_fail": 0, "newly_pass": 7 },
    { "rule": "maxDailyLoss", "before_fail": 12, "after_fail": 16, "newly_fail": 4, "newly_pass": 0 }
  ],
  "changed": [
    { "account_id": "…", "reference": "T-1103", "phase": "evaluation",
      "before": "breach", "after": "pass",
      "rules_changed": [ { "rule": "maxLot", "before": "fail", "after": "pass", "observed": "6.00 lots", "trade_ids": ["…"] } ] }
  ],
  "body_hash": "…", "signature": "…"
}
```

`changed` lists only accounts whose verdict changed, capped at 500,
sorted `pass_to_breach` first. `rules_changed` lists only rules whose
status changed for that account, with the same `observed` and `trade_ids`
a real evaluation would report.

The response is signed so a firm can keep the preview it looked at before
deciding. It is not stored by the Gateway and not part of any ledger.

### Errors

- `400` when `rules` fails the same validation as `POST /programmes/{id}/versions`.
- `409` when the programme has no accounts.
- `429` more than 6 simulations per programme per hour.

## 4. Estimated rules

Daily loss and drawdown are estimated from closed trades in real
evaluations and marked as such; the simulation carries the same
`basis: estimated` through, and `summary` counts `estimated_fail` as
breach, as the real evaluator's verdict does. The console labels this.

## 5. Behaviour-change threshold and banned windows

`behaviourChangePct` does not affect a verdict; changes to it are ignored
by the simulation and the console says so. Banned windows are simulated
like any per-trade rule.

## 6. Prop Monitor side (for reference)

- In the "New rules version" form: a **Preview impact** button beside
  Save. Runs the simulation with the form's current values; shows the
  summary (before/after, moved counts), the per-rule table, and the
  changed accounts with links. Save stays available; the preview's
  `body_hash` is passed as `preview_hash` in the version's `note` metadata
  so the version records which preview was seen.
- `simulate(programmeId, rules, from?)` in the client; `POST
  /api/app/programmes/{id}/simulate` proxy.
