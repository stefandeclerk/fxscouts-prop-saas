import { NextResponse, type NextRequest } from "next/server";
import { STAFF_FIRM_COOKIE, isStaff } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/admin/act-as?firm=<id>  → open that firm's console as staff
// GET /api/admin/act-as?leave=1     → back to /admin
export async function GET(req: NextRequest) {
  if (!(await isStaff())) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const firm = req.nextUrl.searchParams.get("firm");
  const res = NextResponse.redirect(new URL(firm ? "/app" : "/admin", req.url));
  if (firm) res.cookies.set(STAFF_FIRM_COOKIE, firm, { httpOnly: true, sameSite: "lax", path: "/" });
  else res.cookies.set(STAFF_FIRM_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
