"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import PageHero from "@/components/PageHero";
import { Field } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AuthCard({ mode, bypass = false }: { mode: "login" | "signup"; bypass?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const isLogin = mode === "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firm, setFirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    if (bypass) {
      if (!isLogin) await fetch("/api/app/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ firm, email }) });
      router.push("/app"); router.refresh(); return;
    }
    const sb = supabaseBrowser();
    if (isLogin) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setBusy(false); return; }
      router.push(params.get("next") ?? "/app"); router.refresh(); return;
    }
    const res = await fetch("/api/app/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ firm, email, password }) });
    if (res.status === 409) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { firm } } });
      if (error) { setError(error.message); setBusy(false); return; }
      if (data.session) { router.push("/app"); router.refresh(); return; }
      setNotice("Check your email for a confirmation link, then sign in."); setBusy(false); return;
    }
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Could not create the account"); setBusy(false); return; }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setBusy(false); return; }
    router.push("/app"); router.refresh();
  };

  return (
    <>
      <PageHero compact title={isLogin ? "Sign in" : "Create your firm's account"} sub={isLogin ? "Welcome back." : "Connect your first traders in minutes."} />
      <section className="relative mx-auto -mt-16 flex max-w-[1120px] justify-center px-4 pb-20 md:-mt-20 md:px-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-line bg-white p-7 shadow-[0_20px_60px_rgba(0,39,79,0.14)]">
          <form onSubmit={submit}>
            {!isLogin && <Field label="Firm name"><input className="input" value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="Northline Funded" required /></Field>}
            <Field label="Email"><input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com" required /></Field>
            <Field label="Password" hint={isLogin ? undefined : "At least 12 characters."}><input className="input" type="password" autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={isLogin ? undefined : 12} required={!bypass} /></Field>
            {error && <p className="mb-3 text-[13px] text-bad">{error}</p>}
            {notice && <p className="mb-3 text-[13px] text-good">{notice}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full justify-center py-2.5">{busy ? "One moment" : isLogin ? "Sign in" : "Create account"}</button>
          </form>
          <p className="mt-5 text-center text-[13px] text-muted">{isLogin ? <>No account yet? <Link href="/signup" className="text-accent">Create one</Link></> : <>Already have an account? <Link href="/login" className="text-accent">Sign in</Link></>}</p>
        </div>
      </section>
    </>
  );
}
