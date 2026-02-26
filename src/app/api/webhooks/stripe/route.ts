import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          const orderRef = adminDb.collection("orders").doc(orderId);
          const orderSnap = await orderRef.get();

          if (orderSnap.exists) {
            await orderRef.update({
              status: "confirmed",
              paymentStatus: "paid",
              stripePaymentIntentId: session.payment_intent as string,
              updatedAt: FieldValue.serverTimestamp(),
            });

            // Update customer stats
            const order = orderSnap.data()!;
            const customerSnap = await adminDb
              .collection("customers")
              .doc(order.customerId)
              .get();

            if (customerSnap.exists) {
              await customerSnap.ref.update({
                totalOrders: FieldValue.increment(1),
                totalSpent: FieldValue.increment(order.total),
                updatedAt: FieldValue.serverTimestamp(),
              });
            }

            // Update stock
            const orderItems = await adminDb
              .collection("orderItems")
              .where("orderId", "==", orderId)
              .get();

            const batch = adminDb.batch();
            for (const item of orderItems.docs) {
              const data = item.data();
              if (data.productId) {
                const productRef = adminDb
                  .collection("products")
                  .doc(data.productId);
                batch.update(productRef, {
                  stockQuantity: FieldValue.increment(-data.quantity),
                });
              }
            }
            await batch.commit();

            // Increment coupon usage
            if (order.couponId) {
              await adminDb
                .collection("coupons")
                .doc(order.couponId)
                .update({
                  usageCount: FieldValue.increment(1),
                });
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          await adminDb.collection("orders").doc(orderId).update({
            status: "cancelled",
            paymentStatus: "failed",
            notes: "Stripe checkout session expired",
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Find order by stripePaymentIntentId
        const orderSnap = await adminDb
          .collection("orders")
          .where("stripePaymentIntentId", "==", paymentIntent.id)
          .limit(1)
          .get();

        if (!orderSnap.empty) {
          await orderSnap.docs[0].ref.update({
            paymentStatus: "failed",
            notes: `Payment failed: ${paymentIntent.last_payment_error?.message || "Unknown error"}`,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          const orderSnap = await adminDb
            .collection("orders")
            .where("stripePaymentIntentId", "==", paymentIntentId)
            .limit(1)
            .get();

          if (!orderSnap.empty) {
            await orderSnap.docs[0].ref.update({
              status: "refunded",
              paymentStatus: "refunded",
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
