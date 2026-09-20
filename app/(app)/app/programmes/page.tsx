import NotConnected from "@/components/NotConnected";
import Programmes from "@/components/Programmes";
import { PageHeader } from "@/components/ui";
import { ctx } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProgrammesPage() {
  const c = await ctx();
  if (!c.gw) return <><PageHeader title="Programmes" /><NotConnected /></>;
  const [programmes, accounts] = await Promise.all([c.gw.programmes(), c.gw.accounts()]);
  const counts: Record<string, number> = {};
  for (const a of accounts) if (a.programme_id) counts[a.programme_id] = (counts[a.programme_id] ?? 0) + 1;
  return <Programmes programmes={programmes} counts={counts} />;
}
