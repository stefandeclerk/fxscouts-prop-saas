"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ClipboardCheck, LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react";
import SignOut from "@/components/SignOut";
import { PRODUCT, PRODUCT_FULL } from "@/lib/brand";

// The console frame. Unlike the Gateway console (dark left sidebar), this
// product has a dark top bar with the firm's identity and a light sidebar
// for navigation, so the two consoles are recognisably different at a glance
// while sharing every card, table and form beneath.

type NavItem = { href: string; label: string; icon: LucideIcon };

const MAIN: NavItem[] = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/programmes", label: "Programmes", icon: ClipboardCheck },
  { href: "/app/accounts", label: "Traders", icon: Users },
  { href: "/app/events", label: "Events", icon: Activity },
];
const OPS: NavItem[] = [{ href: "/app/settings", label: "Settings", icon: Settings }];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-medium transition-colors ${active ? "bg-accent/10 text-accent-deep" : "text-ink/70 hover:bg-bg hover:text-ink"}`}>
      <Icon className={`h-[18px] w-[18px] ${active ? "text-accent" : ""}`} strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

export default function Shell({ children, firmName, role }: { children: React.ReactNode; firmName: string; role: string }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));
  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative isolate overflow-hidden bg-plum text-white">
        <TopBarWaves />
        <div className="relative mx-auto flex h-[60px] max-w-[1400px] items-center justify-between px-4 md:px-6">
          <Link href="/app" className="flex items-center gap-2.5" aria-label={PRODUCT_FULL}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fxscouts-logo-white.svg" alt="FxScouts" className="h-[22px] w-auto" />
            <span className="text-[13px] font-medium tracking-wide text-white/60">{PRODUCT}</span>
          </Link>
          <nav className="flex items-center gap-1 md:hidden">
            {MAIN.map((i) => <Link key={i.href} href={i.href} className={`rounded-lg px-2.5 py-1.5 text-[13px] font-medium ${active(i.href) ? "bg-white/14 text-white" : "text-white/70"}`}>{i.label}</Link>)}
          </nav>
          <div className="flex items-center gap-2.5">
            <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/15 text-xs font-semibold">{firmName.slice(0, 2).toUpperCase()}</span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-[13.5px] leading-tight">{firmName}</span>
              <small className="block text-[11px] text-white/60">{role.charAt(0).toUpperCase() + role.slice(1)}</small>
            </span>
            {role !== "local test, no sign-in" && <SignOut />}
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-line bg-surface px-3.5 py-5 md:block">
          <div className="sticky top-5 flex flex-col gap-1">
            {MAIN.map((i) => <NavLink key={i.href} item={i} active={active(i.href)} />)}
            <div className="px-2.5 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Firm</div>
            {OPS.map((i) => <NavLink key={i.href} item={i} active={active(i.href)} />)}
          </div>
        </aside>
        <main className="w-full min-w-0 px-4 pb-16 pt-6 md:px-8 md:pt-7">{children}</main>
      </div>
    </div>
  );
}

// A sliver of the landing page's wave motif along the bottom of the bar.
function TopBarWaves() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[60px] w-full opacity-70" viewBox="0 0 1440 60" preserveAspectRatio="none">
      <defs>
        <linearGradient id="tb1" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#6f5ff4" stopOpacity="0.45" /><stop offset="60%" stopColor="#1dacdf" stopOpacity="0.4" /><stop offset="100%" stopColor="#00bcbc" stopOpacity="0.45" /></linearGradient>
        <linearGradient id="tb2" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#00bcbc" stopOpacity="0.7" /><stop offset="100%" stopColor="#1dacdf" stopOpacity="0.6" /></linearGradient>
      </defs>
      <path fill="url(#tb1)" d="M0,34 C240,18 480,52 720,36 C960,20 1200,10 1440,30 L1440,60 L0,60 Z" />
      <path fill="url(#tb2)" d="M0,52 C300,40 560,60 840,50 C1120,40 1300,42 1440,50 L1440,60 L0,60 Z" />
    </svg>
  );
}
