import SectionIntro from "@/components/sections/SectionIntro";
import shell from "@/components/sections/SectionShell.module.css";
import TokenComparison from "@/components/launchpad/TokenComparison";
import { pageMetadata } from "@/lib/seo";
import { parseCompareKeys } from "@/lib/launchpad/compare";
export const metadata = pageMetadata({ path: "/compare", title: "Compare tokens", description: "Compare token launch settings and indexed market activity across LAUNCH." });
export default async function ComparePage({ searchParams }: { searchParams: Promise<{ tokens?: string }> }) {
  const params = await searchParams;
  return <main className={shell.page}><SectionIntro eyebrow="Token comparison" title="See the differences." description="Compare up to three tokens across networks. Launch settings and indexed market activity, side by side." /><TokenComparison initial={parseCompareKeys(params.tokens ?? "")} /></main>;
}
