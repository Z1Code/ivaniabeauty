"use client";

import { useState } from "react";
import { X, Package, Truck, Download, Printer, Loader2, ExternalLink, Mail, Check } from "lucide-react";

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
  const [weight, setWeight] = useState("1.1");
  const [length, setLength] = useState("6");
  const [width, setWidth] = useState("6");
  const [height, setHeight] = useState("6");

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

  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const sendLabelEmail = async () => {
    if (!labelData) return;
    setEmailSending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/shipping/send-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "ivaniabeauty2@gmail.com",
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          trackingNumber: labelData.trackingNumber,
          labelUrl: labelData.labelUrl,
          carrier: labelData.carrier,
          trackingUrl: labelData.trackingUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send email");
      }
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error sending email");
    } finally {
      setEmailSending(false);
    }
  };

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
                Peso del paquete (lb)
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
                1.1 lb = 17.6 oz (0.5 kg)
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
                onClick={sendLabelEmail}
                disabled={emailSending || emailSent}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  emailSent
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                } disabled:opacity-70`}
              >
                {emailSent ? (
                  <>
                    <Check className="w-4 h-4" />
                    Enviado a ivaniabeauty2@gmail.com
                  </>
                ) : emailSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Enviar Label por Email
                  </>
                )}
              </button>

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
