import Link from "next/link";
import { Card, Note, PageHeader, Stat } from "@/components/ui";
import { adminFirms } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

// Indicative run rate until billing is wired: monitored accounts per firm
// times a flat monthly price from the environment.
const PRICE = Number(process.env.PRICE_PER_ACCOUNT_MONTH ?? 9);

export default async function AdminBillingPage() {
  const firms = (await adminFirms()).filter((f) => f.connected);
  const accounts = firms.reduce((s, f) => s + (f.accounts ?? 0), 0);
  return (
    <>
      <PageHeader title="Billing" sub="Indicative, from the accounts the gateway reports per firm right now." />
      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-3">
        <Stat label="Monitored accounts" value={accounts} />
        <Stat label="Price per account" value={`$${PRICE}`} suffix="/ month" detail="PRICE_PER_ACCOUNT_MONTH" />
        <Stat label="Monthly run rate" value={`$${(accounts * PRICE).toLocaleString("en-GB")}`} />
      </div>
      <Card>
        <div className="overflow-x-auto"><table className="w-full border-collapse">
          <thead><tr><th className="th">Firm</th><th className="th num">Accounts</th><th className="th num">Monthly</th></tr></thead>
          <tbody>{firms.map((f) => <tr key={f.id}><td className="td"><Link href={`/admin/firms/${f.id}`} className="font-semibold hover:text-accent">{f.name}</Link></td><td className="td num">{f.accounts ?? "–"}</td><td className="td num">${((f.accounts ?? 0) * PRICE).toLocaleString("en-GB")}</td></tr>)}{firms.length === 0 && <tr><td className="td py-8 text-center text-muted" colSpan={3}>No connected firms.</td></tr>}</tbody>
        </table></div>
      </Card>
      <div className="mt-4"><Note>Invoicing is not connected. This page counts accounts as the gateway reports them today; the gateway&apos;s own billing counts what it charges us per account.</Note></div>
    </>
  );
}
