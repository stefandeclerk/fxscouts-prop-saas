"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Modal, Note } from "@/components/ui";
import type { BatchResult } from "@/lib/gateway/types";

// The firm hands over its own accounts: paste the platform export, choose
// programme and phase. Investor (read-only) passwords only; they go to the
// gateway over TLS and are never stored here.

export default function ImportButton({ programmes, defaultOpen = false, defaultProgramme }: { programmes: { id: string; name: string }[]; defaultOpen?: boolean; defaultProgramme?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchResult | null>(null);
  const close = () => { setOpen(false); setError(null); setResult(null); };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(null);
    const res = await fetch("/api/app/accounts/batch", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ platform: f.get("platform"), server: f.get("server"), rows: f.get("rows"), programmeId: f.get("programmeId"), phase: f.get("phase"), schedule: f.get("schedule") }) });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setError(j.error ?? "Import failed"); return; }
    setResult(j as BatchResult);
    router.refresh();
  };

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}><Upload className="h-4 w-4" />Import traders</button>
      <Modal open={open} onClose={close} title="Import traders" width="max-w-[720px]" footer={result ? <button className="btn-primary" onClick={close}>Done</button> : undefined}>
        {result ? (
          <div>
            <p className="mb-3 text-[13.5px]">{result.created} of {result.results.length} accounts connected and queued for their first sync.</p>
            {result.failed > 0 && (
              <div className="max-h-64 overflow-auto rounded-lg border border-line">
                <table className="w-full min-w-[640px] border-collapse text-[13px]">
                  <thead><tr><th className="th">Login</th><th className="th">Problem</th></tr></thead>
                  <tbody>{result.results.filter((r) => !r.ok).map((r, i) => <tr key={i}><td className="td mono">{"login" in r ? r.login : ""}</td><td className="td text-bad">{"error" in r ? r.error : ""}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              <Field label="Platform"><select className="input select" name="platform" defaultValue="mt5"><option value="mt5">MetaTrader 5</option><option value="mt4">MetaTrader 4</option></select></Field>
              <Field label="Server" hint="Used for rows that leave the server column empty."><input className="input" name="server" placeholder="YourFirm-Demo" /></Field>
              <Field label="Programme" hint={programmes.length === 0 ? "Create one under Programmes to have these traders evaluated." : undefined}>
                <select className="input select" name="programmeId" defaultValue={defaultProgramme ?? ""}><option value="">None</option>{programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              </Field>
              <Field label="Phase"><select className="input select" name="phase" defaultValue="evaluation"><option value="evaluation">Evaluation</option><option value="funded">Funded</option><option value="">Not set</option></select></Field>
              <Field label="Sync every"><select className="input select" name="schedule" defaultValue="hourly"><option value="15m">15 minutes</option><option value="hourly">Hour</option><option value="6h">6 hours</option><option value="daily">Day</option></select></Field>
            </div>
            <Field label="Accounts, one per line" hint={<>Columns: <span className="mono">login, investor password, server, reference, name, starting balance</span>. Login and password are required. Reference is your own ID for the trader; the same reference on an evaluation and a funded account links them.</>}>
              <textarea className="input mono min-h-[180px]" name="rows" placeholder={"51023344, inv-pass, , trader-8812, , 100000\n51023345, inv-pass, , trader-8813, , 100000"} required />
            </Field>
            {error && <p className="mb-3 text-[13px] text-bad">{error}</p>}
            <Note>Investor passwords only. They are sent straight to the gateway, encrypted there, and never stored in this app. Up to 500 rows per import.</Note>
            <div className="mt-4 flex justify-end gap-2"><button type="button" className="btn" onClick={close}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>{busy ? "Importing" : "Import"}</button></div>
          </form>
        )}
      </Modal>
    </>
  );
}
