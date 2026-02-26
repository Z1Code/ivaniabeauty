"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingBag,
  X,
  Minus,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
} from "lucide-react";

import useCart from "@/hooks/useCart";
import { formatPrice, getColorHex, cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

// Stock data keyed by "productId::color::size" for per-color-size or "productId::size" for per-size
type StockMap = Record<string, number | undefined>;

function stockKey(productId: string, color: string, size: string): string {
  if (!size) return productId;
  return color ? `${productId}::${color}::${size}` : `${productId}::::${size}`;
}

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalItems,
    subtotal,
  } = useCart();

  const { t } = useTranslation();
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [checkoutFilling, setCheckoutFilling] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);

  // Stock data fetched from API
  const [stockMap, setStockMap] = useState<StockMap>({});
  const [stockFetched, setStockFetched] = useState(false);

  // Per-item warnings (briefly shown when user hits the limit)
  const [warnings, setWarnings] = useState<Record<string, boolean>>({});

  // Fetch stock for all cart items when drawer opens
  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setStockFetched(false);
      return;
    }

    // Deduplicate product IDs
    const productIds = [...new Set(items.map((i) => i.id))];
    let cancelled = false;

    async function fetchAllStock() {
      const map: StockMap = {};
      await Promise.all(
        productIds.map(async (pid) => {
          try {
            const res = await fetch(`/api/products/${pid}/stock`);
            if (!res.ok) return;
            const data = await res.json();
            const colorSizeStock: Record<string, Record<string, number>> | null = data.colorSizeStock || null;
            const sizeStock: Record<string, number> = data.sizeStock || {};

            if (colorSizeStock && Object.keys(colorSizeStock).length > 0) {
              // Use colorSizeStock keyed by color+size
              for (const [color, sizeMap] of Object.entries(colorSizeStock)) {
                for (const [size, qty] of Object.entries(sizeMap)) {
                  map[stockKey(pid, color, size)] = qty as number;
                }
              }
            } else {
              // Fallback to sizeStock (no color dimension)
              for (const [size, qty] of Object.entries(sizeStock)) {
                map[stockKey(pid, "", size)] = qty as number;
              }
            }
          } catch {
            // Silent fail — stock enforcement is best-effort
          }
        })
      );
      if (!cancelled) {
        setStockMap(map);
        setStockFetched(true);
      }
    }

    void fetchAllStock();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, items.length]);

  // Get max stock for a cart item — colorSizeStock is the primary source
  function getMaxStock(item: { id: string; color: string; size: string }): number {
    if (!item.size) return Infinity; // products without sizes → no limit
    // Try color+size key first, then fallback to no-color key
    const qty = stockMap[stockKey(item.id, item.color, item.size)]
      ?? stockMap[stockKey(item.id, "", item.size)];
    if (typeof qty === "number") return qty;
    // Size not in stockMap → could mean no data fetched yet or size not tracked
    return stockFetched ? 0 : Infinity;
  }

  // Auto-cap quantities when stock data arrives
  useEffect(() => {
    if (!stockFetched || items.length === 0) return;
    for (const item of items) {
      const max = getMaxStock(item);
      if (max !== Infinity && item.quantity > max) {
        updateQuantity(item.id, item.color, item.size, Math.max(1, max));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockFetched, stockMap]);

  // Show a brief warning for an item
  function flashWarning(itemKey: string) {
    setWarnings((w) => ({ ...w, [itemKey]: true }));
    setTimeout(() => {
      setWarnings((w) => ({ ...w, [itemKey]: false }));
    }, 3000);
  }

  // Focus trap for cart drawer
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCart();
        return;
      }
      if (e.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;

      const focusable = drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Focus the drawer when it opens
    const timer = setTimeout(() => {
      const drawer = drawerRef.current;
      if (drawer) {
        const firstFocusable = drawer.querySelector<HTMLElement>(
          "button, a[href], input"
        );
        firstFocusable?.focus();
      }
    }, 100);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, closeCart]);

  const handleCheckout = useCallback(() => {
    if (checkoutFilling || checkoutReady) return;
    setCheckoutFilling(true);
    setTimeout(() => {
      setCheckoutFilling(false);
      setCheckoutReady(true);
      setTimeout(() => {
        closeCart();
        router.push("/checkout");
        setCheckoutReady(false);
      }, 600);
    }, 500);
  }, [checkoutFilling, checkoutReady, closeCart, router]);

  const count = totalItems();
  const cartSubtotal = subtotal();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-rosa-light/30">
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-xl font-semibold">
                  {t("cart.heading")}
                </h2>
                <ShoppingBag className="w-5 h-5 text-rosa" />
                {count > 0 && (
                  <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-rosa rounded-full">
                    {count}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                aria-label={t("cart.closeAriaLabel")}
                className="p-2 rounded-full hover:bg-rosa-light/30 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                /* Empty Cart State */
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <ShoppingBag className="w-16 h-16 text-rosa-light" />
                  <p className="font-serif text-lg text-gray-500">
                    {t("cart.emptyHeading")}
                  </p>
                  <p className="text-sm text-gray-400">
                    {t("cart.emptyText")}
                  </p>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="mt-4 px-8 py-3 bg-rosa text-white rounded-full font-semibold hover:bg-rosa-dark transition-colors duration-300"
                  >
                    {t("cart.emptyCta")}
                  </Link>
                </div>
              ) : (
                /* Cart Items List */
                <div className="flex flex-col gap-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const itemKey = `${item.id}-${item.color}-${item.size}`;
                      const max = stockFetched
                        ? getMaxStock(item)
                        : Infinity;
                      const atMax =
                        max !== Infinity && item.quantity >= max;
                      const isLowStock =
                        stockFetched && max !== Infinity && max <= 2 && max > 0;
                      const showWarning = warnings[itemKey] || false;

                      return (
                        <motion.div
                          key={itemKey}
                          layout
                          initial={{ opacity: 0, x: 40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{
                            opacity: 0,
                            x: -40,
                            height: 0,
                            marginBottom: 0,
                          }}
                          transition={{ duration: 0.25 }}
                          className="flex gap-4"
                        >
                          {/* Product Image */}
                          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-rosa-light/30 to-arena flex-shrink-0 overflow-hidden relative">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {item.name}
                            </p>

                            {/* Color & Size */}
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                                style={{
                                  backgroundColor: getColorHex(item.color),
                                }}
                              />
                              <span className="text-xs text-gray-500 capitalize">
                                {item.color}
                              </span>
                              <span className="text-xs text-gray-300">|</span>
                              <span className="text-xs text-gray-500 uppercase">
                                {item.size}
                              </span>
                            </div>

                            {/* Price */}
                            <p className="text-rosa-dark font-semibold text-sm mt-1">
                              {formatPrice(item.price)}
                            </p>

                            {/* Low stock badge */}
                            {isLowStock && (
                              <p className="flex items-center gap-1 text-[10px] text-amber-600 mt-1">
                                <AlertTriangle className="w-3 h-3" />
                                {t("cart.lowStockBadge").replace(
                                  "{count}",
                                  String(max)
                                )}
                              </p>
                            )}

                            {/* Max stock warning */}
                            <AnimatePresence>
                              {showWarning && atMax && (
                                <motion.p
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  className="text-[10px] text-red-500 mt-1"
                                >
                                  {t("cart.maxStockReached").replace(
                                    "{count}",
                                    String(max)
                                  )}
                                </motion.p>
                              )}
                            </AnimatePresence>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.color,
                                    item.size,
                                    item.quantity - 1
                                  )
                                }
                                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-rosa hover:text-rosa transition-colors duration-200"
                                aria-label={t(
                                  "cart.decreaseQuantityAriaLabel"
                                )}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-medium w-6 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  if (atMax) {
                                    flashWarning(itemKey);
                                    return;
                                  }
                                  updateQuantity(
                                    item.id,
                                    item.color,
                                    item.size,
                                    item.quantity + 1
                                  );
                                }}
                                className={cn(
                                  "w-7 h-7 rounded-full border flex items-center justify-center transition-colors duration-200",
                                  atMax
                                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                    : "border-gray-300 hover:border-rosa hover:text-rosa"
                                )}
                                aria-label={t(
                                  "cart.increaseQuantityAriaLabel"
                                )}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() =>
                              removeItem(item.id, item.color, item.size)
                            }
                            className="self-start p-1 text-gray-400 hover:text-rosa-dark transition-colors duration-200"
                            aria-label={t("cart.removeAriaLabel")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer - only show when cart has items */}
            {items.length > 0 && (
              <div className="border-t border-rosa-light/30 p-6 space-y-4">
                {/* Discount Code */}
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value.toUpperCase());
                        if (discountError) setDiscountError("");
                      }}
                      placeholder={t("cart.discountPlaceholder")}
                      className="flex-1 px-4 py-2 text-sm rounded-full border border-rosa-light/40 focus:border-rosa focus:ring-2 focus:ring-rosa/20 outline-none transition-all duration-200 uppercase"
                    />
                    <button
                      onClick={async () => {
                        if (!discountCode.trim() || discountLoading) return;
                        setDiscountLoading(true);
                        setDiscountError("");
                        try {
                          const res = await fetch("/api/coupons/validate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              code: discountCode.trim(),
                            }),
                          });
                          const data = await res.json();
                          if (data.valid) {
                            closeCart();
                            router.push(
                              `/checkout?coupon=${encodeURIComponent(discountCode.trim())}`
                            );
                          } else {
                            setDiscountError(
                              data.message || t("checkout.couponInvalid")
                            );
                          }
                        } catch {
                          setDiscountError(t("checkout.couponInvalid"));
                        } finally {
                          setDiscountLoading(false);
                        }
                      }}
                      disabled={discountLoading || !discountCode.trim()}
                      className="px-4 py-2 text-sm font-semibold text-rosa border border-rosa rounded-full hover:bg-rosa hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("cart.discountApply")}
                    </button>
                  </div>
                  {discountError && (
                    <p
                      role="alert"
                      className="text-red-500 text-xs mt-1.5 px-2"
                    >
                      {discountError}
                    </p>
                  )}
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {t("cart.subtotalLabel")}
                  </span>
                  <span className="font-semibold text-lg">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>

                {/* Shipping Note */}
                <p className="text-xs text-gray-500 text-center">
                  {t("cart.freeShippingNote")}
                </p>

                {/* Checkout Button */}
                <motion.button
                  onClick={handleCheckout}
                  animate={
                    checkoutFilling ? { scale: 0.95 } : { scale: 1 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                  }}
                  whileTap={
                    !checkoutFilling && !checkoutReady
                      ? { scale: 0.93 }
                      : undefined
                  }
                  className={cn(
                    "group/btn relative w-full py-3 rounded-xl text-sm font-semibold cursor-pointer overflow-hidden transition-all duration-300",
                    checkoutReady
                      ? "border border-emerald-400/50 bg-emerald-50"
                      : "border border-rosa/30 bg-rosa/5 hover:border-rosa hover:shadow-md hover:shadow-rosa/15"
                  )}
                >
                  {/* Fill bar */}
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-rosa to-rosa-dark"
                    initial={{ width: "0%" }}
                    animate={{
                      width: checkoutFilling ? "100%" : "0%",
                    }}
                    transition={
                      checkoutFilling
                        ? { duration: 0.5, ease: "easeOut" }
                        : { duration: 0 }
                    }
                  />
                  {/* Label */}
                  <AnimatePresence mode="wait">
                    {checkoutReady ? (
                      <motion.span
                        key="check"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 25,
                        }}
                        className="relative z-10 flex items-center justify-center gap-2 text-emerald-600"
                      >
                        <Check className="w-4 h-4" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="label"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "relative z-10 flex items-center justify-center gap-2 transition-colors duration-300",
                          checkoutFilling
                            ? "text-white"
                            : "text-rosa-dark"
                        )}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {t("cart.checkoutButton")}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Continue Shopping */}
                <button
                  onClick={closeCart}
                  className="w-full text-center text-sm text-gray-500 hover:text-rosa-dark transition-colors duration-200"
                >
                  {t("cart.continueShopping")}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
