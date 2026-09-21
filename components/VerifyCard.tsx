"use client";

import { useState } from "react";
import { Anchor as AnchorIcon, FileCheck2, ShieldCheck } from "lucide-react";
import PageHero from "@/components/PageHero";
import { Field, Status } from "@/components/ui";
import type { Anchor } from "@/lib/gateway/types";
import { shortDateTime } from "@/lib/format";

type Result = { label: string; body_hash: string; seal_hash?: string; valid?: boolean; anchor?: Anchor | null; verified?: boolean; error?: string };

export default function VerifyCard({ publicKey, gatewayUrl }: { publicKey: string | null; gatewayUrl: string }) {
  const [mode, setMode] = useState<"pack" | "hash">("pack");
  const [hash, setHash] = useState("");
  const [signature, setSignature] = useState("");
  const [sealHash, setSealHash] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [pack, setPack] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null); setResults(null);
    const body = mode === "pack" ? { pack } : { body_hash: hash.trim(), signature, seal_hash: sealHash.trim() || undefined };
    const res = await fetch("/api/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(j.error ?? "Something went wrong"); return; }
    setResults(j.results as Result[]);
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setFileName(f.name); setPack(await f.text()); setResults(null); setError(null);
  };

  const valid = results?.filter((r) => r.valid).length ?? 0;
  const invalid = results?.filter((r) => r.valid === false).length ?? 0;
  const failed = results?.filter((r) => r.error).length ?? 0;
  const seals = results?.filter((r) => r.seal_hash) ?? [];
  const anchored = seals.filter((r) => r.anchor?.status === "confirmed").length;

  return (
    <>
      <PageHero compact title="Verify a record" sub="Anyone holding an evaluation, payout check, seal or evidence pack can check that it is what the gateway signed, and when." />
      <section className="relative mx-auto -mt-16 max-w-[760px] px-4 pb-20 md:-mt-20 md:px-6">
        <div className="rounded-2xl border border-line bg-white p-7 shadow-[0_20px_60px_rgba(0,39,79,0.14)]">
          <div className="mb-5 flex gap-1 border-b border-line">
            {([["pack", "Evidence pack"], ["hash", "Hash and signature"]] as const).map(([k, l]) => <button key={k} type="button" onClick={() => { setMode(k); setResults(null); setError(null); }} className={`-mb-px border-b-2 px-3.5 py-2.5 text-[14px] font-medium ${mode === k ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"}`}>{l}</button>)}
          </div>
          <form onSubmit={run}>
            {mode === "pack" ? (
              <label className="mb-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-bg px-5 py-8 text-center hover:border-muted">
                <FileCheck2 className="h-6 w-6 text-accent" />
                <span className="text-[14px] font-medium">{fileName ?? "Choose the evidence pack (.json)"}</span>
                <span className="text-[12.5px] text-muted">Every signed record in the file is checked: seals, evaluations, payout checks, rule versions. The file is read here and not kept.</span>
                <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
            ) : (
              <>
                <Field label="Hash" hint="body_hash of an evaluation or payout check, or seal_hash of a seal. 64 hex characters."><input className="input mono" value={hash} onChange={(e) => setHash(e.target.value)} placeholder="5f1c9e3a…" required /></Field>
                <Field label="Signature"><textarea className="input mono min-h-[70px]" value={signature} onChange={(e) => setSignature(e.target.value)} required /></Field>
                <Field label="Seal hash (optional)" hint="For a seal, repeat the hash here to also check its public anchor."><input className="input mono" value={sealHash} onChange={(e) => setSealHash(e.target.value)} /></Field>
              </>
            )}
            {error && <p className="mb-3 text-[13px] text-bad">{error}</p>}
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={busy || (mode === "pack" && !pack)}>{busy ? "Checking" : "Verify"}</button>
          </form>

          {results && (
            <div className="mt-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Status tone={invalid > 0 ? "bad" : failed > 0 ? "warn" : "ok"}>{invalid > 0 ? `${invalid} of ${results.length} records do not match` : failed > 0 ? `${valid} verified, ${failed} could not be checked` : `${valid} of ${results.length} records verified`}</Status>
                {seals.length > 0 && <Status tone={anchored === seals.length ? "ok" : "pend"}>{anchored} of {seals.length} seals anchored in Bitcoin</Status>}
              </div>
              <div className="max-h-[420px] overflow-auto rounded-xl border border-line">
                <table className="w-full border-collapse">
                  <thead><tr><th className="th">Record</th><th className="th">Signature</th><th className="th">Anchor</th></tr></thead>
                  <tbody>{results.map((r, i) => (
                    <tr key={i}>
                      <td className="td"><span className="block text-[13px] font-medium">{r.label}</span><span className="mono block text-xs text-muted">{r.body_hash.slice(0, 24)}…</span></td>
                      <td className="td">{r.error ? <Status tone="warn">Not checked</Status> : r.valid ? <Status tone="ok">Genuine</Status> : <Status tone="bad">Does not match</Status>}{r.error && <span className="block text-xs text-muted">{r.error}</span>}</td>
                      <td className="td text-[13px]">{!r.seal_hash ? <span className="text-muted">–</span> : r.anchor === undefined || r.anchor === null ? <span className="text-muted">Not anchored yet</span> : r.anchor.status === "confirmed" ? <><Status tone="ok">Bitcoin block {r.anchor.block_height?.toLocaleString("en-GB")}</Status><span className="block text-xs text-muted">{r.anchor.block_time ? `${shortDateTime(r.anchor.block_time)} UTC` : ""}{r.verified === false ? " · path does not match" : ""}</span></> : <Status tone="warn">Submitted, awaiting block</Status>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-2 flex items-center gap-2 text-[14px] font-semibold"><ShieldCheck className="h-4 w-4 text-accent" />What a signature proves</div>
            <p className="text-[13px] leading-relaxed text-ink/75">The gateway signs every evaluation, payout check, rule version and seal with its private key. A record that verifies here is byte-for-byte what the gateway produced. Public key: <span className="mono break-all text-xs">{publicKey ?? "not published"}</span></p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-2 flex items-center gap-2 text-[14px] font-semibold"><AnchorIcon className="h-4 w-4 text-accent" />What an anchor proves</div>
            <p className="text-[13px] leading-relaxed text-ink/75">Once a day every new seal is committed to the Bitcoin blockchain through OpenTimestamps. A seal anchored in block N existed before that block was mined; nobody, including FxScouts, can move that date. To check without us: <span className="mono text-xs">ots verify</span> against the proof at <span className="mono break-all text-xs">{gatewayUrl}/api/v1/anchors</span>.</p>
          </div>
        </div>
      </section>
    </>
  );
}
