import Link from "next/link";
import { Card, PageHeader, Status } from "@/components/ui";
import { adminFirms } from "@/lib/admin/data";
import { ago, shortDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminFirmsPage() {
  const firms = await adminFirms();
  const now = new Date().toISOString();
  return (
    <>
      <PageHeader title="Firms" sub={`${firms.length} ${firms.length === 1 ? "firm" : "firms"}`} />
      <Card>
        <div className="overflow-x-auto"><table className="w-full border-collapse">
          <thead><tr><th className="th">Firm</th><th className="th">Gateway</th><th className="th hidden xl:table-cell">Webhook</th><th className="th num">Accounts</th><th className="th num">In breach</th><th className="th num hidden xl:table-cell">Members</th><th className="th hidden lg:table-cell">Last event</th><th className="th" /></tr></thead>
          <tbody>
            {firms.map((f) => (
              <tr key={f.id} className="hover:bg-bg">
                <td className="td"><Link href={`/admin/firms/${f.id}`} className="whitespace-nowrap font-semibold hover:text-accent">{f.name}</Link><span className="block max-w-[260px] truncate text-xs text-muted">Since {shortDateTime(f.createdAt)}{f.customerId ? ` · customer ${f.customerId.slice(0, 8)}…` : ""}</span></td>
                <td className="td">{!f.connected ? <Status tone="pend">Not connected</Status> : f.accounts === null ? <Status tone="bad">Unreachable</Status> : <Status tone="ok">Connected</Status>}</td>
                <td className="td hidden xl:table-cell">{f.webhookRegistered ? <Status tone="ok">Registered</Status> : <Status tone="pend">None</Status>}</td>
                <td className="td num">{f.accounts ?? "–"}</td>
                <td className="td num">{f.breached ? <span className="font-semibold text-bad">{f.breached}</span> : "0"}</td>
                <td className="td num hidden xl:table-cell">{f.members}</td>
                <td className="td whitespace-nowrap hidden lg:table-cell">{ago(f.lastEventAt, now)}{f.unseenEvents ? <span className="block text-xs text-muted">{f.unseenEvents} unseen</span> : null}</td>
                <td className="td num whitespace-nowrap"><a href={`/api/admin/act-as?firm=${f.id}`} className="btn btn-sm whitespace-nowrap">Open as staff</a></td>
              </tr>
            ))}
            {firms.length === 0 && <tr><td className="td py-10 text-center text-muted" colSpan={8}>No firms yet.</td></tr>}
          </tbody>
        </table></div>
      </Card>
    </>
  );
}
