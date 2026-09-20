"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Building2, CreditCard, LayoutDashboard } from "lucide-react";
import { NavLink, SidebarWaves } from "@/components/Shell";
import { PRODUCT, PRODUCT_FULL } from "@/lib/brand";

const NAV = [
  { href: "/admin", label: "Health", icon: LayoutDashboard },
  { href: "/admin/firms", label: "Firms", icon: Building2 },
  { href: "/admin/events", label: "Events", icon: Activity },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[232px_1fr]">
      <aside className="relative isolate flex flex-row flex-wrap items-center gap-1 overflow-hidden border-b border-line bg-[#180c3a] px-3.5 py-3 text-white md:sticky md:top-0 md:h-screen md:flex-col md:items-stretch md:border-b-0 md:border-r md:py-5">
        <SidebarWaves />
        <Link href="/admin" className="mr-2 flex flex-col gap-1 px-2.5 md:mr-0 md:pb-4" aria-label={`${PRODUCT_FULL} admin`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fxscouts-logo-white.svg" alt="FxScouts" className="h-[22px] w-auto" />
          <span className="hidden text-[11px] font-medium tracking-wide text-[#7ff5e6]/80 md:block">{PRODUCT} · Admin</span>
        </Link>
        {NAV.map((n) => <NavLink key={n.href} item={n} active={n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)} />)}
        <div className="relative ml-auto text-[12px] text-white/80 md:ml-0 md:mt-auto md:border-t md:border-white/15 md:pt-3 md:pb-1">
          <Link href="/app" className="hover:text-white">Firm console</Link>
        </div>
      </aside>
      <main className="w-full min-w-0 max-w-[1240px] px-4 pb-16 pt-6 md:px-9 md:pt-7">{children}</main>
    </div>
  );
}
