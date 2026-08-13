/* Field Notes Arcade: the question bank is a remote, validated data layer rather than a visual placeholder. */

import type { BankQuestion, QuizMode, Subject } from "./types";

export const QUESTION_BANK_URL =
  "/manus-storage/jamb_high_yield_practice_bank_1000_e93a7fa1.json";

const SUBJECTS: Subject[] = ["Use of English", "Biology", "Chemistry", "Physics"];

export async function loadQuestionBank(signal?: AbortSignal): Promise<BankQuestion[]> {
  const response = await fetch(QUESTION_BANK_URL, { signal });
  if (!response.ok) throw new Error("The question bank could not be loaded.");
  const payload = (await response.json()) as { questions?: unknown };
  if (!Array.isArray(payload.questions)) throw new Error("The question bank format is invalid.");

  const questions = payload.questions.filter(isBankQuestion);
  if (questions.length < 100) throw new Error("The question bank returned too few valid questions.");
  return questions;
}

function isBankQuestion(value: unknown): value is BankQuestion {
  if (!value || typeof value !== "object") return false;
  const question = value as Partial<BankQuestion>;
  return (
    typeof question.id === "string" &&
    SUBJECTS.includes(question.subject as Subject) &&
    typeof question.question === "string" &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every((option) => typeof option === "string") &&
    typeof question.answer_index === "number" &&
    question.answer_index >= 0 &&
    question.answer_index <= 3 &&
    typeof question.explanation === "string"
  );
}

export function selectQuestions(
  questions: BankQuestion[],
  subject: Subject,
  mode: QuizMode,
  count: number,
  wrongIds: string[],
): BankQuestion[] {
  const subjectQuestions = questions.filter((question) => question.subject === subject);
  const source = mode === "review" ? subjectQuestions.filter((question) => wrongIds.includes(question.id)) : subjectQuestions;
  return shuffle(source.length ? source : subjectQuestions).slice(0, Math.min(count, source.length || subjectQuestions.length));
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}
