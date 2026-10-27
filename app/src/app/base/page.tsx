import ChainLanding, { chainLandingMetadata } from "@/components/launchpad/ChainLanding";
import { BASE_PUBLIC_ENABLED } from "@/lib/chainPublic";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = chainLandingMetadata("base");

export default function Page() {
  if (!BASE_PUBLIC_ENABLED) redirect("/robinhood");
  return <ChainLanding chain="base" />;
}
