# Demo: a prop firm on FxScouts Prop Monitor

Everything here is for showing the product with realistic data. The demo
world is loaded from **Admin → Firms → (a firm) → Load demo data**. It runs
through the real pipeline: every trade goes through the gateway's ingest,
every evaluation, seal, payout check and event is produced by the real code.
Loading takes about a minute and replaces the firm's programmes and traders.

## What the demo firm looks like

A firm running a **100k two-step** challenge and a **funded** programme.

**Three programmes**

| Programme | Key rules | Note |
|---|---|---|
| 100k two-step · phase 1 | 8% target, 5% daily loss, 10% static drawdown, no weekend holds, 60 s minimum hold, 40% consistency, settlement window 00:00–02:00 | Rules changed 10 days ago: lot cap lowered from 5 to 3 (version 2). Trades before that are still judged by version 1. |
| 100k two-step · phase 2 | Same, 5% target | |
| Funded · 100k | 5% daily loss, 10% trailing drawdown, weekend holds allowed, behaviour compared with the evaluation phase | |

**Fourteen traders**, each with a year of trades. What to open, and why:

| Trader | Phase | What happened | What to show |
|---|---|---|---|
| Marcus K. (T-1042) | Evaluation | Disciplined trader, passes every rule. Firm recorded *Cleared*. | A clean evaluation; firm and gateway agree. |
| Priya S. (T-1077) | Evaluation | Eight winning trades closed within seconds, and one day makes 47% of profit. | Breach: **minimum hold time** and **consistency**, with the trade IDs behind each. |
| Lena W. (T-1103) | Evaluation | Five positions at 6–8 lots. Firm recorded *Cleared*. | **Disagreement**: the firm cleared an account the gateway sees in breach. Events tab shows the `evaluation.disagreement`. |
| Jonas B. (T-1121) | Evaluation | Five trades opened inside the settlement window. Firm recorded *Breach*. | Breach on **restricted windows**; firm and gateway agree. |
| Aiko T. (T-1150) | Evaluation | Clean account. Firm recorded *Breach, daily loss*. | **Disagreement the other way**: the firm breached a trader the gateway passes. This is the wrongful-breach case. |
| Diego M. (T-1188) | Evaluation, phase 2 | Sizes up 1.7× after each loss, ending over the lot cap. | Lot-cap breach; the Payout check (if run) shows **position-size escalation**. |
| Sara N. (T-1201) | Evaluation, phase 2 | One day made 60% of the year's profit. | **Consistency** breach. |
| Omar H. (T-1230) | Evaluation, phase 2 | Clean. | Pass. |
| Elena V. (T-0917) | Evaluation + Funded | Clean in both phases. Firm approved a payout. | Payout check **clean**; the funded-vs-evaluation comparison shows no change. |
| Ben O. (T-0844) | Evaluation + Funded | Passed the evaluation as a tidy scalper, then traded the funded account very differently: 60 positions over the lot cap, positions held twice as long, win rate down from 49% to 34%. Firm denied the payout. | **Behaviour changed since evaluation** alert and event; payout check flags **lot size** and the phase change, with the funded-vs-evaluation table. |
| Chloe D. (T-0791) | Evaluation + Funded | Clean evaluation; on the funded account one day made 61% of profit. | Payout check flags **consistency** before any payout is approved. |

## Suggested walkthrough (10 minutes)

1. **Overview** — 14 traders, 3 programmes; breaches and disagreements at a glance; recent events on the right.
2. **Programmes** — expand *phase 1*: two versions, the note on why the lot cap changed, both signed by the gateway. Point out: trades before the change keep the old cap.
3. **Traders → Lena W.** — evaluation shows the lot-size breach with trade IDs; scroll to *Your decisions*: the firm's "Cleared" is marked **Disagrees**, with the reason.
4. **Traders → Aiko T.** — the opposite: gateway says pass, the firm's "Breach" is marked Disagrees. This is the wrongful breach a trader would dispute; here it is caught before the trader sees it.
5. **Traders → Ben O. (funded) → Payout check** — flagged; scroll to *Funded vs evaluation*: hold time up 92%, win rate down 30%, sizes over the cap. Then *Evidence* tab → Download: one signed file with everything.
6. **Events** — every breach, disagreement and behaviour change as the firm's own system would receive it (signed webhooks).
7. **Admin** (`/admin`) — the operator's view: every firm, connection health, rejected deliveries, run rate.

## Verifying a record

Any evaluation, payout check, seal or evidence pack can be verified against
the gateway's public key without an account:

```bash
curl -s http://localhost:3000/api/v1/public-key
curl -s -X POST http://localhost:3000/api/v1/verify -H 'content-type: application/json' \
  -d '{"body_hash":"<from the record>","signature":"<from the record>"}'
```

Change one character of the hash and it returns `"valid": false`.

## Files in this folder

- `traders-import.csv` — what a firm pastes into *Import traders* (the same columns the demo loader uses).
- `rulebooks.md` — how three real-world programme types map onto Prop Monitor rules.
