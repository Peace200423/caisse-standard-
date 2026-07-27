import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carnet Suivi & Évaluation — KRÉA.AI",
  description:
    "Le tableau de bord de suivi-évaluation pensé pour les associations et petites structures francophones.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
