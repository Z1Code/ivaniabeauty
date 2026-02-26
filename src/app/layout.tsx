import type { Metadata } from "next";
import {
  Poppins,
  Playfair_Display,
  Dancing_Script,
} from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/layout/LayoutShell";
import LanguageInitializer from "@/components/shared/LanguageInitializer";
import FontInitializer from "@/components/shared/FontInitializer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-dancing",
  display: "swap",
});


export const metadata: Metadata = {
  metadataBase: new URL("https://ivaniabeauty.com"),
  title: "Ivania Beauty | Fajas Premium - Tu Silueta Perfecta",
  description:
    "Fajas premium que moldean sin sacrificar tu comodidad. Descubre nuestra coleccion de fajas para playa, dia a dia, eventos y post-parto.",
  keywords: "fajas, fajas premium, shapewear, moldear, silueta, playa, bikini",
  openGraph: {
    title: "Ivania Beauty | Fajas Premium - Tu Silueta Perfecta",
    description:
      "Fajas premium que moldean sin sacrificar tu comodidad. Descubre nuestra coleccion de fajas para playa, dia a dia, eventos y post-parto.",
    siteName: "Ivania Beauty",
    locale: "es_US",
    type: "website",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ivania Beauty | Fajas Premium - Tu Silueta Perfecta",
    description:
      "Fajas premium que moldean sin sacrificar tu comodidad. Descubre nuestra coleccion de fajas para playa, dia a dia, eventos y post-parto.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://ivaniabeauty.com",
  },
  icons: {
    icon: [
      // Pink logo for light mode browsers
      { url: "/favicon/light/favicon-32x32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon/light/favicon-16x16.png", sizes: "16x16", type: "image/png", media: "(prefers-color-scheme: light)" },
      // White logo for dark mode browsers
      { url: "/favicon/dark/favicon-32x32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/favicon/dark/favicon-16x16.png", sizes: "16x16", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [
      { url: "/favicon/light/apple-icon-180x180.png", sizes: "180x180" },
    ],
  },
  manifest: "/favicon/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${playfair.variable} ${dancingScript.variable} font-sans antialiased`}
      >

        <LanguageInitializer />
        <FontInitializer />
        <LayoutShell>{children}</LayoutShell>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
