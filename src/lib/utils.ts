export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function getColorHex(color: string): string {
  const colors: Record<string, string> = {
    nude: "#E8C4A0",
    negro: "#1A1A1A",
    rosa: "#FF6B9D",
    champagne: "#F7E7CE",
    coral: "#FF7F7F",
    turquesa: "#40E0D0",
  };
  return colors[color] || "#CCCCCC";
}

export function getCompressionLabel(level: string): string {
  const labels: Record<string, string> = {
    suave: "Compresion Suave",
    media: "Compresion Media",
    firme: "Compresion Firme",
  };
  return labels[level] || level;
}
