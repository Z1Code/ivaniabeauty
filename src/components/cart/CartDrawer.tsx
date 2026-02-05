"use client";

import { useState, useCallback } from "react";
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
} from "lucide-react";

import useCart from "@/hooks/useCart";
import { formatPrice, getColorHex, cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

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
  const [discountCode, setDiscountCode] = useState("");
  const [checkoutFilling, setCheckoutFilling] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);

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
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-rosa-light/30">
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-xl font-semibold">{t("cart.heading")}</h2>
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
                    {items.map((item) => (
                      <motion.div
                        key={`${item.id}-${item.color}-${item.size}`}
                        layout
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-4"
                      >
                        {/* Product Image Placeholder */}
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-rosa-light/30 to-arena flex-shrink-0 overflow-hidden">
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
                              style={{ backgroundColor: getColorHex(item.color) }}
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
                              aria-label={t("cart.decreaseQuantityAriaLabel")}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.color,
                                  item.size,
                                  item.quantity + 1
                                )
                              }
                              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-rosa hover:text-rosa transition-colors duration-200"
                              aria-label={t("cart.increaseQuantityAriaLabel")}
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
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer - only show when cart has items */}
            {items.length > 0 && (
              <div className="border-t border-rosa-light/30 p-6 space-y-4">
                {/* Discount Code */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder={t("cart.discountPlaceholder")}
                    className="flex-1 px-4 py-2 text-sm rounded-full border border-rosa-light/40 focus:border-rosa focus:ring-2 focus:ring-rosa/20 outline-none transition-all duration-200"
                  />
                  <button className="px-4 py-2 text-sm font-semibold text-rosa border border-rosa rounded-full hover:bg-rosa hover:text-white transition-colors duration-200">
                    {t("cart.discountApply")}
                  </button>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t("cart.subtotalLabel")}</span>
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
                  animate={checkoutFilling ? { scale: 0.95 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  whileTap={!checkoutFilling && !checkoutReady ? { scale: 0.93 } : undefined}
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
                    animate={{ width: checkoutFilling ? "100%" : "0%" }}
                    transition={checkoutFilling ? { duration: 0.5, ease: "easeOut" } : { duration: 0 }}
                  />
                  {/* Label */}
                  <AnimatePresence mode="wait">
                    {checkoutReady ? (
                      <motion.span
                        key="check"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
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
                          checkoutFilling ? "text-white" : "text-rosa-dark"
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
