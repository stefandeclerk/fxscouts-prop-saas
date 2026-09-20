import Link from "next/link";
import { Card, CardHeader, PageHeader, Stat, Status } from "@/components/ui";
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
        <Stat label="Firms" value={o.totals.firms} detail={`${o.totals.connected} connected to the gateway`} />
        <Stat label="Monitored accounts" value={o.totals.accounts} detail="Across all firms" />
        <Stat label="In breach" value={<span className={o.totals.breached ? "text-bad" : ""}>{o.totals.breached}</span>} />
        <Stat label="Events, 24 h" value={o.totals.events24} />
        <Stat label="Gateway unreachable" value={<span className={o.totals.unreachable ? "text-bad" : ""}>{o.totals.unreachable}</span>} detail="Connected firms whose API calls fail" />
        <Stat label="Rejected deliveries, 24 h" value={<span className={o.totals.rejections24 ? "text-bad" : ""}>{o.totals.rejections24}</span>} detail="Bad signature or unknown firm" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <Card>
          <CardHeader title="Firms needing attention"><Link href="/admin/firms" className="btn btn-sm">All firms</Link></CardHeader>
          {attention.length === 0 ? <div className="px-5 py-10 text-center text-muted">Every firm is connected and receiving events.</div> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse">
              <thead><tr><th className="th">Firm</th><th className="th">Problem</th><th className="th">Last event</th></tr></thead>
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
          <CardHeader title="Rejected deliveries" />
          {o.recentRejections.length === 0 ? <div className="px-5 py-10 text-center text-muted">None.</div> : (
            <ul>{o.recentRejections.map((r, i) => <li key={i} className="flex gap-3 border-b border-line px-5 py-3 text-[13px] last:border-b-0"><span className="min-w-[64px] text-muted">{ago(r.at, now)}</span><span>{r.reason === "bad_signature" ? "Bad signature" : "Unknown firm"}{r.firmId ? <> · <Link href={`/admin/firms/${r.firmId}`} className="mono hover:text-accent">{r.firmId.slice(0, 8)}…</Link></> : ""}</span></li>)}</ul>
          )}
        </Card>
      </div>
    </>
  );
}
