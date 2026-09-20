import { NextResponse } from "next/server";
import { readJson } from "@/lib/route";
import { db } from "@/lib/server/db";
import { AUTH_BYPASS, currentFirm } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST { firm, email, password } — creates the user already confirmed so
// sign-up goes straight in. Set SIGNUP_REQUIRE_EMAIL_CONFIRMATION=true to
// use Supabase's confirmation-link flow instead.
export async function POST(req: Request) {
  if (process.env.SIGNUP_REQUIRE_EMAIL_CONFIRMATION === "true") return NextResponse.json({ error: "Use the confirmation flow" }, { status: 409 });
  const b = await readJson<{ firm?: string; email?: string; password?: string }>(req);
  if (AUTH_BYPASS) {
    const s = await currentFirm();
    if (s && b.firm?.trim()) await db().from("firms").update({ name: b.firm.trim() }).eq("id", s.firmId);
    return NextResponse.json({ ok: true, bypass: true }, { status: 201 });
  }
  const email = (b.email ?? "").trim().toLowerCase();
  const password = b.password ?? "";
  if (!email || password.length < 12) return NextResponse.json({ error: "Email and a password of at least 12 characters are required" }, { status: 400 });
  const { error } = await db().auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { firm: (b.firm ?? "").trim() } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
