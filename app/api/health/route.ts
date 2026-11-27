import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "cloud-whatsapp-automation",
    outboundEnabled: process.env.WHATSAPP_SENDING_ENABLED === "true"
  });
}
