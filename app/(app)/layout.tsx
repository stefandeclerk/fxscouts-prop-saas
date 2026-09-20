import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { firmName } from "@/lib/data";
import { AUTH_BYPASS, currentFirm } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await currentFirm();
  if (!s) redirect("/login");
  return <Shell firmName={await firmName(s.firmId)} role={s.staff ? "staff" : AUTH_BYPASS ? "local test, no sign-in" : s.role} staff={!!s.staff}>{children}</Shell>;
}
