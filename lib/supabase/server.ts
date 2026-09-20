import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { db } from "@/lib/server/db";

// AUTH_BYPASS=true (local development only): no sign-in; the app acts as a
// "Local test firm" created on first use, and reads use the service role, so
// the data layer must filter by firm itself.
export const AUTH_BYPASS = process.env.AUTH_BYPASS === "true" && process.env.NODE_ENV !== "production";

// Fixed id so parallel first requests cannot create two firms.
const BYPASS_FIRM_ID = "00000000-0000-4000-8000-00000000f1a1";
let bypassReady = false;
async function bypassFirmId(): Promise<string> {
  if (bypassReady) return BYPASS_FIRM_ID;
  const { error } = await db().from("firms").upsert({ id: BYPASS_FIRM_ID, name: "Local test firm" }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`Could not create the bypass firm: ${error.message}`);
  bypassReady = true;
  return BYPASS_FIRM_ID;
}

export async function supabaseServer(): Promise<SupabaseClient> {
  if (AUTH_BYPASS) return db();
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (all) => {
        try { for (const { name, value, options } of all) store.set(name, value, options); } catch { /* server components cannot set cookies */ }
      },
    },
  });
}

export type Session = { userId: string; firmId: string; role: string };

// The signed-in user's firm, or null.
export async function currentFirm(): Promise<Session | null> {
  if (AUTH_BYPASS) return { userId: "bypass", firmId: await bypassFirmId(), role: "owner" };
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("firm_members").select("firm_id, role").eq("user_id", user.id).limit(1).maybeSingle();
  if (!data) return null;
  return { userId: user.id, firmId: data.firm_id, role: data.role };
}
