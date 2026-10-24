/** The supplied LAUNCH coin artwork, shared by navigation, onboarding and launch receipts. */
export default function Mark({ size = 24, className = "", title = "LAUNCH" }: { size?: number; className?: string; title?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/launch-mark.webp" width={size} height={size} alt={title} className={className} style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }} />
  );
}

/** LAUNCH wordmark. */
export function Wordmark({ className = "", size = 15 }: { className?: string; size?: number }) {
  return (
    <span className={`font-semibold tracking-tight text-ink ${className}`} style={{ fontSize: size }}>
      LAUNCH
    </span>
  );
}
