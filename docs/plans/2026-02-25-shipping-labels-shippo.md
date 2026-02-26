# Shipping Labels with Shippo API - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add shipping label generation to the admin order detail page using Shippo API, allowing admins to get carrier rates (USPS, UPS, FedEx) and purchase real 4x6 PDF labels with auto-tracking numbers.

**Architecture:** Shippo SDK client singleton → two API routes (get rates, purchase label) → modal UI on the order detail page. Label data (URL, tracking number, carrier) saved to Firestore order document.

**Tech Stack:** Shippo JavaScript SDK (`shippo`), Next.js 16 API Routes, React 19, Firebase Admin SDK, Tailwind CSS 4.

**Store Address:** Ivania Beauty, 2827 Riders Ct, Dacula, GA 30019-2192

---

### Task 1: Install Shippo SDK and create client singleton

**Files:**
- Modify: `package.json` (add shippo dependency)
- Create: `src/lib/shippo.ts`

**Step 1: Install the Shippo SDK**

Run: `cd C:/ivaniabeauty/ivaniabeauty && npm install shippo`

**Step 2: Create the Shippo client singleton**

Create `src/lib/shippo.ts`:

```typescript
import { Shippo } from "shippo";

let _shippo: Shippo | null = null;

export function getShippo(): Shippo {
  if (!_shippo) {
    const key = process.env.SHIPPO_API_KEY;
    if (!key) {
      throw new Error("SHIPPO_API_KEY is not set in environment variables");
    }
    _shippo = new Shippo({
      apiKeyHeader: key,
      shippoApiVersion: "2018-02-08",
    });
  }
  return _shippo;
}

export const STORE_ADDRESS = {
  name: "Ivania Beauty",
  street1: "2827 Riders Ct",
  city: "Dacula",
  state: "GA",
  zip: "30019-2192",
  country: "US",
  email: process.env.STORE_EMAIL || "",
  phone: process.env.STORE_PHONE || "",
};
```

**Step 3: Add env variables to `.env.local`**

Add these lines (user fills in values):
```
SHIPPO_API_KEY=shippo_test_xxxxx
STORE_EMAIL=info@ivaniabeauty.com
STORE_PHONE=
```

**Step 4: Verify typecheck passes**

Run: `cd C:/ivaniabeauty/ivaniabeauty && npx tsc --noEmit`
Expected: No errors related to shippo.ts

**Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/shippo.ts
git commit -m "feat: add Shippo SDK client singleton for shipping labels"
```

---

### Task 2: Add shipping label fields to OrderDoc type and OrderData interface

**Files:**
- Modify: `src/lib/firebase/types.ts:98-126` (OrderDoc interface)
- Modify: `src/app/admin/orders/[id]/OrderDetailClient.tsx:35-61` (OrderData interface)
- Modify: `src/app/api/admin/orders/[id]/route.ts:22-29` (GET response)
- Modify: `src/app/api/admin/orders/[id]/route.ts:43-46` (PUT handler)

**Step 1: Add fields to OrderDoc in types.ts**

After line 122 (`trackingNumber: string | null;`), add:

```typescript
  labelUrl: string | null;
  labelCarrier: string | null;
  labelServiceLevel: string | null;
  labelShippoCost: number | null;
  trackingUrlProvider: string | null;
  shippoShipmentId: string | null;
```

**Step 2: Add fields to OrderData interface in OrderDetailClient.tsx**

After line 56 (`trackingNumber: string;`), add:

```typescript
  labelUrl: string | null;
  labelCarrier: string | null;
  labelServiceLevel: string | null;
  labelShippoCost: number | null;
  trackingUrlProvider: string | null;
  shippoShipmentId: string | null;
```

**Step 3: Update the admin orders API PUT handler to accept new fields**

In `src/app/api/admin/orders/[id]/route.ts`, after the `if (body.notes !== undefined)` line, add:

```typescript
  if (body.trackingUrlProvider !== undefined) updateData.trackingUrlProvider = body.trackingUrlProvider;
  if (body.labelUrl !== undefined) updateData.labelUrl = body.labelUrl;
  if (body.labelCarrier !== undefined) updateData.labelCarrier = body.labelCarrier;
  if (body.labelServiceLevel !== undefined) updateData.labelServiceLevel = body.labelServiceLevel;
  if (body.labelShippoCost !== undefined) updateData.labelShippoCost = body.labelShippoCost;
  if (body.shippoShipmentId !== undefined) updateData.shippoShipmentId = body.shippoShipmentId;
