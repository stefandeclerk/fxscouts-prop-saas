# Gateway spec — account correlation (lockstep / hedge detection)

Status: draft for the Gateway repo. Prop Monitor consumes the result; it
holds no trade data and does no computation of its own.

## 1. Purpose

Detect accounts belonging to one customer that are traded from a single
source: the same trades on many accounts (account farms, passing services,
"group passing"), or opposite trades on two accounts so that one is bound
to pass (challenge hedging). Identity, IP and device data are out of scope;
the only signal is trade timing, which the gateway already holds.

Version 1 compares accounts **within one customer**. Cross-customer
matching is a later version (§9) and changes nothing in the data model.

## 2. Definitions

- **Coincidence**: two trades on different accounts, same customer, same
  symbol (normalised, §4.1), whose `open_time_utc` fall in the same 5-second
  bucket. A **close coincidence** is the same on `close_time_utc`.
- **Pair**: an unordered pair of accounts `(a, b)`, `a < b`.
- **Window**: the trailing 30 days ending at the job run, on `close_time_utc`.
- **Kind** of a pair: `mirrored` when ≥ 80 % of coincident trades share
  `side`; `hedged` when ≥ 80 % have opposite `side`; otherwise `mixed`.

## 3. Scoring

For each pair with at least one coincidence in the window:

| Field | Definition |
|---|---|
| `trades_a`, `trades_b` | closed trades of each account in the window |
| `open_matches` | coincidences on open time |
| `close_matches` | coincidences on close time |
| `both_matches` | trades matched on open **and** close (same pair of trades) |
| `score` | `both_matches / min(trades_a, trades_b)` |
| `volume_similarity` | share of `both_matches` where `min(vol)/max(vol) ≥ 0.8` |

Flag when **all** hold:

- `both_matches ≥ 15`
- `score ≥ 0.6`
- `min(trades_a, trades_b) ≥ 20`

`both_matches` is used, not open matches alone, because news releases
produce coincident opens across unrelated traders but not coincident
closes.

Severity, for the payout check:

- `block`: flagged and `kind = hedged`
- `review`: flagged and `kind ∈ {mirrored, mixed}`
- `info`: not flagged but `score ≥ 0.3` and `both_matches ≥ 8` (shown, not
  acted on)

Thresholds are customer-configurable (§7) with these defaults.

## 4. Job

`correlate_accounts(customer_id)` runs nightly per customer (after the last
sync of the day) and on demand via the endpoint in §6.4.

### 4.1 Steps

1. Load all closed trades of the customer's accounts in `state ∈
   {connected, syncing, retrying}` with `close_time_utc` in the window.
   Accounts in `phase = null` (no programme) are included; the customer
   may have imported them for exactly this reason.
2. Normalise symbol: uppercase, strip broker suffixes/prefixes
   (`EURUSD.m`, `EURUSDmicro`, `#EURUSD` → `EURUSD`). Keep a mapping table
   for broker-specific names; unknown names are used as-is.
3. Bucket: `open_bucket = floor(epoch(open_time_utc) / 5)`,
   `close_bucket = floor(epoch(close_time_utc) / 5)`.
4. Self-join on `(customer_id, symbol, open_bucket)` and on
   `(customer_id, symbol, close_bucket)` across different accounts.
   Intersect to get `both_matches` per pair. Record matched trade-id pairs.
5. Compute §3 fields per pair; upsert into `account_correlations`.
6. For pairs that are newly flagged, or whose `kind` or severity changed
   since the previous run, emit the event in §6.5.
7. Write a signed **correlation record** for every account that appears in
   at least one flagged pair (§5.2) and include it in the account's next
   seal so it becomes part of the ledger.

### 4.2 Cost

Trades are already indexed by account. Add index
`(customer_id, symbol, open_bucket)` and `(customer_id, symbol,
close_bucket)` (generated columns). A customer with 10 000 accounts × 50
trades/month is 500 k rows; the bucket join is bounded by trades per bucket,
which is small except at news spikes. Run inside a single transaction per
customer; target < 60 s for the largest customer.

### 4.3 Groups

After pairs are scored, build connected components over flagged pairs
(union-find). A component with ≥ 3 accounts is a **group**; store it so the
console can say "one of 14 accounts trading together" rather than listing
13 pairs.

## 5. Data model

### 5.1 `account_correlations`

```sql
create table account_correlations (
  customer_id    uuid not null,
  account_a      uuid not null,
  account_b      uuid not null,
  window_from    timestamptz not null,
  window_to      timestamptz not null,
  trades_a       int not null,
  trades_b       int not null,
  open_matches   int not null,
  close_matches  int not null,
  both_matches   int not null,
  score          numeric(5,4) not null,
  volume_similarity numeric(5,4) not null,
  kind           text not null check (kind in ('mirrored','hedged','mixed')),
  severity       text not null check (severity in ('none','info','review','block')),
  group_id       uuid,
  matched_trades jsonb not null,  -- [{a: trade_id, b: trade_id}], capped at 500
  computed_at    timestamptz not null default now(),
  primary key (customer_id, account_a, account_b),
  check (account_a < account_b)
);
create index on account_correlations (customer_id, account_b);
create index on account_correlations (customer_id, group_id) where group_id is not null;
```

Rows are replaced on each run (one row per pair, latest window). History
lives in the signed correlation records, not here.

### 5.2 `correlation_records` (signed, per account)

