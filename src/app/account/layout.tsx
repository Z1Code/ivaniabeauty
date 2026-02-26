import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account | Ivania Beauty",
  description: "Manage your Ivania Beauty profile and orders",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
