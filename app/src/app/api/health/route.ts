import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({ ok: true, mode: "bnkr-read-only-preview", database: false, transactions: false }); }
