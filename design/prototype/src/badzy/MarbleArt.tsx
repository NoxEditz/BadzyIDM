import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Badzy brand art — animated red liquid-marble / lava-vein texture.
 * Pure SVG (fractal noise + displacement, slow drift) with a gradient veil
 * on top so overlaid text stays readable. No stock photos, no bitmaps.
 */
export function MarbleArt({
  className,
  veil = 0.8,
  seed = 7,
}: {
  className?: string;
  veil?: number;
  seed?: number;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute -inset-[12%] animate-drift">
        <svg className="h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`mv-${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--accent)" />
              <stop offset="1" stopColor="var(--accent-2)" />
            </linearGradient>
            <filter id={`mf-${id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.028" numOctaves="3" seed={seed} result="n">
                <animate
                  attributeName="seed"
                  values={`${seed};${seed + 5};${seed}`}
                  dur="38s"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="n" scale="80" />
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>
          <rect width="400" height="300" fill="var(--window)" />
          <g filter={`url(#mf-${id})`} opacity="0.92">
            <rect x="50" y="118" width="270" height="26" rx="13" fill={`url(#mv-${id})`} transform="rotate(-24 200 140)" />
            <rect x="90" y="178" width="230" height="12" rx="6" fill={`url(#mv-${id})`} transform="rotate(-16 200 180)" opacity="0.85" />
            <ellipse cx="150" cy="88" rx="95" ry="17" fill="var(--accent)" opacity="0.55" transform="rotate(-30 150 88)" />
            <ellipse cx="305" cy="212" rx="115" ry="15" fill="var(--accent-2)" opacity="0.5" transform="rotate(-11 305 212)" />
            <path d="M10 258 Q 200 198 390 242" stroke={`url(#mv-${id})`} strokeWidth="8" fill="none" opacity="0.75" />
            <path d="M-10 58 Q 180 122 410 48" stroke="var(--accent)" strokeWidth="4.5" fill="none" opacity="0.5" />
            <path d="M30 30 Q 240 90 400 20" stroke="var(--accent-2)" strokeWidth="3" fill="none" opacity="0.4" />
          </g>
        </svg>
      </div>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(165deg, color-mix(in oklab, var(--window) ${veil * 100}%, transparent) 0%, color-mix(in oklab, var(--window) ${Math.max(0, (veil - 0.3) * 100)}%, transparent) 45%, color-mix(in oklab, var(--window) ${Math.min(100, (veil + 0.08) * 100)}%, transparent) 100%)`,
        }}
      />
    </div>
  );
}
