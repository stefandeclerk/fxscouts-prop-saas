"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardHeader, Field } from "@/components/ui";

export default function FirmActions({ firmId, name, connected }: { firmId: string; name: string; connected: boolean }) {
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
        {msg && <p className="mt-3 text-[13px] text-muted">{msg}</p>}
      </div>
    </Card>
  );
}
