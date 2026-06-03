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
  title: "Educación",
  description:
    "Aprendizaje práctico semanal para aplicar en tu negocio.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Educación",
    description:
      "Aprendizaje práctico semanal para aplicar en tu negocio.",
    url: "/",
    siteName: "Educación",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Educación",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Educación",
    description:
      "Aprendizaje práctico semanal para aplicar en tu negocio.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
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
