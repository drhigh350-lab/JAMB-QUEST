import type { BankQuestion } from "./types";

function clean(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function questionExplanationLines(question: BankQuestion): string[] {
  const topic = clean(question.topic) || "General revision";
  const rawExplanation = (question.explanation ?? "").split(/\r?\n/).map(clean).filter(Boolean);
  const explanation = clean(question.explanation);
  const answer = clean(question.answer_text) || "the selected correct option";
  if (rawExplanation.length >= 6) return rawExplanation.slice(0, 6);
  const core = explanation || `The correct answer is ${answer}.`;
  return [
    `Answer: ${answer}.`,
    `Core idea: ${core}`,
    `Topic focus: This question tests your understanding of ${topic}.`,
    "Reasoning step: Read the key wording, identify the concept being tested, and compare each option with that concept before choosing.",
    "Check the alternatives: An option can sound familiar but still be wrong when it does not match the exact definition, relationship, or condition in the question.",
    `Exam takeaway: Revisit ${topic} and practise recalling the rule in your own words before moving to the next question.`,
  ];
}

export function normalisedTopic(topic: string): string {
  const value = clean(topic);
  return value || "General revision";
}
