import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BNI Emprendedores del Desierto Insights",
  description:
    "Aprendizaje práctico semanal para aplicar en tu negocio — Capítulo Emprendedores del Desierto.",
  icons: {
    icon: [{ url: "/bni-favicon.svg", type: "image/svg+xml" }],
    shortcut: "/bni-favicon.svg",
    apple: "/bni-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
