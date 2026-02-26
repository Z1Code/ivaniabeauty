import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminSession } from "@/lib/firebase/auth-helpers";

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { to, orderNumber, customerName, trackingNumber, labelUrl, carrier, trackingUrl } = body;

  if (!to || !labelUrl || !orderNumber) {
    return NextResponse.json(
      { error: "to, labelUrl, and orderNumber are required" },
      { status: 400 }
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const resend = new Resend(resendKey);

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Ivania Beauty <onboarding@resend.dev>",
      to: [to],
      subject: `Shipping Label - Order ${orderNumber}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0;">
            <h1 style="font-size: 24px; color: #1a1a1a; margin: 0;">Ivania Beauty</h1>
            <p style="color: #888; font-size: 14px; margin-top: 4px;">Shipping Label</p>
          </div>

          <div style="padding: 24px 0;">
            <h2 style="font-size: 18px; color: #333; margin: 0 0 16px 0;">
              Order ${orderNumber}
            </h2>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Customer</td>
                <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; text-align: right; font-weight: 600;">
                  ${customerName || "N/A"}
                </td>
              </tr>
              ${carrier ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Carrier</td>
                <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; text-align: right; font-weight: 600;">
                  ${carrier}
                </td>
              </tr>` : ""}
              ${trackingNumber ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Tracking #</td>
                <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; text-align: right; font-family: monospace;">
                  ${trackingNumber}
                </td>
              </tr>` : ""}
            </table>

            <div style="text-align: center; padding: 20px 0;">
              <a href="${labelUrl}"
                 style="display: inline-block; padding: 14px 32px; background-color: #c9a4a9; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">
                Download Shipping Label (PDF)
              </a>
            </div>

            ${trackingUrl ? `
            <div style="text-align: center; padding: 8px 0;">
              <a href="${trackingUrl}"
                 style="color: #c9a4a9; text-decoration: underline; font-size: 13px;">
                Track Package
              </a>
            </div>` : ""}
          </div>

          <div style="border-top: 2px solid #f0f0f0; padding-top: 16px; text-align: center;">
            <p style="color: #aaa; font-size: 12px; margin: 0;">
              Ivania Beauty - 2827 Riders Ct, Dacula, GA 30019
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
