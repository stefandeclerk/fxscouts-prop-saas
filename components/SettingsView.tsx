"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardHeader, Field, Note, PageHeader, Status } from "@/components/ui";
import type { Connection } from "@/lib/gateway/client";
import { shortDateTime } from "@/lib/format";

export default function SettingsView({ name, connection, webhookOk, members, gatewayUrl, bypass }: { name: string; connection: Connection | null; webhookOk: boolean | null; members: { userId: string; role: string; since: string }[]; gatewayUrl: string; bypass: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const post = async (body: Record<string, unknown>) => {
    setBusy(String(body.action)); setError(null);
    const res = await fetch("/api/app/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Something went wrong"); return; }
    router.refresh();
  };
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Gateway connection" />
          {connection ? (
            <div className="p-5">
              <dl className="grid grid-cols-[160px_1fr] gap-y-2 text-[13.5px]">
                <dt className="text-muted">Status</dt><dd><Status tone="ok">Connected</Status></dd>
                <dt className="text-muted">Gateway</dt><dd className="mono">{gatewayUrl}</dd>
                <dt className="text-muted">Customer ID</dt><dd className="mono">{connection.customerId}</dd>
                <dt className="text-muted">Webhooks</dt><dd>{webhookOk === null ? <Status tone="pend">Unknown</Status> : webhookOk ? <Status tone="ok">Receiving</Status> : <Status tone="bad">Not registered</Status>}</dd>
                <dt className="text-muted">Signing key</dt><dd className="mono break-all">{connection.publicKey ?? "not published yet"}</dd>
                <dt className="text-muted">Connected</dt><dd>{shortDateTime(connection.connectedAt)} UTC</dd>
              </dl>
              <p className="mt-4 text-xs text-muted">The API key is stored encrypted in this app and used only by its server. The gateway holds all account data; this app never connects to the gateway&apos;s database.</p>
            </div>
          ) : (
            <div className="p-5">
              <p className="mb-4 text-[13.5px] text-ink/80">Not connected. Connecting creates your firm&apos;s customer and API key on the gateway at <span className="mono">{gatewayUrl}</span>, stores the key encrypted here, and registers this app to receive the gateway&apos;s events.</p>
              {error && <p className="mb-3 text-[13px] text-bad">{error}</p>}
              <button className="btn-primary" onClick={() => post({ action: "connect" })} disabled={busy !== null}>{busy === "connect" ? "Connecting" : "Connect to gateway"}</button>
            </div>
          )}
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Firm" />
            <form className="p-5" onSubmit={(e) => { e.preventDefault(); void post({ action: "rename", name: new FormData(e.currentTarget).get("name") }); }}>
              <Field label="Firm name"><input className="input" name="name" defaultValue={name} required /></Field>
              <button type="submit" className="btn-primary btn-sm" disabled={busy !== null}>{busy === "rename" ? "Saving" : "Save"}</button>
            </form>
          </Card>
          <Card>
            <CardHeader title="Team" />
            {bypass ? <div className="px-5 py-4 text-[13px] text-muted">Local test mode: no sign-in, no team.</div> : (
              <ul>{members.map((m) => <li key={m.userId} className="flex justify-between border-b border-line px-5 py-3 last:border-b-0 text-[13.5px]"><span className="mono">{m.userId.slice(0, 8)}…</span><span className="text-muted">{m.role} · since {shortDateTime(m.since)}</span></li>)}</ul>
            )}
          </Card>
          <Note>Inviting team members and roles are managed through Supabase Auth for now.</Note>
        </div>
      </div>
    </>
  );
}
