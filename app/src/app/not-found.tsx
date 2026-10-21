import Link from "next/link";
import { btn } from "@/components/ui";
import { errorBody, errorRegionLabel } from "@/lib/error-copy";

export default function NotFound() {
  return (
    <main aria-label={errorRegionLabel("not-found")} className="bb-not-found mx-auto max-w-3xl px-4 py-20 text-center space-y-5">
      <span className="bb-kicker">404 · Page not found</span>
      <h1 className="font-display font-semibold text-ink">A little off course.</h1>
      <p className="text-[15px] text-body">{errorBody("not-found")}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={btn.primary}>
          Back to the launchpad
        </Link>
        <Link href="/launch" className={btn.secondary}>
          Launch a token
        </Link>
      </div>
    </main>
  );
}
