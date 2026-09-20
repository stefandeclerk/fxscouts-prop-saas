"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Card, CardHeader, Field, Modal, Note, PageHeader, Status, toneForState, type Tone } from "@/components/ui";
import type { EventRow, Note as NoteRow } from "@/lib/data";
import type { Decision, Evaluation, GatewayAccount, PayoutCheck, PayoutFlag, Programme, RuleResult, Seal, Trade } from "@/lib/gateway/types";
import { ago, money, pct, phaseLabel, shortDateTime, signed, stateLabel } from "@/lib/format";

type Tab = "evaluation" | "payout" | "evidence" | "flagged" | "notes" | "settings";
const TABS: [Tab, string][] = [["evaluation", "Evaluation"], ["payout", "Payout check"], ["evidence", "Evidence"], ["flagged", "Flagged trades"], ["notes", "Notes"], ["settings", "Settings"]];

const STATUS: Record<RuleResult["status"], { tone: Tone; label: string }> = { pass: { tone: "ok", label: "Pass" }, fail: { tone: "bad", label: "Fail" }, estimated_pass: { tone: "ok", label: "Pass (estimated)" }, estimated_fail: { tone: "warn", label: "Fail (estimated)" } };
const VERDICT: Record<Evaluation["verdict"], { tone: Tone; label: string }> = { pass: { tone: "ok", label: "Pass" }, breach: { tone: "bad", label: "Breach" }, incomplete: { tone: "pend", label: "No trades yet" } };
const KIND: Record<string, string> = { breach: "Breach", clear: "Cleared", payout_approved: "Payout approved", payout_denied: "Payout denied" };
const SEVERITY: Record<PayoutFlag["severity"], { tone: Tone; label: string }> = { info: { tone: "pend", label: "Info" }, review: { tone: "warn", label: "Review" }, block: { tone: "bad", label: "Block" } };
const METRIC: Record<string, string> = { avgLots: "Average lot size", tradesPerDay: "Trades per day", medianHoldSeconds: "Median hold time", winRate: "Win rate", quickStrikeShare: "Quick-strike share" };

export type TraderBundle = {
  account: GatewayAccount;
  programmes: Programme[];
  evaluations: Evaluation[];
  decisions: Decision[];
  payoutChecks: PayoutCheck[];
  seals: Seal[];
  publicKey: string | null;
  trades: Trade[];
  notes: NoteRow[];
  events: EventRow[];
  sibling: GatewayAccount | null;
};

