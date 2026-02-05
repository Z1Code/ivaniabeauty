import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// POST: Create a new order (public - from checkout)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.customer?.email || !body.items?.length) {
      return NextResponse.json(
        { error: "Customer email and items are required" },
        { status: 400 }
      );
    }

    const { customer, items, shippingMethod, paymentMethod, couponCode } = body;

    // Generate order number
    const date = new Date();
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const orderNumber = `IB-${datePart}-${randomPart}`;

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) =>
        sum + item.unitPrice * item.quantity,
      0
    );
    const shippingCost = shippingMethod === "express" ? 12.99 : 0;

    // Validate and apply coupon
    let discountAmount = 0;
    let couponId = null;
    if (couponCode) {
      const couponSnap = await adminDb
        .collection("coupons")
        .where("code", "==", couponCode.toUpperCase())
        .where("isActive", "==", true)
        .limit(1)
        .get();

      if (!couponSnap.empty) {
        const couponDoc = couponSnap.docs[0];
        const coupon = couponDoc.data();
        const now = new Date();

        const isValid =
          (!coupon.startsAt || coupon.startsAt.toDate() <= now) &&
          (!coupon.expiresAt || coupon.expiresAt.toDate() >= now) &&
          (coupon.usageLimit === null ||
            coupon.usageCount < coupon.usageLimit) &&
          subtotal >= (coupon.minPurchase || 0);

        if (isValid) {
          couponId = couponDoc.id;
          if (coupon.discountType === "percentage") {
            discountAmount = subtotal * (coupon.discountValue / 100);
            if (coupon.maxDiscount) {
              discountAmount = Math.min(discountAmount, coupon.maxDiscount);
            }
          } else {
            discountAmount = Math.min(coupon.discountValue, subtotal);
          }

          // Increment usage count
          await couponDoc.ref.update({
            usageCount: FieldValue.increment(1),
          });
        }
      }
    }

    const total = Math.max(0, subtotal + shippingCost - discountAmount);

    // Find or create customer
    let customerId: string;
    const existingCustomer = await adminDb
      .collection("customers")
      .where("email", "==", customer.email)
      .limit(1)
      .get();

    if (!existingCustomer.empty) {
      customerId = existingCustomer.docs[0].id;
      await existingCustomer.docs[0].ref.update({
        totalOrders: FieldValue.increment(1),
        totalSpent: FieldValue.increment(total),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      const customerRef = await adminDb.collection("customers").add({
        email: customer.email,
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        phone: customer.phone || "",
        addressLine1: customer.addressLine1 || "",
        addressLine2: customer.addressLine2 || "",
        city: customer.city || "",
        state: customer.state || "",
        zipCode: customer.zip || "",
        country: customer.country || "CO",
        totalOrders: 1,
        totalSpent: total,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      customerId = customerRef.id;
    }

    // Create order
    const orderRef = await adminDb.collection("orders").add({
      orderNumber,
      customerId,
      customerEmail: customer.email,
      customerName: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
      status: "pending",
      subtotal,
      shippingCost,
      discountAmount,
      taxAmount: 0,
      total,
      couponId,
      couponCode: couponCode?.toUpperCase() || null,
      paymentMethod: paymentMethod || "card",
      shippingMethod: shippingMethod || "standard",
      shippingAddressLine1: customer.addressLine1 || "",
      shippingAddressLine2: customer.addressLine2 || "",
      shippingCity: customer.city || "",
      shippingState: customer.state || "",
      shippingZip: customer.zip || "",
      shippingCountry: customer.country || "CO",
      trackingNumber: null,
      notes: "",
      itemCount: items.length,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create order items and update stock
    const batch = adminDb.batch();
    for (const item of items) {
      const itemRef = adminDb.collection("orderItems").doc();
      batch.set(itemRef, {
        orderId: orderRef.id,
        productId: item.productId,
        productName: item.name,
        productImage: item.image || "",
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
      });

      // Decrement stock if productId is a valid Firestore doc
      if (item.productId) {
        try {
          const productRef = adminDb
            .collection("products")
            .doc(item.productId);
          batch.update(productRef, {
            stockQuantity: FieldValue.increment(-item.quantity),
          });
        } catch {
          // Product may not exist in Firestore yet during migration
        }
      }
    }
    await batch.commit();

    return NextResponse.json(
      {
        success: true,
        orderNumber,
        orderId: orderRef.id,
        total,
        discountAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
