import { poolFeeExample } from "@/lib/launchpad/trade-fee-summary";
import { explorerAddress, type ChainKey } from "@/lib/chainPublic";

export default function TradeFeeSummary({
  chain,
  feePips,
  recipients,
  inputSymbol,
  multihop = false,
}: {
  chain: ChainKey;
  feePips: number;
  recipients?: { payout: string; bps: number }[] | null;
  inputSymbol: string;
  multihop?: boolean;
}) {
  const example = poolFeeExample(feePips);
  const burned = (address: string) => /^0x(?:0{40}|0{36}dead)$/i.test(address);
  return (
    <details className="rounded-xl border border-line bg-paper px-3 text-[11px] text-muted">
      <summary className="min-h-11 cursor-pointer py-3 font-medium text-body">Where do the fees go?</summary>
      <div className="space-y-2 pb-3 leading-relaxed">
        <p>
          LAUNCH platform fee: <strong className="text-ink">$0</strong>. Network gas is separate and shown by your
          wallet before signing.
        </p>
        {example !== null ? (
          <p>
            Pool fee: <strong className="text-ink">{feePips / 10000}%</strong>. A trade of 100 {inputSymbol} includes{" "}
            {example.toLocaleString("en-US", { maximumFractionDigits: 6 })} {inputSymbol} in pool fees. This fee is
            included in the quote.
          </p>
        ) : (
          <p>Check the pool fee above before trading.</p>
        )}
        {multihop ? (
          <p>
            This route crosses additional pools. The example covers this token’s pool only; the quote includes the
            route’s trading fees.
          </p>
        ) : null}
        {feePips === 0 ? (
          <p>This pool charges no trading fee.</p>
        ) : Array.isArray(recipients) ? (
          recipients.length === 0 ? (
            <p>All collected pool fees go to the burn address.</p>
          ) : (
            <>
              <p>Collected pool fees are allocated to:</p>
              <ul className="space-y-1">
                {recipients.map((recipient, index) => (
                  <li key={`${recipient.payout}:${index}`} className="flex items-start justify-between gap-2">
                    <a
                      href={explorerAddress(chain, recipient.payout)}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all underline underline-offset-2"
                    >
                      {burned(recipient.payout)
                        ? "Burn address"
                        : `${recipient.payout.slice(0, 6)}…${recipient.payout.slice(-4)}`}{" "}
                      ↗
                    </a>
                    <span className="shrink-0 font-mono">{recipient.bps / 100}%</span>
                  </li>
                ))}
              </ul>
            </>
          )
        ) : (
          <p>Recipient details are unavailable. Check the pool’s fee route above.</p>
        )}
        <p>Slippage tolerance is a limit on execution, rather than an additional fee.</p>
      </div>
    </details>
  );
}
