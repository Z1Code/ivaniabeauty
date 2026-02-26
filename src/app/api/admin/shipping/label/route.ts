import { NextResponse } from "next/server";
import { getShippo } from "@/lib/shippo";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { rateId, orderId, shipmentId } = body;

  if (!rateId || !orderId) {
    return NextResponse.json(
      { error: "rateId and orderId are required" },
      { status: 400 }
    );
  }

  const orderDoc = await adminDb.collection("orders").doc(orderId).get();
  if (!orderDoc.exists) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  try {
    const shippo = getShippo();

    const transaction = await shippo.transactions.create({
      rate: rateId,
      async: false,
      labelFileType: "PDF_4x6",
      metadata: `Order ${orderDoc.data()?.orderNumber || orderId}`,
    });

    if (transaction.status !== "SUCCESS") {
      const errorMessages = transaction.messages
        ?.map((m) => m.text)
        .join("; ");
      return NextResponse.json(
        { error: errorMessages || "Label purchase failed" },
        { status: 400 }
      );
    }

    const rateObj = typeof transaction.rate === "object" ? transaction.rate : null;

    await adminDb.collection("orders").doc(orderId).update({
      trackingNumber: transaction.trackingNumber || null,
      trackingUrlProvider: transaction.trackingUrlProvider || null,
      labelUrl: transaction.labelUrl || null,
      labelCarrier: rateObj?.provider || null,
      labelServiceLevel: rateObj?.servicelevelToken || null,
      labelShippoCost: rateObj?.amount
        ? parseFloat(rateObj.amount)
        : null,
      shippoShipmentId: shipmentId || null,
      status: "shipped",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      trackingNumber: transaction.trackingNumber,
      trackingUrl: transaction.trackingUrlProvider,
      labelUrl: transaction.labelUrl,
      carrier: rateObj?.provider,
      serviceLevel: rateObj?.servicelevelName,
      cost: rateObj?.amount,
    });
  } catch (err) {
    console.error("Shippo label error:", err);
    return NextResponse.json(
      { error: "Failed to purchase shipping label" },
      { status: 500 }
    );
  }
}
