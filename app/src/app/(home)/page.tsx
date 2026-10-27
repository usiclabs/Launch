import type { Metadata } from "next";
import { cookies } from "next/headers";
import LaunchHero from "@/components/launchpad/LaunchHero";
import RecentTokens from "@/components/launchpad/RecentTokens";
import LaunchList from "@/components/launchpad/LaunchList";
import LiveRiver from "@/components/launchpad/LiveRiver";
import JustLaunched from "@/components/launchpad/JustLaunched";
import { PostsFeed } from "@/components/launchpad/Posts";
import { listFeed } from "@/lib/launchpad/postsServer";
import { VOLUME_WINDOWS, getLaunchFeed, getTrending, isTrendingSource, listLaunchesPage, parseSort, trendingFrom, withBoardTape, type VolumeWindow } from "@/lib/launchpad/queries";
import { JUST_LAUNCHED_SIZE, PAGE_SIZE } from "@/lib/launchpad/paging";
import { ethUsd } from "@/lib/launchpad/ethPrice";
import { LAUNCHPAD_CONFIGURED, visibleChainOr } from "@/lib/launchpad/config";
import { dbConfigured } from "@/lib/db";
import { isFilter } from "@/lib/launchpad/search";
import { nowMs } from "@/lib/launchpad/time";
import { feedKey, inRiverWindow, riverCoverage } from "@/lib/launchpad/river";
import TrendingStrip from "@/components/launchpad/TrendingStrip";
import BoostedLane from "@/components/launchpad/BoostedLane";
import { boostLaneOrNull } from "@/lib/launchpad/boostServer";
import LaunchPill from "@/components/launchpad/LaunchPill";
import WhyFree from "@/components/launchpad/WhyFree";
import { MagicCard } from "@/components/vendor/magic-card";
import { LAYOUT_COOKIE, parseLayout } from "@/lib/launchpad/list-layout";
import { MARKET_COOKIE, parseMarketPreferences } from "@/lib/launchpad/market-preferences";
import { BASE_PUBLIC_ENABLED } from "@/lib/chainPublic";

export const dynamic = "force-dynamic";
// Title and description come from the root layout; ?sort= / ?chain= / ?window= / ?view= are all this one page.
export const metadata: Metadata = { alternates: { canonical: "/" } };

/** The river starts from the newest events (getLaunchFeed's ceiling) and keeps the ones from the last 30 minutes. */
const RIVER_SEED = 100;

export default async function Home({ searchParams }: { searchParams: Promise<{ sort?: string; window?: string; chain?: string; filter?: string; view?: string }> }) {
  const requested = await searchParams;
  const jar = await cookies();
  // Explicit links always win. A plain home visit restores the previous market selection before rendering.
  const saved = parseMarketPreferences(jar.get(MARKET_COOKIE)?.value);
  const hasSelection = [requested.sort, requested.window, requested.chain, requested.filter, requested.view].some(v => v !== undefined);
  const sp = hasSelection || !saved ? requested : { sort: saved.sort, window: saved.window, chain: saved.chain ?? undefined, filter: saved.filter ?? undefined, view: undefined };
  const sort = parseSort(sp.sort, "live");
  const window: VolumeWindow = VOLUME_WINDOWS.includes(sp.window as VolumeWindow) ? (sp.window as VolumeWindow) : "all";
  const chain = BASE_PUBLIC_ENABLED ? visibleChainOr(sp.chain) : "robinhood";
  const filter = BASE_PUBLIC_ENABLED && isFilter(sp.filter) ? sp.filter : null;
  const usd = await ethUsd();
  const layout = parseLayout(jar.get(LAYOUT_COOKIE)?.value);
  const listOpts = { sort, window, chain, filter, limit: PAGE_SIZE, ethUsd: usd };
  const [page, feed, fresh, posts, fetchedTrending, boost] = await Promise.all([
    listLaunchesPage(listOpts),
    getLaunchFeed(RIVER_SEED, usd),
    listLaunchesPage({ sort: "new", chain, limit: JUST_LAUNCHED_SIZE, ethUsd: usd }),
    listFeed(30),
    isTrendingSource(listOpts) ? null : getTrending(usd, chain),
    BASE_PUBLIC_ENABLED ? boostLaneOrNull(usd) : null,
  ]);
  const trending = await withBoardTape(fetchedTrending ?? trendingFrom(page.items)); // the default view's first page doubles as the strip's candidates; the tapes are the cards' recent trades
  const visibleFeed = BASE_PUBLIC_ENABLED ? feed : feed.filter(item => item.chain === "robinhood");
  const visiblePosts = BASE_PUBLIC_ENABLED ? posts : posts.filter(post => post.chain === "robinhood");
  const now = nowMs();

  return (
    <>
      <main className="bb-market bb-mid bb-page relative space-y-6 pb-16 sm:space-y-8">
        <LaunchHero configured={LAUNCHPAD_CONFIGURED} />
        <RecentTokens />
        {/* what is hot first (names and numbers to act on), then the last half hour as it happens, then every launch */}
        <TrendingStrip initial={trending} serverNow={now} seenKeys={visibleFeed.filter((item) => item.kind === "swap").map(feedKey)} />
        {/* paid and labelled, after the facts-only board and never inside it (boost.ts); nothing while BOOST is off */}
        {BASE_PUBLIC_ENABLED ? <BoostedLane initial={boost ?? { enabled: false }} serverNow={now} source="home" /> : null}
        <LiveRiver initial={visibleFeed.filter((item) => inRiverWindow(item, now))} recent={visibleFeed} serverNow={now} coveredSince={riverCoverage(visibleFeed, RIVER_SEED, now)} lastActivityAt={visibleFeed[0] ? new Date(visibleFeed[0].at).getTime() : 0} />
        <div id="token-market" className="scroll-mt-24 grid items-start gap-x-8 gap-y-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <MagicCard className="min-w-0 rounded-2xl"><LaunchList frame="rounded-[inherit]" initial={page.items} initialHasMore={page.hasMore} initialSort={sort} initialWindow={window} initialChain={chain} initialFilter={filter} initialView={sp.view === "watchlist" ? "watchlist" : "market"} initialLayout={layout} hasDb={dbConfigured()} serverNow={now} /></MagicCard>
          <aside aria-label="New launches and community" className="grid min-w-0 gap-4 md:grid-cols-2 xl:sticky xl:top-24 xl:grid-cols-1">
            <JustLaunched initial={fresh.items} serverNow={now} />
            <div className="min-w-0 space-y-4">
              <PostsFeed initial={visiblePosts} compact />
              <WhyFree />
            </div>
          </aside>
        </div>
      </main>
      {/* outside <main>: it is fixed to the screen, and as <main>'s last child it switched the spacing of the grid above it
          (space-y skips only the last child) every time it came or went, moving the page's height and the footer with it */}
      <LaunchPill />
    </>
  );
}
