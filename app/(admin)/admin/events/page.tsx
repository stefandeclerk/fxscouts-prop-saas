import Link from "next/link";
import { Card, PageHeader, Status, type Tone } from "@/components/ui";
import { adminEvents } from "@/lib/admin/data";
import { shortDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const TONE: Record<string, Tone> = { "evaluation.breach": "bad", "evaluation.disagreement": "warn", "behaviour.changed": "warn", "account.reconnect_required": "bad", "sync.failed": "warn", "sync.completed": "ok", "account.connected": "ok", "account.disconnected": "pend" };

export default async function AdminEventsPage() {
  const events = await adminEvents();
  return (
    <>
      <PageHeader title="Events" sub="Every delivery the gateway made to any firm, newest first." />
      <Card>
        {events.length === 0 ? <div className="px-5 py-10 text-center text-muted">Nothing received yet.</div> : (
          <div className="overflow-x-auto"><table className="w-full border-collapse">
            <thead><tr><th className="th">Received</th><th className="th">Firm</th><th className="th">Event</th><th className="th">Trader</th><th className="th">Seen</th></tr></thead>
            <tbody>{events.map((e) => (
              <tr key={e.id}><td className="td whitespace-nowrap">{shortDateTime(e.at)}</td><td className="td"><Link href={`/admin/firms/${e.firmId}`} className="font-semibold hover:text-accent">{e.firmName}</Link></td><td className="td"><Status tone={TONE[e.event] ?? "pend"}>{e.event}</Status></td><td className="td mono text-xs">{String(e.data.reference ?? e.accountId?.slice(0, 8) ?? "–")}</td><td className="td">{e.seen ? "Yes" : <span className="text-muted">No</span>}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
