import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function matchesSecret(candidate: string | undefined, expected: string | undefined) {
  if (!candidate || !expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const valid = matchesSecret(request.cookies.get("wa_admin_session")?.value, process.env.ADMIN_API_KEY);
  return NextResponse.json({ authenticated: valid });
}

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_API_KEY;
  if (!secret) return NextResponse.json({ error: "Admin login is not configured" }, { status: 503 });

  let body: { key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!matchesSecret(body.key, secret)) {
    return NextResponse.json({ error: "Incorrect admin key" }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set("wa_admin_session", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set("wa_admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0
  });
  return response;
}
