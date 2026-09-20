# FxScouts Prop Monitor — product brief for positioning analysis

Purpose of this document: give an analyst everything needed to judge whether
Prop Monitor overlaps with, competes with, or cannibalises the FxScouts
Trading Journal. It describes what Prop Monitor is, who buys it, what it
does, what it deliberately does not do, and how it relates to the other two
FxScouts products. The question to answer is at the end.

---

## 1. The three FxScouts products

| Product | Customer | What they buy | Relationship |
|---|---|---|---|
| **FxScouts Trading Journal** | Individual retail traders | A place to log, review and improve their own trading: automatic import of trades, statistics, insights, behaviour analysis | Consumer product. Will connect accounts *through* the Gateway. |
| **FxScouts Gateway** | Software companies (B2B) | An API that reads MT4/MT5 accounts with read-only credentials and returns trades, statistics, costs and signed records as JSON | Platform. The Journal and Prop Monitor are both customers of it. |
| **FxScouts Prop Monitor** | Prop trading firms (B2B) | Independent monitoring of their challenge and funded accounts: rule evaluation, payout checks, a second opinion on breach decisions, and signed evidence for disputes | Built on the Gateway. This document. |

Prop Monitor and the Journal never touch each other. They share only the
Gateway underneath, in the same way two unrelated apps might share a payment
provider.

---

## 2. Who buys Prop Monitor

**The buyer is a prop trading firm** — a company that sells evaluation
challenges to retail traders and funds the ones who pass. Typical size:
hundreds to tens of thousands of accounts, a risk/compliance team of one to
ten people, a technology stack bought from vendors (trading platform, CRM,
risk engine).

Concretely, the person who signs is the firm's **head of risk, COO or
founder**. The daily users are **risk analysts and payout reviewers**.

**The buyer is never an individual trader.** A trader cannot sign up for
Prop Monitor, cannot connect their own account, and cannot see anything in
it unless the firm shows it to them (for example, an evidence pack in a
dispute).

---

## 3. The problem it solves

A prop firm decides whether a trader breached its rules and whether to pay
them. Every monitoring tool the firm uses today runs on the firm's own
server data. So in a dispute the firm is simultaneously the counterparty,
the price feed, the judge and the only record-keeper. Traders do not trust
that, and the disputes end up on Trustpilot, in Discord and, increasingly,
in front of adjudication bodies (The Financial Commission's prop-firm
certification, The Prop Association) that need evidence from someone who
isn't a party.

Firms also lose money and reputation from:

- **Wrongful breaches** — their engine miscalculates (daily reset time,
  balance vs equity, swaps, retroactive rule changes) and a trader is
  breached who shouldn't have been.
- **Missed abuse** — payouts approved to accounts that quick-struck,
  martingaled, or made all their profit in one day.
- **Behaviour change after funding** — traders who pass carefully and then
  gamble on the funded account.
- **Rule disputes** — "the rules changed after I passed" with no independent
  record of which rules applied when.

---

## 4. What Prop Monitor does

All of this is computed by the Gateway from closed trades read with the
investor (read-only) password. Prop Monitor is the firm's console on top.

1. **Bulk account connection** — the firm imports its own challenge and
   funded accounts (hundreds at a time). The trader is not involved.
2. **Programmes with versioned rules** — the firm writes down each
   programme's rules (profit target, daily loss and reset time, static or
   trailing drawdown, lot cap, minimum hold time, consistency limit,
   minimum trading days, weekend holds, restricted time windows). Every
   change is a new, dated, signed version. Per-trade rules are judged by
   the version in force when each trade closed, so a change today cannot
   touch yesterday's trades.
3. **Automatic evaluation after every sync** — pass or breach, per rule,
   with the trade IDs behind every failure. Signed by the Gateway.
4. **A second opinion on the firm's own decisions** — the firm records what
   its own engine concluded (breach, cleared, payout approved/denied). When
   Prop Monitor sees it differently, the disagreement is flagged and sent
   as an event, both ways: wrongful breaches and missed breaches.
5. **Payout checks** — a signed report before a payout: consistency (one
   day too much of the profit), quick-strike trades, position-size
   escalation after losses, trades in restricted windows, lot-cap breaches,
   single-trade dependence. Every flag names the trades.
6. **Behaviour-change alerts** — a funded account compared with the same
   trader's evaluation account: lot size, trades per day, hold time, win
   rate, quick-strike share. Fires when anything moves beyond the firm's
   threshold.
7. **A tamper-evident record** — after every sync the whole ledger is
   hashed, chained to the previous hash and signed. Anyone with the
   Gateway's public key can verify that a record handed over later is what
   was recorded at the time.
