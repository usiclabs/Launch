/** Single source of truth for the brand. Rename here, nowhere else. */
export const BRAND = "LAUNCH";
export const BRAND_TLD = "";
export const BRAND_DOMAIN = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://openlaunch-production.up.railway.app").host;
export const BRAND_X = "launchxyz"; // the official account (never link the look-alike handles)
/** Reversible visibility setting for public repository and license promotions. */
export const PUBLIC_SOURCE_VISIBLE = false;
export const BRAND_GITHUB = "https://github.com/usiclabs/Launch"; // MIT, contracts + site
export const TAGLINE = "launch a token. Free. On Base, Robinhood Chain or Arc.";
/**
 * Per-surface copy (each surface truncates at a different point):
 *   SITE_TITLE ≤ 60 chars (Google), also the X title (≤ 70);
 *   SITE_DESCRIPTION ≤ 155 chars (Google snippet);
 *   SOCIAL_DESCRIPTION ≤ 125 chars (OpenGraph / X previews, mobile-safe).
 */
/** Leads with the bare brand word: "openlaunch" is the query to win, and Google tokenises the domain as two words. */
export const SITE_TITLE = `${BRAND}: free token launchpad on ${process.env.NEXT_PUBLIC_ENABLE_BASE === "true" ? "Base, Robinhood & Arc" : "Robinhood Chain"}`;
export const SITE_DESCRIPTION = `Launch a token in one transaction on ${process.env.NEXT_PUBLIC_ENABLE_BASE === "true" ? "Base, Robinhood Chain or Arc" : "Robinhood Chain"}. Zero platform fee, 100% of supply locked as Uniswap v4 liquidity forever.`;
export const SOCIAL_DESCRIPTION = `Zero-fee token launchpad. One transaction, liquidity locked forever. ${process.env.NEXT_PUBLIC_ENABLE_BASE === "true" ? "Base + Robinhood Chain + Arc." : "Robinhood Chain."}`;
/** Old domain: kept alive as a redirect (on-chain metadata URIs of early launches point at it). */
export const LEGACY_DOMAIN = "basebid.lol";
