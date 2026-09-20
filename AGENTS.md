<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# FxScouts Prop Monitor — product boundary

Prop Monitor is sold to prop firms. The individual trader is never a user of
it. This is a deliberate product boundary, not a missing feature: FxScouts
sells a separate product to traders (the FxScouts Trading Journal), and Prop
Monitor must not grow into a cut-down version of it.

Prop Monitor must not have:

- A trader login, trader signup, trader onboarding, or any way for a trader
  to connect their own account.
- Any page, link, email or embeddable widget that a firm can hand to a
  trader to view their own account inside Prop Monitor. That includes
  "share this dashboard with the trader", read-only trader links, and
  public account pages.
- Performance analytics for the trader's benefit: equity curves for the
  trader to look at, win-rate breakdowns, "how you're doing", "how to
  improve", tips, coaching, insights, streaks, or anything motivational.
- Notifications sent to the trader ("you're close to your daily loss
  limit", "you passed").

What the trader legitimately receives is the evidence pack: a signed file
the firm exports and hands over in a dispute. That is a document, not a
screen. It is produced by the firm, from the firm's console, on the firm's
decision. Prop Monitor never sends it to the trader itself.

If a firm asks for "something for our traders", the answer is not a Prop
Monitor screen. That is the Journal's job. The firm can give traders the
Journal; Prop Monitor stays firm-only.

Rule of thumb for any feature request: who is looking at this, and whose
interests does it serve? If the viewer is a risk analyst, payout reviewer,
compliance person or adjudicator, and the purpose is judging the account,
it belongs in Prop Monitor. If the viewer is the trader, or the purpose is
helping the trader trade better, it does not.

Figures that appear in the console (win rate, hold time, lot size, trades)
are there for the reviewer's judgement — in payout checks, behaviour
comparisons and evaluations — and must stay framed that way. There is no
general trade list: the "Flagged trades" tab shows only trades a rule or a
payout check named, with the reason. Keep it that way.

# Git

Never commit, push, stash, reset or change branches. Leave all work as
uncommitted changes; the owner commits.
