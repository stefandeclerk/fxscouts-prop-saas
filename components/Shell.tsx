"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ClipboardCheck, LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react";
import SignOut from "@/components/SignOut";

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
    <Link href={item.href} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-medium transition-colors ${active ? "bg-white/14 text-white" : "text-white/75 hover:bg-white/8 hover:text-white"}`}>
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

export default function Shell({ children, firmName, role }: { children: React.ReactNode; firmName: string; role: string }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[232px_1fr]">
      <aside className="relative isolate flex flex-col gap-1 overflow-hidden border-r border-line bg-plum px-3.5 py-5 text-white md:sticky md:top-0 md:h-screen">
        <SidebarWaves />
        <Link href="/app" className="flex flex-col gap-1 px-2.5 pb-4" aria-label="FxScouts Prop">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fxscouts-logo-white.svg" alt="FxScouts" className="h-[22px] w-auto" />
          <span className="text-[11px] font-medium tracking-wide text-white/60">Prop · Monitoring</span>
        </Link>
        {MAIN.map((i) => <NavLink key={i.href} item={i} active={active(i.href)} />)}
        <div className="px-2.5 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/45">Firm</div>
        {OPS.map((i) => <NavLink key={i.href} item={i} active={active(i.href)} />)}
        <div className="relative mt-auto hidden items-center gap-2.5 border-t border-white/15 pt-3 md:flex">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/15 text-xs font-semibold text-white">{firmName.slice(0, 2).toUpperCase()}</span>
          <span className="min-w-0">
            <span className="block truncate">{firmName}</span>
            <small className="block text-xs text-white/60">{role.charAt(0).toUpperCase() + role.slice(1)}</small>
          </span>
          {role !== "local test, no sign-in" && <SignOut />}
        </div>
      </aside>
      <main className="w-full min-w-0 max-w-[1240px] px-4 pb-16 pt-6 md:px-9 md:pt-7">{children}</main>
    </div>
  );
}

function SidebarWaves() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[240px] w-full" viewBox="0 0 232 240" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pw1" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#d06de7" stopOpacity="0.4" /><stop offset="100%" stopColor="#6f5ff4" stopOpacity="0.5" /></linearGradient>
        <linearGradient id="pw2" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#6f5ff4" stopOpacity="0.5" /><stop offset="100%" stopColor="#1dacdf" stopOpacity="0.45" /></linearGradient>
        <linearGradient id="pw3" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#1dacdf" stopOpacity="0.7" /><stop offset="100%" stopColor="#00bcbc" stopOpacity="0.75" /></linearGradient>
      </defs>
      <path fill="url(#pw1)" d="M0,120 C50,80 90,170 130,120 C170,70 200,60 232,90 L232,240 L0,240 Z" />
      <path fill="url(#pw2)" d="M0,170 C50,140 90,210 140,170 C180,140 210,130 232,150 L232,240 L0,240 Z" />
      <path fill="url(#pw3)" d="M0,204 C50,180 90,236 140,206 C180,182 210,176 232,186 L232,240 L0,240 Z" />
    </svg>
  );
}
