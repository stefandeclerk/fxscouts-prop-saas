"use client";

import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Field, Modal, Note, Status } from "@/components/ui";
import type { BannedWindow, ProgrammeRules, Simulation } from "@/lib/gateway/types";
import { phaseLabel } from "@/lib/format";

// One form for creating a programme and for adding a version to one. Every
// save of an existing programme creates a new signed version; nothing is
// edited in place, so trades already judged keep the rules they were judged
// by.

type Props = { programmeId?: string; name?: string; rules?: ProgrammeRules; open: boolean; onClose: () => void };

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ProgrammeEditor({ programmeId, name, rules: initial = {}, open, onClose }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [windows, setWindows] = useState<BannedWindow[]>(initial.bannedWindows ?? []);
  const [sim, setSim] = useState<Simulation | null>(null);
  const [simBusy, setSimBusy] = useState(false);
  const editing = !!programmeId;

  const rulesFrom = (form: HTMLFormElement) => {
    const f = new FormData(form);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const rules: Record<string, unknown> = {
      profitTargetPct: s("profitTargetPct"), maxDailyLossPct: s("maxDailyLossPct"), dailyResetUtc: s("dailyResetUtc"),
      maxDrawdownPct: s("maxDrawdownPct"), drawdownType: s("drawdownType"), maxLot: s("maxLot"),
      weekendHolds: s("weekendHolds") === "allowed", minTradingDays: s("minTradingDays"), consistencyPct: s("consistencyPct"),
      minHoldSeconds: s("minHoldSeconds"), maxTradesPerDay: s("maxTradesPerDay"), behaviourChangePct: s("behaviourChangePct"),
      bannedWindows: windows.filter((w) => w.fromUtc && w.toUtc),
    };
    return { rules, s };
  };

  // Runs the proposed rules over the programme's accounts on the gateway;
  // nothing is written. The version note records which preview was seen.
  const preview = async (form: HTMLFormElement) => {
    setSimBusy(true); setError(null);
    const { rules } = rulesFrom(form);
    const res = await fetch(`/api/app/programmes/${programmeId}/simulate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rules }) });
    setSimBusy(false);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Could not preview"); return; }
    setSim(await res.json());
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { rules, s } = rulesFrom(e.currentTarget);
    setBusy(true); setError(null);
    const note = [s("note"), sim ? `[preview ${sim.body_hash.slice(0, 16)}]` : ""].filter(Boolean).join(" ");
    const res = editing
      ? await fetch(`/api/app/programmes/${programmeId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rules, effectiveFrom: s("effectiveFrom") || undefined, note }) })
      : await fetch("/api/app/programmes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: s("name"), rules, note: s("note") }) });
    setBusy(false);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Could not save"); return; }
    onClose();
    router.refresh();
  };

  const num = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

  return (
    <Modal open={open} onClose={onClose} title={editing ? `New rules version for ${name}` : "New programme"} width="max-w-[760px]">
      <form onSubmit={submit}>
        {!editing && <Field label="Programme name" hint="What your traders know it as, e.g. 100k two-step, phase 1."><input className="input" name="name" required autoFocus /></Field>}
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
          <Field label="Profit target %"><input className="input" name="profitTargetPct" type="number" step="0.1" min="0" defaultValue={num(initial.profitTargetPct)} /></Field>
          <Field label="Max daily loss %"><input className="input" name="maxDailyLossPct" type="number" step="0.1" min="0" defaultValue={num(initial.maxDailyLossPct)} /></Field>
          <Field label="Trading day starts (UTC)" hint="When the daily loss resets."><input className="input mono" name="dailyResetUtc" placeholder="00:00" pattern="^([01]\d|2[0-3]):[0-5]\d$" defaultValue={initial.dailyResetUtc ?? ""} /></Field>
          <Field label="Max drawdown %"><input className="input" name="maxDrawdownPct" type="number" step="0.1" min="0" defaultValue={num(initial.maxDrawdownPct)} /></Field>
          <Field label="Drawdown type"><select className="input select" name="drawdownType" defaultValue={initial.drawdownType ?? "trailing"}><option value="trailing">Trailing, from the highest closed equity</option><option value="static">Static, from the starting balance</option></select></Field>
          <Field label="Max lot size"><input className="input" name="maxLot" type="number" step="0.01" min="0" defaultValue={num(initial.maxLot)} /></Field>
          <Field label="Weekend holds"><select className="input select" name="weekendHolds" defaultValue={initial.weekendHolds ? "allowed" : "none"}><option value="none">Not allowed</option><option value="allowed">Allowed</option></select></Field>
          <Field label="Minimum trading days"><input className="input" name="minTradingDays" type="number" min="0" defaultValue={num(initial.minTradingDays)} /></Field>
          <Field label="Consistency: max share of profit from one day, %"><input className="input" name="consistencyPct" type="number" step="1" min="0" max="100" defaultValue={num(initial.consistencyPct)} /></Field>
          <Field label="Minimum hold time, seconds" hint="Trades closed sooner count as quick strikes."><input className="input" name="minHoldSeconds" type="number" min="0" defaultValue={num(initial.minHoldSeconds)} /></Field>
          <Field label="Max trades per day"><input className="input" name="maxTradesPerDay" type="number" min="0" defaultValue={num(initial.maxTradesPerDay)} /></Field>
          <Field label="Behaviour-change alert threshold, %" hint="Funded vs evaluation. Default 50."><input className="input" name="behaviourChangePct" type="number" min="0" defaultValue={num(initial.behaviourChangePct)} /></Field>
        </div>

        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between"><span className="text-[13px] font-medium">Restricted windows (UTC)</span><button type="button" className="btn btn-sm" onClick={() => setWindows([...windows, { label: "", fromUtc: "", toUtc: "" }])}><Plus className="h-4 w-4" />Add window</button></div>
          {windows.length === 0 && <p className="text-xs text-muted">None. Add news windows, settlement windows or any time of day trades must not be opened or closed.</p>}
          {windows.map((w, i) => (
            <div key={i} className="mb-2 grid grid-cols-[1fr_90px_90px_auto_auto] items-center gap-2">
              <input className="input" placeholder="Label, e.g. NFP" value={w.label} onChange={(e) => setWindows(windows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className="input mono" placeholder="13:25" value={w.fromUtc} onChange={(e) => setWindows(windows.map((x, j) => (j === i ? { ...x, fromUtc: e.target.value } : x)))} />
              <input className="input mono" placeholder="13:35" value={w.toUtc} onChange={(e) => setWindows(windows.map((x, j) => (j === i ? { ...x, toUtc: e.target.value } : x)))} />
              <div className="flex gap-0.5">
                {DAY_LABELS.map((d, di) => {
                  const on = !w.days || w.days.length === 0 || w.days.includes(di);
                  return <button type="button" key={d} title={d} className={`h-7 w-7 rounded text-[11px] font-medium ${on ? "bg-accent/15 text-accent-deep" : "bg-bg text-muted"}`} onClick={() => {
                    const cur = !w.days || w.days.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : w.days;
                    const next = cur.includes(di) ? cur.filter((x) => x !== di) : [...cur, di].sort();
                    setWindows(windows.map((x, j) => (j === i ? { ...x, days: next.length === 7 ? undefined : next } : x)));
                  }}>{d[0]}</button>;
                })}
              </div>
              <button type="button" className="rounded-md p-1 text-muted hover:text-bad" aria-label="Remove" onClick={() => setWindows(windows.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>

        {editing && (
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Field label="Effective from" hint="Leave empty for now. Trades closed before this keep the previous version."><input className="input" name="effectiveFrom" type="datetime-local" /></Field>
            <Field label="Note" hint="Why the rules changed. Shown in the version history."><input className="input" name="note" placeholder="Raised daily loss to 5%" /></Field>
          </div>
        )}
        {!editing && <Field label="Note"><input className="input" name="note" placeholder="Where these rules were read from" /></Field>}

        {editing && sim && <Preview sim={sim} />}
        {error && <p className="mb-3 text-[13px] text-bad">{error}</p>}
        <Note>Leave a field empty when the programme has no such rule. Daily loss and drawdown are measured on closed trades and marked as estimates; everything else is exact. {editing ? "Saving creates a new signed version; earlier versions are never changed." : ""}</Note>
        <div className="mt-4 flex justify-end gap-2"><button type="button" className="btn" onClick={onClose}>Cancel</button>{editing && <button type="button" className="btn" disabled={busy || simBusy} onClick={(e) => preview(e.currentTarget.form!)}>{simBusy ? "Previewing" : sim ? "Preview again" : "Preview impact"}</button>}<button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving" : editing ? "Save new version" : "Create programme"}</button></div>
      </form>
    </Modal>
  );
}

// What the proposed rules would have concluded for the accounts already on
// the programme, against what the rules in force concluded. Estimated rules
// (daily loss, drawdown) stay estimated in both.
function Preview({ sim }: { sim: Simulation }) {
  const RULE: Record<string, string> = { maxLot: "Lot size", maxDailyLoss: "Daily loss", maxDrawdown: "Drawdown", minHoldSeconds: "Hold time", consistency: "Consistency", bannedWindows: "Restricted windows", minTradingDays: "Trading days", weekendHolds: "Weekend holds", maxTradesPerDay: "Trades per day", profitTarget: "Profit target" };
  const moved = sim.summary.pass_to_breach + sim.summary.breach_to_pass;
  return (
    <div className="mb-4 rounded-xl border border-line bg-bg">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-2.5 text-[13px]">
        <Status tone={sim.summary.pass_to_breach > 0 ? "warn" : "ok"}>{moved === 0 ? "No verdict changes" : `${moved} of ${sim.accounts} verdicts change`}</Status>
        <span><b className="text-bad">{sim.summary.pass_to_breach}</b> pass → breach</span>
        <span><b className="text-good">{sim.summary.breach_to_pass}</b> breach → pass</span>
        <span className="text-muted">against rules v{sim.current_version} · {sim.signature ? "signed preview" : "unsigned"}</span>
      </div>
      {sim.by_rule.length > 0 && (
        <table className="w-full border-collapse text-[13px]">
          <thead><tr><th className="th">Rule</th><th className="th num">Fail now</th><th className="th num">Fail after</th><th className="th num">Newly fail</th><th className="th num">Newly pass</th></tr></thead>
          <tbody>{sim.by_rule.map((r) => <tr key={r.rule}><td className="td font-medium">{RULE[r.rule] ?? r.rule}</td><td className="td num">{r.before_fail}</td><td className="td num">{r.after_fail}</td><td className={`td num ${r.newly_fail ? "font-semibold text-bad" : ""}`}>{r.newly_fail}</td><td className={`td num ${r.newly_pass ? "font-semibold text-good" : ""}`}>{r.newly_pass}</td></tr>)}</tbody>
        </table>
      )}
      {sim.changed.length > 0 && (
        <div className="max-h-[200px] overflow-auto border-t border-line">
          {sim.changed.map((c) => (
            <div key={c.account_id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-line px-4 py-2 text-[13px] last:border-b-0">
              <Link href={`/app/accounts/${c.account_id}`} className="font-semibold hover:text-accent">{c.reference ?? c.account_id.slice(0, 8)}</Link>
              <span className="text-muted">{phaseLabel(c.phase)}</span>
              <span>{c.before} → <b className={c.after === "breach" ? "text-bad" : "text-good"}>{c.after}</b></span>
              <span className="text-muted">{c.rules_changed.map((r) => `${RULE[r.rule] ?? r.rule}: ${r.observed}`).join("; ")}</span>
            </div>
          ))}
        </div>
      )}
      <p className="px-4 py-2 text-xs text-muted">A preview reads the same trades and runs the same evaluator as a real evaluation, with the proposed rules applied to every trade. Nothing is written. The behaviour-change threshold does not affect verdicts and is not previewed.</p>
    </div>
  );
}
