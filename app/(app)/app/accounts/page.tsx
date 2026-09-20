import { Suspense } from "react";
import NotConnected from "@/components/NotConnected";
import Traders from "@/components/Traders";
import { PageHeader } from "@/components/ui";
import { ctx, listEvents } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TradersPage() {
  const c = await ctx();
  if (!c.gw) return <><PageHeader title="Traders" /><NotConnected /></>;
  const [accounts, programmes, events] = await Promise.all([c.gw.accounts(), c.gw.programmes(), listEvents(c.firmId, { limit: 500 })]);
  const breached = [...new Set(events.filter((e) => e.event === "evaluation.breach" && e.accountId).map((e) => e.accountId as string))];
  return <Suspense><Traders accounts={accounts} programmes={programmes} breached={breached} /></Suspense>;
}
