"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ImportButton from "@/components/ImportButton";
import { Card, PageHeader, Status, toneForState } from "@/components/ui";
import type { GatewayAccount, Programme } from "@/lib/gateway/types";
import { ago, money, phaseLabel, stateLabel } from "@/lib/format";

export default function Traders({ accounts, programmes, breached }: { accounts: GatewayAccount[]; programmes: Programme[]; breached: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const programme = params.get("programme") ?? "";
  const phase = params.get("phase") ?? "";
  const state = params.get("state") ?? "";
  const set = (k: string, v: string) => { const p = new URLSearchParams(params.toString()); if (v) p.set(k, v); else p.delete(k); p.delete("import"); router.replace(`/app/accounts?${p}`); };
  const breachedSet = new Set(breached);
  const rows = accounts.filter((a) => (!programme || (programme === "none" ? !a.programme_id : a.programme_id === programme)) && (!phase || a.phase === phase) && (!state || (state === "breach" ? breachedSet.has(a.id) : a.state === state)));
  const name = (id: string | null) => programmes.find((p) => p.id === id)?.name ?? (id ? "Programme" : "–");
  const now = new Date().toISOString();

  return (
    <>
      <PageHeader title="Traders" sub={`${accounts.length} connected ${accounts.length === 1 ? "account" : "accounts"}`}>
        <select className="input select w-auto" value={programme} onChange={(e) => set("programme", e.target.value)}>
          <option value="">All programmes</option>
          {programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value="none">No programme</option>
        </select>
        <select className="input select w-auto" value={phase} onChange={(e) => set("phase", e.target.value)}><option value="">All phases</option><option value="evaluation">Evaluation</option><option value="funded">Funded</option></select>
        <select className="input select w-auto" value={state} onChange={(e) => set("state", e.target.value)}>
          <option value="">All states</option><option value="breach">In breach</option><option value="connected">Connected</option><option value="pending">Pending</option><option value="syncing">Syncing</option><option value="retrying">Retrying</option><option value="reconnect_required">Reconnect required</option>
        </select>
        <ImportButton programmes={programmes.filter((p) => p.active).map((p) => ({ id: p.id, name: p.name }))} defaultOpen={params.get("import") === "1"} defaultProgramme={programme !== "none" ? programme : undefined} />
      </PageHeader>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr><th className="th">Trader</th><th className="th hidden lg:table-cell">Programme</th><th className="th hidden md:table-cell">Phase</th><th className="th">State</th><th className="th">Rules</th><th className="th num hidden xl:table-cell">Balance</th><th className="th hidden xl:table-cell">Last sync</th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-bg">
                  <td className="td"><Link href={`/app/accounts/${a.id}`} className="whitespace-nowrap font-semibold hover:text-accent">{a.reference || a.name}</Link><span className="block max-w-[280px] truncate text-xs text-muted">{a.name} · {a.login} · {a.server}</span></td>
                  <td className="td hidden lg:table-cell">{name(a.programme_id)}</td>
                  <td className="td hidden md:table-cell">{phaseLabel(a.phase)}</td>
                  <td className="td"><Status tone={toneForState(a.state)}>{stateLabel(a.state)}</Status></td>
                  <td className="td">{breachedSet.has(a.id) ? <Status tone="bad">Breach</Status> : a.programme_id ? <Status tone="ok">Clear</Status> : <span className="text-muted">–</span>}</td>
                  <td className="td num whitespace-nowrap hidden xl:table-cell">{money(a.balance, a.currency)}</td>
                  <td className="td whitespace-nowrap hidden xl:table-cell">{ago(a.last_sync_at, now)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="td py-10 text-center text-muted" colSpan={7}>{accounts.length === 0 ? "Import your first traders with the button above." : "No traders match these filters."}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 text-[13px] text-muted">Showing {rows.length} of {accounts.length}. &ldquo;Rules&rdquo; reflects breach events received from the gateway; open a trader for the full evaluation.</div>
      </Card>
    </>
  );
}
