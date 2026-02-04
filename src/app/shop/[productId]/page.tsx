"use client";

import React, { useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ShoppingBag,
  Minus,
  Plus,
  Truck,
  RefreshCw,
  Shield,
  RotateCw,
  CheckCircle,
  X,
  ChevronRight,
} from "lucide-react";

import productsData from "@/data/products.json";
import useCart from "@/hooks/useCart";
import { formatPrice, getColorHex } from "@/lib/utils";
import { SIZE_CHART } from "@/lib/constants";
import ProductCard from "@/components/ui/ProductCard";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  category: string;
  colors: string[];
  sizes: string[];
  compression: string;
  occasion: string;
  badge: string | null;
  description: string;
  shortDescription: string;
  features: string[];
  materials: string;
  care: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

/* ------------------------------------------------------------------ */
/*  Mock reviews                                                       */
/* ------------------------------------------------------------------ */

const MOCK_REVIEWS = [
  {
    id: 1,
    name: "Maria Garcia",
    avatar: "MG",
    rating: 5,
    date: "15 Enero, 2026",
    text: "Increible calidad! La tela es super suave y realmente moldea sin incomodar. Ya es mi tercera compra en Bella Forma y nunca me decepcionan.",
  },
  {
    id: 2,
    name: "Laura Martinez",
    avatar: "LM",
    rating: 4,
    date: "8 Enero, 2026",
    text: "Muy buena faja, la uso todos los dias y se mantiene como nueva. El envio fue rapidisimo. Solo le doy 4 estrellas porque me hubiera gustado mas opciones de color.",
  },
  {
    id: 3,
    name: "Carolina Lopez",
    avatar: "CL",
    rating: 5,
    date: "28 Diciembre, 2025",
    text: "La mejor faja que he probado! Se siente como una segunda piel. La guia de tallas fue muy precisa, me quedo perfecta a la primera.",
  },
];

/* ------------------------------------------------------------------ */
/*  Thumbnail gradient palette                                         */
/* ------------------------------------------------------------------ */

const THUMB_GRADIENTS = [
  "from-rosa-light/40 to-arena",
  "from-rosa/30 to-rosa-light/50",
  "from-arena to-rosa-light/30",
  "from-rosa-light/20 to-coral/20",
];

/* ------------------------------------------------------------------ */
/*  Tab keys                                                           */
/* ------------------------------------------------------------------ */

type TabKey = "descripcion" | "tallas" | "materiales" | "resenas";

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: "descripcion", label: "Descripcion" },
  { key: "tallas", label: "Guia de Tallas" },
  { key: "materiales", label: "Materiales" },
  { key: "resenas", label: "Resenas" },
];

/* ================================================================== */
/*  PAGE COMPONENT                                                     */
/* ================================================================== */

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();

  /* ----- locate product ----- */
  const product = useMemo(
    () =>
      (productsData as ProductData[]).find(
        (p) => p.slug === productId
      ) ?? null,
    [productId]
  );

  /* If product is not found, render a friendly message */
  if (!product) {
    return <ProductNotFound />;
  }

  return <ProductDetail product={product} />;
}

/* ================================================================== */
/*  NOT FOUND                                                          */
/* ================================================================== */

function ProductNotFound() {
  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center pt-28">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-serif text-3xl font-bold text-gray-800 mb-4">
          Producto no encontrado
        </h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Lo sentimos, el producto que buscas no existe o ha sido removido de
          nuestra tienda.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-3 bg-rosa text-white rounded-full font-semibold hover:bg-rosa-dark transition-colors"
        >
          Volver a la Tienda
        </Link>
      </motion.div>
    </section>
  );
}

/* ================================================================== */
/*  PRODUCT DETAIL                                                     */
/* ================================================================== */

