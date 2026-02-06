export const FIT_GUIDE_VERSION = 1;

export const SIZE_ORDER = [
  "XXS",
  "XS",
  "XS/S",
  "S",
  "S/M",
  "M",
  "M/L",
  "L",
  "L/XL",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "7XL",
] as const;

export const SIZE_ALIASES: Record<string, string> = {
  XXL: "2XL",
  "2X": "2XL",
  "2 X": "2XL",
  XXXL: "3XL",
  "3X": "3XL",
  "3 X": "3XL",
  XXXXL: "4XL",
  "4X": "4XL",
  XXXXXL: "5XL",
  "5X": "5XL",
};

export const METRIC_ALIASES: Record<string, string> = {
  cintura: "waist",
  waist: "waist",
  cadera: "hip",
  hip: "hip",
  hips: "hip",
  busto: "bust",
  pecho: "bust",
  bust: "bust",
  "contorno-busto": "bust",
  "contorno-bust": "bust",
  largo: "length",
  longitud: "length",
  length: "length",
};

export const PREFERRED_METRIC_ORDER = ["waist", "hip", "bust", "length"] as const;
