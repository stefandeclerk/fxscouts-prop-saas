"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRODUCT, PRODUCT_FULL } from "@/lib/brand";

// Same layout as the Gateway site's nav; the wordmark says Prop Monitor and the
// dark surfaces are plum instead of navy, so the two products read as
// siblings, not the same site.

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#evidence", label: "Evidence" },
  { href: "/#pricing", label: "Pricing" },
];

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={PRODUCT_FULL}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={light ? "/fxscouts-logo-white.svg" : "/fxscouts-logo-dark.svg"} alt="FxScouts" className="h-[26px] w-auto" />
      <span className={`text-[13px] font-medium tracking-wide ${light ? "text-white/60" : "text-muted"} ${compact ? "hidden sm:inline" : ""}`}>{PRODUCT}</span>
    </Link>
  );
}

export default function SiteNav() {
  const pathname = usePathname();
  void pathname;
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-[72px] max-w-[1160px] items-center justify-between px-5 md:px-8">
        <Logo light compact />
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => <Link key={l.label} href={l.href} className="text-[14px] font-medium text-white/75 transition-colors hover:text-white">{l.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-lg px-3.5 py-2 text-[14px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex">Sign in</Link>
          <Link href="/signup" className="whitespace-nowrap rounded-lg bg-white px-4 py-2 text-[14px] font-semibold text-accent-deep shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition hover:bg-white/90">Get started</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-plum text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_70%_at_0%_0%,rgba(111,95,244,0.3)_0%,rgba(111,95,244,0)_100%),radial-gradient(45%_60%_at_100%_100%,rgba(0,188,188,0.16)_0%,rgba(0,188,188,0)_100%)]" />
      <div className="relative mx-auto max-w-[1160px] px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-[340px] text-[13.5px] leading-relaxed text-white/60">Independent monitoring for prop firms: every challenge and funded account read by a neutral party, judged against your rules, and recorded in a form nobody can alter afterwards.</p>
          </div>
          <FooterCol title="Product" links={[["How it works", "/#how"], ["Evidence", "/#evidence"], ["Pricing", "/#pricing"]]} />
          <FooterCol title="Account" links={[["Sign in", "/login"], ["Sign up", "/signup"]]} />
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-[12.5px] text-white/45">
          <span>© 2026 FxScouts Ltd</span>
          <span>Built on FxScouts Gateway</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/45">{title}</div>
      <ul className="flex flex-col gap-2 text-[14px]">{links.map(([label, href]) => <li key={label}><Link href={href} className="text-white/80 transition-colors hover:text-white">{label}</Link></li>)}</ul>
    </div>
  );
}
