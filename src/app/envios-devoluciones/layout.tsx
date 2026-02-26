import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Envios y Devoluciones | Ivania Beauty",
  description:
    "Conoce nuestras politicas de envio gratis, devoluciones y cambios. Enviamos a todo Estados Unidos con entrega rapida y segura.",
  alternates: {
    canonical: "https://ivaniabeauty.com/envios-devoluciones",
  },
};

export default function EnviosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
