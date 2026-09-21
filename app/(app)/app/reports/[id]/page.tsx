import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Download } from "lucide-react";
import { Card, CardHeader, Note, PageHeader, Status } from "@/components/ui";
import { ctx } from "@/lib/data";
import { monthLabel, pct, shortDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const RULE: Record<string, string> = { maxDailyLoss: "Daily loss", maxDrawdown: "Drawdown", maxLot: "Lot size", minHoldSeconds: "Hold time", consistency: "Consistency", bannedWindows: "Restricted windows", minTradingDays: "Trading days", weekendHolds: "Weekend holds", maxTradesPerDay: "Trades per day", profitTarget: "Profit target" };
const CHECK: Record<string, string> = { consistency: "Consistency", quick_strike: "Quick strikes", lot_cap: "Lot cap", size_escalation: "Size escalation", banned_window: "Restricted windows", single_trade: "Single-trade dependence", correlated_account: "Linked accounts" };
const METRIC: Record<string, string> = { avgLots: "Lot size", tradesPerDay: "Trades per day", medianHoldSeconds: "Hold time", winRate: "Win rate", quickStrikeShare: "Quick-strike share" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await ctx();
  if (!c.gw) redirect("/app/settings");
  const r = await c.gw.report(id);
  if (!r) notFound();
  const n = (v: number) => v.toLocaleString("en-GB");
  const rows = (o: Record<string, number>, labels: Record<string, string>) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => [labels[k] ?? k, n(v)] as const);
  return (
    <>
      <div className="mb-2 flex items-center gap-1.5 text-[13px] text-muted"><Link href="/app/reports" className="hover:text-accent">Reports</Link><span>/</span><span>{monthLabel(r.period.from)}</span></div>
      <PageHeader title={monthLabel(r.period.from)} sub={<>{r.period.partial ? "Month so far, " : "Final, "}generated {shortDateTime(r.generated_at)} UTC · signed · <span className="mono">{r.body_hash.slice(0, 16)}…</span></>}>
        <a className="btn-primary" href={`/api/app/reports/${r.id}/download`} download><Download className="h-4 w-4" />Download signed report</a>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4 xl:grid-cols-8">
        {[["Accounts", n(r.accounts.at_end)], ["Read every day", pct(r.accounts.at_end ? r.coverage.accounts_read_every_day / r.accounts.at_end : 0)], ["Syncs", n(r.coverage.sync_jobs)], ["Evaluations", n(r.programmes.reduce((s, p) => s + p.evaluations, 0))], ["New breaches", n(r.programmes.reduce((s, p) => s + p.first_breaches_in_period, 0))], ["Payout checks", n(r.payout_checks.run)], ["Linked accounts", n(r.correlations.accounts_flagged_at_end)], ["Chain breaks", n(r.integrity.chain_breaks)]].map(([k, v]) => (
          <div key={k} className="bg-surface px-4 py-3"><small className="block text-xs text-muted">{k}</small><b className="text-[15px] font-semibold">{v}</b></div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section title="Accounts" rows={[["At start of period", n(r.accounts.at_start)], ["At end", n(r.accounts.at_end)], ["Connected in period", n(r.accounts.connected)], ["Disconnected", n(r.accounts.disconnected)], ["In evaluation / funded / no programme", `${n(r.accounts.by_phase_at_end.evaluation)} / ${n(r.accounts.by_phase_at_end.funded)} / ${n(r.accounts.by_phase_at_end.none)}`], ["Read with investor password", `${n(r.accounts.access.investor)} of ${n(r.accounts.at_end)}`], ["Live / demo servers", `${n(r.accounts.servers.live)} / ${n(r.accounts.servers.demo)}`]]} />
        <Section title="Coverage" rows={[["Sync jobs", `${n(r.coverage.sync_jobs)} · ${n(r.coverage.failed)} failed`], ["Accounts read every day", n(r.coverage.accounts_read_every_day)], ["Median time between reads", r.coverage.median_minutes_between_reads === null ? "–" : `${r.coverage.median_minutes_between_reads} min`], ["Deals ingested", n(r.coverage.deals_ingested)], ["Trades reconciled", n(r.coverage.trades_reconciled)]]} />
      </div>

      <Card className="mt-4">
        <CardHeader title="Programmes" />
        <div className="overflow-x-auto"><table className="w-full border-collapse">
          <thead><tr><th className="th">Programme</th><th className="th num">Accounts</th><th className="th num">Evaluations</th><th className="th">Latest verdicts</th><th className="th num">New breaches</th><th className="th hidden lg:table-cell">By rule</th><th className="th hidden md:table-cell">Versions published</th></tr></thead>
          <tbody>{r.programmes.map((p) => (
            <tr key={p.id}>
              <td className="td font-semibold">{p.name}</td>
              <td className="td num">{n(p.accounts_at_end)}</td>
              <td className="td num">{n(p.evaluations)}</td>
              <td className="td text-[13px]"><span className="text-good">{n(p.latest_verdict_at_end.pass)} pass</span> · <span className="text-bad">{n(p.latest_verdict_at_end.breach)} breach</span> · {n(p.latest_verdict_at_end.incomplete)} no trades</td>
              <td className="td num">{n(p.first_breaches_in_period)}{p.estimated_only_breaches > 0 && <span className="block text-xs text-muted">{p.estimated_only_breaches} on estimated rules only</span>}</td>
              <td className="td text-[13px] hidden lg:table-cell">{rows(p.breaches_by_rule, RULE).map(([k, v]) => `${k} ${v}`).join(", ") || "–"}</td>
              <td className="td text-[13px] hidden md:table-cell">{p.versions_published.length === 0 ? "None" : p.versions_published.map((v) => `v${v.version} from ${shortDateTime(v.effective_from)}`).join("; ")}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Section title="Payout checks" rows={[["Run", n(r.payout_checks.run)], ["Clean", n(r.payout_checks.clean)], ["Flagged", n(r.payout_checks.flagged)], ["Info / review / block", `${n(r.payout_checks.by_severity.info)} / ${n(r.payout_checks.by_severity.review)} / ${n(r.payout_checks.by_severity.block)}`], ...rows(r.payout_checks.flags_by_check, CHECK).map(([k, v]) => [`Flag: ${k}`, v] as const)]} />
        <Section title="Behaviour and linked accounts" rows={[["Behaviour-change alerts", n(r.behaviour.alerts)], ...rows(r.behaviour.by_metric, METRIC).map(([k, v]) => [`Alert: ${k}`, v] as const), ["Correlation runs", n(r.correlations.runs)], ["Accounts flagged at end", n(r.correlations.accounts_flagged_at_end)], ["Groups", n(r.correlations.groups_at_end)], ["Newly flagged / cleared", `${n(r.correlations.newly_flagged)} / ${n(r.correlations.cleared)}`]]} />
        <Section title="Ledger integrity" rows={[["Seals", n(r.integrity.seals)], ["Chain breaks", <Status key="cb" tone={r.integrity.chain_breaks === 0 ? "ok" : "bad"}>{n(r.integrity.chain_breaks)}</Status>], ["Public anchors", n(r.integrity.anchors)], ["Seals anchored", `${n(r.integrity.anchored_seals)} of ${n(r.integrity.seals)}`], ["Confirmed in Bitcoin", n(r.integrity.confirmed_seals)], ["Events delivered", `${n(r.events.delivered)} · ${n(r.events.failed)} failed`]]} />
      </div>
      <div className="mt-4"><Note>Every figure is a count from the gateway&apos;s own records: accounts, syncs, evaluations, payout checks, alerts and seals. Decisions you record and notes you write are not included, so the report reads the same for every firm. Verify it at <Link href="/verify" className="text-accent">/verify</Link> with the hash and signature in the file.</Note></div>
    </>
  );
}

function Section({ title, rows }: { title: string; rows: readonly (readonly [string, React.ReactNode])[] }) {
  return (
    <Card>
      <CardHeader title={title} />
      <dl className="px-5 py-2 text-[13.5px]">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-line py-2 last:border-b-0"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl>
    </Card>
  );
}
