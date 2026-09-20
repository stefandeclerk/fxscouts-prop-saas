import Link from "next/link";
import MarkSeen from "@/components/MarkSeen";
import { Card, PageHeader, Status, type Tone } from "@/components/ui";
import { ctx, listEvents } from "@/lib/data";
import { shortDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = { "evaluation.breach": "Breach", "evaluation.disagreement": "Disagreement", "behaviour.changed": "Behaviour changed", "account.reconnect_required": "Reconnect required", "sync.failed": "Sync failed", "sync.completed": "Synced", "account.connected": "Connected", "account.disconnected": "Disconnected" };
const TONE: Record<string, Tone> = { "evaluation.breach": "bad", "evaluation.disagreement": "warn", "behaviour.changed": "warn", "account.reconnect_required": "bad", "sync.failed": "warn", "sync.completed": "ok", "account.connected": "ok", "account.disconnected": "pend" };

function summary(event: string, data: Record<string, unknown>): string {
  switch (event) {
    case "evaluation.breach": return `Rules v${data.version}: ${((data.rules as { rule: string }[]) ?? []).map((r) => r.rule).join(", ")}`;
    case "evaluation.disagreement": return String(data.detail ?? "");
    case "behaviour.changed": return `${((data.exceeded as string[]) ?? []).join(", ")} moved more than ${data.threshold_pct}% since evaluation`;
    case "sync.completed": return `${data.deals} deals, ${data.trades} trades`;
    case "sync.failed": case "account.reconnect_required": return String((data.error as { message?: string } | undefined)?.message ?? "");
    default: return "";
  }
}

export default async function EventsPage() {
  const c = await ctx();
  const events = await listEvents(c.firmId, { limit: 300 });
  return (
    <>
      <PageHeader title="Events" sub="Everything the gateway has sent this firm, signature-verified on arrival. Breaches, disagreements and behaviour changes are the ones to act on."><MarkSeen /></PageHeader>
      <Card>
        {events.length === 0 ? <div className="px-5 py-10 text-center text-muted">Nothing received yet. Events arrive after syncs run on the gateway.</div> : (
          <div className="overflow-x-auto"><table className="w-full border-collapse">
            <thead><tr><th className="th">Received</th><th className="th">Event</th><th className="th">Trader</th><th className="th hidden md:table-cell">Detail</th></tr></thead>
            <tbody>{events.map((e) => {
              const data = (e.payload.data ?? {}) as Record<string, unknown>;
              return (
                <tr key={e.id} className={e.seen ? "" : "bg-accent/[0.04]"}>
                  <td className="td whitespace-nowrap">{shortDateTime(e.receivedAt)}</td>
                  <td className="td"><Status tone={TONE[e.event] ?? "pend"}>{LABEL[e.event] ?? e.event}</Status></td>
                  <td className="td">{e.accountId ? <Link href={`/app/accounts/${e.accountId}`} className="font-semibold hover:text-accent">{String(data.reference ?? e.accountId.slice(0, 8))}</Link> : "–"}</td>
                  <td className="td text-[13px] text-ink/80 hidden md:table-cell">{summary(e.event, data)}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