export default function TraderDetail({ b }: { b: TraderBundle }) {
  const router = useRouter();
  const a = b.account;
  const [tab, setTab] = useState<Tab>("evaluation");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disconnect, setDisconnect] = useState(false);
  const programme = b.programmes.find((p) => p.id === a.programme_id) ?? null;

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action); setError(null);
    const res = await fetch(`/api/app/accounts/${a.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Something went wrong"); return false; }
    if (action === "disconnect") { router.push("/app/accounts"); router.refresh(); return true; }
    router.refresh();
    return true;
  };

  return (
    <>
      <div className="mb-2 flex items-center gap-1.5 text-[13px] text-muted"><Link href="/app/accounts" className="hover:text-accent">Traders</Link><span>/</span><span>{a.reference || a.name}</span></div>
      <PageHeader title={a.reference || a.name} sub={<>{a.name} · {a.source.toUpperCase()} · login {a.login} · {a.server}{programme ? <> · {programme.name}, {phaseLabel(a.phase).toLowerCase()}</> : " · no programme"}</>}>
        <button className="btn" onClick={() => act("sync")} disabled={busy !== null || a.state === "reconnect_required"}><RefreshCw className={`h-4 w-4 ${busy === "sync" ? "animate-spin" : ""}`} />Sync now</button>
        <a className="btn" href={`/api/app/accounts/${a.id}/evidence`} download><Download className="h-4 w-4" />Evidence pack</a>
        <button className="btn text-bad" onClick={() => setDisconnect(true)}>Disconnect</button>
      </PageHeader>

      <Card className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["State", <Status key="s" tone={toneForState(a.state)}>{stateLabel(a.state)}</Status>],
            ["Latest evaluation", b.evaluations[0] ? <Status key="e" tone={VERDICT[b.evaluations[0].verdict].tone}>{VERDICT[b.evaluations[0].verdict].label}</Status> : "–"],
            ["Balance", money(a.balance, a.currency)],
            ["Starting balance", money(a.starting_balance, a.currency)],
            ["Access", a.access_level === "investor" ? "Investor (read-only)" : a.access_level === "master" ? "Master" : "–"],
            ["Last sync", ago(a.last_sync_at)],
          ].map(([k, v], i) => (
            <div key={i} className="border-b border-line px-4 py-3.5 xl:border-b-0 xl:border-r xl:last:border-r-0"><small className="block text-xs text-muted">{k}</small><b className="text-[15px] font-semibold">{v}</b></div>
          ))}
        </div>
        {a.error && <div className="border-t border-line px-4 py-2 text-xs text-bad">{a.error.message}</div>}
      </Card>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 font-medium ${tab === k ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"}`}>{l}</button>)}
      </div>

      {error && <p className="mb-3 text-[13px] text-bad">{error}</p>}
      {tab === "evaluation" && <EvaluationTab b={b} programme={programme} busy={busy} act={act} />}
      {tab === "payout" && <PayoutTab b={b} busy={busy} act={act} />}
      {tab === "evidence" && <EvidenceTab b={b} />}
      {tab === "flagged" && <FlaggedTradesTab b={b} />}
      {tab === "notes" && <NotesTab b={b} />}
      {tab === "settings" && <SettingsTab b={b} busy={busy} setBusy={setBusy} setError={setError} />}

      <Modal open={disconnect} onClose={() => setDisconnect(false)} title="Disconnect this trader?" footer={<><button className="btn" onClick={() => setDisconnect(false)}>Cancel</button><button className="btn-primary bg-bad border-bad hover:bg-bad/90" onClick={() => act("disconnect")} disabled={busy !== null}>Disconnect</button></>}>
        <p className="text-[13.5px]">The gateway deletes the stored password immediately. The trade record, evaluations and seals are kept for the retention period and can still be exported as evidence until then.</p>
      </Modal>
    </>
  );
}

// ── Evaluation ──────────────────────────────────────────────────────────────

