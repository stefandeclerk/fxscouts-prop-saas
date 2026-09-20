import Link from "next/link";
import NotConnected from "@/components/NotConnected";
import { Card, CardHeader, PageHeader, Stat, Status, Tip } from "@/components/ui";
import { ctx, overview } from "@/lib/data";
import { ago } from "@/lib/format";

export const dynamic = "force-dynamic";

const EVENT_LABEL: Record<string, string> = {
  "evaluation.breach": "Breach", "evaluation.disagreement": "Disagreement", "behaviour.changed": "Behaviour changed",
  "account.reconnect_required": "Reconnect required", "sync.failed": "Sync failed", "sync.completed": "Synced", "account.connected": "Connected", "account.disconnected": "Disconnected",
};
const EVENT_TONE: Record<string, "ok" | "warn" | "bad" | "pend" | "run"> = { "evaluation.breach": "bad", "evaluation.disagreement": "warn", "behaviour.changed": "warn", "account.reconnect_required": "bad", "sync.failed": "warn", "sync.completed": "ok", "account.connected": "ok", "account.disconnected": "pend" };

export default async function OverviewPage() {
  const c = await ctx();
  const o = await overview(c);
  if (!o) return <><PageHeader title="Overview" /><NotConnected /></>;
  const now = new Date().toISOString();
  return (
    <>
      <PageHeader title="Overview" sub={o.totals.accounts === 0 ? "No traders connected yet." : `${o.totals.accounts} traders across ${o.programmes.length} ${o.programmes.length === 1 ? "programme" : "programmes"}`}>
        <Link href="/app/accounts?import=1" className="btn-primary">Import traders</Link>
      </PageHeader>
      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Traders" value={o.totals.accounts} tip="Every account imported into the gateway for your firm, evaluation and funded, whatever its connection state." />
        <Stat label="In breach" value={<span className={o.totals.breached ? "text-bad" : ""}>{o.totals.breached}</span>} detail="From breach events received" tip="Traders whose latest signed evaluation found at least one verified rule failure. Estimated failures flag but do not count here." />
        <Stat label="Disagreements" value={<span className={o.totals.disagreements ? "text-warn" : ""}>{o.totals.disagreements}</span>} detail="Your decision vs the gateway's" tip="Traders where a decision you recorded (breach, clear, payout) differs from the gateway's evaluation of the same account. Review these before the trader hears about them." />
        <Stat label="Need attention" value={<span className={o.totals.attention ? "text-bad" : ""}>{o.totals.attention}</span>} detail="Reconnect required or retrying" tip="Accounts the gateway cannot currently read: the password changed, the server rejected the login, or a sync is being retried. Nothing is evaluated until they reconnect." />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <Card>
          <CardHeader title="Programmes" tip="Each programme is a versioned rulebook. Counts are the traders assigned to it, split by phase, and how many of them currently need a look."><Link href="/app/programmes" className="btn btn-sm">Manage</Link></CardHeader>
          {o.programmes.length === 0 ? <div className="px-5 py-10 text-center text-muted">No programmes yet. <Link href="/app/programmes" className="text-accent">Create one</Link> to start evaluating traders.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead><tr><th className="th">Programme</th><th className="th text-center"><span className="inline-flex items-center gap-1">Evaluation<Tip text="Traders in a challenge or verification phase." /></span></th><th className="th text-center hidden md:table-cell"><span className="inline-flex items-center gap-1">Funded<Tip text="Traders on a live, payout-eligible account." /></span></th><th className="th text-center"><span className="inline-flex items-center gap-1">In breach<Tip text="Traders on this programme whose latest evaluation failed a verified rule." /></span></th><th className="th text-center hidden md:table-cell"><span className="inline-flex items-center gap-1">Disagreements<Tip text="Your recorded decisions the gateway does not agree with." /></span></th><th className="th text-center hidden lg:table-cell"><span className="inline-flex items-center gap-1">Attention<Tip text="Accounts that need reconnecting or are retrying a failed sync." /></span></th></tr></thead>
                <tbody>
                  {o.programmes.map((p) => (
                    <tr key={p.programme.id} className="hover:bg-bg">
                      <td className="td md:whitespace-nowrap"><Link href={`/app/accounts?programme=${p.programme.id}`} className="font-semibold hover:text-accent">{p.programme.name}</Link><span className="block text-xs text-muted">Rules v{p.programme.current?.version ?? 0}{p.byPhase.none ? ` · ${p.byPhase.none} without phase` : ""}</span></td>
                      <td className="td text-center tabular-nums">{p.byPhase.evaluation}</td>
                      <td className="td text-center tabular-nums hidden md:table-cell">{p.byPhase.funded}</td>
                      <td className="td text-center tabular-nums">{p.breached.size ? <span className="font-semibold text-bad">{p.breached.size}</span> : "0"}</td>
                      <td className="td text-center tabular-nums hidden md:table-cell">{p.disagreements ? <span className="font-semibold text-warn">{p.disagreements}</span> : "0"}</td>
                      <td className="td text-center tabular-nums hidden lg:table-cell">{p.attention ? <span className="font-semibold text-bad">{p.attention}</span> : "0"}</td>
                    </tr>
                  ))}
                  {o.unassigned.length > 0 && <tr><td className="td text-muted" colSpan={6}><Link href="/app/accounts?programme=none" className="hover:text-accent">{o.unassigned.length} {o.unassigned.length === 1 ? "trader is" : "traders are"} not on any programme</Link></td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Recent events" tip="The last events the gateway pushed to your firm: breaches, disagreements, behaviour changes and connection problems. Each one is signed and kept."><Link href="/app/events" className="btn btn-sm">All</Link></CardHeader>
          {o.recent.length === 0 ? <div className="px-5 py-10 text-center text-muted">Nothing received from the gateway yet.</div> : (
            <ul>
              {o.recent.map((e) => (
                <li key={e.id} className="flex items-start gap-3 border-b border-line px-5 py-3 last:border-b-0">
                  <span className="min-w-[64px] pt-0.5 text-xs text-muted">{ago(e.receivedAt, now)}</span>
                  <span className="min-w-0">
                    <Status tone={EVENT_TONE[e.event] ?? "pend"}>{EVENT_LABEL[e.event] ?? e.event}</Status>
                    {e.accountId && <Link href={`/app/accounts/${e.accountId}`} className="block truncate text-xs text-muted hover:text-accent">{String((e.payload.data as Record<string, unknown> | undefined)?.reference ?? e.accountId)}</Link>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
