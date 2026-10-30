import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Poses cropped from the official LiquiditySlushy character sheet
 * (public/images/liquidity-slushy). No artwork here is generated or redrawn.
 */
const POSES = {
  front: { src: "/images/liquidity-slushy/front.png", width: 160, height: 307, alt: "LiquiditySlushy standing in a black crown hoodie" },
  happy: { src: "/images/liquidity-slushy/happy.png", width: 128, height: 151, alt: "LiquiditySlushy smiling" },
  cool: { src: "/images/liquidity-slushy/cool.png", width: 128, height: 154, alt: "LiquiditySlushy wearing sunglasses with a confident smirk" },
  excited: { src: "/images/liquidity-slushy/excited.png", width: 125, height: 150, alt: "LiquiditySlushy grinning with eyes closed in excitement" },
  thinking: { src: "/images/liquidity-slushy/thinking.png", width: 131, height: 151, alt: "LiquiditySlushy thinking with a hand on the chin" },
  surprised: { src: "/images/liquidity-slushy/surprised.png", width: 119, height: 151, alt: "LiquiditySlushy looking surprised" },
  laughing: { src: "/images/liquidity-slushy/laughing.png", width: 124, height: 142, alt: "LiquiditySlushy laughing" },
  sad: { src: "/images/liquidity-slushy/sad.png", width: 117, height: 143, alt: "LiquiditySlushy looking a little sad" },
  angry: { src: "/images/liquidity-slushy/angry.png", width: 122, height: 147, alt: "LiquiditySlushy frowning" },
  trading: { src: "/images/liquidity-slushy/trading.png", width: 226, height: 240, alt: "LiquiditySlushy studying candlestick charts on a laptop" },
  toTheMoon: { src: "/images/liquidity-slushy/to-the-moon.png", width: 251, height: 263, alt: "LiquiditySlushy leaping forward next to a rising green arrow" },
  celebrate: { src: "/images/liquidity-slushy/celebrate.png", width: 304, height: 221, alt: "LiquiditySlushy celebrating with a phone showing a green chart" },
  chill: { src: "/images/liquidity-slushy/chill.png", width: 406, height: 239, alt: "LiquiditySlushy relaxing on a crate holding a slushy cup" },
  heroScene: { src: "/images/liquidity-slushy/hero-scene.webp", width: 622, height: 612, alt: "LiquiditySlushy sitting on a rock with a phone, pointing ahead, a laptop with a To The Moon sticker beside him" },
} as const;

export type MascotPose = keyof typeof POSES;

type MascotProps = {
  pose: MascotPose;
  className?: string;
  /** Rendered CSS width hint for responsive image selection. */
  sizes?: string;
  priority?: boolean;
  /** Pass true when the image is purely decorative next to text that says the same thing. */
  decorative?: boolean;
};

export function Mascot({ pose, className, sizes = "160px", priority = false, decorative = false }: MascotProps) {
  const p = POSES[pose];
  return (
    <Image
      src={p.src}
      width={p.width}
      height={p.height}
      alt={decorative ? "" : p.alt}
      sizes={sizes}
      priority={priority}
      draggable={false}
      className={cn("h-auto select-none", className)}
    />
  );
}
