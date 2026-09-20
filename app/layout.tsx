import type { Metadata } from "next";
import "./globals.css";
import { PRODUCT_FULL } from "@/lib/brand";

export const metadata: Metadata = {
  title: PRODUCT_FULL,
  description: "Independent monitoring, payout checks and signed evidence for prop firms.",
  icons: { icon: "/fxscouts-favicon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
