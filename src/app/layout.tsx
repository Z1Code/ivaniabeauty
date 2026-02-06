import type { Metadata } from "next";
import {
  Poppins,
  Playfair_Display,
  Dancing_Script,
  Cormorant_Garamond,
  Lora,
  Merriweather,
  Libre_Baskerville,
  DM_Serif_Display,
  Spectral,
  Josefin_Sans,
  Raleway,
  Outfit,
  Inter,
} from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/layout/LayoutShell";
import LanguageInitializer from "@/components/shared/LanguageInitializer";
import FontInitializer from "@/components/shared/FontInitializer";

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

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-lora",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dmserif",
  display: "swap",
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-spectral",
  display: "swap",
});

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-josefin",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-raleway",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ivania Beauty | Fajas Premium - Tu Silueta Perfecta",
  description:
    "Fajas premium que moldean sin sacrificar tu comodidad. Descubre nuestra coleccion de fajas para playa, dia a dia, eventos y post-parto.",
  keywords: "fajas, fajas premium, shapewear, moldear, silueta, playa, bikini",
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
        className={`${poppins.variable} ${playfair.variable} ${dancingScript.variable} ${cormorant.variable} ${lora.variable} ${merriweather.variable} ${libreBaskerville.variable} ${dmSerifDisplay.variable} ${spectral.variable} ${josefinSans.variable} ${raleway.variable} ${outfit.variable} ${inter.variable} font-sans antialiased`}
      >

        <LanguageInitializer />
        <FontInitializer />
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
