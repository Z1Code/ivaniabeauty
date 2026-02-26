import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";

// POST: Generate shipping label for a single order (auto-selects cheapest USPS rate)
export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId, batchId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderSnap.data()!;

    // Skip if label already exists
    if (order.labelUrl) {
      return NextResponse.json({
        success: true,
        skipped: true,
        labelUrl: order.labelUrl,
        message: "Label already exists",
      });
    }

    const shippoToken = process.env.SHIPPO_API_TOKEN;
    if (!shippoToken) {
      return NextResponse.json(
        { error: "Shippo API token not configured" },
        { status: 500 }
      );
    }

    // Create shipment in Shippo
    const shipmentRes = await fetch("https://api.goshippo.com/shipments/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${shippoToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address_from: {
          name: "Ivania Beauty",
          street1: process.env.SHIPPO_FROM_STREET || "123 Main St",
          city: process.env.SHIPPO_FROM_CITY || "Miami",
          state: process.env.SHIPPO_FROM_STATE || "FL",
          zip: process.env.SHIPPO_FROM_ZIP || "33101",
          country: "US",
        },
        address_to: {
          name: order.customerName,
          street1: order.shippingAddressLine1,
          street2: order.shippingAddressLine2 || "",
          city: order.shippingCity,
          state: order.shippingState,
          zip: order.shippingZip,
          country: order.shippingCountry || "US",
        },
        parcels: [
          {
            length: "12",
            width: "10",
            height: "4",
            distance_unit: "in",
            weight: "1",
            mass_unit: "lb",
          },
        ],
        async: false,
      }),
    });

    if (!shipmentRes.ok) {
      const err = await shipmentRes.text();
      console.error("Shippo shipment error:", err);
      return NextResponse.json(
        { error: "Failed to create shipment" },
        { status: 500 }
      );
    }

    const shipment = await shipmentRes.json();

    // Find cheapest USPS rate
    const uspsRates = (shipment.rates || [])
      .filter((r: Record<string, unknown>) =>
        String(r.provider || "").toLowerCase().includes("usps")
      )
      .sort(
        (a: Record<string, unknown>, b: Record<string, unknown>) =>
          Number(a.amount) - Number(b.amount)
      );

    if (uspsRates.length === 0) {
      return NextResponse.json(
        { error: "No USPS rates available for this shipment" },
        { status: 400 }
      );
    }

    const cheapestRate = uspsRates[0];

    // Purchase the label (transaction)
    const transactionRes = await fetch(
      "https://api.goshippo.com/transactions/",
      {
        method: "POST",
        headers: {
          Authorization: `ShippoToken ${shippoToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rate: cheapestRate.object_id,
          label_file_type: "PDF",
          async: false,
        }),
      }
    );

    if (!transactionRes.ok) {
      const err = await transactionRes.text();
      console.error("Shippo transaction error:", err);
      return NextResponse.json(
        { error: "Failed to purchase label" },
        { status: 500 }
      );
    }

    const transaction = await transactionRes.json();

    if (transaction.status !== "SUCCESS") {
      return NextResponse.json(
        {
          error: `Label purchase failed: ${transaction.messages?.[0]?.text || "Unknown error"}`,
        },
        { status: 500 }
      );
    }

    // Update order in Firestore
    await orderRef.update({
      labelUrl: transaction.label_url,
      trackingNumber: transaction.tracking_number || null,
      trackingUrlProvider: transaction.tracking_url_provider || null,
      labelCarrier: "USPS",
      labelServiceLevel: cheapestRate.servicelevel?.name || "USPS",
      labelShippoCost: Number(cheapestRate.amount) || 0,
      shippoShipmentId: shipment.object_id || null,
      labelBatchId: batchId || null,
      labelPrintedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      labelUrl: transaction.label_url,
      trackingNumber: transaction.tracking_number,
      cost: Number(cheapestRate.amount),
      carrier: "USPS",
      service: cheapestRate.servicelevel?.name,
    });
  } catch (error) {
    console.error("Error generating label:", error);
    return NextResponse.json(
      { error: "Failed to generate shipping label" },
      { status: 500 }
    );
  }
}
