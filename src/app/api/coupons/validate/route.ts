import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

// GET: Validate a coupon code
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const subtotal = parseFloat(searchParams.get("subtotal") || "0");

    if (!code) {
      return NextResponse.json(
        { valid: false, message: "Codigo de cupon requerido" },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection("coupons")
      .where("code", "==", code.toUpperCase())
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        valid: false,
        message: "Cupon no encontrado o inactivo",
      });
    }

    const couponDoc = snapshot.docs[0];
    const coupon = couponDoc.data();
    const now = new Date();

    // Check date range
    if (coupon.startsAt && coupon.startsAt.toDate() > now) {
      return NextResponse.json({
        valid: false,
        message: "Este cupon aun no esta activo",
      });
    }

    if (coupon.expiresAt && coupon.expiresAt.toDate() < now) {
      return NextResponse.json({
        valid: false,
        message: "Este cupon ha expirado",
      });
    }

    // Check usage limit
    if (
      coupon.usageLimit !== null &&
      coupon.usageCount >= coupon.usageLimit
    ) {
      return NextResponse.json({
        valid: false,
        message: "Este cupon ha alcanzado su limite de uso",
      });
    }

    // Check minimum purchase
    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      return NextResponse.json({
        valid: false,
        message: `Compra minima de $${coupon.minPurchase} requerida`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = subtotal * (coupon.discountValue / 100);
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: couponDoc.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100,
        description: coupon.description || "",
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { valid: false, message: "Error al validar el cupon" },
      { status: 500 }
    );
  }
}
