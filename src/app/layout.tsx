import type { Metadata } from "next";
import AppBackground from "@/components/AppBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "LabLink Nexus | Intelligent Campus Labs",
  description: "Discover, allocate, and share specialised campus laboratory resources across departments."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppBackground />
        {children}
      </body>
    </html>
  );
}
