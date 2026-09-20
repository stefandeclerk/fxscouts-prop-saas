import Link from "next/link";
import { ArrowRight } from "lucide-react";
import NotConnected from "@/components/NotConnected";
import { Card, CardHeader, PageHeader, Status } from "@/components/ui";
import { ctx, overview } from "@/lib/data";
import { ago, money, phaseLabel, stateLabel } from "@/lib/format";

const GROUP_TONE = { block: "bad", review: "warn", info: "pend", none: "ok" } as const;
const GROUP_KIND: Record<string, string> = { mirrored: "Mirrored", hedged: "Hedged", mixed: "Mixed" };

export const dynamic = "force-dynamic";

// The firm's overview answers three questions in order: what do I have to
// decide, who is about to become a problem, and is every account being read.
// Aggregate counts come last; they are context, not the point.
export default async function OverviewPage() {
  const c = await ctx();
  const o = await overview(c);
  if (!o) return <><PageHeader title="Overview" /><NotConnected /></>;
  const now = new Date().toISOString();
  const { totals: t, coverage, unseen } = o;
  const unseenTotal = unseen.breaches + unseen.disagreements + unseen.behaviour + unseen.correlation + unseen.connection;
  const disagreements = o.queue.filter((q) => q.kind === "disagreement");
  const breaches = o.queue.filter((q) => q.kind === "breach");

  return (
    <>
      <PageHeader
        title="Overview"
        sub={t.accounts === 0 ? "No traders connected yet." : <>{t.accounts} traders · {t.evaluation} in evaluation, {t.funded} funded · last read from the gateway {ago(coverage.lastSyncAt, now)}</>}
      >
        <Link href="/app/accounts?import=1" className="btn-primary">Import traders</Link>
      </PageHeader>

      {unseenTotal > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/6 px-5 py-3 text-[14px]">
          <div>
            <span className="font-semibold">Since you last looked:</span>{" "}
            {[
              [unseen.disagreements, "disagreement"], [unseen.breaches, "new breach", "new breaches"], [unseen.behaviour, "behaviour change"], [unseen.correlation, "newly linked account"], [unseen.connection, "connection problem"],
            ].filter(([n]) => (n as number) > 0).map(([n, one, many]) => `${n} ${(n as number) === 1 ? one : (many ?? `${one}s`)}`).join(", ")}.
          </div>
          <Link href="/app/events" className="btn btn-sm">See events</Link>
        </div>
      )}

      <Card className="mb-4">
        <CardHeader title="Needs your decision" tip="Disagreements are where a decision you recorded differs from the referee's signed evaluation of the same account. Breaches are traders whose latest evaluation failed a verified rule and are waiting for you to confirm or clear.">
          <span className="text-[13px] text-muted">{o.queue.length === 0 ? "Nothing outstanding" : `${disagreements.length} ${disagreements.length === 1 ? "disagreement" : "disagreements"} · ${breaches.length} ${breaches.length === 1 ? "breach" : "breaches"}`}</span>
        </CardHeader>
        {o.queue.length === 0 ? <Empty>Every evaluated trader either passes or has a decision recorded that the referee agrees with.</Empty> : (
          <div className="overflow-x-auto"><table className="w-full border-collapse">
            <thead><tr><th className="th">Trader</th><th className="th">What</th><th className="th hidden md:table-cell">Detail</th><th className="th">When</th><th className="th" /></tr></thead>
            <tbody>
              {o.queue.map((q) => (
                <tr key={`${q.kind}:${q.accountId}`} className={q.seen ? "" : "bg-accent/4"}>
                  <td className="td">
                    <Link href={`/app/accounts/${q.accountId}`} className="whitespace-nowrap font-semibold hover:text-accent">{q.reference}</Link>
                    <span className="block text-xs text-muted">{[q.programme, phaseLabel(q.phase)].filter(Boolean).join(" · ")}</span>
                  </td>
                  <td className="td"><Status tone={q.kind === "disagreement" ? "warn" : "bad"}>{q.kind === "disagreement" ? "Disagreement" : "Breach"}</Status></td>
                  <td className="td hidden max-w-[420px] md:table-cell"><span className="block truncate text-[13px]">{q.summary}</span></td>
                  <td className="td whitespace-nowrap text-[13px] text-muted">{ago(q.at, now)}{!q.seen && <span className="ml-2 rounded-full bg-accent/15 px-1.5 py-0.5 text-[11px] font-semibold text-accent-deep">New</span>}</td>
                  <td className="td text-right"><Link href={`/app/accounts/${q.accountId}`} className="btn btn-sm">Review<ArrowRight className="h-3.5 w-3.5" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Card>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Close to a limit" tip="Traders who have used at least half of their programme's maximum drawdown, from starting balance to current equity at the last sync. Measured against the static limit; a trailing limit is tighter than shown. Traders already in breach are listed above instead." />
          {o.watch.length === 0 ? <Empty>No trader has used more than half of their drawdown allowance.</Empty> : (
            <table className="w-full border-collapse">
              <thead><tr><th className="th">Trader</th><th className="th">Drawdown used</th><th className="th num hidden sm:table-cell">Equity</th></tr></thead>
              <tbody>
                {o.watch.map((w) => {
                  const share = Math.min(1, w.drawdownPct / w.drawdownLimit);
                  const over = w.drawdownPct >= w.drawdownLimit;
                  return (
                    <tr key={w.accountId}>
                      <td className="td">
                        <Link href={`/app/accounts/${w.accountId}`} className="whitespace-nowrap font-semibold hover:text-accent">{w.reference}</Link>
                        <span className="block text-xs text-muted">{w.programme} · {phaseLabel(w.phase)}</span>
                      </td>
                      <td className="td w-[45%]">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg"><div className={`h-full rounded-full ${share >= 0.8 ? "bg-bad" : "bg-warn"}`} style={{ width: `${share * 100}%` }} /></div>
                          <span className="whitespace-nowrap text-[13px] tabular-nums"><b className={`font-semibold ${share >= 0.8 ? "text-bad" : ""}`}>{w.drawdownPct.toFixed(1)}%</b> <span className="text-muted">of {w.drawdownLimit}%</span></span>
                        </div>
                        {over && <span className="mt-1 block text-xs text-bad">Past the limit on equity; awaiting the next evaluation</span>}
                      </td>
                      <td className="td num hidden text-[13px] sm:table-cell">{money(w.equity, w.currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <CardHeader title="Not being read" tip="Accounts the gateway cannot currently evaluate. Reconnect required means the investor password or server changed; retrying means the last sync failed and will be tried again; pending means the first sync has not happened yet.">
            <span className="text-[13px] text-muted">{coverage.readLastHour} of {t.accounts} read in the last hour</span>
          </CardHeader>
          {o.unread.length === 0 ? <Empty>Every account was read recently. Nothing to fix.</Empty> : (
            <table className="w-full table-fixed border-collapse">
              <colgroup><col className="w-[22%]" /><col /><col className="w-[88px]" /><col className="w-[112px]" /></colgroup>
              <thead><tr><th className="th">Trader</th><th className="th">Problem</th><th className="th">Last read</th><th className="th" /></tr></thead>
              <tbody>
                {o.unread.map((u) => (
                  <tr key={u.accountId}>
                    <td className="td"><Link href={`/app/accounts/${u.accountId}`} className="block truncate font-semibold hover:text-accent">{u.reference}</Link></td>
                    <td className="td">
                      <Status tone={u.state === "reconnect_required" ? "bad" : u.state === "retrying" ? "warn" : "pend"}>{stateLabel(u.state)}</Status>
                      {u.error && <span className="block truncate text-xs text-muted" title={u.error}>{u.error}</span>}
                    </td>
                    <td className="td whitespace-nowrap text-[13px] text-muted">{ago(u.since, now)}</td>
                    <td className="td text-right"><Link href={`/app/accounts/${u.accountId}`} className="btn btn-sm">{u.state === "reconnect_required" ? "Reconnect" : "Open"}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {o.groups.length > 0 && (
        <Card className="mb-4">
          <CardHeader title="Trading together" tip="Sets of your accounts whose trades open and close on the same symbol within seconds of each other, often enough that one source is the likeliest explanation. Hedged means opposite sides (one is bound to pass); mirrored means the same side (one signal over many accounts). The gateway judges this from trade timing only and signs the result. Open any account in the set for the matched trades.">
            <span className="text-[13px] text-muted">{o.groups.length} {o.groups.length === 1 ? "set" : "sets"} · {o.groups.reduce((n, g) => n + g.size, 0)} accounts</span>
          </CardHeader>
          <div className="overflow-x-auto"><table className="w-full border-collapse">
            <thead><tr><th className="th">Severity</th><th className="th">Pattern</th><th className="th num">Accounts</th><th className="th">Who</th></tr></thead>
            <tbody>
              {o.groups.map((g) => (
                <tr key={g.id}>
                  <td className="td"><Status tone={GROUP_TONE[g.severity]}>{g.severity === "block" ? "Block" : g.severity === "review" ? "Review" : "Info"}</Status></td>
                  <td className="td">{GROUP_KIND[g.kind] ?? g.kind}</td>
                  <td className="td num">{g.size}</td>
                  <td className="td text-[13px]">{g.accounts.map((a, i) => <span key={a.id}>{i > 0 && ", "}<Link href={`/app/accounts/${a.id}`} className="font-semibold hover:text-accent">{a.reference || a.name}</Link>{a.phase && <span className="text-muted"> ({phaseLabel(a.phase).toLowerCase()})</span>}</span>)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Card>
      )}

      <Card>
        <CardHeader title="Programmes" tip="Each programme is a versioned rulebook. Counts are the traders assigned to it, split by phase, and how many of them are in breach or have a disagreement outstanding."><Link href="/app/programmes" className="btn btn-sm">Manage</Link></CardHeader>
        {o.programmes.length === 0 ? <Empty>No programmes yet. <Link href="/app/programmes" className="text-accent">Create one</Link> to start evaluating traders.</Empty> : (
          <div className="overflow-x-auto"><table className="w-full border-collapse">
            <thead><tr><th className="th">Programme</th><th className="th num">Evaluation</th><th className="th num">Funded</th><th className="th num">In breach</th><th className="th num">Disagreements</th><th className="th num hidden md:table-cell">Not read</th></tr></thead>
            <tbody>
              {o.programmes.map((p) => (
                <tr key={p.programme.id} className="hover:bg-bg">
                  <td className="td"><Link href={`/app/accounts?programme=${p.programme.id}`} className="font-semibold hover:text-accent">{p.programme.name}</Link><span className="ml-2 text-xs text-muted">rules v{p.programme.current?.version ?? 0}</span></td>
                  <td className="td num">{p.byPhase.evaluation}</td>
                  <td className="td num">{p.byPhase.funded}</td>
                  <td className="td num">{p.breached.size ? <b className="font-semibold text-bad">{p.breached.size}</b> : <span className="text-muted">0</span>}</td>
                  <td className="td num">{p.disagreements ? <b className="font-semibold text-warn">{p.disagreements}</b> : <span className="text-muted">0</span>}</td>
                  <td className="td num hidden md:table-cell">{p.attention ? <b className="font-semibold text-bad">{p.attention}</b> : <span className="text-muted">0</span>}</td>
                </tr>
              ))}
              {o.unassigned.length > 0 && <tr><td className="td text-[13px] text-muted" colSpan={6}><Link href="/app/accounts?programme=none" className="hover:text-accent">{o.unassigned.length} {o.unassigned.length === 1 ? "trader is" : "traders are"} not on any programme and not being evaluated</Link></td></tr>}
            </tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-8 text-center text-[13.5px] text-muted">{children}</div>;
}