```

**Step 4: Verify typecheck**

Run: `cd C:/ivaniabeauty/ivaniabeauty && npx tsc --noEmit`

**Step 5: Commit**

```bash
git add src/lib/firebase/types.ts src/app/admin/orders/[id]/OrderDetailClient.tsx src/app/api/admin/orders/[id]/route.ts
git commit -m "feat: add shipping label fields to OrderDoc and admin API"
```

---

### Task 3: Create API route to get shipping rates

**Files:**
- Create: `src/app/api/admin/shipping/rates/route.ts`

**Step 1: Create the rates API route**

Create `src/app/api/admin/shipping/rates/route.ts`:

```typescript
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
          massUnit: "oz",
        },
      ],
    });

    // Filter to only successful rates and sort by price
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
      addressValidation: {
        from: shipment.addressFrom,
        to: shipment.addressTo,
      },
    });
  } catch (err) {
    console.error("Shippo rates error:", err);
    return NextResponse.json(
      { error: "Failed to get shipping rates" },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify typecheck**

Run: `cd C:/ivaniabeauty/ivaniabeauty && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/app/api/admin/shipping/rates/route.ts
git commit -m "feat: add API route to get Shippo shipping rates"
```

---

### Task 4: Create API route to purchase a shipping label

**Files:**
- Create: `src/app/api/admin/shipping/label/route.ts`

**Step 1: Create the label purchase API route**

Create `src/app/api/admin/shipping/label/route.ts`:

```typescript
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

  // Verify the order exists
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

    // Update the order in Firestore with label data
    await adminDb.collection("orders").doc(orderId).update({
      trackingNumber: transaction.trackingNumber || null,
      trackingUrlProvider: transaction.trackingUrlProvider || null,
      labelUrl: transaction.labelUrl || null,
      labelCarrier: transaction.rate?.provider || null,
      labelServiceLevel: transaction.rate?.servicelevel?.token || null,
      labelShippoCost: transaction.rate?.amount
        ? parseFloat(transaction.rate.amount)
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
      carrier: transaction.rate?.provider,
      serviceLevel: transaction.rate?.servicelevel?.name,
      cost: transaction.rate?.amount,
    });
  } catch (err) {
    console.error("Shippo label error:", err);
    return NextResponse.json(
      { error: "Failed to purchase shipping label" },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify typecheck**

Run: `cd C:/ivaniabeauty/ivaniabeauty && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/app/api/admin/shipping/label/route.ts
git commit -m "feat: add API route to purchase Shippo shipping label"
```

---

### Task 5: Create the ShippingLabelModal component

**Files:**
- Create: `src/components/admin/ShippingLabelModal.tsx`

**Step 1: Create the modal component**

Create `src/components/admin/ShippingLabelModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { X, Package, Truck, Download, Printer, Loader2, ExternalLink } from "lucide-react";

interface ShippingRate {
  objectId: string;
  carrier: string;
  service: string;
  serviceLevelToken: string;
  amount: string;
  currency: string;
  estimatedDays: number | null;
  durationTerms: string | null;
}

interface OrderForShipping {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
}

type Step = "parcel" | "rates" | "success";

const CARRIER_COLORS: Record<string, string> = {
  USPS: "bg-blue-50 border-blue-200 text-blue-800",
  UPS: "bg-amber-50 border-amber-200 text-amber-800",
  FedEx: "bg-purple-50 border-purple-200 text-purple-800",
};

const inputClasses =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all";

export default function ShippingLabelModal({
  order,
  onClose,
  onLabelCreated,
}: {
  order: OrderForShipping;
  onClose: () => void;
  onLabelCreated: (data: {
    trackingNumber: string;
    trackingUrl: string;
    labelUrl: string;
    carrier: string;
    serviceLevel: string;
  }) => void;
}) {
  const [step, setStep] = useState<Step>("parcel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Parcel dimensions
  const [weight, setWeight] = useState("16");
  const [length, setLength] = useState("12");
  const [width, setWidth] = useState("10");
  const [height, setHeight] = useState("4");

  // Rates
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [shipmentId, setShipmentId] = useState("");
  const [selectedRate, setSelectedRate] = useState<string>("");

  // Success data
  const [labelData, setLabelData] = useState<{
    trackingNumber: string;
    trackingUrl: string;
    labelUrl: string;
    carrier: string;
    serviceLevel: string;
    cost: string;
  } | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressTo: {
            name: order.customerName,
            street1: order.shippingAddressLine1,
            street2: order.shippingAddressLine2,
            city: order.shippingCity,
            state: order.shippingState,
            zip: order.shippingZip,
            country: order.shippingCountry || "US",
            email: order.customerEmail,
          },
          parcel: {
            weight: parseFloat(weight),
            length: parseFloat(length),
            width: parseFloat(width),
            height: parseFloat(height),
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get rates");
      }

      const data = await res.json();
      setRates(data.rates);
      setShipmentId(data.shipmentId);
      if (data.rates.length > 0) {
        setSelectedRate(data.rates[0].objectId);
      }
      setStep("rates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error getting rates");
    } finally {
      setLoading(false);
    }
  };

  const purchaseLabel = async () => {
    if (!selectedRate) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/shipping/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rateId: selectedRate,
          orderId: order.id,
          shipmentId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to purchase label");
      }

      const data = await res.json();
      setLabelData(data);
      setStep("success");
      onLabelCreated({
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        labelUrl: data.labelUrl,
        carrier: data.carrier,
        serviceLevel: data.serviceLevel,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error purchasing label");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-serif text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Truck className="w-5 h-5 text-rosa" />
              {step === "parcel" && "Generar Etiqueta de Envio"}
              {step === "rates" && "Seleccionar Tarifa"}
              {step === "success" && "Etiqueta Generada"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Pedido {order.orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Step: Parcel Dimensions */}
        {step === "parcel" && (
          <div className="p-6 space-y-5">
            {/* Destination preview */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Destino
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {order.customerName}
              </p>
              <p className="text-sm text-gray-600">
                {order.shippingAddressLine1}
              </p>
              {order.shippingAddressLine2 && (
                <p className="text-sm text-gray-600">
                  {order.shippingAddressLine2}
                </p>
              )}
              <p className="text-sm text-gray-600">
                {order.shippingCity}, {order.shippingState}{" "}
                {order.shippingZip}
              </p>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Peso del paquete (oz)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="16"
                min="1"
                className={inputClasses}
              />
              <p className="text-xs text-gray-400 mt-1">
                1 lb = 16 oz. Productos de belleza tipicos: 8-32 oz
              </p>
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Dimensiones del paquete (pulgadas)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Largo
                  </label>
                  <input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    min="1"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Ancho
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    min="1"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Alto
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    min="1"
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={fetchRates}
              disabled={loading || !weight || !length || !width || !height}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Obteniendo tarifas...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Obtener Tarifas de Envio
                </>
              )}
            </button>
          </div>
        )}

        {/* Step: Rate Selection */}
        {step === "rates" && (
          <div className="p-6 space-y-4">
            {rates.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No se encontraron tarifas disponibles.
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  {rates.length} tarifas disponibles. Selecciona una:
                </p>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {rates.map((rate) => {
                    const colorClass =
                      CARRIER_COLORS[rate.carrier] ||
                      "bg-gray-50 border-gray-200 text-gray-800";
                    return (
                      <label
                        key={rate.objectId}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedRate === rate.objectId
                            ? "border-rosa bg-rosa/5 ring-2 ring-rosa/20"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="rate"
                          value={rate.objectId}
                          checked={selectedRate === rate.objectId}
                          onChange={() => setSelectedRate(rate.objectId)}
                          className="sr-only"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${colorClass}`}
                            >
                              {rate.carrier}
                            </span>
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {rate.service}
                            </span>
                          </div>
                          {rate.estimatedDays && (
                            <p className="text-xs text-gray-400">
                              ~{rate.estimatedDays} dias habiles
                            </p>
                          )}
                          {rate.durationTerms && (
                            <p className="text-xs text-gray-400">
                              {rate.durationTerms}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-gray-900">
                            ${rate.amount}
                          </p>
                          <p className="text-xs text-gray-400 uppercase">
                            {rate.currency}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep("parcel")}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Atras
                  </button>
                  <button
                    onClick={purchaseLabel}
                    disabled={loading || !selectedRate}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Comprando etiqueta...
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4" />
                        Comprar Etiqueta
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && labelData && (
          <div className="p-6 space-y-5">
            <div className="text-center py-2">
              <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <Truck className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-gray-800">
                Etiqueta Creada Exitosamente
              </h3>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Carrier</p>
                    <p className="font-semibold text-gray-800">
                      {labelData.carrier}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Servicio</p>
                    <p className="font-semibold text-gray-800">
                      {labelData.serviceLevel}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Tracking</p>
                    <p className="font-mono text-xs font-semibold text-gray-800 break-all">
                      {labelData.trackingNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Costo</p>
                    <p className="font-semibold text-gray-800">
                      ${labelData.cost}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={labelData.labelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar Label (PDF)
                </a>
                {labelData.trackingUrl && (
                  <a
                    href={labelData.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Rastreo
                  </a>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify typecheck**

Run: `cd C:/ivaniabeauty/ivaniabeauty && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/admin/ShippingLabelModal.tsx
git commit -m "feat: add ShippingLabelModal component for label generation flow"
```

---

### Task 6: Integrate shipping label button into OrderDetailClient

**Files:**
- Modify: `src/app/admin/orders/[id]/OrderDetailClient.tsx`

**Step 1: Add import for ShippingLabelModal and new icons**

Add to imports at top of file:

```typescript
import ShippingLabelModal from "@/components/admin/ShippingLabelModal";
import { Download, ExternalLink } from "lucide-react";
```

**Step 2: Add state for modal visibility and label data**

After the existing state declarations (around line 110), add:

```typescript
const [showLabelModal, setShowLabelModal] = useState(false);
const [labelUrl, setLabelUrl] = useState(order.labelUrl || null);
const [labelCarrier, setLabelCarrier] = useState(order.labelCarrier || null);
const [trackingUrl, setTrackingUrl] = useState(order.trackingUrlProvider || null);
```

**Step 3: Replace the existing "Seguimiento" card (lines 457-483) with enhanced version**

Replace the entire Tracking Number card with:

```tsx
{/* Shipping Label & Tracking */}
<div className="bg-white rounded-2xl border border-gray-100 p-6">
  <h3 className="font-serif text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
    <Truck className="w-4 h-4 text-rosa" />
    Envio y Seguimiento
  </h3>

  {/* Generate Label Button */}
  {!labelUrl ? (
    <button
      onClick={() => setShowLabelModal(true)}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors mb-4 cursor-pointer"
    >
      <Truck className="w-4 h-4" />
      Generar Etiqueta de Envio
    </button>
  ) : (
    <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-emerald-700">
          Etiqueta generada
          {labelCarrier && ` (${labelCarrier})`}
        </span>
      </div>
      <div className="flex gap-2">
        <a
          href={labelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Descargar PDF
        </a>
        <button
          onClick={() => setShowLabelModal(true)}
          className="px-3 py-2 rounded-lg border border-emerald-300 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
        >
          Nueva Etiqueta
        </button>
      </div>
    </div>
  )}

  {/* Tracking Number */}
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    Numero de Seguimiento
  </label>
  <input
    type="text"
    value={trackingNumber}
    onChange={(e) => setTrackingNumber(e.target.value)}
    placeholder="Numero de seguimiento"
    className={inputClasses}
  />
  {trackingUrl && (
    <a
      href={trackingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 mt-2 text-xs text-rosa hover:text-rosa-dark transition-colors"
    >
      <ExternalLink className="w-3 h-3" />
      Ver rastreo en sitio del carrier
    </a>
  )}
  <div className="mt-3 flex justify-end">
    <button
      onClick={handleTrackingSave}
      disabled={trackingSaving}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors disabled:opacity-50 cursor-pointer"
    >
      {trackingSaving ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {trackingSaving ? "Guardando..." : "Guardar"}
    </button>
  </div>
</div>
```

**Step 4: Add the modal at the end of the component (before closing `</>`)

```tsx
{showLabelModal && (
  <ShippingLabelModal
    order={order}
    onClose={() => setShowLabelModal(false)}
    onLabelCreated={(data) => {
      setTrackingNumber(data.trackingNumber);
      setLabelUrl(data.labelUrl);
      setLabelCarrier(data.carrier);
      setTrackingUrl(data.trackingUrl);
      setStatus("shipped");
    }}
  />
)}
```

**Step 5: Verify typecheck and build**

Run: `cd C:/ivaniabeauty/ivaniabeauty && npx tsc --noEmit`

**Step 6: Commit**

```bash
git add src/app/admin/orders/[id]/OrderDetailClient.tsx
git commit -m "feat: integrate shipping label generation into order detail page"
```

---

### Task 7: Manual testing and final verification

**Step 1: Run build to verify no compilation errors**

Run: `cd C:/ivaniabeauty/ivaniabeauty && npm run build`

**Step 2: Start dev server and verify the flow visually**

Run: `cd C:/ivaniabeauty/ivaniabeauty && npm run dev`

Test plan:
1. Navigate to `/admin/orders` and click any order
2. Verify "Generar Etiqueta de Envio" button appears in the Seguimiento section
3. Click the button — modal should open with parcel dimensions form
4. Verify destination address shows correctly from order data
5. Enter package weight/dimensions and click "Obtener Tarifas"
6. (With test API key) rates should appear from USPS/UPS/FedEx
7. Select a rate and click "Comprar Etiqueta"
8. Success screen should show tracking number and PDF download link
9. Close modal — tracking number should be auto-filled, label download should appear
10. Verify order status changed to "shipped"

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete shipping label integration with Shippo API"
```
