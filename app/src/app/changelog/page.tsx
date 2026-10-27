import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = pageMetadata({
  path: "/changelog",
  title: "Changelog",
  description:
    "The latest LAUNCH updates: creator tools, token discovery, trade clarity and a more considered experience.",
});

const releases = [
  {
    id: "robinhood-first",
    date: "2026-10-27",
    label: "October 27, 2026",
    category: "Network focus",
    title: "One network, clearly in focus.",
    summary:
      "LAUNCH is temporarily focused on Robinhood Chain while Base RPC reliability is being resolved.",
    updates: [
      [
        "Robinhood Chain as the active network",
        "Base launch options, chain references and homepage labels are hidden for now, so the active experience stays clear and consistent.",
      ],
      [
        "Easy to restore",
        "Base support remains in the product and can be re-enabled through the existing NEXT_PUBLIC_ENABLE_BASE feature flag when its RPC is ready.",
      ],
      [
        "A more welcoming first visit",
        "The onboarding flow has been refined with smoother pacing, subtle motion and clearer guidance through the platform.",
      ],
    ],
    links: [{ href: "/", label: "Explore LAUNCH" }],
  },
  {id: "workspace-portability",date:"2026-10-26",label:"October 26, 2026",category:"Workspace upgrades",title:"More room for your next idea.",summary:"Keep separate launches in progress and carry your saved workspace between devices.",updates:[["Named draft projects","Save up to 10 unfinished launches with token details and settings. Review before replacing your current form and undo project removals. First-buy amounts are cleared and custom pairs need reselecting."],["Workspace backup and restore","Export watchlists, templates, named projects, alerts, discovery views and preferences in one validated file. Review before replacing browser data. Wallet credentials, transaction history and the automatic recovery draft are excluded."],["Release highlights","A dismissible homepage panel links to the changelog. Dismissal is remembered for this release in your browser."]],links:[{href:"/launch",label:"Open draft projects"},{href:"/preferences#workspace-backup",label:"Back up your workspace"}]},
  {
    id: "workspace-and-verification",
    date: "2026-10-26",
    label: "October 26, 2026",
    category: "Experience & clarity",
    title: "More clarity. More control.",
    summary:
      "A more personal workspace, with practical answers and contract details closer to hand.",
    updates: [
      [
        "Token verification",
        "Inspect the network, token, pair, factory and liquidity locker addresses from the token detail page, with direct explorer links.",
      ],
      [
        "Saved discovery views",
        "Name and revisit your network, sort, volume-window and pairing filters. Copy a view link, save with Enter, and undo a removal. Saved views stay in your browser.",
      ],
      [
        "Display preferences",
        "Choose a preferred launch network and starting chart interval. These display defaults never switch your wallet or submit a transaction.",
      ],
      [
        "Metadata preview",
        "Review artwork, banner, description and social-link changes before signing a creator metadata update.",
      ],
      [
        "Help center",
        "Search practical guidance on launches, fees, approvals, slippage and pending transactions. Quick searches and clear empty states make answers easier to find.",
      ],
      [
        "Interface refinements",
        "More consistent workspace cards, clearer form labels, visible keyboard focus and subtle motion that respects reduced-motion preferences.",
      ],
    ],
    links: [
      { href: "/help", label: "Explore the help center" },
      { href: "/preferences", label: "Set your preferences" },
    ],
  },
  {
    id: "creator-launch-kit",
    date: "2026-10-26",
    label: "October 26, 2026",
    category: "Creator tools",
    title: "Ready to share your next idea.",
    summary:
      "A launch kit built around the details that matter, plus clearer guidance when a transaction needs attention.",
    updates: [
      [
        "Creator launch kit",
        "Open Share on a token page to edit and copy an announcement, export it as text, download token facts as JSON, or save a QR image.",
      ],
      [
        "Accurate token identity",
        "Share the token’s contract, network and page link alongside its name and symbol. Editing an announcement does not publish a post or change token metadata.",
      ],
      [
        "Transaction troubleshooting",
        "Contextual guidance explains wallet rejections, gas issues, slippage and RPC timeouts. An unavailable receipt is never presented as proof that a transaction failed.",
      ],
    ],
    links: [{ href: "/", label: "Find a token to share" }],
  },
  {
    id: "creator-workspace",
    date: "2026-10-25",
    label: "October 25, 2026",
    category: "Launch, discover & manage",
    title: "A stronger creator workspace.",
    summary:
      "Reusable launch setups, a clearer trade review and more useful ways to follow activity.",
    updates: [
      [
        "Launch templates",
        "Save named launch setups in your browser and import or export them as JSON. First-buy amounts are cleared when applying a template; custom pairings must be selected again.",
      ],
      [
        "Trade review",
        "Review the network, spending amount, minimum output, fees, slippage and signing wallet before continuing. Changed quotes or inputs require a fresh review.",
      ],
      [
        "Creator insights",
        "View 30 days of indexed activity, inspect fee-collection records and export CSV data from your connected dashboard. Pool fees are distinguished from personal earnings.",
      ],
      [
        "Unified activity history",
        "Bring indexed launches, recent wallet trades, fee collections and browser-saved transactions into one filterable view, with source and status labels.",
      ],
      [
        "Watchlist alerts",
        "Create one-shot price or market-cap alerts for watched tokens. Checks run while LAUNCH is open and visible, and pause when indexing is delayed or USD pricing is unavailable.",
      ],
      [
        "Trade filters",
        "Filter the loaded recent trades by buy or sell, wallet fragment and minimum quote amount. The interface makes the loaded-history limit explicit.",
      ],
    ],
    links: [
      { href: "/me", label: "Open your dashboard" },
      { href: "/alerts", label: "Manage watchlist alerts" },
    ],
  },
] as const;