Same pattern as `evaluations` and `payout_checks`: a JSON body, its
`body_hash`, and `signature` with `GATEWAY_SIGNING_KEY`.

```json
{
  "account_id": "…",
  "computed_at": "2026-09-20T02:14:09Z",
  "window": { "from": "…", "to": "…" },
  "trades": 61,
  "verdict": "flagged",
  "peers": [
    {
      "account_id": "…",
      "reference": "CH-20419",
      "kind": "hedged",
      "severity": "block",
      "score": 0.87,
      "both_matches": 53,
      "open_matches": 55,
      "close_matches": 54,
      "volume_similarity": 0.96,
      "trade_ids": ["…"]          // this account's trades that matched
    }
  ],
  "group": { "id": "…", "size": 14 } | null,
  "thresholds": { "bucket_seconds": 5, "min_matches": 15, "min_score": 0.6, "min_trades": 20 }
}
```

`peers[].reference` is the customer's own reference for the peer account —
it is the customer's data, so it may be shown. `trade_ids` lists only this
account's trades so the record fits the "flagged trades with a reason"
framing. The peer's trade ids are reachable through the peer's own record.

A record is written when an account's verdict or peer set changes; unchanged
accounts get no new record. Records are appended to the account's ledger
and covered by the next seal, and included in the evidence pack under
`correlations`.

### 5.3 `customer_settings` additions

```
correlation_bucket_seconds   int      default 5
correlation_min_matches      int      default 15
correlation_min_score        numeric  default 0.6
correlation_min_trades       int      default 20
correlation_enabled          bool     default true
```

## 6. API (`/api/v1`)

All routes are scoped to the caller's customer by API key, like the rest.

### 6.1 `GET /accounts/{id}/correlations`

Latest correlation record for the account, or `{ "record": null }`.

```json
{ "public_key": "…", "record": { …§5.2 body…, "body_hash": "…", "signature": "…" } }
```

### 6.2 `GET /accounts/{id}/correlations/history?limit=20`

Earlier records, newest first. For the evidence pack and disputes.

### 6.3 `GET /correlations/groups`

All current groups for the customer:

```json
{ "groups": [ { "id": "…", "size": 14, "kind": "mirrored", "severity": "review",
               "accounts": [ { "id": "…", "reference": "…", "name": "…", "phase": "funded" } ] } ] }
```

### 6.4 `POST /correlations/run`

Queues `correlate_accounts` for the customer now. Returns `{ "queued": true }`.
Rate-limit to one run per 10 minutes per customer.

### 6.5 Webhook event `correlation.flagged`

Emitted per account when it becomes flagged, or its severity rises, or a
new peer is added. Same envelope and signature as `behaviour.changed`.

```json
{
  "event": "correlation.flagged",
  "account_id": "…",
  "severity": "block",
  "kind": "hedged",
  "peers": 1,
  "group_id": null,
  "record_id": "…"
}
```

Also `correlation.cleared` when an account drops below every threshold
after having been flagged.

### 6.6 Payout check

`POST /accounts/{id}/payout-checks` reads the account's current correlation
record and adds one `PayoutFlag` per flagged peer:

```json
{ "check": "correlated_account", "severity": "block",
  "observed": "53 of 61 trades opened and closed within 5s of account CH-20419, opposite side",
  "threshold": "≥15 matches and ≥60% of trades",
  "tradeIds": ["…"] }
```

`verdict` becomes `flagged` as today when any flag is `review` or `block`.

### 6.7 Evidence pack

Add a `correlations` array (all records for the account, each with hash and
signature) and, in the summary, the current verdict.

## 7. Configuration

Customer thresholds (§5.3) are editable via `PATCH /settings` and shown in
Prop Monitor's settings page. Lowering `bucket_seconds` below 1 or
`min_matches` below 5 is rejected.

## 8. Validation before release

1. Take one pilot customer's accounts that they have *already* identified
   as farmed or hedged. Run the job; every known case must be flagged.
2. Run against a customer with no known abuse; inspect every `review`/
   `block` pair by hand. Target < 1 false flag per 1 000 accounts.
3. Replay a major news day (NFP) and confirm open-only coincidences do not
   produce flags.
4. Adjust defaults from the above and record them in this document.

## 9. Later versions (not in scope now)

- **Cross-customer**: hash `(symbol, side, bucket)` with a pool salt, join
  hashes across opted-in customers, report "an account at another
  participating firm" with no customer or login. Needs a contract clause
  and a `correlation_pool_opt_in` setting. The §5 tables are reused; peer
  becomes `{ external: true }` with no id or reference.
- **Delayed mirroring**: farms that add random delay. Compare symbol/side
  sequences within a 10-minute window instead of exact buckets.
- **Firm-declared legitimate groups**: let a customer mark a group as
  known copy-trading of a public signal, which downgrades it to `info`.

## 10. Prop Monitor side (for reference)

After the gateway ships:

- `lib/gateway/types.ts`: `CorrelationRecord`, `CorrelationPeer`,
  `CorrelationGroup`; `lib/gateway/client.ts`: `correlations(id)`,
  `correlationHistory(id)`, `correlationGroups()`, `runCorrelations()`.
- Account page: a "Linked accounts" panel listing peers with kind,
  severity, score and matches; matched trades appear in the Flagged trades
  tab with reason "Opened and closed within 5s of account CH-20419".
- Events feed: render `correlation.flagged` / `correlation.cleared`.
- Settings: the four thresholds.
- Overview: count of accounts currently flagged, and groups.
