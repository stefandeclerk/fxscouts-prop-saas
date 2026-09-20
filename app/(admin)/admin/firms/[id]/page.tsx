import Link from "next/link";
import { notFound } from "next/navigation";
import FirmActions from "@/components/admin/FirmActions";
import { Card, CardHeader, PageHeader, Stat, Status, toneForState } from "@/components/ui";
import { adminFirm } from "@/lib/admin/data";
import { phaseLabel, shortDateTime, stateLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminFirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await adminFirm(id);
  if (!f) notFound();
  const breached = new Set(f.events.filter((e) => e.event === "evaluation.breach" && e.accountId).map((e) => e.accountId));
  return (
    <>
      <div className="mb-2 flex items-center gap-1.5 text-[13px] text-muted"><Link href="/admin/firms" className="hover:text-accent">Firms</Link><span>/</span><span>{f.firm.name}</span></div>
      <PageHeader title={f.firm.name} sub={<>Since {shortDateTime(f.firm.createdAt)} · <span className="mono">{f.firm.id}</span></>}>
        <a href={`/api/admin/act-as?firm=${f.firm.id}`} className="btn-primary">Open as staff</a>
      </PageHeader>
      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-5">
        <Stat label="Gateway" value={!f.connection ? <Status tone="pend">Not connected</Status> : f.accounts === null ? <Status tone="bad">Unreachable</Status> : <Status tone="ok">Connected</Status>} detail={f.connection ? `Customer ${f.connection.customerId.slice(0, 8)}…` : undefined} />
        <Stat label="Webhook" value={f.webhookOk === null ? <Status tone="pend">Unknown</Status> : f.webhookOk ? <Status tone="ok">Receiving</Status> : <Status tone="bad">Not registered</Status>} />
        <Stat label="Accounts" value={f.accounts?.length ?? "–"} detail={f.accounts ? `${f.accounts.filter((a) => a.phase === "funded").length} funded` : undefined} />
        <Stat label="Programmes" value={f.programmes?.length ?? "–"} />
        <Stat label="Notes" value={f.notes} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Accounts" />
            {!f.accounts ? <div className="px-5 py-8 text-center text-muted">{f.connection ? "The gateway did not answer." : "Not connected."}</div> : f.accounts.length === 0 ? <div className="px-5 py-8 text-center text-muted">No accounts yet.</div> : (
              <div className="overflow-x-auto"><table className="w-full border-collapse">
                <thead><tr><th className="th">Trader</th><th className="th">Programme</th><th className="th">Phase</th><th className="th">State</th><th className="th">Rules</th></tr></thead>
                <tbody>{f.accounts.map((a) => (
                  <tr key={a.id}><td className="td font-semibold">{a.reference || a.name}<span className="block text-xs font-normal text-muted">{a.name} · {a.server}</span></td><td className="td">{f.programmes?.find((p) => p.id === a.programme_id)?.name ?? "–"}</td><td className="td">{phaseLabel(a.phase)}</td><td className="td"><Status tone={toneForState(a.state)}>{stateLabel(a.state)}</Status></td><td className="td">{breached.has(a.id) ? <Status tone="bad">Breach</Status> : a.programme_id ? <Status tone="ok">Clear</Status> : "–"}</td></tr>
                ))}</tbody>
              </table></div>
            )}
          </Card>
          <Card>
            <CardHeader title="Recent events" />
            {f.events.length === 0 ? <div className="px-5 py-8 text-center text-muted">Nothing received.</div> : (
              <ul>{f.events.slice(0, 20).map((e) => <li key={e.id} className="flex gap-3 border-b border-line px-5 py-2.5 text-[13px] last:border-b-0"><span className="min-w-[110px] text-muted">{shortDateTime(e.at)}</span><span className="mono">{e.event}</span>{!e.seen && <span className="text-xs text-muted">unseen</span>}</li>)}</ul>
            )}
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <FirmActions firmId={f.firm.id} name={f.firm.name} connected={!!f.connection} demo={process.env.NODE_ENV !== "production"} />
          <Card>
            <CardHeader title="Connection" />
            {f.connection ? (
              <dl className="grid grid-cols-[110px_1fr] gap-y-2 p-5 text-[13px]">
                <dt className="text-muted">Customer</dt><dd className="mono break-all">{f.connection.customerId}</dd>
                <dt className="text-muted">Endpoint</dt><dd className="mono break-all">{f.connection.webhookEndpointId ?? "none"}</dd>
                <dt className="text-muted">Signing key</dt><dd className="mono break-all">{f.connection.publicKey ?? "–"}</dd>
                <dt className="text-muted">Connected</dt><dd>{shortDateTime(f.connection.connectedAt)}</dd>
              </dl>
            ) : <div className="px-5 py-6 text-[13px] text-muted">The firm has not connected to the gateway yet. They do that under Settings in their console; you can do it for them via Open as staff.</div>}
          </Card>
          <Card>
            <CardHeader title="Members" />
            <ul>{f.members.map((m) => <li key={m.userId} className="flex justify-between border-b border-line px-5 py-3 text-[13px] last:border-b-0"><span className="mono">{m.userId.slice(0, 8)}…</span><span className="text-muted">{m.role} · {shortDateTime(m.since)}</span></li>)}{f.members.length === 0 && <li className="px-5 py-4 text-[13px] text-muted">No members (local test firm).</li>}</ul>
          </Card>
        </div>
      </div>
    </>
  );
}
