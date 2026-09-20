import Link from "next/link";
import { Card, CardHeader, PageHeader, Stat, Status, Tip } from "@/components/ui";
import { adminOverview } from "@/lib/admin/data";
import { ago } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const o = await adminOverview();
  const now = new Date().toISOString();
  const attention = o.firms.filter((f) => !f.connected || f.accounts === null || !f.webhookRegistered || f.rejections24h > 0);
  return (
    <>
      <PageHeader title="Health" sub="Every firm on Prop Monitor and whether its link to the gateway is working." />
      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-6">
        <Stat label="Firms" value={o.totals.firms} detail={`${o.totals.connected} connected to the gateway`} tip="Every firm with an account on Prop Monitor. Connected means it has a gateway customer and API key; the rest have signed up but not finished setup." />
        <Stat label="Monitored accounts" value={o.totals.accounts} detail="Across all firms" tip="Trader accounts imported into the gateway by every connected firm. This is the billable number." />
        <Stat label="In breach" value={<span className={o.totals.breached ? "text-bad" : ""}>{o.totals.breached}</span>} tip="Accounts across all firms whose latest evaluation failed a verified rule. A high number is normal for busy challenge programmes." />
        <Stat label="Events, 24 h" value={o.totals.events24} tip="Signed events the gateway delivered to this app in the last 24 hours, all firms. A sudden drop usually means syncs have stopped on the gateway." />
        <Stat label="Gateway unreachable" value={<span className={o.totals.unreachable ? "text-bad" : ""}>{o.totals.unreachable}</span>} detail="Connected firms whose API calls fail" tip="Firms whose stored API key no longer works against the gateway, or the gateway is down. Their console shows stale data until this is fixed." />
        <Stat label="Rejected deliveries, 24 h" value={<span className={o.totals.rejections24 ? "text-bad" : ""}>{o.totals.rejections24}</span>} detail="Bad signature or unknown firm" tip="Webhook deliveries this app refused in the last 24 hours. Bad signature means the gateway signing key does not match; unknown firm means the customer id is not registered here." />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <Card>
          <CardHeader title="Firms needing attention" tip="Firms that are not connected, whose gateway calls fail, that have no webhook registered, or that had deliveries rejected today. Fix these first; nothing reaches their console otherwise."><Link href="/admin/firms" className="btn btn-sm">All firms</Link></CardHeader>
          {attention.length === 0 ? <div className="px-5 py-10 text-center text-muted">Every firm is connected and receiving events.</div> : (
            <div className="overflow-x-auto"><table className="w-full border-collapse">
              <thead><tr><th className="th">Firm</th><th className="th"><span className="inline-flex items-center gap-1">Problem<Tip text="The first thing wrong, in setup order: not connected, then failing API calls, then missing webhook, then rejected deliveries." /></span></th><th className="th"><span className="inline-flex items-center gap-1">Last event<Tip text="When this app last received an event for the firm. Never means no sync has completed since connection." /></span></th></tr></thead>
              <tbody>{attention.map((f) => (
                <tr key={f.id}>
                  <td className="td"><Link href={`/admin/firms/${f.id}`} className="font-semibold hover:text-accent">{f.name}</Link></td>
                  <td className="td">
                    {!f.connected ? <Status tone="pend">Not connected to the gateway</Status>
                      : f.accounts === null ? <Status tone="bad">Gateway calls failing</Status>
                      : !f.webhookRegistered ? <Status tone="warn">No webhook registered</Status>
                      : <Status tone="bad">{f.rejections24h} rejected deliveries today</Status>}
                  </td>
                  <td className="td">{ago(f.lastEventAt, now)}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </Card>
        <Card>
          <CardHeader title="Rejected deliveries" tip="The most recent webhook calls this app turned away, newest first. The short id links to the firm when the payload named one." />
          {o.recentRejections.length === 0 ? <div className="px-5 py-10 text-center text-muted">None.</div> : (
            <ul>{o.recentRejections.map((r, i) => <li key={i} className="flex gap-3 border-b border-line px-5 py-3 text-[13px] last:border-b-0"><span className="min-w-[64px] text-muted">{ago(r.at, now)}</span><span>{r.reason === "bad_signature" ? "Bad signature" : "Unknown firm"}{r.firmId ? <> · <Link href={`/admin/firms/${r.firmId}`} className="mono hover:text-accent">{r.firmId.slice(0, 8)}…</Link></> : ""}</span></li>)}</ul>
          )}
        </Card>
      </div>
    </>
  );
}
