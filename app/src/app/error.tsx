"use client";

import Link from "next/link";
import { useEffect } from "react";
import { btn } from "@/components/ui";
import { errorBody, errorRegionLabel, sanitizeDigest } from "@/lib/error-copy";

/** Route-level error boundary. Next.js injects `{ error, reset }`: `reset` re-renders the route segment so failed server data is fetched again. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = sanitizeDigest(error.digest);
  return (
    <main aria-label={errorRegionLabel("route")} className="bb-not-found mx-auto max-w-3xl px-4 py-20 text-center space-y-5">
      <span className="bb-kicker">500 · Something went wrong</span>
      <h1 className="font-display font-semibold text-ink">Let’s try that again.</h1>
      <p role="alert" className="text-[15px] text-body">{errorBody("route")}</p>
      {digest ? (
        <p className="text-xs text-muted">Error ID: {digest}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className={btn.primary}>
          Try again
        </button>
        <Link href="/" className={btn.secondary}>
          Back to the launchpad
        </Link>
      </div>
    </main>
  );
}
