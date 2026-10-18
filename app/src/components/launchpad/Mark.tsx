/** LAUNCH mark: white geometric L on the MyUSIC accent tile. */
export default function Mark({ size = 24, className = "", title = "LAUNCH", tile = true, color = "#FFFFFF" }: { size?: number; className?: string; title?: string; tile?: boolean; color?: string }) {
  const fg = tile ? "#FFFFFF" : color;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={title}>
      {tile ? <rect width="32" height="32" rx="7" fill="#FA003E" /> : null}
      <rect x="10" y="6" width="4.6" height="20" rx="1.4" fill={fg} />
      <rect x="10" y="21.4" width="13" height="4.6" rx="1.4" fill={fg} />
    </svg>
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
