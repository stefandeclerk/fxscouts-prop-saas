"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardHeader, Field } from "@/components/ui";

export default function FirmActions({ firmId, name, connected, demo = false }: { firmId: string; name: string; connected: boolean; demo?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const post = async (body: Record<string, unknown>) => {
    setBusy(String(body.action)); setMsg(null);
    const res = await fetch(`/api/admin/firms/${firmId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    setBusy(null);
    setMsg(res.ok ? "Done." : j.error ?? "Failed");
    router.refresh();
  };
  return (
    <Card>
      <CardHeader title="Support actions" />
      <div className="p-5">
        <form onSubmit={(e) => { e.preventDefault(); void post({ action: "rename", name: new FormData(e.currentTarget).get("name") }); }}>
          <Field label="Firm name"><input className="input" name="name" defaultValue={name} required /></Field>
          <button type="submit" className="btn btn-sm" disabled={busy !== null}>{busy === "rename" ? "Saving" : "Rename"}</button>
        </form>
        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-[13px] text-muted">If events stopped arriving, register a fresh webhook endpoint on the gateway with a new secret.</p>
          <button className="btn btn-sm" disabled={busy !== null || !connected} onClick={() => post({ action: "reregister_webhook" })}>{busy === "reregister_webhook" ? "Registering" : "Re-register webhook"}</button>
        </div>
        {demo && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-[13px] text-muted">Load the demo world for this firm: 3 programmes with a rules change, 14 traders in evaluation and funded phases with a year of trades each, breaches, disagreements, payout checks and events. Replaces the firm&apos;s existing programmes and traders. Development only.</p>
            <button className="btn-primary btn-sm" disabled={busy !== null} onClick={async () => {
              if (!confirm(`Replace ${name}'s programmes and traders with demo data?`)) return;
              setBusy("demo"); setMsg(null);
              const res = await fetch("/api/admin/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ firmId }) });
              const j = await res.json().catch(() => ({}));
              setBusy(null);
              setMsg(res.ok ? `Loaded ${j.traders?.length ?? 0} traders across ${j.programmes?.length ?? 0} programmes; ${j.webhooks_delivered ?? 0} events delivered.${j.warnings?.length ? ` Warnings: ${j.warnings.join("; ")}` : ""}` : j.error ?? "Failed");
              router.refresh();
            }}>{busy === "demo" ? "Loading (about a minute)" : "Load demo data"}</button>
          </div>
        )}
        {msg && <p className="mt-3 text-[13px] text-muted">{msg}</p>}
      </div>
    </Card>
  );
}
