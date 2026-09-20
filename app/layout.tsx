import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FxScouts Prop",
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
