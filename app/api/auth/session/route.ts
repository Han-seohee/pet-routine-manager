import { NextResponse } from "next/server";
import { clearAccessToken, hasAccessToken } from "@/lib/auth/session";

export async function GET() {
  return NextResponse.json({
    authenticated: await hasAccessToken(),
  });
}

export async function DELETE() {
  await clearAccessToken();
  return new NextResponse(null, { status: 204 });
}
