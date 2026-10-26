import Link from "next/link";
export default function CompareTokenLink({ chain, token }: { chain: string; token: string }) {
  return <Link href={`/compare?tokens=${chain}:${token}`} className="inline-flex min-h-11 items-center rounded-xl border border-line bg-card px-3 text-xs text-body transition-colors hover:border-line-strong hover:text-ink motion-reduce:transition-none">Compare</Link>;
}
