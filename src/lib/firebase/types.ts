// ============================================================
// Firestore Document Types
// ============================================================

export interface AdminProfile {
  uid: string;
  email: string;
  fullName: string;
  role: "super_admin" | "admin" | "editor";
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDoc {
  slug: string;
  nameEn: string;
  nameEs: string;
  price: number;
  originalPrice: number | null;
  category: string;
  colors: string[];
  sizes: string[];
  compression: string;
  occasion: string;
  badgeEn: string | null;
  badgeEs: string | null;
  descriptionEn: string;
  descriptionEs: string;
  shortDescriptionEn: string;
  shortDescriptionEs: string;
  featuresEn: string[];
  featuresEs: string[];
  materials: string;
  care: string;
  images: string[];
  sizeChartImageUrl: string | null;
  productPageImageUrl: string | null;
  productPageImageSourceUrl: string | null;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  sku: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionDoc {
  slug: string;
  nameEn: string;
  nameEs: string;
  descriptionEn: string;
  descriptionEs: string;
  image: string;
  productCount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerDoc {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "card" | "paypal" | "transfer";
export type ShippingMethod = "standard" | "express";

export interface OrderDoc {
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  couponId: string | null;
  couponCode: string | null;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
  shippingAddressLine1: string;
  shippingAddressLine2: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  trackingNumber: string | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemDoc {
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type DiscountType = "percentage" | "fixed";

export interface CouponDoc {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignDoc {
  name: string;
  description: string;
  couponId: string | null;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  bannerImage: string | null;
  bannerTextEn: string;
  bannerTextEs: string;
  targetUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewDoc {
  productId: string;
  productName: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BannerPosition = "hero" | "promo_bar" | "collection" | "popup";

export interface BannerDoc {
  titleEn: string;
  titleEs: string;
  subtitleEn: string;
  subtitleEs: string;
  imageUrl: string;
  linkUrl: string;
  position: BannerPosition;
  sortOrder: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsEventDoc {
  eventType: string;
  eventData: Record<string, unknown>;
  sessionId: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface SizeChartMeasurement {
  size: string;
  waist_cm: string | null;
  hip_cm: string | null;
  bust_cm: string | null;
  length_cm: string | null;
}

export type FitGuideStatus = "draft" | "confirmed" | "failed" | "stale";

export interface FitGuideMetric {
  min_cm: number | null;
  max_cm: number | null;
  raw: string | null;
  confidence: number | null;
}

export interface FitGuideRow {
  size: string;
  waist?: FitGuideMetric | null;
  hip?: FitGuideMetric | null;
  bust?: FitGuideMetric | null;
  length?: FitGuideMetric | null;
  [metricKey: string]: FitGuideMetric | string | null | undefined;
}

export interface SizeChartDoc {
  productId: string;
  version: number;
  status: FitGuideStatus;
  warnings: string[];
  confidenceScore: number;
  availableSizesCanonical: string[];
  rows: FitGuideRow[];
  measurements: SizeChartMeasurement[];
  extractedAt: Date;
  sourceImageUrl: string;
  sourceImageHash: string;
  confirmedAt?: Date | null;
  confirmedBy?: string | null;
}
