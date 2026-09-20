import Link from "next/link";
import { ArrowRight, FileCheck2, GitCompareArrows, Lock, ScrollText, Scale, ShieldCheck, type LucideIcon } from "lucide-react";

// Landing page. Same structure and motion as the Gateway site (hero with
// wave bands, feature grid, dark band with a product card, pricing) so the
// two read as one family; the base colour is plum instead of navy and the
// product card shows a breach evaluation instead of a track record.

type Feature = { icon: LucideIcon; title: string; text: string };

const FEATURES: Feature[] = [
  { icon: Lock, title: "Read-only, by construction", text: "We connect with investor passwords only. We cannot trade, and we have no execution access to sell to anyone. That is what makes our record neutral." },
  { icon: ScrollText, title: "Rules locked to every trade", text: "Your programme rules are versioned and signed. Each trade is judged by the version in force when it closed; a change today cannot touch yesterday." },
  { icon: GitCompareArrows, title: "A second opinion on breaches", text: "Tell us what your engine decided. When we see it differently, you hear about it first, before the trader does." },
  { icon: Scale, title: "Payout checks in seconds", text: "Consistency, quick strikes, size escalation, restricted windows: every flag names the trades behind it, so you can show the trader what was seen." },
  { icon: ShieldCheck, title: "A record nobody can alter", text: "After every sync the full ledger is hashed, chained and signed. A ledger that does not match a seal has been changed since." },
  { icon: FileCheck2, title: "Evidence on demand", text: "One signed file per trader: ledger, rules, evaluations, decisions, payout checks, and a statement of demo or live. For adjudicators, auditors and regulators." },
];

