import { NextResponse } from "next/server";
import { checkPlatformToken } from "@/lib/launchpad/platformTokenCheck";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ checks: await Promise.all([checkPlatformToken("base"), checkPlatformToken("robinhood")]) }, { headers: { "cache-control": "no-store" } });
}
