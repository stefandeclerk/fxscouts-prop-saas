import VerifyCard from "@/components/VerifyCard";
import { gatewayPublicKey } from "@/lib/gateway/client";

export const dynamic = "force-dynamic";

// Public. A trader, adjudicator or auditor holding a record from a firm
// checks it here without an account. Nothing they paste is stored.
export default async function VerifyPage() {
  const publicKey = await gatewayPublicKey();
  return <VerifyCard publicKey={publicKey} gatewayUrl={process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.GATEWAY_URL ?? "http://localhost:3000"} />;
}