function ProductDetail({ product }: { product: ProductData }) {
  const addItem = useCart((s) => s.addItem);

  /* ----- local state ----- */
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("descripcion");
  const [show360, setShow360] = useState(false);

  /* ----- derived ----- */
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : null;

  const fullStars = Math.floor(product.rating);
  const hasHalfStar = product.rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  /* ----- related products ----- */
  const relatedProducts = useMemo(() => {
    const sameCat = (productsData as ProductData[]).filter(
      (p) => p.category === product.category && p.id !== product.id
    );
    const pool =
      sameCat.length >= 4
        ? sameCat
        : (productsData as ProductData[]).filter((p) => p.id !== product.id);
    return pool.slice(0, 4);
  }, [product.id, product.category]);

  /* ----- cart handler ----- */
  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? "",
      color: selectedColor,
      size: selectedSize || product.sizes[0],
      quantity,
    });
  };

  /* ----- badge style helper ----- */
  const badgeBg =
    product.badge === "Bestseller"
      ? "bg-rosa"
      : product.badge === "Nuevo"
        ? "bg-turquesa"
        : product.badge === "Oferta"
          ? "bg-dorado"
          : "bg-rosa";

  /* ---------------------------------------------------------------- */
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
      {/* ---------- BREADCRUMB ---------- */}
      <nav className="text-sm text-gray-500 mb-8 flex items-center gap-1 flex-wrap">
        <Link href="/" className="hover:text-rosa transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/shop" className="hover:text-rosa transition-colors">
          Tienda
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-800 font-medium">{product.name}</span>
      </nav>

      {/* ---------- TWO COLUMN GRID ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* ============ LEFT : GALLERY ============ */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* --- main image --- */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-rosa-light/30 to-arena group cursor-zoom-in">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-rosa-light/40 to-arena"
              style={{
                backgroundImage: `linear-gradient(135deg, ${
                  THUMB_GRADIENTS[selectedImageIndex]
                    ? ""
                    : ""
                }rgba(255,184,208,0.35), rgba(255,245,230,1))`,
              }}
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
            {/* selected gradient overlay for variety */}
            <motion.div
              key={selectedImageIndex}
              className={`absolute inset-0 bg-gradient-to-br ${THUMB_GRADIENTS[selectedImageIndex] ?? THUMB_GRADIENTS[0]}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.08 }}
            />

            {/* Badge */}
            {product.badge && (
              <span
                className={`absolute top-4 left-4 z-10 px-4 py-1.5 text-xs font-semibold text-white rounded-full ${badgeBg}`}
              >
                {product.badge}
              </span>
            )}
          </div>

          {/* --- thumbnails --- */}
          <div className="flex gap-3 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedImageIndex(i)}
                className={`flex-1 aspect-square rounded-lg overflow-hidden bg-gradient-to-br ${THUMB_GRADIENTS[i]} transition-all cursor-pointer ${
                  selectedImageIndex === i
                    ? "ring-2 ring-rosa ring-offset-2"
                    : "opacity-70 hover:opacity-100"
                }`}
                aria-label={`Imagen ${i + 1}`}
              />
            ))}
          </div>

          {/* --- 360 toggle --- */}
          <button
            onClick={() => setShow360((v) => !v)}
            className="mt-4 flex items-center gap-2 text-sm text-rosa font-semibold hover:text-rosa-dark transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            Vista 360
          </button>

          {/* --- 360 viewer --- */}
          <AnimatePresence>
            {show360 && <Viewer360 />}
          </AnimatePresence>
        </motion.div>

        {/* ============ RIGHT : PRODUCT INFO ============ */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Badge pill */}
          {product.badge && (
            <span
              className={`inline-block px-3 py-1 text-xs font-semibold text-white rounded-full mb-3 ${badgeBg}`}
            >
              {product.badge}
            </span>
          )}

          {/* Name */}
          <h1 className="font-serif text-3xl font-bold text-gray-900">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center">
              {Array.from({ length: fullStars }).map((_, i) => (
                <Star
                  key={`f-${i}`}
                  className="w-4 h-4 fill-yellow-400 text-yellow-400"
                />
              ))}
              {hasHalfStar && (
                <Star className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />
              )}
              {Array.from({ length: emptyStars }).map((_, i) => (
                <Star
                  key={`e-${i}`}
                  className="w-4 h-4 fill-transparent text-gray-300"
                />
              ))}
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {product.rating}
            </span>
            <span className="text-sm text-gray-500">
              ({product.reviewCount} resenas)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mt-4">
            <span className="text-3xl font-bold text-rosa-dark">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                {discountPercent && (
                  <span className="px-2 py-0.5 bg-rosa/10 text-rosa-dark text-sm font-semibold rounded-full">
                    {discountPercent}% OFF
                  </span>
                )}
              </>
            )}
          </div>

          {/* Short description */}
          <p className="text-gray-600 mt-4 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Divider */}
          <hr className="border-t border-rosa-light/30 my-6" />

          {/* ----- Color selector ----- */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Color:{" "}
              <span className="font-normal capitalize text-gray-500">
                {selectedColor}
              </span>
            </p>
            <div className="flex items-center gap-3">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                    selectedColor === color
                      ? "ring-2 ring-rosa ring-offset-2 border-transparent"
                      : "border-gray-200 hover:border-rosa-light"
                  }`}
                  style={{ backgroundColor: getColorHex(color) }}
                  aria-label={color}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* ----- Size selector ----- */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">
                Talla:{" "}
                <span className="font-normal text-gray-500">
                  {selectedSize || "Selecciona"}
                </span>
              </p>
              <button
                onClick={() => setShowSizeGuide(true)}
                className="text-sm text-rosa font-semibold underline underline-offset-2 hover:text-rosa-dark transition-colors cursor-pointer"
              >
                Guia de Tallas
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[3rem] px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    selectedSize === size
                      ? "bg-rosa text-white shadow-md"
                      : "border border-gray-300 text-gray-700 hover:border-rosa hover:text-rosa"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* ----- Quantity ----- */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Cantidad
            </p>
            <div className="inline-flex items-center border border-gray-300 rounded-full overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-rosa-light/30 transition-colors cursor-pointer"
                aria-label="Disminuir cantidad"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-semibold text-gray-800 select-none">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-rosa-light/30 transition-colors cursor-pointer"
                aria-label="Aumentar cantidad"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ----- Add to Cart ----- */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToCart}
            className="w-full py-4 bg-rosa text-white rounded-full text-lg font-semibold hover:bg-rosa-dark transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            Agregar al Carrito
          </motion.button>

          {/* ----- Buy Now ----- */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToCart}
            className="w-full mt-3 py-4 border-2 border-rosa text-rosa rounded-full text-lg font-semibold hover:bg-rosa hover:text-white transition-colors cursor-pointer"
          >
            Comprar Ahora
          </motion.button>

          {/* ----- Trust badges ----- */}
          <div className="mt-6 flex justify-center gap-8 text-gray-500">
            <div className="flex flex-col items-center gap-1 text-xs">
              <Truck className="w-5 h-5 text-rosa" />
              <span>Envio Gratis</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-xs">
              <RefreshCw className="w-5 h-5 text-rosa" />
              <span>30 Dias Devolucion</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-xs">
              <Shield className="w-5 h-5 text-rosa" />
              <span>Pago Seguro</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ----- Size Guide Modal ----- */}
      <AnimatePresence>
        {showSizeGuide && (
          <SizeGuideModal onClose={() => setShowSizeGuide(false)} />
        )}
      </AnimatePresence>

      {/* ============ TABS SECTION ============ */}
      <div className="mt-16">
        {/* Tab buttons */}
        <div className="flex gap-6 border-b border-gray-200 overflow-x-auto">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === key
                  ? "border-b-2 border-rosa text-rosa font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="py-8">
          <AnimatePresence mode="wait">
            {activeTab === "descripcion" && (
              <TabPanel key="descripcion">
                <p className="text-gray-600 leading-relaxed mb-6">
                  {product.description}
                </p>
                <ul className="space-y-3">
                  {product.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-turquesa flex-shrink-0" />
                      <span className="text-gray-700">{feat}</span>
                    </li>
                  ))}
                </ul>
              </TabPanel>
            )}

            {activeTab === "tallas" && (
              <TabPanel key="tallas">
                <SizeChartTable />
              </TabPanel>
            )}

            {activeTab === "materiales" && (
              <TabPanel key="materiales">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Composicion
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      {product.materials}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Cuidados
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      {product.care}
                    </p>
                  </div>
                </div>
              </TabPanel>
            )}

            {activeTab === "resenas" && (
              <TabPanel key="resenas">
                <ReviewsList rating={product.rating} count={product.reviewCount} />
              </TabPanel>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ============ RELATED PRODUCTS ============ */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 mb-8">
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-8">
            Tambien te puede gustar
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
            {relatedProducts.map((rp) => (
              <div key={rp.id} className="min-w-[260px] max-w-[280px] snap-start flex-shrink-0">
                <ProductCard product={rp} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ================================================================== */
/*  SUB-COMPONENTS                                                     */
/* ================================================================== */

/* ---------- Tab Panel wrapper ---------- */

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Size Chart Table ---------- */

function SizeChartTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-rosa-light/40">
            <th className="py-3 pr-6 font-semibold text-gray-800">Talla</th>
            <th className="py-3 pr-6 font-semibold text-gray-800">
              Cintura (cm)
            </th>
            <th className="py-3 font-semibold text-gray-800">Cadera (cm)</th>
          </tr>
        </thead>
        <tbody>
          {SIZE_CHART.map((row) => (
            <tr
              key={row.size}
              className="border-b border-gray-100 hover:bg-rosa-light/10 transition-colors"
            >
              <td className="py-3 pr-6 font-medium text-gray-800">
                {row.size}
              </td>
              <td className="py-3 pr-6 text-gray-600">{row.waist}</td>
              <td className="py-3 text-gray-600">{row.hip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Size Guide Modal ---------- */

function SizeGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-white rounded-2xl p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl z-10"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6">
          Guia de Tallas
        </h2>

        <SizeChartTable />

        {/* How to measure */}
        <div className="mt-8 p-4 bg-arena/60 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-2">Como medirte</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <strong>Cintura:</strong> Mide alrededor de la parte mas estrecha
              de tu torso, generalmente a la altura del ombligo.
            </li>
            <li>
              <strong>Cadera:</strong> Mide alrededor de la parte mas ancha de
              tus caderas, pasando por los gluteos.
            </li>
            <li>
              Usa una cinta metrica flexible y manten la cinta ajustada pero sin
              apretar.
            </li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-rosa text-white rounded-full font-semibold hover:bg-rosa-dark transition-colors cursor-pointer"
        >
          Entendido
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ---------- 360 Viewer ---------- */

function Viewer360() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastXRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    lastXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    setRotation((prev) => prev + delta * 0.8);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 overflow-hidden"
    >
      <div
        className="relative h-64 rounded-2xl bg-gradient-to-br from-rosa-light/20 to-arena overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Rotating gradient to simulate 360 */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-rosa/30 via-transparent to-rosa-light/40"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
        />
        <div
          className="absolute inset-8 rounded-full bg-gradient-to-tr from-rosa-light/50 to-arena/70"
          style={{
            transform: `rotate(${-rotation * 0.5}deg)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
        />

        {/* Rotation angle label */}
        <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-600">
          {Math.round(((rotation % 360) + 360) % 360)}
        </div>

        {/* Instruction text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 text-gray-500 text-sm bg-white/60 backdrop-blur-sm rounded-full px-4 py-2">
            <RotateCw className="w-4 h-4" />
            <span>Arrastra para girar</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Reviews List ---------- */

function ReviewsList({ rating, count }: { rating: number; count: number }) {
  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-8">
        <div className="text-center">
          <span className="text-4xl font-bold text-gray-900">{rating}</span>
          <div className="flex items-center mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">{count} resenas</p>
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-6">
        {MOCK_REVIEWS.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: review.id * 0.1 }}
            className="border-b border-gray-100 pb-6 last:border-0"
          >
            <div className="flex items-center gap-3 mb-2">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rosa-light to-rosa flex items-center justify-center text-white text-sm font-semibold">
                {review.avatar}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {review.name}
                </p>
                <p className="text-xs text-gray-400">{review.date}</p>
              </div>
            </div>
            {/* Stars */}
            <div className="flex items-center gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-transparent text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {review.text}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
