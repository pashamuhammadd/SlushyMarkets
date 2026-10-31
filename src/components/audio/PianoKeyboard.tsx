import { TIMEFRAMES } from "@/lib/audio/trend-scenario";

const LOW = 36; // C2
const HIGH = 96; // C7
const BLACK = new Set([1, 3, 6, 8, 10]);

const isBlack = (midi: number) => BLACK.has(midi % 12);

function registerColor(midi: number): string | null {
  const tf = TIMEFRAMES.find((t) => midi >= t.baseMidi && midi <= t.baseMidi + 12);
  return tf ? tf.color : null;
}

/** One piano, three registers. Keys light up while their note sounds. */
export function PianoKeyboard({ activeNotes }: { activeNotes: number[] }) {
  const whites: number[] = [];
  for (let m = LOW; m <= HIGH; m += 1) if (!isBlack(m)) whites.push(m);
  const keyW = 10;
  const width = whites.length * keyW;
  const height = 56;
  const active = new Set(activeNotes);
  const whiteIndex = new Map(whites.map((m, i) => [m, i]));

  return (
    <svg viewBox={`0 0 ${width} ${height + 8}`} preserveAspectRatio="none" className="h-20 w-full" aria-hidden="true">
      {whites.map((m, i) => {
        const color = registerColor(m);
        const on = active.has(m);
        return (
          <g key={m}>
            <rect
              x={i * keyW + 0.4}
              y={0}
              width={keyW - 0.8}
              height={height}
              rx={1.5}
              fill={on && color ? color : "#E8F1FF"}
              fillOpacity={on ? 1 : 0.92}
            />
            {color ? <rect x={i * keyW + 0.4} y={height + 3} width={keyW - 0.8} height={4} rx={1} fill={color} /> : null}
          </g>
        );
      })}
      {Array.from({ length: HIGH - LOW + 1 }, (_, k) => LOW + k)
        .filter(isBlack)
        .map((m) => {
          const left = whiteIndex.get(m - 1) ?? 0;
          const color = registerColor(m);
          const on = active.has(m);
          return (
            <rect
              key={m}
              x={(left + 1) * keyW - keyW * 0.32}
              y={0}
              width={keyW * 0.64}
              height={height * 0.6}
              rx={1.2}
              fill={on && color ? color : "#0A1830"}
            />
          );
        })}
    </svg>
  );
}
