import { Suspense } from "react";
import AuthCard from "@/components/AuthCard";
import { AUTH_BYPASS } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default function Page() {
  return <Suspense><AuthCard mode="signup" bypass={AUTH_BYPASS} /></Suspense>;
}
