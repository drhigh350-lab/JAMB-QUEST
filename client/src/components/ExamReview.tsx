import React from "react";
import { ArrowRight, BarChart3, CheckCircle2, Flag, XCircle } from "lucide-react";
import { questionExplanationLines } from "@/game/explanation";
import type { AnswerRecord, BankQuestion, MistakeReason, RoundConfig } from "@/game/types";

interface ExamReviewProps {
  config: RoundConfig;
  questions: BankQuestion[];
  answers: Record<string, AnswerRecord>;
  flaggedIds: string[];
  onFinalize: () => void;
  onHome: () => void;
  historical?: { completedAt: Date; durationSeconds: number } | null;
  mistakeReasons?: Record<string, MistakeReason>;
  onMistakeReasonChange?: (questionId: string, reason: MistakeReason | null) => void;
}

export function ExamReview({ config, questions, answers, flaggedIds, onFinalize, onHome, historical = null, mistakeReasons = {}, onMistakeReasonChange }: ExamReviewProps) {
  const correct = questions.filter((question) => answers[question.id]?.correct).length;
  const unanswered = questions.filter((question) => answers[question.id]?.selectedIndex === null).length;
  const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  return <main className="exam-review page-shell">
    <header className="exam-review-header"><div><span className="eyebrow">{historical ? "SAVED CBT CORRECTION" : "CBT EXAM REVIEW"}</span><h1>{config.subject}</h1><p>{historical ? `Completed ${historical.completedAt.toLocaleString()} · ${Math.max(0, Math.round(historical.durationSeconds / 60))} minutes recorded. Your original answers and corrections are preserved below.` : "Your selections have been marked. Review the corrections below before saving this mock to your exam log."}</p></div><button className="button button-outline" onClick={onHome}>{historical ? "Back to progress" : "Exit without saving"}</button></header>
    <section className="exam-review-summary"><div><CheckCircle2 size={20} /><strong>{correct} / {questions.length}</strong><span>correct</span></div><div><BarChart3 size={20} /><strong>{accuracy}%</strong><span>accuracy</span></div><div><Flag size={20} /><strong>{flaggedIds.length}</strong><span>flagged</span></div><div><XCircle size={20} /><strong>{unanswered}</strong><span>unanswered</span></div></section>
    <section className="exam-review-list" aria-label="Exam question review">{questions.map((question, index) => {
      const answer = answers[question.id];
      const isCorrect = Boolean(answer?.correct);
      const selectedText = answer?.selectedIndex === null || answer?.selectedIndex === undefined ? "No answer selected" : question.options[answer.selectedIndex];
      return <article className={`exam-review-item ${isCorrect ? "review-correct" : "review-wrong"}`} key={question.id}><div className="exam-review-index"><span>{String(index + 1).padStart(2, "0")}</span>{flaggedIds.includes(question.id) && <Flag size={14} />}</div><div className="exam-review-copy"><span className="question-topic-label">Topic: {question.topic}</span><h2>{question.question}</h2><p><strong>Your answer:</strong> {selectedText}</p><p><strong>Correct answer:</strong> {question.answer_text}</p><div className="explanation-block">{questionExplanationLines(question).map((line, lineIndex) => <p key={`${question.id}-line-${lineIndex}`}>{line}</p>)}</div>{!isCorrect && !historical && onMistakeReasonChange && <div className="mistake-reason-picker"><span>Why did you miss it? <small>Optional, but it sharpens your repair plan.</small></span><div>{(["concept", "calculation", "reading", "careless"] as const).map((reason) => <button key={reason} className={mistakeReasons[question.id] === reason ? "active" : ""} onClick={() => onMistakeReasonChange(question.id, mistakeReasons[question.id] === reason ? null : reason)}>{reason === "concept" ? "Concept" : reason === "calculation" ? "Calculation" : reason === "reading" ? "Reading" : "Careless error"}</button>)}</div></div>}</div><span className="review-verdict">{isCorrect ? <><CheckCircle2 size={16} /> Correct</> : <><XCircle size={16} /> Review</>}</span></article>;
    })}</section>
    <footer className="exam-review-footer">{historical ? <div><span className="eyebrow">SAVED EXAM LOG</span><strong>This correction review is read-only; it will not change your score or create another attempt.</strong></div> : <><div><span className="eyebrow">READY TO LOG</span><strong>Save this CBT attempt to your performance history.</strong></div><button className="button button-dark" onClick={onFinalize}>Save exam log <ArrowRight size={16} /></button></>}</footer>
  </main>;
}