export default function ChangelogPage() {
  return (
    <main className={`bb-market bb-mid bb-page ${styles.page}`}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>
          <Sparkles size={14} aria-hidden="true" /> Always moving forward
        </p>
        <h1>Changelog</h1>
        <p className={styles.intro}>
          The details make the difference. Follow the improvements shaping a
          clearer, smoother LAUNCH.
        </p>
        <div className={styles.heroBottom}>
          <span className={styles.latest}>
            Latest update <time dateTime="2026-10-27">October 27, 2026</time>
          </span>
          <a href="#robinhood-first" className={styles.link}>
            Read what’s new <ArrowRight size={15} aria-hidden="true" />
          </a>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <nav aria-label="Changelog sections">
            <p className={styles.navLabel}>In this release log</p>
            {releases.map((release) => (
              <a key={release.id} href={`#${release.id}`}>
                {release.title}
                <ArrowRight size={13} aria-hidden="true" />
              </a>
            ))}
            <a href="#platform-foundation">
              Platform foundations
              <ArrowRight size={13} aria-hidden="true" />
            </a>
          </nav>
          <p className={styles.sideNote}>
            Shipped updates, not a roadmap. Network availability and live
            indexing health are shown on the{" "}
            <Link href="/status">status page</Link>.
          </p>
        </aside>

        <div className={styles.timeline}>
          {releases.map((release, index) => (
            <article
              key={release.id}
              id={release.id}
              className={styles.release}
              aria-labelledby={`${release.id}-title`}
            >
              <div className={styles.releaseMeta}>
                <time dateTime={release.date}>{release.label}</time>
                {index === 0 && <span className={styles.newBadge}>Latest</span>}
              </div>
              <div className={styles.card}>
                <p className={styles.category}>{release.category}</p>
                <h2 id={`${release.id}-title`}>{release.title}</h2>
                <p className={styles.summary}>{release.summary}</p>
                <ul className={styles.updates}>
                  {release.updates.map(([title, description]) => (
                    <li key={title}>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </li>
                  ))}
                </ul>
                <div className={styles.actions}>
                  {release.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={styles.link}
                    >
                      {link.label}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
          <section
            id="platform-foundation"
            className={styles.foundation}
            aria-labelledby="foundation-title"
          >
            <p className={styles.category}>Core platform</p>
            <h2 id="foundation-title">The foundations remain simple.</h2>
            <p>
              Launch on Base or Robinhood Chain in one transaction: your token,
              a Uniswap v4 pool, and an original liquidity position locked
              permanently. All supply enters the pool at launch. No platform
              launch fee; network gas applies.
            </p>
            <p>
              Token and banner uploads, charts, swaps, token comparison,
              watchlists, creator fee collection and mobile onboarding support
              the journey from first visit to managing a launch. Arc remains
              coming soon.
            </p>
            <Link href="/rules" className={styles.link}>
              Understand the launch mechanics
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
