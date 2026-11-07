/**
 * Instrument definitions for the Sound Playground. Every voice is built from Web Audio
 * oscillators only: original programmatic tones, no samples or recordings.
 * Partials and envelopes follow the tone function in Slushy's sonar prototypes.
 */

export type VoiceId = "organ" | "flute" | "bell" | "chime" | "tuned-wood" | "wood" | "drum";

export type VoiceDefinition = {
  id: VoiceId;
  label: string;
  wave: OscillatorType;
  /** [frequency ratio, relative level] pairs added on top of each other. */
  partials: ReadonlyArray<readonly [number, number]>;
  /** Short hit with a quick downward pitch drop (drums and wood blocks). */
  percussive: boolean;
};

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
  flute: { id: "flute", label: "Flute", wave: "sine", partials: [[1, 1]], percussive: false },
  bell: { id: "bell", label: "Bell", wave: "sine", partials: BELL, percussive: false },
  chime: { id: "chime", label: "Chime", wave: "sine", partials: BELL, percussive: false },
  "tuned-wood": { id: "tuned-wood", label: "Tuned wood", wave: "triangle", partials: [[1, 1]], percussive: false },
  wood: { id: "wood", label: "Wood block", wave: "triangle", partials: [[1, 1]], percussive: true },
  drum: { id: "drum", label: "Drum", wave: "sine", partials: [[1, 1]], percussive: true },
};

export const VOICE_IDS = Object.keys(VOICES) as VoiceId[];

/** Fixed length of a percussive hit, in seconds. */
export const PERCUSSIVE_SECONDS = 0.095;
