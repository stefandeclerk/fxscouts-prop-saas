"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarkSeen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button className="btn" disabled={busy} onClick={async () => { setBusy(true); await fetch("/api/app/events", { method: "POST" }); setBusy(false); router.refresh(); }}>Mark all seen</button>;
}
