import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Ivania Beauty",
  description:
    "Lee los términos y condiciones de uso de Ivania Beauty. Información sobre compras, envíos, devoluciones y más.",
  alternates: {
    canonical: "https://ivaniabeauty.com/terminos-condiciones",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
