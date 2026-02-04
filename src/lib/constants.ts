export const SITE_NAME = "Ivania Beauty";
export const SITE_DESCRIPTION = "Fajas premium que moldean sin sacrificar tu comodidad";

export const COLORS = {
  rosaPrincipal: "#FF6B9D",
  rosaClaro: "#FFB8D0",
  rosaOscuro: "#E91E63",
  arena: "#FFF5E6",
  blancoPerla: "#FFFAF5",
  dorado: "#D4AF37",
  turquesa: "#40E0D0",
  coral: "#FF7F7F",
} as const;

export const NAV_LINKS = [
  { labelKey: "nav.home", href: "/" },
  { labelKey: "nav.shop", href: "/shop" },
  { labelKey: "nav.collections", href: "/#colecciones" },
  { labelKey: "nav.about", href: "/#nosotros" },
  { labelKey: "nav.contact", href: "/#contacto" },
] as const;

export const SIZE_CHART = [
  { size: "XS", waist: "58-62", hip: "84-88" },
  { size: "S", waist: "63-67", hip: "89-93" },
  { size: "M", waist: "68-72", hip: "94-98" },
  { size: "L", waist: "73-77", hip: "99-103" },
  { size: "XL", waist: "78-82", hip: "104-108" },
  { size: "2XL", waist: "83-87", hip: "109-113" },
  { size: "3XL", waist: "88-92", hip: "114-118" },
  { size: "4XL", waist: "93-97", hip: "119-123" },
] as const;
