"use client";

import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ProgrammeEditor from "@/components/ProgrammeEditor";
import { Card, CardHeader, Note, PageHeader, Status } from "@/components/ui";
import type { Programme, ProgrammeRules } from "@/lib/gateway/types";
import { shortDateTime } from "@/lib/format";

export function describeRules(r: ProgrammeRules): string[] {
  const out: string[] = [];
  if (r.profitTargetPct) out.push(`Target ${r.profitTargetPct}%`);
  if (r.maxDailyLossPct) out.push(`Daily loss ${r.maxDailyLossPct}%${r.dailyResetUtc ? ` (resets ${r.dailyResetUtc} UTC)` : ""}`);
  if (r.maxDrawdownPct) out.push(`Drawdown ${r.maxDrawdownPct}% ${r.drawdownType === "static" ? "static" : "trailing"}`);
  if (r.maxLot) out.push(`Max ${r.maxLot} lots`);
  if (r.weekendHolds === false) out.push("No weekend holds");
  if (r.minTradingDays) out.push(`Min ${r.minTradingDays} trading days`);
  if (r.consistencyPct) out.push(`Consistency ${r.consistencyPct}%`);
  if (r.minHoldSeconds) out.push(`Hold ≥ ${r.minHoldSeconds}s`);
  if (r.maxTradesPerDay) out.push(`≤ ${r.maxTradesPerDay} trades/day`);
  if (r.bannedWindows?.length) out.push(`${r.bannedWindows.length} restricted ${r.bannedWindows.length === 1 ? "window" : "windows"}`);
  return out;
}

export default function Programmes({ programmes, counts }: { programmes: Programme[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [versioning, setVersioning] = useState<Programme | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleActive = async (p: Programme) => {
    await fetch(`/api/app/programmes/${p.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ active: !p.active }) });
    router.refresh();
  };

  return (
    <>
      <PageHeader title="Programmes" sub="Your challenge and funded rules, versioned. Every trader on a programme is evaluated after each sync, and every trade is judged by the rules in force when it closed.">
        <button className="btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />New programme</button>
      </PageHeader>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          {programmes.length === 0 ? <div className="px-5 py-10 text-center text-muted">No programmes yet. Create one, then import traders onto it.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead><tr><th className="th w-8" /><th className="th">Programme</th><th className="th">Current rules</th><th className="th num">Traders</th><th className="th">State</th><th className="th" /></tr></thead>
                <tbody>
                  {programmes.map((p) => {
                    const open = expanded === p.id;
                    const summary = describeRules(p.current?.rules ?? {});
                    return (
                      <FragmentRow key={p.id} p={p} open={open} summary={summary} count={counts[p.id] ?? 0} onToggle={() => setExpanded(open ? null : p.id)} onVersion={() => setVersioning(p)} onActive={() => toggleActive(p)} />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="How versions work" />
            <div className="flex flex-col gap-3 p-5 text-[13.5px] text-ink/80">
              <p>Saving a change never edits the old rules. It creates a new version, signed by the gateway, with the date it takes effect.</p>
              <p>Per-trade rules (lot size, hold time, restricted windows, weekend holds) are judged trade by trade against the version in force when each trade closed. Account-wide rules (drawdown, daily loss, consistency, minimum days) use the version in force at evaluation time.</p>
              <p>So a rule change after a trader has passed cannot be applied to their earlier trades, and neither you nor the gateway can quietly rewrite history.</p>
            </div>
          </Card>
          <Note>Every version is stored and signed by the gateway, not by this app.</Note>
        </div>
      </div>
      <ProgrammeEditor open={creating} onClose={() => setCreating(false)} />
      {versioning && <ProgrammeEditor open programmeId={versioning.id} name={versioning.name} rules={versioning.current?.rules ?? {}} onClose={() => setVersioning(null)} />}
    </>
  );
}

function FragmentRow({ p, open, summary, count, onToggle, onVersion, onActive }: { p: Programme; open: boolean; summary: string[]; count: number; onToggle: () => void; onVersion: () => void; onActive: () => void }) {
  return (
    <>
      <tr className="cursor-pointer" onClick={onToggle}>
        <td className="td text-muted">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
        <td className="td"><span className="font-semibold">{p.name}</span><span className="block text-xs text-muted">Version {p.current?.version ?? 0} · created {shortDateTime(p.created_at)}</span></td>
        <td className="td text-[13px]">{summary.length ? summary.join(" · ") : <span className="text-muted">No rules set</span>}</td>
        <td className="td num">{count}</td>
        <td className="td"><Status tone={p.active ? "ok" : "pend"}>{p.active ? "Active" : "Archived"}</Status></td>
        <td className="td num whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-sm" onClick={onVersion}>New version</button>
          <button className="btn btn-sm ml-2" onClick={onActive}>{p.active ? "Archive" : "Restore"}</button>
        </td>
      </tr>
      {open && (
        <tr>
          <td className="td bg-bg" colSpan={6}>
            <div className="px-2 py-1">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Version history</div>
              <table className="w-full border-collapse text-[13px]">
                <thead><tr><th className="th">Version</th><th className="th">Effective from</th><th className="th">Rules</th><th className="th">Note</th><th className="th">Signed</th></tr></thead>
                <tbody>
                  {[...p.versions].reverse().map((v) => (
                    <tr key={v.version}>
                      <td className="td font-semibold">v{v.version}</td>
                      <td className="td whitespace-nowrap">{shortDateTime(v.effective_from)} UTC</td>
                      <td className="td">{describeRules(v.rules).join(" · ") || <span className="text-muted">None</span>}</td>
                      <td className="td text-muted">{v.note ?? ""}</td>
                      <td className="td">{v.signature ? <Status tone="ok">Yes</Status> : <Status tone="pend">No</Status>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