8. **Evidence packs** — one signed file per trader: full ledger, reconciled
   trades, every seal, every rule version, every evaluation, the firm's
   decisions, payout checks, alerts, the sync log, and a statement of
   whether the account was demo or live and that it was read with a
   read-only password. For traders in dispute, adjudicators, auditors and
   regulators.
9. **Events feed and webhooks** — breaches, disagreements and behaviour
   changes as signed webhooks into the firm's own systems, and a feed in
   the console.
10. **Operator admin** — every firm, its connection health, rejected
    deliveries, run rate.

### What it deliberately does not do

- It does not trade, cannot trade, and holds no execution access.
- It does not stream live prices or intraday equity. Daily loss and
  drawdown are measured on closed trades and marked "estimated"; they flag
  rather than breach. The firm's intraday engine stays authoritative for
  those; Prop Monitor is the second opinion.
- It does not see identity, IP addresses or devices. Account-sharing and
  multi-identity fraud stay with the firm's KYC.
- It has no trader-facing screens, no trader login, no trader onboarding.
- It offers no performance analytics *for the trader's benefit*: no
  insights, no coaching, no "how to improve", no equity curve for the
  trader to admire.

---

## 5. The USPs, as marketed

1. **Neutral by construction.** Read-only credentials only; no execution
   access; not the firm's server. The record is worth something in a
   dispute precisely because Prop Monitor cannot be the firm.
2. **Rules locked to every trade.** Versioned, signed rulebooks; a change
   cannot be applied retroactively by either side.
3. **A second opinion, not a replacement.** The firm keeps its engine;
   Prop Monitor runs beside it and reports disagreements first.
4. **Payout checks in seconds, with the trades behind every flag** — so the
   reviewer can show the trader what was seen instead of saying
   "suspicious activity".
5. **Evidence nobody can alter** — signed seals and evidence packs, publicly
   verifiable.

---

## 6. What the Journal is, as far as this document knows

From the Gateway's README and codebase (the Journal's own repository was
not read for this brief):

- A **self-hosted trading journal for individual traders**.
- Imports trades automatically from MT4/MT5 (the Gateway's runner was carved
  out of the Journal's "self-hosted sync" feature), from cTrader, and from
  CSV/HTML statement uploads.
- Reconciles deals into round-trip trades with pips, R-multiple, holding
  time and costs.
- Provides statistics (win rate, profit factor, drawdown, per-symbol) and an
  **"insight engine"** — behaviour analysis for the trader's own benefit.
- Has a "self-hosted" model where the trader runs the sync.
- Is expected to become a customer of the Gateway API "like anyone else".

Areas of apparent overlap to examine: both products (a) read MT4/MT5
accounts with investor passwords, (b) reconcile trades, (c) compute
statistics and behaviour metrics, and (d) can evaluate an account against
prop-firm rules — the Journal offers "evaluation against a firm's programme"
to the *trader* (am I on track to pass?), Prop Monitor offers it to the
*firm* (did this trader breach?).

---

## 7. The question for the analyst

Please assess, with reasons:

1. **Audience overlap.** Does anyone who would pay for the Journal also pay
   for Prop Monitor, or vice versa? (Our view: no — one is sold to traders,
   the other to firms — but check the edge cases, e.g. a trader who also
   runs a small prop firm, or a firm that gives traders a journal.)
2. **Feature overlap.** Which Journal features does Prop Monitor
   duplicate, and does the duplication matter given the different buyer?
   In particular: trade reconciliation, statistics, behaviour metrics, and
   rule evaluation.
3. **USP cannibalisation.** Does any Prop Monitor USP weaken a Journal USP?
   The one to look hardest at: the Journal's "check yourself against a prop
   firm's rules before you fail" versus Prop Monitor's "the firm checks
   you". If a trader's firm uses Prop Monitor, does the trader still need
   the Journal's rule check — or does it become *more* valuable (the trader
   wants to see what the firm will see)?
4. **Channel conflict.** Could Prop Monitor make prop firms hostile to the
   Journal (e.g. firms banning traders from connecting accounts to
   third-party journals because "the monitoring is our job now")? Note that
   most firms already forbid traders sharing investor passwords with third
   parties, which affects the Journal today regardless of Prop Monitor.
5. **Brand.** Is it a problem that a trader sees "FxScouts" both as the
   thing that helps them (Journal) and the thing that judges them (Prop
   Monitor)? Should Prop Monitor carry a more distant brand?
6. **Upside.** Is there a positive interaction — e.g. the Journal as the
   trader-side view of the same signed record ("see exactly what your firm
   sees"), sold through firms, or the Journal's rule check becoming a
   preview of a Prop Monitor evaluation?

Please give a verdict in one of three forms — *no cannibalisation*,
*manageable overlap with these mitigations*, or *real conflict, here is
what to change* — followed by the reasoning.