function EvaluationTab({ b, programme, busy, act }: { b: TraderBundle; programme: Programme | null; busy: string | null; act: (a: string, x?: Record<string, unknown>) => Promise<boolean> }) {
  const [show, setShow] = useState<number | null>(null);
  const [kind, setKind] = useState("breach");
  const [rule, setRule] = useState("");
  const shown = b.evaluations.find((e) => e.id === show) ?? b.evaluations[0] ?? null;
  if (!programme) return <Card><div className="px-5 py-10 text-center text-muted">This trader is not on a programme. Choose one in Settings; the next sync evaluates them.</div></Card>;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title={`${programme.name} · ${phaseLabel(b.account.phase).toLowerCase()}`}>
          <div className="flex items-center gap-2">
            {b.evaluations.length > 1 && <select className="input select w-auto py-1.5" value={shown?.id ?? ""} onChange={(e) => setShow(Number(e.target.value))}>{b.evaluations.map((e) => <option key={e.id} value={e.id}>{shortDateTime(e.evaluated_at)} · v{e.version} · {VERDICT[e.verdict].label}</option>)}</select>}
            <button className="btn btn-sm" onClick={() => act("evaluate")} disabled={busy !== null}>{busy === "evaluate" ? "Evaluating" : "Evaluate now"}</button>
          </div>
        </CardHeader>
        {!shown ? <div className="px-5 py-10 text-center text-muted">No evaluation yet. One runs after every sync; Evaluate now runs one on the stored trades.</div> : (
          <>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line px-5 py-3 text-[13px]">
              <Status tone={VERDICT[shown.verdict].tone}>{VERDICT[shown.verdict].label}</Status>
              <span className="text-muted">Evaluated {shortDateTime(shown.evaluated_at)} UTC against rules v{shown.version}</span>
              <span className="text-muted">{shown.signature ? "Signed by the gateway" : "Unsigned"} · <span className="mono">{shown.body_hash.slice(0, 16)}…</span></span>
            </div>
            <div className="overflow-x-auto"><table className="w-full border-collapse">
              <thead><tr><th className="th">Rule</th><th className="th hidden lg:table-cell">Limit</th><th className="th">Observed</th><th className="th">Result</th><th className="th hidden lg:table-cell">Basis</th></tr></thead>
              <tbody>
                {shown.results.map((r) => (
                  <tr key={r.rule}>
                    <td className="td font-semibold">{r.rule}{r.version !== undefined && <span className="block text-xs font-normal text-muted">v{r.version}</span>}</td>
                    <td className="td hidden lg:table-cell">{r.limit}</td>
                    <td className="td">{r.observed}{r.note && <span className="block text-xs text-muted">{r.note}</span>}{r.tradeIds && r.tradeIds.length > 0 && <span className="mono block text-xs text-muted">Trades {r.tradeIds.slice(0, 6).join(", ")}{r.tradeIds.length > 6 ? ` +${r.tradeIds.length - 6}` : ""}</span>}</td>
                    <td className="td"><Status tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Status></td>
                    <td className="td hidden lg:table-cell">{r.basis === "verified" ? "Verified" : "Estimated"}</td>
                  </tr>
                ))}
                {shown.results.length === 0 && <tr><td className="td text-muted" colSpan={5}>No trades in the ledger yet.</td></tr>}
              </tbody>
            </table></div>
          </>
        )}
      </Card>

      <Card>
        <CardHeader title="Your decisions">
          <div className="flex items-center gap-2">
            <select className="input select w-auto py-1.5" value={kind} onChange={(e) => setKind(e.target.value)}>{Object.entries(KIND).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <input className="input w-40 py-1.5" placeholder="Rule (optional)" value={rule} onChange={(e) => setRule(e.target.value)} />
            <button className="btn btn-sm" disabled={busy !== null} onClick={async () => { if (await act("decision", { kind, rule })) setRule(""); }}>Record</button>
          </div>
        </CardHeader>
        <div className="border-b border-line px-5 py-3 text-[13px] text-ink/80">Record what your own system concluded. When it differs from the gateway&apos;s evaluation, it is flagged here and arrives as a disagreement event.</div>
        {b.decisions.length === 0 ? <div className="px-5 py-8 text-center text-muted">No decisions recorded.</div> : (
          <div className="overflow-x-auto"><table className="w-full border-collapse">
            <thead><tr><th className="th">When</th><th className="th">Your decision</th><th className="th hidden md:table-cell">Rule</th><th className="th">Gateway</th><th className="th hidden lg:table-cell">Detail</th></tr></thead>
            <tbody>{b.decisions.map((d) => (
              <tr key={d.id}><td className="td whitespace-nowrap">{shortDateTime(d.decided_at)}</td><td className="td font-semibold">{KIND[d.kind] ?? d.kind}</td><td className="td hidden md:table-cell">{d.rule ?? "–"}</td>
                <td className="td">{d.agrees === null ? <Status tone="pend">Not evaluated</Status> : d.agrees ? <Status tone="ok">Agrees</Status> : <Status tone="bad">Disagrees</Status>}</td>
                <td className="td text-[13px] text-muted hidden lg:table-cell">{d.disagreement?.detail ?? ""}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
      <Note>Verified rules are exact from closed trades. Estimated ones depend on intraday or floating figures a scheduled sync does not see, so they flag rather than breach. Every evaluation is signed by the gateway and records the rules version it used.</Note>
    </div>
  );
}

// ── Payout check ────────────────────────────────────────────────────────────

function PayoutTab({ b, busy, act }: { b: TraderBundle; busy: string | null; act: (a: string) => Promise<boolean> }) {
  const [show, setShow] = useState<string | null>(null);
  const shown = b.payoutChecks.find((c) => c.id === show) ?? b.payoutChecks[0] ?? null;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="Payout check">
          <div className="flex items-center gap-2">
            {b.payoutChecks.length > 1 && <select className="input select w-auto py-1.5" value={shown?.id ?? ""} onChange={(e) => setShow(e.target.value)}>{b.payoutChecks.map((c) => <option key={c.id} value={c.id}>{shortDateTime(c.created_at)} · {c.verdict}</option>)}</select>}
            <button className="btn-primary btn-sm" onClick={() => act("payout_check")} disabled={busy !== null}>{busy === "payout_check" ? "Checking" : "Run check now"}</button>
          </div>
        </CardHeader>
        {!shown ? <div className="px-5 py-10 text-center text-muted">No check yet. Run one before approving a payout; it produces a signed report in a few seconds.</div> : (
          <>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line px-5 py-3 text-[13px]">
              <Status tone={shown.verdict === "clean" ? "ok" : "bad"}>{shown.verdict === "clean" ? "Clean" : `Flagged: ${shown.flags.length} ${shown.flags.length === 1 ? "item" : "items"}`}</Status>
              <span className="text-muted">{shortDateTime(shown.created_at)} UTC{shown.rules_version ? ` · rules v${shown.rules_version}` : " · no programme rules, defaults used"}</span>
              <span className="mono text-muted">{shown.id}</span>
              <span className="text-muted">{shown.signature ? "Signed by the gateway" : "Unsigned"}</span>
            </div>
            <div className="grid grid-cols-2 gap-px border-b border-line bg-line md:grid-cols-4 xl:grid-cols-8">
              {[["Trades", shown.profile.trades], ["Trading days", shown.profile.tradingDays], ["Win rate", pct(shown.profile.winRate)], ["Avg lots", shown.profile.avgLots.toFixed(2)], ["Median hold", `${Math.round(shown.profile.medianHoldSeconds / 60)} min`], ["Trades/day", shown.profile.tradesPerDay.toFixed(1)], ["Best day share", pct(shown.profile.bestDayShare)], ["Quick-strike share", pct(shown.profile.quickStrikeShare)]].map(([k, v]) => (
                <div key={String(k)} className="bg-surface px-4 py-3"><small className="block text-xs text-muted">{k}</small><b className="text-[15px] font-semibold">{v}</b></div>
              ))}
            </div>
            {shown.flags.length === 0 ? <div className="px-5 py-6 text-[13.5px] text-ink/80">Nothing a reviewer would need to look at.</div> : (
              <div className="overflow-x-auto"><table className="w-full border-collapse">
                <thead><tr><th className="th">Check</th><th className="th">Severity</th><th className="th">Observed</th><th className="th hidden lg:table-cell">Threshold</th><th className="th hidden md:table-cell">Trades</th></tr></thead>
                <tbody>{shown.flags.map((f) => (
                  <tr key={f.check}><td className="td font-semibold">{f.check}</td><td className="td"><Status tone={SEVERITY[f.severity].tone}>{SEVERITY[f.severity].label}</Status></td><td className="td">{f.observed}</td><td className="td text-[13px] text-muted hidden lg:table-cell">{f.threshold}</td><td className="td mono text-xs hidden md:table-cell">{f.tradeIds.length === 0 ? "–" : f.tradeIds.slice(0, 5).join(", ") + (f.tradeIds.length > 5 ? ` +${f.tradeIds.length - 5}` : "")}</td></tr>
                ))}</tbody>
              </table></div>
            )}
          </>
        )}
      </Card>
      {shown?.phaseComparison && (
        <Card>
          <CardHeader title="Funded vs evaluation" />
          <div className="border-b border-line px-5 py-3 text-[13px] text-ink/80">Compared with this trader&apos;s evaluation account{b.sibling ? <> (<Link href={`/app/accounts/${b.sibling.id}`} className="text-accent">{b.sibling.name}</Link>)</> : ""}. Anything over {shown.phaseComparison.thresholdPct}% is flagged.</div>
          <div className="overflow-x-auto"><table className="w-full border-collapse">
            <thead><tr><th className="th">Metric</th><th className="th num">Evaluation</th><th className="th num">Funded</th><th className="th num">Change</th></tr></thead>
            <tbody>{(["avgLots", "tradesPerDay", "medianHoldSeconds", "winRate", "quickStrikeShare"] as const).map((k) => {
              const ev = shown.phaseComparison!.evaluation[k], fu = shown.profile[k], d = shown.phaseComparison!.deltas[k];
              const fmt = (v: number) => (k === "winRate" || k === "quickStrikeShare" ? pct(v) : k === "medianHoldSeconds" ? `${Math.round(v / 60)} min` : v.toFixed(2));
              const over = shown.phaseComparison!.exceeded.includes(k);
              return <tr key={k}><td className="td font-semibold">{METRIC[k]}</td><td className="td num">{fmt(ev)}</td><td className="td num">{fmt(fu)}</td><td className={`td num ${over ? "font-semibold text-bad" : ""}`}>{d > 0 ? "+" : ""}{d.toFixed(0)}%</td></tr>;
            })}</tbody>
          </table></div>
        </Card>
      )}
      {b.account.phase === "funded" && !b.sibling && <Note>No evaluation account shares this trader&apos;s reference, so no phase comparison is possible. Set the same reference on both accounts to enable it.</Note>}
      <Note>A flag is a reason to look, not a verdict: every one names the trades behind it, so you can show the trader exactly what was seen. The check cannot see IP addresses, devices or identity; those stay with your own KYC.</Note>
    </div>
  );
}

// ── Evidence ────────────────────────────────────────────────────────────────

function EvidenceTab({ b }: { b: TraderBundle }) {
  const a = b.account;
  const serverType = /demo/i.test(a.server) ? "demo" : "live";
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="Evidence pack"><a className="btn-primary btn-sm" href={`/api/app/accounts/${a.id}/evidence`} download><Download className="h-4 w-4" />Download</a></CardHeader>
        <div className="p-5 text-[13.5px] text-ink/80">One signed JSON file with everything about this trader: the full deal ledger and reconciled trades, every ledger seal, the programme&apos;s rule versions, every evaluation, your recorded decisions, payout checks, behaviour alerts, the sync log, and a statement that the account was read with a <b>{a.access_level === "investor" ? "read-only investor" : a.access_level === "master" ? "master" : "not yet observed"}</b> password on a <b>{serverType}</b> server. Hand it to the trader, an adjudicator, an auditor or a regulator; anyone can verify it against the gateway&apos;s public key{b.publicKey ? <> <span className="mono">{b.publicKey.slice(0, 16)}…</span></> : ""}.</div>
      </Card>
      <Card>
        <CardHeader title="Ledger seals" />
        <div className="border-b border-line px-5 py-3 text-[13px] text-ink/80">After every sync the gateway hashes the whole ledger, chains it to the previous seal and signs it. A ledger handed over later that does not hash to a sealed value has been altered since.</div>
        {b.seals.length === 0 ? <div className="px-5 py-8 text-center text-muted">No seal yet; the first is made after the first successful sync.</div> : (
          <div className="overflow-x-auto"><table className="w-full border-collapse">
            <thead><tr><th className="th">Seal</th><th className="th">Sealed at</th><th className="th num hidden md:table-cell">Deals</th><th className="th hidden lg:table-cell">Ledger hash</th><th className="th hidden xl:table-cell">Chained to</th><th className="th">Signed</th></tr></thead>
            <tbody>{b.seals.map((s) => (
              <tr key={s.seq}><td className="td font-semibold">#{s.seq}</td><td className="td whitespace-nowrap">{shortDateTime(s.sealed_at)} UTC</td><td className="td num hidden md:table-cell">{s.deals_count.toLocaleString("en-GB")}</td><td className="td mono text-xs hidden lg:table-cell">{s.ledger_hash.slice(0, 20)}…</td><td className="td mono text-xs hidden xl:table-cell">{s.prev_hash ? `${s.prev_hash.slice(0, 12)}…` : "first"}</td><td className="td">{s.signature ? <Status tone="ok">Yes</Status> : <Status tone="pend">No</Status>}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
      {b.events.length > 0 && (
        <Card>
          <CardHeader title="Events for this trader" />
          <ul>{b.events.map((e) => <li key={e.id} className="flex gap-3 border-b border-line px-5 py-3 last:border-b-0"><span className="min-w-[110px] text-xs text-muted">{shortDateTime(e.receivedAt)}</span><span className="mono">{e.event}</span></li>)}</ul>
        </Card>
      )}
    </div>
  );
}

// ── Flagged trades ──────────────────────────────────────────────────────────
// Only the trades an evaluation failure or a payout flag names, with the
// reason beside each. There is deliberately no general trade list here:
// this is a lookup for the reviewer, not a view for the trader.

function FlaggedTradesTab({ b }: { b: TraderBundle }) {
  const reasons = new Map<string, string[]>();
  const add = (ids: string[] | undefined, why: string) => { for (const id of ids ?? []) reasons.set(id, [...(reasons.get(id) ?? []), why]); };
  const ev = b.evaluations[0];
  for (const r of ev?.results ?? []) if (r.status === "fail") add(r.tradeIds, `Rule: ${r.rule}`);
  const pc = b.payoutChecks[0];
  for (const f of pc?.flags ?? []) add(f.tradeIds, `Payout check: ${f.check}`);
  const byId = new Map(b.trades.map((t) => [t.trade_id, t]));
  const rows = [...reasons.keys()].map((id) => ({ id, t: byId.get(id) ?? null, why: reasons.get(id)! })).sort((a, c) => (c.t?.close_time_utc ?? "").localeCompare(a.t?.close_time_utc ?? ""));
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title={`Flagged trades (${rows.length})`} />
        <div className="border-b border-line px-5 py-3 text-[13px] text-ink/80">The trades named by the latest evaluation{ev ? ` (${shortDateTime(ev.evaluated_at)})` : ""}{pc ? ` and the latest payout check (${shortDateTime(pc.created_at)})` : ""}, with the reason each was flagged. Nothing else is listed.</div>
        {rows.length === 0 ? <div className="px-5 py-10 text-center text-muted">No trade has been flagged by the latest evaluation or payout check.</div> : (
          <div className="overflow-x-auto"><table className="w-full border-collapse">
            <thead><tr><th className="th">Trade</th><th className="th">Why</th><th className="th hidden md:table-cell">Closed</th><th className="th hidden md:table-cell">Symbol</th><th className="th num hidden lg:table-cell">Lots</th><th className="th num hidden lg:table-cell">Hold</th><th className="th num">Net</th></tr></thead>
            <tbody>{rows.map(({ id, t, why }) => (
              <tr key={id}>
                <td className="td mono text-xs">{id}</td>
                <td className="td text-[13px]">{why.map((w) => <span key={w} className="mr-1.5 inline-block rounded-md bg-bg px-2 py-0.5">{w}</span>)}</td>
                <td className="td whitespace-nowrap hidden md:table-cell">{t ? shortDateTime(t.close_time_utc) : <span className="text-muted">older than the loaded history</span>}</td>
                <td className="td font-semibold hidden md:table-cell">{t?.symbol ?? "–"}</td>
                <td className="td num hidden lg:table-cell">{t ? Number(t.volume).toFixed(2) : "–"}</td>
                <td className="td num hidden lg:table-cell">{t ? (t.hold_minutes < 60 ? `${t.hold_minutes} min` : `${(t.hold_minutes / 60).toFixed(1)} h`) : "–"}</td>
                <td className={`td num ${t && t.net > 0 ? "text-good" : t && t.net < 0 ? "text-bad" : ""}`}>{t ? signed(Number(t.net)) : "–"}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
      <Note>Trades are shown only because a rule or a payout check named them. The full ledger is in the evidence pack.</Note>
    </div>
  );
}

// ── Notes ───────────────────────────────────────────────────────────────────

function NotesTab({ b }: { b: TraderBundle }) {
  const router = useRouter();
  const [kind, setKind] = useState("note");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const KINDS: Record<string, string> = { note: "Note", payout_review: "Payout review", dispute: "Dispute" };
  const add = async () => {
    if (!body.trim()) return;
    setBusy(true);
    await fetch("/api/app/notes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accountId: b.account.id, kind, body }) });
    setBusy(false); setBody(""); router.refresh();
  };
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="Add a note" />
        <div className="flex flex-col gap-3 p-5">
          <div className="flex gap-2"><select className="input select w-auto" value={kind} onChange={(e) => setKind(e.target.value)}>{Object.entries(KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          <textarea className="input min-h-[90px]" placeholder="What was reviewed, decided or discussed with the trader" value={body} onChange={(e) => setBody(e.target.value)} />
          <div><button className="btn-primary btn-sm" onClick={add} disabled={busy || !body.trim()}>{busy ? "Saving" : "Save note"}</button></div>
        </div>
      </Card>
      <Card>
        <CardHeader title="History" />
        {b.notes.length === 0 ? <div className="px-5 py-8 text-center text-muted">No notes yet.</div> : (
          <ul>{b.notes.map((n) => <li key={n.id} className="border-b border-line px-5 py-3 last:border-b-0"><div className="mb-1 flex gap-3 text-xs text-muted"><span>{shortDateTime(n.createdAt)}</span><span className="font-semibold uppercase tracking-wider">{KINDS[n.kind] ?? n.kind}</span>{n.mine && <span>you</span>}</div><p className="whitespace-pre-wrap text-[13.5px]">{n.body}</p></li>)}</ul>
        )}
      </Card>
      <Note>Notes live in this app only. They are never part of the gateway&apos;s record or the evidence pack.</Note>
    </div>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────

function SettingsTab({ b, busy, setBusy, setError }: { b: TraderBundle; busy: string | null; setBusy: (v: string | null) => void; setError: (v: string | null) => void }) {
  const router = useRouter();
  const a = b.account;
  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy("save"); setError(null);
    const res = await fetch(`/api/app/accounts/${a.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: f.get("name"), reference: f.get("reference"), programme_id: f.get("programme_id"), phase: f.get("phase"), starting_balance: f.get("starting_balance"), schedule: f.get("schedule") }) });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Could not save"); return; }
    router.refresh();
  };
  return (
    <Card>
      <form className="max-w-[520px] p-5" onSubmit={save}>
        <Field label="Trader reference" hint="Your own ID for the trader. The same reference on an evaluation and a funded account links them for the behaviour comparison."><input className="input" name="reference" defaultValue={a.reference ?? ""} /></Field>
        <Field label="Display name"><input className="input" name="name" defaultValue={a.name} /></Field>
        <Field label="Programme"><select className="input select" name="programme_id" defaultValue={a.programme_id ?? ""}><option value="">None</option>{b.programmes.filter((p) => p.active || p.id === a.programme_id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <Field label="Phase"><select className="input select" name="phase" defaultValue={a.phase ?? ""}><option value="">Not set</option><option value="evaluation">Evaluation</option><option value="funded">Funded</option></select></Field>
          <Field label="Starting balance" hint="Drawdown and targets are measured from this."><input className="input" name="starting_balance" type="number" step="0.01" defaultValue={a.starting_balance ?? ""} /></Field>
        </div>
        <Field label="Sync every"><select className="input select" name="schedule" defaultValue={a.schedule}><option value="15m">15 minutes</option><option value="hourly">Hour</option><option value="6h">6 hours</option><option value="daily">Day</option><option value="manual">Manual only</option></select></Field>
        <button type="submit" className="btn-primary" disabled={busy !== null}>{busy === "save" ? "Saving" : "Save changes"}</button>
      </form>
    </Card>
  );
}
