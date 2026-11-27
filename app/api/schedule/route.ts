import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY;
  const candidate = request.cookies.get("wa_admin_session")?.value;
  if (!expected || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 500 });
  }

  let body: {
    phoneE164?: string;
    displayName?: string;
    templateName?: string;
    languageCode?: string;
    scheduledAt?: string;
    consentConfirmed?: boolean;
    consentSource?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const phone = body.phoneE164?.trim();
  const template = body.templateName?.trim();
  const language = body.languageCode?.trim() || "en";
  const source = body.consentSource?.trim();
  const when = body.scheduledAt ? new Date(body.scheduledAt) : null;

  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
    return NextResponse.json({ error: "phoneE164 must use international E.164 format, e.g. +919876543210" }, { status: 400 });
  }
  if (!template || !/^[a-z0-9_]{2,128}$/.test(template)) {
    return NextResponse.json({ error: "templateName must be the name of an approved WhatsApp template" }, { status: 400 });
  }
  if (!/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(language)) {
    return NextResponse.json({ error: "languageCode must be a valid template language code, e.g. en or en_US" }, { status: 400 });
  }
  if (!when || Number.isNaN(when.getTime())) {
    return NextResponse.json({ error: "scheduledAt must be a valid ISO date-time" }, { status: 400 });
  }
  if (body.consentConfirmed !== true || !source) {
    return NextResponse.json({ error: "Explicit opt-in confirmation and consentSource are required" }, { status: 400 });
  }

  const sql = neon(databaseUrl);
  const contact = await sql\`
    INSERT INTO contacts (phone_e164, display_name, opted_in_at, opt_in_source)
    VALUES (${phone}, ${body.displayName?.trim() || null}, NOW(), ${source})
    ON CONFLICT (phone_e164) DO UPDATE
      SET display_name = COALESCE(EXCLUDED.display_name, contacts.display_name),
          opted_in_at = COALESCE(contacts.opted_in_at, NOW()),
          opt_in_source = COALESCE(contacts.opt_in_source, EXCLUDED.opt_in_source)
      WHERE contacts.opted_out_at IS NULL
    RETURNING id
  \`;

  if (contact.length === 0) {
    return NextResponse.json({ error: "This contact has opted out and cannot be reactivated through scheduling" }, { status: 409 });
  }

  const inserted = await sql\`
    INSERT INTO scheduled_messages (contact_id, template_name, language_code, scheduled_at)
    VALUES (${contact[0].id}, ${template}, ${language}, ${when.toISOString()})
    RETURNING id, status, scheduled_at
  \`;

  return NextResponse.json({ ok: true, message: inserted[0] }, { status: 201 });
}
