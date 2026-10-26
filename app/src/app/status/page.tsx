import { Activity } from "lucide-react";
import SectionIntro from "@/components/sections/SectionIntro";
import shell from "@/components/sections/SectionShell.module.css";
import { pageMetadata } from "@/lib/seo";
import PlatformStatusPanel from "@/components/PlatformStatusPanel";

export const metadata = pageMetadata({ path: "/status", title: "Platform status", description: "Live availability and network indexing status for LAUNCH." });

export default function StatusPage() {
  return <main className={shell.page}>
    <SectionIntro eyebrow="Platform status" icon={<Activity />} title="Clarity at every step." description="Check platform availability and network data freshness before your next move." />
    <PlatformStatusPanel />
  </main>;
}
