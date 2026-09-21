"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RequestReport({ period }: { period: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const run = async () => {
    setBusy(true); setMsg(null);
    const res = await fetch("/api/app/reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ period }) });
    setBusy(false);
    if (!res.ok) { setMsg((await res.json().catch(() => ({}))).error ?? "Could not request the report"); return; }
    setMsg("Requested; it appears in the list within a minute."); router.refresh();
  };
  return <div className="flex items-center gap-3">{msg && <span className="text-[13px] text-muted">{msg}</span>}<button className="btn" onClick={run} disabled={busy}>{busy ? "Requesting" : "Report for this month so far"}</button></div>;
}
