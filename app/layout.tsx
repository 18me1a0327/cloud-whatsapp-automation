import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Cloud WhatsApp Automation", description: "Scheduled, consent-based WhatsApp notifications." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
