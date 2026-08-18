/* Field Notes Arcade: the question bank is a remote, validated data layer rather than a visual placeholder. */

import type { BankQuestion, QuizMode, RoundSubject, Subject } from "./types";
import { inferTopicFromQuestion } from "@shared/topicInference";

export const QUESTION_BANK_URL =
  "/manus-storage/jamb_high_yield_practice_bank_1000_natural_explanations_817e6822.json";

const SUBJECTS: Subject[] = ["Use of English", "Biology", "Chemistry", "Physics"];
const INTERNAL_TOPIC_LABEL = "to be tagged during syllabus mapping";

export function normaliseLearnerTopic(subject: Subject, topic: string | undefined) {
  return inferTopicFromQuestion(subject, "", topic);
}

export function normaliseQuestionTopic(question: BankQuestion) {
  return { ...question, topic: inferTopicFromQuestion(question.subject, question.question, question.topic) };
}

export async function loadQuestionBank(signal?: AbortSignal): Promise<BankQuestion[]> {
  const response = await fetch(QUESTION_BANK_URL, { signal });
  if (!response.ok) throw new Error("The question bank could not be loaded.");
  const payload = (await response.json()) as { questions?: unknown };
  if (!Array.isArray(payload.questions)) throw new Error("The question bank format is invalid.");

  const questions = payload.questions.filter(isBankQuestion).map(normaliseQuestionTopic);
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
    question.options.length >= 4 &&
    question.options.length <= 5 &&
    question.options.every((option) => typeof option === "string") &&
    typeof question.answer_index === "number" &&
    question.answer_index >= 0 &&
    question.answer_index < question.options.length &&
    typeof question.explanation === "string"
  );
}

export function selectQuestions(
  questions: BankQuestion[],
  subject: RoundSubject,
  mode: QuizMode,
  count: number,
  wrongIds: string[],
  filters?: { topic?: string; topics?: string[]; questionIds?: string[]; includeLekki?: boolean },
): BankQuestion[] {
  const savedQuestionIds = new Set(filters?.questionIds ?? []);
  const isLekkiQuestion = (question: BankQuestion) => question.subject === "Use of English" && question.topic.startsWith("The Lekki Headmaster");
  if (savedQuestionIds.size) {
    const exactQuestions = questions.filter((question) => savedQuestionIds.has(question.id));
    return shuffle(exactQuestions).slice(0, Math.min(count, exactQuestions.length));
  }
  if (subject === "Full JAMB Mock") {
    const distribution = count === 180
      ? { "Use of English": 60, Biology: 40, Chemistry: 40, Physics: 40 } satisfies Record<Subject, number>
      : Object.fromEntries(SUBJECTS.map((currentSubject, index) => [currentSubject, Math.floor(count / SUBJECTS.length) + (index < count % SUBJECTS.length ? 1 : 0)])) as Record<Subject, number>;
    return SUBJECTS.flatMap((currentSubject) => {
      const selected = questions.filter((question) => question.subject === currentSubject && (currentSubject !== "Use of English" || filters?.includeLekki || !isLekkiQuestion(question)));
      return shuffle(selected).slice(0, distribution[currentSubject]);
    });
  }
  const allSubjectQuestions = questions.filter((question) => question.subject === subject);
  const requestedTopics = new Set(filters?.topics ?? []);
  const hasTopicFilter = Boolean(filters?.topic || requestedTopics.size);
  const isDedicatedLekkiRound = Boolean(filters?.topic?.startsWith("The Lekki Headmaster")) || Array.from(requestedTopics).some((topic) => topic.startsWith("The Lekki Headmaster"));
  const subjectQuestions = subject === "Use of English" && !filters?.includeLekki && !isDedicatedLekkiRound
    ? allSubjectQuestions.filter((question) => !isLekkiQuestion(question))
    : allSubjectQuestions;
  const source = filters?.topic
      ? subjectQuestions.filter((question) => question.topic === filters.topic || (filters.topic === "The Lekki Headmaster" && question.topic.startsWith("The Lekki Headmaster · Chapter")))
      : requestedTopics.size
        ? subjectQuestions.filter((question) => requestedTopics.has(question.topic))
      : mode === "review"
        ? subjectQuestions.filter((question) => wrongIds.includes(question.id))
        : subjectQuestions;
  if (hasTopicFilter || mode === "review") return shuffle(source).slice(0, Math.min(count, source.length));
  return shuffle(subjectQuestions).slice(0, Math.min(count, subjectQuestions.length));
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}
