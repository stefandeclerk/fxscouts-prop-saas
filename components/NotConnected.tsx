import Link from "next/link";
import { Card } from "@/components/ui";

export default function NotConnected() {
  return (
    <Card>
      <div className="px-6 py-12 text-center">
        <h2 className="mb-2 text-[17px] font-semibold">Connect your firm to the gateway</h2>
        <p className="mx-auto mb-5 max-w-[460px] text-muted">Your accounts, programmes and evidence live in FxScouts Gateway. Connect once and this app reads them through the API with your firm&apos;s own key.</p>
        <Link href="/app/settings" className="btn-primary">Go to Settings</Link>
      </div>
    </Card>
  );
}
