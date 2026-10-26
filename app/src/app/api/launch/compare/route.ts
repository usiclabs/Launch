import { NextResponse } from "next/server";
import { parseCompareKeys } from "@/lib/launchpad/compare";
import { getLaunch } from "@/lib/launchpad/queries";
import { ethUsd } from "@/lib/launchpad/ethPrice";
import { CONFIGURED_CHAINS } from "@/lib/launchpad/config";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const keys = parseCompareKeys(new URL(request.url).searchParams.get("tokens") ?? "").filter(k => CONFIGURED_CHAINS.includes(k.chain));
  if (!keys.length) return NextResponse.json({ error: "Choose up to three valid tokens." }, { status: 400 });
  try {
    const usd = await ethUsd();
    const rows = await Promise.all(keys.map(async key => ({ key, launch: await getLaunch(key.chain, key.token, usd) })));
    return NextResponse.json({ launches: rows.flatMap(r => r.launch ? [r.launch] : []), missing: rows.filter(r => !r.launch).map(r => r.key), asOf: Date.now() }, { headers: { "cache-control": "no-store" } });
  } catch { return NextResponse.json({ error: "Comparison data is temporarily unavailable." }, { status: 502 }); }
}
