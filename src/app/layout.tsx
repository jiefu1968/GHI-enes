import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global Harvest Initiative",
  description: "Multi-agent AI system for training Christian missionaries · Sistema de IA multiagente para la formación de misioneros cristianos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="min-h-screen bg-harvest-bg font-sans antialiased">{children}</body>
    </html>
  );
}
