import "./globals.css";
import "./product.css";
import "./profile-references.css";
import "./design-refresh.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "NutriAtlas",
  description: "Moteur nutritionnel personnel pour comprendre les aliments, les portions et les repères journaliers."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
