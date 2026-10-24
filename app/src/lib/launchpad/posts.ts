/**
 * Pure post / comment logic (node --test loads this directly).
 * Every write is a wallet-signed message: post, report, mute, admin action.
 */
export const POST_MAX = 500;
export const POST_DOMAIN = "LAUNCH";
export const POST_TS_SKEW_MS = 5 * 60_000; // signed timestamp must be within ±5 min
export const AUTO_HIDE_REPORTS = 5; // distinct wallets
export const POST_MIN_GAP_MS = 20_000; // per wallet
export const POST_DAILY_MAX = 60; // per wallet

export type Tag = "creator" | "whale" | "holder" | null;

/** Plain text only: trim, collapse blank runs, strip control chars, cap length. HTML is never interpreted, but obvious tags are rejected to keep the feed clean. */
export function validateBody(raw: unknown): { ok: true; body: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: "body required" };
  const body = raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!body) return { ok: false, error: "empty post" };
  if (body.length > POST_MAX) return { ok: false, error: `max ${POST_MAX} characters` };
  if (/<\s*(script|iframe|img|a|style|svg)\b/i.test(body)) return { ok: false, error: "no HTML" };
  return { ok: true, body };
}

export function buildPostMessage(p: { chain: string; token: string; wallet: string; nonce: string; ts: number; parentId: number | null; body: string }): string {
  return [
    `${POST_DOMAIN} — sign to post. Free, no transaction.`,
    ``,
    `Chain: ${p.chain}`,
    `Token: ${p.token.toLowerCase()}`,
    `Wallet: ${p.wallet.toLowerCase()}`,
    `Reply to: ${p.parentId ?? "-"}`,
    `Nonce: ${p.nonce}`,
    `Time: ${new Date(p.ts).toISOString()}`,
    ``,
    p.body,
  ].join("\n");
}

export function buildReportMessage(p: { postId: number; wallet: string; nonce: string; ts: number; reason: string }): string {
  return [`${POST_DOMAIN} — sign to report a post.`, ``, `Post: ${p.postId}`, `Wallet: ${p.wallet.toLowerCase()}`, `Reason: ${p.reason}`, `Nonce: ${p.nonce}`, `Time: ${new Date(p.ts).toISOString()}`].join("\n");
}

export type ModAction = "hide" | "unhide" | "mute" | "unmute";
export function buildModMessage(p: { action: ModAction; target: string; wallet: string; nonce: string; ts: number }): string {
  return [`${POST_DOMAIN} — sign a moderation action.`, ``, `Action: ${p.action}`, `Target: ${p.target}`, `Wallet: ${p.wallet.toLowerCase()}`, `Nonce: ${p.nonce}`, `Time: ${new Date(p.ts).toISOString()}`].join("\n");
}

export const REPORT_REASONS = ["scam", "spam", "harassment", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export function isReportReason(v: unknown): v is ReportReason {
  return typeof v === "string" && (REPORT_REASONS as readonly string[]).includes(v);
}

/** Timestamp freshness check (replay window). */
export function tsFresh(ts: unknown, now: number): boolean {
  const n = Number(ts);
  return Number.isFinite(n) && Math.abs(now - n) <= POST_TS_SKEW_MS;
}

/** Holder tag from a balance relative to supply (both raw wei). */
export function holderTag(isCreator: boolean, balanceWei: bigint, supplyWei: bigint): Tag {
  if (isCreator) return "creator";
  if (balanceWei <= 0n || supplyWei <= 0n) return null;
  return balanceWei * 100n >= supplyWei ? "whale" : "holder"; // ≥ 1% of supply
}

/** Pure per-wallet posting policy: gap since last post and posts in the last 24h. */
export function canPostNow(lastPostAt: number | null, postsLast24h: number, now: number): { ok: true } | { ok: false; error: string } {
  if (lastPostAt !== null && now - lastPostAt < POST_MIN_GAP_MS) return { ok: false, error: `wait ${Math.ceil((POST_MIN_GAP_MS - (now - lastPostAt)) / 1000)}s between posts` };
  if (postsLast24h >= POST_DAILY_MAX) return { ok: false, error: "daily post limit reached" };
  return { ok: true };
}

export function shouldAutoHide(distinctReports: number): boolean {
  return distinctReports >= AUTO_HIDE_REPORTS;
}
