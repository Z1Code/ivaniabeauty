import { requireAdmin } from "@/lib/firebase/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import OrderDetailClient from "./OrderDetailClient";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  // Fetch order document
  const orderDoc = await adminDb.collection("orders").doc(id).get();
  if (!orderDoc.exists) {
    notFound();
  }

  const orderData = orderDoc.data()!;

  // Fetch order items
  const itemsSnap = await adminDb
    .collection("orderItems")
    .where("orderId", "==", id)
    .get();

  const items = itemsSnap.docs.map((doc) => ({
    id: doc.id,
    productId: doc.data().productId || "",
    productName: doc.data().productName || "",
    productImage: doc.data().productImage || "",
    color: doc.data().color || "",
    size: doc.data().size || "",
    quantity: doc.data().quantity || 0,
    unitPrice: doc.data().unitPrice || 0,
    totalPrice: doc.data().totalPrice || 0,
  }));

  const order = {
    id: orderDoc.id,
    orderNumber: orderData.orderNumber || "",
    customerId: orderData.customerId || "",
    customerEmail: orderData.customerEmail || "",
    customerName: orderData.customerName || "",
    status: orderData.status || "pending",
    subtotal: orderData.subtotal || 0,
    shippingCost: orderData.shippingCost || 0,
    discountAmount: orderData.discountAmount || 0,
    taxAmount: orderData.taxAmount || 0,
    total: orderData.total || 0,
    couponCode: orderData.couponCode || null,
    paymentMethod: orderData.paymentMethod || "",
    shippingMethod: orderData.shippingMethod || "",
    shippingAddressLine1: orderData.shippingAddressLine1 || "",
    shippingAddressLine2: orderData.shippingAddressLine2 || "",
    shippingCity: orderData.shippingCity || "",
    shippingState: orderData.shippingState || "",
    shippingZip: orderData.shippingZip || "",
    shippingCountry: orderData.shippingCountry || "",
    trackingNumber: orderData.trackingNumber || "",
    labelUrl: orderData.labelUrl || null,
    labelCarrier: orderData.labelCarrier || null,
    labelServiceLevel: orderData.labelServiceLevel || null,
    labelShippoCost: orderData.labelShippoCost || null,
    trackingUrlProvider: orderData.trackingUrlProvider || null,
    shippoShipmentId: orderData.shippoShipmentId || null,
    notes: orderData.notes || "",
    createdAt: orderData.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: orderData.updatedAt?.toDate?.()?.toISOString() || null,
    items,
  };

  return <OrderDetailClient order={order} />;
}
