import type { QuizQuestion } from "./types";

export const LESSON_ID = "echo-bands";

export const ECHO_COMPLETION = "Great work. You can hear where a candle closes between two bands from the pitch and timing of its echo.";

export const ECHO_QUIZ: QuizQuestion[] = [
  {
    id: "q-echo-notes",
    prompt: "A candle closes inside the channel. What do you hear?",
    options: [
      { id: "a", text: "Lower band, close, upper band" },
      { id: "b", text: "Only the close" },
      { id: "c", text: "Upper band, then lower band" },
      { id: "d", text: "A drum for every candle" },
    ],
    correct: "a",
    explanation: "Each candle plays three short notes: the lower band, the close and the upper band. The close lands between them.",
  },
  {
    id: "q-echo-middle",
    prompt: "The close note sounds exactly halfway between the two band notes, in pitch and in time. Where did the candle close?",
    options: [
      { id: "a", text: "On the lower band" },
      { id: "b", text: "Halfway between the bands" },
      { id: "c", text: "Above the channel" },
      { id: "d", text: "It cannot be known from sound" },
    ],
    correct: "b",
    explanation: "The close is placed between the band notes in proportion to where it sits between the bands, so halfway in sound means halfway in price.",
  },
  {
    id: "q-echo-outside",
    prompt: "You hear the close note first, before both band notes, and it is higher than everything else. What happened?",
    options: [
      { id: "a", text: "The candle closed above the upper band" },
      { id: "b", text: "The candle closed below the lower band" },
      { id: "c", text: "The candle closed on the lower band" },
      { id: "d", text: "The bands crossed" },
    ],
    correct: "a",
    explanation: "Outside the channel the close leads both bands. A higher pitch means above the channel, a lower pitch means below it.",
  },
  {
    id: "q-echo-two",
    prompt: "A candle only plays two notes. Why?",
    options: [
      { id: "a", text: "The sound is broken" },
      { id: "b", text: "The close sits on a band, so the close and band notes merge" },
      { id: "c", text: "The candle had no volume" },
      { id: "d", text: "The market was closed" },
    ],
    correct: "b",
    explanation: "When the close is right on a band, the two notes are the same, so you hear them as one.",
  },
  {
    id: "q-echo-signal",
    prompt: "What does an echo band sound tell you?",
    options: [
      { id: "a", text: "Where price closed relative to two boundaries" },
      { id: "b", text: "Whether to buy or sell" },
      { id: "c", text: "What price will do next" },
      { id: "d", text: "How much volume traded" },
    ],
    correct: "a",
    explanation: "Echo bands describe distance from two boundaries. They are a listening aid, not a forecast or a trading signal.",
  },
];
