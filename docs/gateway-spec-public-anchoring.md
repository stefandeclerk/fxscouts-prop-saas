# Gateway spec — public anchoring of seals

Status: draft for the Gateway repo. Prop Monitor shows the result on the
Evidence tab and on a public verify page; it computes nothing itself.

## 1. Purpose

Today a seal proves a ledger has not changed *since the Gateway signed it*.
It does not prove *when* the Gateway signed it, and a party holding the
signing key could in principle re-sign a different history. Anchoring
fixes both: once a day the Gateway commits the set of all current seals to
a public, third-party timestamp that nobody — including FxScouts — can
move or backdate.

The anchor is OpenTimestamps (opentimestamps.org): free, no account, no
key; it aggregates hashes through public calendar servers and commits them
to the Bitcoin blockchain. A proof is a small `.ots` file that any
OpenTimestamps client can verify offline against a Bitcoin block header.

No third-party fees, no contract, no data leaves the Gateway except one
32-byte hash per day.

## 2. Definitions

- **Daily root**: a Merkle root over every seal hash produced since the
  previous anchor, across all customers. Only hashes go into it; nothing
  identifies a customer, account or trade.
- **Inclusion path**: the sibling hashes that lead from one seal hash to
  the daily root. Stored per seal so a single seal can be verified without
  the others.
- **Proof**: the `.ots` bytes returned by OpenTimestamps for the daily
  root. *Pending* on submission (calendar-attested only); *confirmed* once
  the calendar has committed it to a Bitcoin block, usually within a few
  hours and always within a day. The Gateway upgrades pending proofs by
  polling.

## 3. Jobs

### 3.1 `anchor_seals` — daily, 00:15 UTC

1. Select seals with `anchor_id is null`, ordered by `seal_hash`.
   If none, stop.
2. Build a Merkle tree over their `seal_hash` values (SHA-256, pairwise,
   odd leaf duplicated; standard). Record the root and each leaf's path.
3. Submit the root to OpenTimestamps via the `opentimestamps` npm package
   (`OpenTimestamps.stamp(detached)`), using at least two calendars
   (`https://a.pool.opentimestamps.org`, `https://b.pool.opentimestamps.org`).
4. Insert an `anchors` row with `status = 'pending'` and the serialized
   `.ots` proof. Set `anchor_id` and `anchor_path` on each included seal in
   the same transaction.
5. Publish the public list (§6).

If OpenTimestamps is unreachable, leave the seals unanchored; the next run
picks them up. Never anchor a seal twice.

### 3.2 `upgrade_anchors` — hourly

For each anchor with `status = 'pending'` older than one hour, call
`OpenTimestamps.upgrade(proof)`. When the upgraded proof contains a
Bitcoin attestation, store the upgraded proof, `block_height`,
`block_time` (from the attestation) and set `status = 'confirmed'`.
A proof still pending after 72 hours is flagged in operator admin.

### 3.3 Verification (server-side helper, used by §5)

`verifySealAnchor(seal_hash)`: recompute the root from the seal's stored
path and compare with the anchor's root; then verify the `.ots` proof
against the root using `OpenTimestamps.verify`. Bitcoin block headers are
checked against a public block-explorer API or a locally cached header
list — cache the result, since a confirmed proof never changes.

## 4. Data model

```sql
create table anchors (
  id            uuid primary key default gen_random_uuid(),
  anchored_at   timestamptz not null default now(),
  root          bytea not null unique,         -- 32 bytes
  leaves        int not null,
  status        text not null check (status in ('pending','confirmed')),
  proof         bytea not null,                -- .ots, latest version
  block_height  int,
  block_time    timestamptz,
  upgraded_at   timestamptz
);

alter table seals add column anchor_id uuid references anchors(id);
alter table seals add column anchor_path jsonb;   -- [{ "side": "left"|"right", "hash": "<hex>" }]
create index on seals (anchor_id);
```

Seals are never updated except to set these two columns once.

## 5. API

Public, no API key — the point is that anyone can check. Rate-limited by IP.

### 5.1 `GET /api/v1/anchors?limit=90`

```json
{ "anchors": [ { "id": "…", "anchored_at": "2026-09-21T00:15:02Z", "root": "<hex>", "leaves": 4812,
                 "status": "confirmed", "block_height": 913211, "block_time": "2026-09-21T03:41:10Z" } ] }
```

### 5.2 `GET /api/v1/anchors/{root}.ots`

The proof bytes, `content-type: application/octet-stream`. This is what an
independent verifier feeds to the OpenTimestamps client:
`ots verify --digest <root> <root>.ots`.

### 5.3 `GET /api/v1/seals/{seal_hash}/anchor`

```json
{ "seal_hash": "<hex>", "anchor": { …§5.1 row… }, "path": [ { "side": "right", "hash": "<hex>" }, … ],
  "verified": true }
```

`verified` is the Gateway's own recomputation (§3.3). 404 when the seal is
unknown; `"anchor": null` when it exists but is not yet anchored.

### 5.4 `POST /api/v1/verify` (existing)

Unchanged for `{ body_hash, signature }`. Add an optional `seal_hash`:
when present the response includes `anchor` as in §5.3.

### 5.5 `GET /accounts/{id}/seals` (existing, keyed)

Each seal gains:

```json
"anchor": { "root": "<hex>", "anchored_at": "…", "status": "confirmed", "block_height": 913211, "block_time": "…" } | null
```

### 5.6 Evidence pack

Add `anchors`: for every seal in the pack, its anchor row, inclusion path
and the `.ots` proof (base64). With this the pack verifies fully offline:
signature → seal chain → Merkle path → `.ots` → Bitcoin block.

## 6. Public list

After each anchor run, write `anchors.json` (the §5.1 body, last 365 days)
and each `.ots` file to a public bucket (Supabase storage, public folder)
so the list survives the Gateway being offline. `GET /api/v1/anchors`
serves the same content.

## 7. Operator admin

- Latest anchor: time, leaves, status, block height.
- Seals not yet anchored (should be < 1 day old).
- Anchors pending > 72 h.

## 8. What this does not do

- It does not put any customer, account or trade data on chain. Only a
  Merkle root over hashes.
- It does not replace the signature. The signature says *who*; the anchor
  says *when* and *that it was not re-signed later*.
- It does not make a seal instantly confirmed. A seal from the last few
  hours shows "anchored, awaiting Bitcoin confirmation".

## 9. Prop Monitor side (for reference)

- `Seal.anchor` in `lib/gateway/types.ts`; `verify()` and `sealAnchor()`
  in the client (public routes, no key).
- Evidence tab: "Anchored" column on the seals table with status and
  block height; explanatory paragraph.
- Public page `/verify`: paste a hash and signature, or drop an evidence
  pack; shows signature validity per record and anchor status per seal.
- Landing page: a line under "A record nobody can alter".
