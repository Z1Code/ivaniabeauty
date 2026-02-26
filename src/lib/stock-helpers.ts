/**
 * Centralized stock helpers for colorSizeStock + sizeStock fallback logic.
 *
 * Every consumer should use these helpers so the fallback behavior is consistent:
 *   if colorSizeStock exists → use it
 *   else → fallback to sizeStock (legacy)
 */

type ColorSizeStock = Record<string, Record<string, number>>;
type SizeStock = Record<string, number>;

/**
 * Get the stock quantity for a specific color+size combination.
 * Falls back to sizeStock if colorSizeStock is not available.
 */
export function getColorSizeQty(
  colorSizeStock: ColorSizeStock | undefined | null,
  sizeStock: SizeStock | undefined | null,
  color: string,
  size: string
): number | undefined {
  if (colorSizeStock && Object.keys(colorSizeStock).length > 0 && color) {
    const colorEntry = colorSizeStock[color];
    if (colorEntry) return colorEntry[size];
    return undefined;
  }
  return sizeStock?.[size];
}

/**
 * Get the size→stock map for a given color.
 * Falls back to sizeStock if colorSizeStock is not available.
 */
export function getSizeStockForColor(
  colorSizeStock: ColorSizeStock | undefined | null,
  sizeStock: SizeStock | undefined | null,
  color: string
): Record<string, number> {
  if (colorSizeStock && Object.keys(colorSizeStock).length > 0 && color) {
    return colorSizeStock[color] || {};
  }
  return sizeStock || {};
}

/**
 * Check if ALL color+size combos are out of stock.
 * Falls back to sizeStock if colorSizeStock is not available.
 */
export function isAllOutOfStock(
  colorSizeStock: ColorSizeStock | undefined | null,
  sizeStock: SizeStock | undefined | null,
  colors: string[],
  sizes: string[]
): boolean {
  if (!sizes || sizes.length === 0) return false;

  if (colorSizeStock && Object.keys(colorSizeStock).length > 0) {
    for (const color of Object.keys(colorSizeStock)) {
      const sizeMap = colorSizeStock[color];
      for (const size of sizes) {
        const qty = sizeMap[size];
        if (typeof qty === "number" && qty > 0) return false;
      }
    }
    return true;
  }

  // Fallback to sizeStock
  if (!sizeStock || Object.keys(sizeStock).length === 0) return true;
  return sizes.every((size) => {
    const qty = sizeStock[size];
    return typeof qty !== "number" || qty <= 0;
  });
}

/**
 * Compute total stock across all colors and sizes.
 * Falls back to sizeStock if colorSizeStock is not available.
 */
export function computeTotalStock(
  colorSizeStock: ColorSizeStock | undefined | null,
  sizeStock: SizeStock | undefined | null
): number {
  if (colorSizeStock && Object.keys(colorSizeStock).length > 0) {
    let total = 0;
    for (const sizeMap of Object.values(colorSizeStock)) {
      for (const qty of Object.values(sizeMap)) {
        if (typeof qty === "number") total += qty;
      }
    }
    return total;
  }

  if (!sizeStock) return 0;
  return Object.values(sizeStock).reduce(
    (sum, qty) => sum + (typeof qty === "number" ? qty : 0),
    0
  );
}

/**
 * Flatten colorSizeStock into a legacy sizeStock map (sum across colors).
 */
export function flattenToSizeStock(
  colorSizeStock: ColorSizeStock
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const sizeMap of Object.values(colorSizeStock)) {
    for (const [size, qty] of Object.entries(sizeMap)) {
      result[size] = (result[size] || 0) + (typeof qty === "number" ? qty : 0);
    }
  }
  return result;
}
