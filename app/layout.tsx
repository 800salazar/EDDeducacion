import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://edd-educacion.vercel.app"),
  title: "BNI Emprendedores del Desierto Insights",
  description:
    "Aprendizaje práctico semanal para aplicar en tu negocio — Capítulo Emprendedores del Desierto.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BNI Emprendedores del Desierto Insights",
    description:
      "Aprendizaje práctico semanal para aplicar en tu negocio — Capítulo Emprendedores del Desierto.",
    url: "/",
    siteName: "BNI Emprendedores del Desierto Insights",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "BNI Emprendedores del Desierto Insights",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BNI Emprendedores del Desierto Insights",
    description:
      "Aprendizaje práctico semanal para aplicar en tu negocio — Capítulo Emprendedores del Desierto.",
    images: ["/twitter-image"],
  },
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
