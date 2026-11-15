/**
 * Instrument definitions for the Sound Playground. Every voice is built from Web Audio
 * oscillators only: original programmatic tones, no samples or recordings.
 * Partials and envelopes follow the tone function in Slushy's sonar prototypes.
 */

export type VoiceId = "organ" | "speaker-organ" | "flute" | "bell" | "chime" | "tuned-wood" | "wood" | "drum" | "rounded-wood";

export type VoiceDefinition = {
  id: VoiceId;
  label: string;
  wave: OscillatorType;
  /** [frequency ratio, relative level] pairs added on top of each other. */
  partials: ReadonlyArray<readonly [number, number]>;
  /** Short hit with a quick downward pitch drop (drums and wood blocks). */
  percussive: boolean;
  /** Optional fixed hit shape, used instead of the standard envelope (see ROUNDED_WOOD). */
  hit?: HitShape;
};

/**
 * A fixed percussive shape: pitch = source Hz x pitchRatio, linear attack, then an exponential
 * decay with time constant decaySec, lasting lengthSec. The level is set so that one unscaled
 * hit has the given RMS, before event amplitude and layer and master gains.
 */
export type HitShape = { pitchRatio: number; attackSec: number; decaySec: number; lengthSec: number; rms: number };

/**
 * "Rounded wood" volume drum, style E from Slushy's speaker comparison (15 November 2026):
 * body = sin(p) + 0.35 sin(2.7 p) + 0.12 sin(4.1 p) at 1.8 x the source pitch,
 * envelope = exp(-t / 0.019) x min(t / 0.004, 1), about 115 ms, normalized to 0.048 RMS.
 * 110 Hz becomes about 198 Hz (sellers), 220 Hz about 396 Hz (buyers). No pitch drop, no click.
 */
export const ROUNDED_WOOD: HitShape = { pitchRatio: 1.8, attackSec: 0.004, decaySec: 0.019, lengthSec: 0.115, rms: 0.048 };
const ROUNDED_WOOD_PARTIALS: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [2.7, 0.35],
  [4.1, 0.12],
];

/** RMS of one unscaled hit, measured numerically at 48 kHz over the hit length. */
export function hitRms(shape: HitShape, partials: ReadonlyArray<readonly [number, number]>, sourceHz: number, sampleRate = 48000): number {
  const f = sourceHz * shape.pitchRatio;
  const n = Math.round(shape.lengthSec * sampleRate);
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / sampleRate;
    const phase = 2 * Math.PI * f * t;
    let body = 0;
    for (const [ratio, weight] of partials) body += weight * Math.sin(phase * ratio);
    const env = Math.exp(-t / shape.decaySec) * Math.min(t / shape.attackSec, 1);
    sum += (body * env) ** 2;
  }
  return Math.sqrt(sum / n);
}

const scaleCache = new Map<string, number>();

/** Peak multiplier that gives a hit of this voice its target RMS. */
export function hitScale(voice: VoiceDefinition, sourceHz: number): number {
  if (!voice.hit) return 1;
  const key = `${voice.id}:${Math.round(sourceHz)}`;
  let scale = scaleCache.get(key);
  if (scale === undefined) {
    const rms = hitRms(voice.hit, voice.partials, sourceHz);
    scale = rms > 0 ? voice.hit.rms / rms : 0;
    scaleCache.set(key, scale);
  }
  return scale;
}

const BELL: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [2.76, 0.23],
  [4.1, 0.08],
];

export const VOICES: Record<VoiceId, VoiceDefinition> = {
  organ: {
    id: "organ",
    label: "Organ",
    wave: "sine",
    partials: [
      [1, 1],
      [2, 0.3],
      [3, 0.15],
    ],
    percussive: false,
  },
  /**
   * Brighter organ for phone and laptop speakers, from Slushy's speaker comparison
   * (15 November 2026). Same pitches, stronger upper harmonics. Used by EMA Sonar and the
   * Sonar Channels modes; the original organ stays for everything else.
   */
  "speaker-organ": {
    id: "speaker-organ",
    label: "Speaker organ",
    wave: "sine",
    partials: [
      [1, 0.8],
      [2, 0.55],
      [3, 0.35],
      [4, 0.2],
    ],
    percussive: false,
  },
  flute: { id: "flute", label: "Flute", wave: "sine", partials: [[1, 1]], percussive: false },
  bell: { id: "bell", label: "Bell", wave: "sine", partials: BELL, percussive: false },
  chime: { id: "chime", label: "Chime", wave: "sine", partials: BELL, percussive: false },
  "tuned-wood": { id: "tuned-wood", label: "Tuned wood", wave: "triangle", partials: [[1, 1]], percussive: false },
  wood: { id: "wood", label: "Wood block", wave: "triangle", partials: [[1, 1]], percussive: true },
  drum: { id: "drum", label: "Drum", wave: "sine", partials: [[1, 1]], percussive: true },
  "rounded-wood": {
    id: "rounded-wood",
    label: "Rounded wood",
    wave: "sine",
    partials: ROUNDED_WOOD_PARTIALS,
    percussive: true,
    hit: ROUNDED_WOOD,
  },
};

export const VOICE_IDS = Object.keys(VOICES) as VoiceId[];

/** Fixed length of a percussive hit, in seconds. */
export const PERCUSSIVE_SECONDS = 0.095;
