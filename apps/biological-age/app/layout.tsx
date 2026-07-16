import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Biological Age — Longevity Check",
  description: "A multilingual lifestyle assessment that estimates biological age."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