const STEPS = [
  { n: "1", title: "Write down your rules", text: "Drawdown, daily loss, consistency, hold time, restricted windows. Saved as a signed version." },
  { n: "2", title: "Import your traders", text: "Paste your account export. Evaluation and funded accounts, hundreds at a time, investor passwords only." },
  { n: "3", title: "Get judgements, not data", text: "Every sync evaluates every trader. Breaches, disagreements and payout checks arrive as events." },
];

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <DarkBand />
      <Pricing />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-plum text-white">
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(120%_90%_at_10%_0%,#4a2aa8_0%,#2f1a70_45%,#2a1660_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(45%_55%_at_0%_30%,rgba(208,109,231,0.32)_0%,rgba(208,109,231,0)_100%),radial-gradient(45%_60%_at_100%_0%,rgba(0,188,188,0.3)_0%,rgba(0,188,188,0)_100%)]" />
      <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[380px] w-full md:h-[560px]" viewBox="0 0 1440 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wg1" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#d06de7" stopOpacity="0.55" /><stop offset="55%" stopColor="#6f5ff4" stopOpacity="0.55" /><stop offset="100%" stopColor="#1dacdf" stopOpacity="0.55" /></linearGradient>
          <linearGradient id="wg2" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#1dacdf" stopOpacity="0.5" /><stop offset="50%" stopColor="#00bcbc" stopOpacity="0.5" /><stop offset="100%" stopColor="#6f5ff4" stopOpacity="0.5" /></linearGradient>
          <linearGradient id="wg3" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#00bcbc" stopOpacity="0.9" /><stop offset="60%" stopColor="#1dacdf" stopOpacity="0.9" /><stop offset="100%" stopColor="#6f5ff4" stopOpacity="0.9" /></linearGradient>
        </defs>
        <path fill="url(#wg1)" d="M0,228 C260,148 440,398 740,298 C1020,208 1200,108 1440,248 L1440,600 L0,600 Z" />
        <path fill="url(#wg2)" d="M0,374 C280,304 500,514 780,404 C1060,294 1250,254 1440,364 L1440,600 L0,600 Z" />
        <path fill="url(#wg3)" d="M0,480 C320,420 540,590 840,500 C1120,420 1270,400 1440,460 L1440,600 L0,600 Z" />
      </svg>
      <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-0 h-[110px] w-full md:h-[150px]" viewBox="0 0 1440 160" preserveAspectRatio="none"><path fill="#ffffff" d="M0,96 C240,150 420,30 720,70 C1000,108 1200,150 1440,60 L1440,160 L0,160 Z" /></svg>

      <div className="relative mx-auto max-w-[1160px] px-5 pb-48 pt-28 md:px-8 md:pb-72 md:pt-32">
        <div className="mx-auto flex max-w-[800px] flex-col items-center text-center">
          <span className="rise rise-1 mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[12.5px] font-semibold uppercase tracking-wider text-[#7ff5e6] backdrop-blur"><ShieldCheck className="h-4 w-4" strokeWidth={2} />For prop firms</span>
          <h1 className="rise rise-2 mb-6 text-[40px] font-bold leading-[1.05] tracking-[-0.02em] md:text-[58px]">
            Independent monitoring
            <br />
            <span className="bg-linear-to-r from-[#7ff5e6] via-[#8fd3ff] to-[#d8a7ff] bg-clip-text text-transparent">your traders can trust.</span>
          </h1>
          <p className="rise rise-3 mb-9 max-w-[640px] text-[17px] leading-relaxed text-white/72 md:text-[18px]">
            Every challenge and funded account read by a neutral party, judged against your own rules, and recorded in a form nobody can alter afterwards. Fewer disputes, faster payouts, evidence when it matters.
          </p>
          <div className="rise rise-4 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[15px] font-semibold text-accent-deep shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition hover:-translate-y-px hover:bg-white/95">Start with your first programme<ArrowRight className="h-4 w-4" /></Link>
            <Link href="/#how" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/8 px-5 py-3 text-[15px] font-medium text-white backdrop-blur transition hover:bg-white/14">How it works</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="evidence" className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_50%_at_100%_0%,rgba(111,95,244,0.12)_0%,rgba(111,95,244,0)_100%),radial-gradient(35%_45%_at_0%_100%,rgba(0,188,188,0.12)_0%,rgba(0,188,188,0)_100%)]" />
      <div className="relative mx-auto max-w-[1160px] px-5 pb-16 pt-2 md:px-8 md:pb-20 md:pt-4">
        <div className="mb-10 max-w-[640px]">
          <h2 className="mb-3 text-[28px] font-bold leading-tight tracking-tight md:text-[36px]">The record is only worth something if <span className="text-accent">you can&apos;t change it.</span></h2>
          <p className="text-[15.5px] leading-relaxed text-ink/70">Every monitoring tool a firm uses today runs on the firm&apos;s own server data. In a dispute, the firm is the counterparty, the price feed, the judge and the only record-keeper. We are none of those.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="group rounded-2xl border border-line/80 bg-white/70 p-6 backdrop-blur transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_16px_40px_rgba(64,30,139,0.10)]">
                <span className="mb-3.5 grid h-9 w-9 place-items-center rounded-lg bg-linear-to-br from-accent to-accent-deep text-white shadow-[0_6px_16px_rgba(111,95,244,0.3)]"><Icon className="h-[17px] w-[17px]" strokeWidth={1.75} /></span>
                <h3 className="mb-1.5 text-[15.5px] font-semibold">{f.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-ink/68">{f.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DarkBand() {
  return (
    <section id="how" className="relative isolate overflow-hidden bg-plum text-white">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(90%_120%_at_90%_10%,#4a2aa8_0%,#2f1a70_50%,#2a1660_100%)]" />
      <svg aria-hidden className="pointer-events-none absolute inset-0 -z-10 h-full w-full" viewBox="0 0 1440 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bg1" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#00bcbc" stopOpacity="0.4" /><stop offset="100%" stopColor="#6f5ff4" stopOpacity="0.4" /></linearGradient>
          <linearGradient id="bg2" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#d06de7" stopOpacity="0.28" /><stop offset="100%" stopColor="#1dacdf" stopOpacity="0.28" /></linearGradient>
        </defs>
        <path fill="url(#bg2)" d="M0,160 C300,40 520,300 820,200 C1100,110 1260,0 1440,130 L1440,0 L0,0 Z" />
        <path fill="url(#bg1)" d="M0,520 C260,430 480,660 760,540 C1040,430 1240,410 1440,500 L1440,600 L0,600 Z" />
      </svg>
      <div className="relative mx-auto grid max-w-[1160px] gap-12 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-8 md:py-24">
        <div>
          <h2 className="mb-4 text-[28px] font-bold leading-tight tracking-tight md:text-[36px]">From your rulebook to a signed verdict in three steps.</h2>
          <p className="mb-8 max-w-[520px] text-[15.5px] leading-relaxed text-white/68">Your engine keeps running. Ours runs beside it on the same accounts, and tells you when the two disagree.</p>
          <ol className="flex flex-col gap-4">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-white/10 text-[13px] font-bold text-[#7ff5e6] ring-1 ring-white/15">{s.n}</span>
                <div><div className="text-[15px] font-semibold">{s.title}</div><div className="text-[13.5px] text-white/60">{s.text}</div></div>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-2xl border border-white/12 bg-white/6 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-bad/20 text-[#ffb3a7]"><Scale className="h-5 w-5" /></span>
              <div><div className="text-[14px] font-semibold">trader-8812 · 100k phase 1</div><div className="text-[12px] text-white/50">Evaluated 14:02 UTC · rules v3</div></div>
            </div>
            <span className="rounded-full bg-bad/20 px-2.5 py-1 text-[11.5px] font-semibold text-[#ffb3a7]">Breach</span>
          </div>
          <ul className="flex flex-col divide-y divide-white/10 text-[13px]">
            {[["Maximum daily loss", "4.1% of 5%", "ok"], ["Maximum lot size", "2 trades over 1.00", "bad"], ["Restricted windows", "None", "ok"], ["Consistency", "Best day 31% of 40%", "ok"], ["Minimum hold time", "1 trade under 60 s", "bad"]].map(([r, o, t]) => (
              <li key={r} className="flex items-center justify-between py-2.5"><span className="text-white/80">{r}</span><span className="flex items-center gap-2 text-white/60"><span>{o}</span><span className={`h-2 w-2 rounded-full ${t === "ok" ? "bg-good" : "bg-bad"}`} /></span></li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-between rounded-lg bg-white/6 px-3.5 py-2.5 text-[12.5px]">
            <span className="text-white/60">Your decision: <b className="text-white">Cleared</b></span>
            <span className="rounded-full bg-warn/25 px-2 py-0.5 font-semibold text-[#f0c4f7]">Disagreement</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(35%_50%_at_0%_10%,rgba(208,109,231,0.12)_0%,rgba(208,109,231,0)_100%),radial-gradient(35%_50%_at_100%_100%,rgba(29,172,223,0.12)_0%,rgba(29,172,223,0)_100%)]" />
      <div className="relative mx-auto max-w-[1160px] px-5 py-16 md:px-8 md:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[560px]">
            <h2 className="mb-2 text-[28px] font-bold leading-tight tracking-tight md:text-[36px]">Per monitored account, per month.</h2>
            <p className="text-[15.5px] text-ink/70">Evaluations, payout checks, seals and evidence packs included. Nothing per request, nothing per dispute.</p>
          </div>
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-accent to-accent-deep px-5 py-3 text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(111,95,244,0.35)] transition hover:-translate-y-px">Talk to us<ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[["Evaluation accounts", "Challenge and verification phases", ["Evaluation after every sync", "Breach events", "Rules pinned to each trade"]], ["Funded accounts", "Live payouts, live disputes", ["Everything in evaluation", "Payout checks", "Behaviour-change alerts", "Second opinion on your decisions"]], ["Evidence", "When a trader, adjudicator or auditor asks", ["Signed evidence pack per trader", "Ledger seals", "Public verification key"]]].map(([title, sub, items]) => (
            <div key={String(title)} className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h3 className="mb-1 text-[17px] font-semibold">{title}</h3>
              <p className="mb-4 text-[13.5px] text-muted">{sub}</p>
              <ul className="flex flex-col gap-2 text-[13.5px] text-ink/80">{(items as string[]).map((i) => <li key={i} className="flex items-start gap-2"><span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-linear-to-br from-accent to-good" />{i}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
