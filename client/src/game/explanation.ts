import type { BankQuestion } from "./types";

function clean(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function questionExplanationLines(question: BankQuestion): string[] {
  const topic = clean(question.topic) || "General revision";
  const sourceExplanation = (question.explanation ?? "").trim();
  const rawExplanation = sourceExplanation.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const explanation = clean(sourceExplanation);
  const answer = clean(question.answer_text) || "the selected correct option";
  const wordCount = explanation.split(" ").filter(Boolean).length;
  if (rawExplanation.length >= 2 && wordCount >= 25) return rawExplanation;
  if (wordCount >= 25) return [sourceExplanation];
  const core = explanation || `${answer} matches the idea being tested.`;
  return [
    `${answer} is the correct answer. ${core}`,
    `For ${topic}, compare each option with the exact condition in the question instead of choosing the one that merely sounds familiar.`,
  ];
}

export function normalisedTopic(topic: string): string {
  const value = clean(topic);
  return value || "General revision";
}
