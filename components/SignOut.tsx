"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignOut() {
  const router = useRouter();
  return (
    <button aria-label="Sign out" className="ml-auto rounded-md p-1.5 text-muted hover:bg-ink/6 hover:text-ink" onClick={async () => { await supabaseBrowser().auth.signOut(); router.push("/login"); router.refresh(); }}>
      <LogOut className="h-4 w-4" />
    </button>
  );
}
