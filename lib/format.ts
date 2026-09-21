const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", AUD: "A$" };

export function money(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined) return "–";
  const sym = (currency && CURRENCY_SYMBOL[currency]) ?? (currency ? `${currency} ` : "");
  return `${sym}${Number(amount).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function signed(amount: number): string {
  const s = amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount > 0 ? `+${s}` : s;
}

export function ago(iso: string | null, now: string = new Date().toISOString()): string {
  if (!iso) return "–";
  const diff = Math.max(0, (new Date(now).getTime() - new Date(iso).getTime()) / 1000);
  if (diff < 45) return "now";
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
  return `${Math.round(diff / 86400)} d ago`;
}

export function shortDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return `${date} ${time}`;
}

export function pct(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export function stateLabel(state: string): string {
  return ({ pending: "Pending first sync", connected: "Connected", syncing: "Syncing", retrying: "Retrying", reconnect_required: "Reconnect required", disconnected: "Disconnected" } as Record<string, string>)[state] ?? state;
}

export function phaseLabel(p: string | null): string {
  return p === "funded" ? "Funded" : p === "evaluation" ? "Evaluation" : "No phase";
}

export function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}
