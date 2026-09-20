import { notFound } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { isStaff } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Staff only. Non-staff get a 404, so the area is not advertised.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isStaff())) notFound();
  return <AdminShell>{children}</AdminShell>;
}
