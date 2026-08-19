/* Field Notes Arcade: shared game vocabulary keeps quiz rules separate from the visual frame. */

export type Subject = "Use of English" | "Biology" | "Chemistry" | "Physics";
export type RoundSubject = Subject | "Full JAMB Mock";
export type QuizMode = "sprint" | "cbt" | "review";
export type GameScreen = "home" | "quiz" | "result" | "exam-review";
export const STANDARD_FULL_CBT_SECONDS = 2 * 60 * 60;

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
  diagram_url?: string;
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
  timing?: "study" | "timed";
  /** Optional explicit duration for a timed CBT, in seconds. */
  durationSeconds?: number;
  /** English-only choice: include the separate Lekki Headmaster novel pool. */
  includeLekki?: boolean;
  topic?: string;
  topics?: string[];
  questionIds?: string[];
  recoveryOrigin?: "saved-question" | "missed-questions";
}

export interface AnswerRecord {
  selectedIndex: number | null;
  correct: boolean;
  timedOut: boolean;
}

export type MistakeReason = "concept" | "calculation" | "reading" | "careless";

export interface ActiveCbtSession {
  config: RoundConfig;
  questionIds: string[];
  answers: Record<string, AnswerRecord>;
  flaggedIds: string[];
  currentIndex: number;
  secondsLeft: number;
  initialSeconds: number;
  isPaused: boolean;
  deadlineAt: number | null;
}

export interface ExamReviewRecord {
  questionId: string;
  subject: Subject;
  topic: string;
  selectedIndex: number | null;
  correct: boolean;
  timedOut: boolean;
  flagged: boolean;
  mistakeReason?: MistakeReason;
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
