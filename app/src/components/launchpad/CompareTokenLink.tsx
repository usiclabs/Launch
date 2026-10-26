import Link from "next/link";
export default function CompareTokenLink({ chain, token }: { chain: string; token: string }) {
  return <Link href={`/compare?tokens=${chain}:${token}`} className="inline-flex min-h-11 items-center rounded-xl border border-line px-3 text-xs text-body hover:text-ink">Compare</Link>;
}
