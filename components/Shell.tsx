"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ClipboardCheck, LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react";
import SignOut from "@/components/SignOut";
import { PRODUCT, PRODUCT_FULL } from "@/lib/brand";

// The console frame: a dark left sidebar like the Gateway console's, in
// plum with teal for the active item instead of navy with purple.

type NavItem = { href: string; label: string; icon: LucideIcon };

const MAIN: NavItem[] = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/programmes", label: "Programmes", icon: ClipboardCheck },
  { href: "/app/accounts", label: "Traders", icon: Users },
  { href: "/app/events", label: "Events", icon: Activity },
];
const OPS: NavItem[] = [{ href: "/app/settings", label: "Settings", icon: Settings }];

export function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-medium transition-colors ${active ? "bg-good/20 text-white" : "text-white/75 hover:bg-white/8 hover:text-white"}`}>
      <Icon className={`h-[18px] w-[18px] ${active ? "text-[#7ff5e6]" : ""}`} strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

export function SidebarWaves() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-[200px] w-full opacity-80 lg:block" viewBox="0 0 232 240" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pw1" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#6f5ff4" stopOpacity="0.35" /><stop offset="100%" stopColor="#1dacdf" stopOpacity="0.4" /></linearGradient>
        <linearGradient id="pw2" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#1dacdf" stopOpacity="0.6" /><stop offset="100%" stopColor="#00bcbc" stopOpacity="0.7" /></linearGradient>
      </defs>
      <path fill="url(#pw1)" d="M0,140 C50,100 90,190 130,140 C170,90 200,80 232,110 L232,240 L0,240 Z" />
      <path fill="url(#pw2)" d="M0,200 C50,176 90,232 140,202 C180,178 210,172 232,182 L232,240 L0,240 Z" />
    </svg>
  );
}

export default function Shell({ children, firmName, role, staff = false }: { children: React.ReactNode; firmName: string; role: string; staff?: boolean }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));
  return (
    <div className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] lg:grid-cols-[232px_1fr] lg:grid-rows-1">
      <aside className="relative isolate flex flex-row flex-wrap items-center gap-1 overflow-hidden border-b border-line bg-plum px-3.5 py-3 text-white lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:items-stretch lg:border-b-0 lg:border-r lg:py-5">
        <SidebarWaves />
        <Link href="/app" className="mr-2 flex flex-col gap-1 px-2.5 lg:mr-0 lg:pb-4" aria-label={PRODUCT_FULL}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fxscouts-logo-white.svg" alt="FxScouts" className="h-[22px] w-auto" />
          <span className="hidden text-[11px] font-medium tracking-wide text-[#7ff5e6]/80 lg:block">{PRODUCT} · Console</span>
        </Link>
        {MAIN.map((i) => <NavLink key={i.href} item={i} active={active(i.href)} />)}
        <div className="hidden px-2.5 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/45 lg:block">Firm</div>
        {OPS.map((i) => <NavLink key={i.href} item={i} active={active(i.href)} />)}
        <div className="relative mt-auto hidden items-center gap-2.5 border-t border-white/15 pt-3 lg:flex">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/15 text-xs font-semibold text-white">{firmName.slice(0, 2).toUpperCase()}</span>
          <span className="min-w-0">
            <span className="block truncate">{firmName}</span>
            <small className="block text-xs text-white/60">{role.charAt(0).toUpperCase() + role.slice(1)}</small>
          </span>
          {role !== "local test, no sign-in" && !staff && <SignOut />}
        </div>
      </aside>
      <div className="min-w-0">
        {staff && (
          <div className="flex items-center justify-between bg-warn px-4 py-1.5 text-[12.5px] font-medium text-white md:px-6">
            <span>Staff view: you are acting as <b>{firmName}</b>. Everything you do here is done in their name.</span>
            <a href="/api/admin/act-as?leave=1" className="rounded-md bg-white/20 px-2.5 py-1 hover:bg-white/30">Back to admin</a>
          </div>
        )}
        <main className="w-full min-w-0 max-w-[1240px] px-4 pb-16 pt-6 md:px-9 md:pt-7">{children}</main>
      </div>
    </div>
  );
}
