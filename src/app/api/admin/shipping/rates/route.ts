import { NextResponse } from "next/server";
import { getShippo, STORE_ADDRESS } from "@/lib/shippo";
import { getAdminSession } from "@/lib/firebase/auth-helpers";

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { addressTo, parcel } = body;

  if (!addressTo || !parcel) {
    return NextResponse.json(
      { error: "addressTo and parcel are required" },
      { status: 400 }
    );
  }

  try {
    const shippo = getShippo();

    const shipment = await shippo.shipments.create({
      addressFrom: {
        name: STORE_ADDRESS.name,
        street1: STORE_ADDRESS.street1,
        city: STORE_ADDRESS.city,
        state: STORE_ADDRESS.state,
        zip: STORE_ADDRESS.zip,
        country: STORE_ADDRESS.country,
        email: STORE_ADDRESS.email,
        phone: STORE_ADDRESS.phone,
      },
      addressTo: {
        name: addressTo.name,
        street1: addressTo.street1,
        street2: addressTo.street2 || "",
        city: addressTo.city,
        state: addressTo.state,
        zip: addressTo.zip,
        country: addressTo.country || "US",
        phone: addressTo.phone || "",
        email: addressTo.email || "",
      },
      parcels: [
        {
          length: String(parcel.length),
          width: String(parcel.width),
          height: String(parcel.height),
          distanceUnit: "in",
          weight: String(parcel.weight),
          massUnit: "lb",
        },
      ],
    });

    const rates = (shipment.rates || [])
      .filter((r) => r.amount)
      .map((r) => ({
        objectId: r.objectId,
        carrier: r.provider,
        service: r.servicelevel?.name || r.servicelevel?.token || "Unknown",
        serviceLevelToken: r.servicelevel?.token || "",
        amount: r.amount,
        currency: r.currency,
        estimatedDays: r.estimatedDays,
        durationTerms: r.durationTerms,
      }))
      .sort((a, b) => parseFloat(a.amount!) - parseFloat(b.amount!));

    return NextResponse.json({
      shipmentId: shipment.objectId,
      rates,
    });
  } catch (err) {
    console.error("Shippo rates error:", err);
    return NextResponse.json(
      { error: "Failed to get shipping rates" },
      { status: 500 }
    );
  }
}
