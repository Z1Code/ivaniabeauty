import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Ivania Beauty",
  description:
    "Conoce cómo Ivania Beauty recopila, usa y protege tu información personal. Política de privacidad completa.",
  alternates: {
    canonical: "https://ivaniabeauty.com/politica-privacidad",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
