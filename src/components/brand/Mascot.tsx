import Image from "next/image";
import { cn } from "@/lib/cn";

type Pose = { src: string; width: number; height: number; alt: string; idle?: string };

/**
 * Original poses are cropped from the official LiquiditySlushy character sheet
 * (public/images/liquidity-slushy). The poses in public/images/mascot were drawn from that sheet
 * for the site. Each one has its own idle motion, defined in app/motion.css.
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
  heroScene: { src: "/images/liquidity-slushy/hero-scene.webp", width: 622, height: 612, alt: "LiquiditySlushy sitting on a rock with a phone, pointing ahead, a laptop with a To The Moon sticker beside him", idle: "idle-float" },
  welcomeWave: { src: "/images/mascot/welcome-wave.webp", width: 319, height: 560, alt: "LiquiditySlushy waving hello", idle: "idle-wave" },
  teacherPointing: { src: "/images/mascot/teacher-pointing.webp", width: 520, height: 560, alt: "LiquiditySlushy pointing at a small candlestick chart", idle: "idle-point" },
  candleCarry: { src: "/images/mascot/candle-carry.webp", width: 526, height: 560, alt: "LiquiditySlushy carrying a giant green candlestick", idle: "idle-heave" },
  lineSurfer: { src: "/images/mascot/line-surfer.webp", width: 505, height: 560, alt: "LiquiditySlushy surfing on two moving average lines", idle: "idle-surf" },
  brickBuilder: { src: "/images/mascot/brick-builder.webp", width: 519, height: 560, alt: "LiquiditySlushy in a hard hat stacking Renko bricks", idle: "idle-stack" },
  chainDetective: { src: "/images/mascot/chain-detective.webp", width: 497, height: 560, alt: "LiquiditySlushy inspecting linked blocks with a magnifying glass", idle: "idle-peer" },
  twoBuckets: { src: "/images/mascot/two-buckets.webp", width: 456, height: 560, alt: "LiquiditySlushy comparing a cyan bucket and a pink bucket", idle: "idle-balance" },
  headphones: { src: "/images/mascot/headphones-listening.webp", width: 398, height: 560, alt: "LiquiditySlushy listening on headphones with eyes closed", idle: "idle-groove" },
  djMixer: { src: "/images/mascot/dj-mixer.webp", width: 357, height: 560, alt: "LiquiditySlushy in sunglasses at a DJ deck", idle: "idle-sway" },
  piano: { src: "/images/mascot/piano.webp", width: 429, height: 560, alt: "LiquiditySlushy playing a piano", idle: "idle-keys" },
  sonarRadar: { src: "/images/mascot/sonar-radar.webp", width: 314, height: 560, alt: "LiquiditySlushy holding a handheld radar", idle: "idle-scan" },
  drums: { src: "/images/mascot/drums.webp", width: 497, height: 560, alt: "LiquiditySlushy playing a drum kit", idle: "idle-drum" },
  stopwatch: { src: "/images/mascot/stopwatch.webp", width: 383, height: 560, alt: "LiquiditySlushy holding up a stopwatch", idle: "idle-tick" },
  gameController: { src: "/images/mascot/game-controller.webp", width: 352, height: 560, alt: "LiquiditySlushy holding a game controller", idle: "idle-mash" },
  megaphone: { src: "/images/mascot/feedback-megaphone.webp", width: 365, height: 560, alt: "LiquiditySlushy speaking into a megaphone", idle: "idle-shout" },
  quizTrophy: { src: "/images/mascot/quiz-trophy.webp", width: 453, height: 560, alt: "LiquiditySlushy jumping with a trophy", idle: "idle-cheer" },
  quizTryAgain: { src: "/images/mascot/quiz-try-again.webp", width: 285, height: 560, alt: "LiquiditySlushy smiling with a thumbs up", idle: "idle-nod" },
  lostMap: { src: "/images/mascot/lost-map.webp", width: 314, height: 560, alt: "LiquiditySlushy puzzled by a map held upside down", idle: "idle-puzzled" },
  repairWrench: { src: "/images/mascot/repair-wrench.webp", width: 328, height: 560, alt: "LiquiditySlushy holding a wrench", idle: "idle-fix" },
  comingSoon: { src: "/images/mascot/coming-soon.webp", width: 336, height: 560, alt: "LiquiditySlushy in a hard hat with a traffic cone", idle: "idle-hover" },
  headHappy: { src: "/images/mascot/head-happy.webp", width: 174, height: 256, alt: "LiquiditySlushy smiling" },
  headWink: { src: "/images/mascot/head-wink.webp", width: 165, height: 256, alt: "LiquiditySlushy winking", idle: "idle-peek" },
} as const satisfies Record<string, Pose>;

export type MascotPose = keyof typeof POSES;

type MascotProps = {
  pose: MascotPose;
  className?: string;
  /** Rendered CSS width hint for responsive image selection. */
  sizes?: string;
  priority?: boolean;
  /** Pass true when the image is purely decorative next to text that says the same thing. */
  decorative?: boolean;
  /** Turns off the idle motion, for small or repeated mascots. */
  still?: boolean;
};

export function Mascot({ pose, className, sizes = "160px", priority = false, decorative = false, still = false }: MascotProps) {
  const p: Pose = POSES[pose];
  return (
    <Image
      src={p.src}
      width={p.width}
      height={p.height}
      alt={decorative ? "" : p.alt}
      sizes={sizes}
      priority={priority}
      draggable={false}
      className={cn("h-auto select-none", !still && p.idle, className)}
    />
  );
}

const BRAND_IMAGES = {
  "badge-lesson-complete": { width: 193, height: 256 },
  "deco-ice-crystals": { width: 767, height: 776 },
  "deco-sound-candles": { width: 780, height: 277 },
  "icon-audio-lab": { width: 256, height: 251 },
  "icon-candlesticks": { width: 256, height: 247 },
  "icon-games": { width: 256, height: 255 },
  "icon-learn": { width: 256, height: 255 },
  "icon-moving-average": { width: 256, height: 255 },
  "icon-on-chain": { width: 256, height: 253 },
  "icon-renko": { width: 256, height: 255 },
} as const;

export type BrandImageName = keyof typeof BRAND_IMAGES;

/** Icons, badges and decorations from public/images/mascot. Always decorative: nearby text carries the meaning. */
export function BrandImage({ name, className, sizes = "64px" }: { name: BrandImageName; className?: string; sizes?: string }) {
  const { width, height } = BRAND_IMAGES[name];
  return <Image src={`/images/mascot/${name}.webp`} width={width} height={height} alt="" sizes={sizes} draggable={false} className={cn("select-none", className)} />;
}
