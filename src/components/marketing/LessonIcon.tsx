import type { Lesson } from "@/data/lessons";

/** Small illustrative glyphs for lesson cards. Decorative, not data. */
export function LessonIcon({ kind }: { kind: Lesson["icon"] }) {
  return (
    <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true">
      {kind === "candles" ? (
        <g strokeWidth="2" strokeLinecap="round">
          <line x1="14" x2="14" y1="14" y2="50" stroke="#44D9A4" />
          <rect x="9" y="22" width="10" height="18" rx="2" fill="#44D9A4" />
          <line x1="32" x2="32" y1="10" y2="46" stroke="#FF758A" />
          <rect x="27" y="16" width="10" height="20" rx="2" fill="#FF758A" />
          <line x1="50" x2="50" y1="18" y2="54" stroke="#44D9A4" />
          <rect x="45" y="26" width="10" height="16" rx="2" fill="#44D9A4" />
        </g>
      ) : null}
      {kind === "profile" ? (
        <g>
          {[10, 18, 32, 46, 38, 24, 14].map((w, i) => (
            <rect
              key={i}
              x="8"
              y={9 + i * 7}
              width={w}
              height="5"
              rx="2"
              fill={w === 46 ? "#FFC53D" : w > 30 ? "#37D5FA" : "#3D6FD8"}
            />
          ))}
        </g>
      ) : null}
      {kind === "averages" ? (
        <g fill="none" strokeWidth="3" strokeLinecap="round">
          <path d="M6 46 C 18 44, 24 22, 34 24 S 50 40, 58 16" stroke="#FFC53D" />
          <path d="M6 50 C 20 48, 28 34, 38 32 S 52 30, 58 24" stroke="#2F7BFF" />
        </g>
      ) : null}
      {kind === "renko" ? (
        <g>
          {[
            [8, 40, "#44D9A4"],
            [18, 32, "#44D9A4"],
            [28, 24, "#44D9A4"],
            [38, 32, "#FF758A"],
            [48, 40, "#FF758A"],
          ].map(([x, y, color]) => (
            <rect key={x} x={x} y={y} width="9" height="8" rx="1.5" fill={color as string} />
          ))}
        </g>
      ) : null}
      {kind === "onchain" ? (
        <g>
          <path d="M8 18 H28 L25 52 H11 Z" fill="none" stroke="#B79BFF" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M10.5 34 H25.5 L24.2 50 H11.8 Z" fill="#8B5CF6" />
          <path d="M36 12 H56 L53 52 H39 Z" fill="none" stroke="#75C9FF" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M37.4 22 H54.6 L52.2 50 H39.8 Z" fill="#37D5FA" />
        </g>
      ) : null}
      {kind === "sound" ? (
        <g>
          <path d="M24 44 V16 L50 10 V38" fill="none" stroke="#B79BFF" strokeWidth="3.5" strokeLinejoin="round" />
          <ellipse cx="19" cy="45" rx="7" ry="5.5" fill="#F05DEB" />
          <ellipse cx="45" cy="39" rx="7" ry="5.5" fill="#8B5CF6" />
        </g>
      ) : null}
    </svg>
  );
}
