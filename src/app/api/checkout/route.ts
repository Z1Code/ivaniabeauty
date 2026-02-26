import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.customer?.email || !body.items?.length) {
      return NextResponse.json(
        { error: "Customer email and items are required" },
        { status: 400 }
      );
    }

    const { customer, items, shippingMethod, paymentMethod, couponCode } = body;

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
        }
      }
    }

    const total = Math.max(0, subtotal + shippingCost - discountAmount);

    // Generate order number
    const date = new Date();
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const orderNumber = `IB-${datePart}-${randomPart}`;

    // Find or create customer
    let customerId: string;
    const existingCustomer = await adminDb
      .collection("customers")
      .where("email", "==", customer.email)
      .limit(1)
      .get();

    if (!existingCustomer.empty) {
      customerId = existingCustomer.docs[0].id;
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
        zipCode: customer.zipCode || "",
        country: customer.country || "CO",
        totalOrders: 0,
        totalSpent: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      customerId = customerRef.id;
    }

    // Create pending order in Firestore
    const orderRef = await adminDb.collection("orders").add({
      orderNumber,
      customerId,
      customerEmail: customer.email,
      customerName:
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
      status: "pending",
      subtotal,
      shippingCost,
      discountAmount,
      taxAmount: 0,
      total,
      couponId,
      couponCode: couponCode?.toUpperCase() || null,
      paymentMethod: paymentMethod || "card",
      paymentStatus: "pending",
      stripeSessionId: null,
      stripePaymentIntentId: null,
      shippingMethod: shippingMethod || "standard",
      shippingAddressLine1: customer.addressLine1 || "",
      shippingAddressLine2: customer.addressLine2 || "",
      shippingCity: customer.city || "",
      shippingState: customer.state || "",
      shippingZip: customer.zipCode || "",
      shippingCountry: customer.country || "CO",
      trackingNumber: null,
      notes: "",
      itemCount: items.length,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create order items
    const batch = adminDb.batch();
    for (const item of items) {
      const itemRef = adminDb.collection("orderItems").doc();
      batch.set(itemRef, {
        orderId: orderRef.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage || "",
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
      });
    }
    await batch.commit();

    // Build Stripe line items
    const lineItems = items.map(
      (item: {
        productName: string;
        unitPrice: number;
        quantity: number;
        productImage?: string;
      }) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.productName,
            ...(item.productImage ? { images: [item.productImage] } : {}),
          },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      })
    );

    // Add shipping as a line item if applicable
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Express Shipping",
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Build discounts for Stripe
    const discounts: { coupon: string }[] = [];
    if (discountAmount > 0) {
      const stripeCoupon = await getStripe().coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency: "usd",
        duration: "once",
        name: couponCode?.toUpperCase() || "Discount",
      });
      discounts.push({ coupon: stripeCoupon.id });
    }

    // Create Stripe Checkout Session
    const origin = request.headers.get("origin") || "https://ivaniabeauty.com";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customer.email,
      line_items: lineItems,
      ...(discounts.length > 0 ? { discounts } : {}),
      metadata: {
        orderId: orderRef.id,
        orderNumber,
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
    });

    // Update order with Stripe session ID
    await orderRef.update({
      stripeSessionId: session.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error creating checkout session:", message, error);
    return NextResponse.json(
      { error: `Failed to create checkout session: ${message}` },
      { status: 500 }
    );
  }
}
