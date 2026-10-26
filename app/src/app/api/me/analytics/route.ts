import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { maybeDb } from "@/lib/db";
import { rateLimited } from "@/lib/launchpad/editServer";
import { memo } from "@/lib/launchpad/memo";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const wallet =
    new URL(req.url).searchParams.get("wallet")?.toLowerCase() ?? "";
  if (!isAddress(wallet))
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  const ip =
    (req.headers.get("x-forwarded-for") ?? "").split(",").at(-1)?.trim() ??
    "unknown";
  if (rateLimited(`analytics:${ip}`, 30))
    return NextResponse.json({ error: "Too many refreshes" }, { status: 429 });
  const db = maybeDb();
  if (!db)
    return NextResponse.json(
      { error: "Analytics unavailable" },
      { status: 503 },
    );
  try {
    const data = await memo(`creator-analytics:${wallet}`, 30000, async () => {
      const [activity, fees] = await Promise.all([
        db`SELECT to_char(s.block_time AT TIME ZONE 'UTC','YYYY-MM-DD') AS day, s.chain_id, s.token, count(*)::int AS trades, count(*) FILTER (WHERE s.is_buy)::int AS buys, sum(abs(s.amount0))::text AS quote_raw FROM bb_launch_swaps s JOIN bb_launches l ON l.chain_id=s.chain_id AND l.token=s.token WHERE l.launcher=${wallet} AND s.block_time >= now()-interval '30 days' GROUP BY 1,s.chain_id,s.token ORDER BY 1 DESC LIMIT 3000`,
        db`SELECT e.tx_hash,e.chain_id,e.token,e.kind,e.quote_amount::text,e.token_amount::text,e.block_time FROM bb_launch_fee_events e JOIN bb_launches l ON l.chain_id=e.chain_id AND l.token=e.token WHERE l.launcher=${wallet} AND e.kind='collected' AND e.block_time >= now()-interval '30 days' ORDER BY e.block_time DESC LIMIT 300`,
      ]);
      return { activity, fees, asOf: Date.now() };
    });
    return NextResponse.json(data, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Analytics could not be loaded" },
      { status: 502 },
    );
  }
}
