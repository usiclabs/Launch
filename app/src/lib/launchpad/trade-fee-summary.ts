/** Display-only pool illustration, never used to set a swap amount or minimum output. */
export function poolFeeExample(feePips: number, amount = 100): number | null {
  return Number.isInteger(feePips) && feePips >= 0 && feePips <= 1_000_000 && Number.isFinite(amount) && amount >= 0
    ? (amount * feePips) / 1_000_000
    : null;
}
