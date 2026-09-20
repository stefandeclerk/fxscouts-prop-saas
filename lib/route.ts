import "server-only";

import { NextResponse } from "next/server";
import { GatewayError, type Gateway, gatewayFor } from "@/lib/gateway/client";
import { currentFirm, type Session } from "@/lib/supabase/server";

// App API routes: the signed-in user acts for their firm; the route then
// calls the gateway with the firm's key. Gateway errors pass through with
// their status and message so the UI can show them as they are.

export async function session(): Promise<Session | NextResponse> {
  const s = await currentFirm();
  if (!s) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return s;
}

export async function withGateway(): Promise<{ s: Session; gw: Gateway } | NextResponse> {
  const s = await session();
  if (s instanceof NextResponse) return s;
  const gw = await gatewayFor(s.firmId);
  if (!gw) return NextResponse.json({ error: "This firm is not connected to the gateway yet. Connect it under Settings." }, { status: 409 });
  return { s, gw };
}

export async function readJson<T extends Record<string, unknown>>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { return {} as T; }
}

export function fail(e: unknown): NextResponse {
  if (e instanceof GatewayError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e);
  return NextResponse.json({ error: (e as Error).message ?? "Something went wrong" }, { status: 500 });
}
