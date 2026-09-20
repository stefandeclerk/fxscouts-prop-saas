# Example rulebooks

How common programme types map onto Prop Monitor rules. Each is one
programme; a rules change is a new version, never an edit.

## Two-step challenge, phase 1 (typical)

| Rule | Value | Prop Monitor field |
|---|---|---|
| Profit target | 8% | `profitTargetPct: 8` |
| Maximum daily loss | 5%, day resets 00:00 server time | `maxDailyLossPct: 5`, `dailyResetUtc: "00:00"` |
| Maximum overall loss | 10% of starting balance | `maxDrawdownPct: 10`, `drawdownType: "static"` |
| Minimum trading days | 4 | `minTradingDays: 4` |
| Weekend holding | not allowed | `weekendHolds: false` |
| Consistency | no single day over 40% of total profit | `consistencyPct: 40` |
| Maximum position | 5 lots | `maxLot: 5` |
| Quick trades | positions held under 60 s not counted | `minHoldSeconds: 60` |
| Settlement window | no trades 00:00–02:00 UTC | `bannedWindows: [{ label: "Settlement", fromUtc: "00:00", toUtc: "02:00" }]` |

## One-step evaluation with trailing drawdown

| Rule | Value | Field |
|---|---|---|
| Profit target | 10% | `profitTargetPct: 10` |
| Trailing drawdown | 6% from the highest equity | `maxDrawdownPct: 6`, `drawdownType: "trailing"` |
| Daily loss | 3%, resets 17:00 New York (21:00 UTC in summer) | `maxDailyLossPct: 3`, `dailyResetUtc: "21:00"` |
| News trading | no trades 2 minutes either side of high-impact news | one `bannedWindows` entry per scheduled release, e.g. NFP `{ label: "NFP", fromUtc: "12:28", toUtc: "12:32", days: [5] }` |
| Max trades per day | 30 | `maxTradesPerDay: 30` |

## Funded account

| Rule | Value | Field |
|---|---|---|
| Daily loss | 5% | `maxDailyLossPct: 5` |
| Trailing drawdown | 10% | `maxDrawdownPct: 10`, `drawdownType: "trailing"` |
| Weekend holding | allowed | `weekendHolds: true` |
| Consistency for payouts | best day under 40% of profit | `consistencyPct: 40` |
| Behaviour change alert | any metric moved more than 50% vs the evaluation phase | `behaviourChangePct: 50` |

## What the gateway can and cannot measure

Everything measured on closed trades is exact ("verified"): lot size, hold
time, restricted windows, weekend holds, consistency, trading days, target on
closed profit. Daily loss and drawdown are measured on closed trades and
marked "estimated", because a scheduled read does not see intraday floating
P&L. An estimated fail is flagged, not treated as a breach: that is exactly
the case where the firm's intraday engine and the gateway should be compared,
which the *decisions* feature does.
