# FxScouts Prop Monitor

Independent monitoring for prop firms, built as a customer of FxScouts
Gateway. Firms write down their programme rules, import their challenge and
funded accounts, and get signed evaluations, payout checks, a second opinion
on their own breach decisions, and an evidence pack per trader.

This app never touches the gateway's database. Every account, rule,
evaluation and seal lives in the gateway and is read through its `/v1` API
with the firm's own API key. This app's database holds only who can sign
in, which gateway customer each firm is (and its key, encrypted), the events
the gateway has sent us, and reviewer notes.

## Running it

```bash
npm install
npm run dev
```

Needs `.env.local` with this app's Supabase project (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`), the gateway
(`GATEWAY_URL`, and `GATEWAY_INTERNAL_SECRET` = the gateway's `INTERNAL_SECRET`,
used once per firm to create its customer and key), and `APP_ENCRYPTION_KEY`
(64 hex, encrypts stored API keys; never change it once a firm is connected).
`.env.development` sets `AUTH_BYPASS=true` so local runs skip sign-in.

Apply `sql/001_app.sql` in the Supabase SQL editor once.

The gateway must be running with `sql/008_prop_firm.sql` applied and
`GATEWAY_SIGNING_KEY` set. In development the gateway accepts a webhook URL
on `http://localhost`, so events arrive locally; in production set `APP_URL`
to this app's public https origin before connecting a firm.

## Layout

| Folder | What |
|---|---|
| `app/(site)` | Landing page, sign in, sign up |
| `app/(app)/app` | The firm's console: overview, programmes, traders, trader detail, events, settings |
| `app/api/app` | This app's routes: thin proxies to the gateway plus notes, events and settings |
| `app/api/gateway/webhook` | Receiver for the gateway's signed events |
| `lib/gateway` | Typed gateway client and per-firm provisioning |
| `sql` | This app's own schema |

## A firm's first run

Settings → Connect to gateway (creates the customer, stores the key, registers
the webhook) → Programmes → New programme → Traders → Import.
