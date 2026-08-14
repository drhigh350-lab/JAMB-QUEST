/* Field Notes Arcade: shared game vocabulary keeps quiz rules separate from the visual frame. */

export type Subject = "Use of English" | "Biology" | "Chemistry" | "Physics";
export type RoundSubject = Subject | "Full JAMB Mock";
export type QuizMode = "sprint" | "cbt" | "review";
export type GameScreen = "home" | "quiz" | "result" | "exam-review";

export interface BankQuestion {
  id: string;
  subject: Subject;
  topic: string;
  subtopic: string;
  difficulty: "easy" | "medium" | "hard";
  question_type: "multiple_choice";
  question: string;
  options: string[];
  answer_index: number;
  answer_text: string;
  explanation: string;
  tags: string[];
  source: string;
}

export interface QuestionBankPayload {
  metadata?: {
    title?: string;
    question_count?: number;
    answer_index_convention?: string;
  };
  questions: BankQuestion[];
}

export interface RoundConfig {
  subject: RoundSubject;
  mode: QuizMode;
  count: number;
  topic?: string;
  questionIds?: string[];
  recoveryOrigin?: "saved-question" | "missed-questions";
}

export interface AnswerRecord {
  selectedIndex: number | null;
  correct: boolean;
  timedOut: boolean;
}

export interface ExamReviewRecord {
  questionId: string;
  subject: Subject;
  topic: string;
  selectedIndex: number | null;
  correct: boolean;
  timedOut: boolean;
  flagged: boolean;
}

export interface StoredProgress {
  totalAnswered: number;
  totalCorrect: number;
  bestScore: number;
  lastScore: number;
  roundsPlayed: number;
  wrongIds: string[];
  subjectBest: Partial<Record<Subject, number>>;
}
