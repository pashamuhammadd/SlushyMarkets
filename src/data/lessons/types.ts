/** Shared shape for multiple choice knowledge checks used by every lesson. */
export type QuizQuestion = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correct: string;
  explanation: string;
};
