import React from "react";
import { ArrowRight, BarChart3, CheckCircle2, Flag, XCircle } from "lucide-react";
import { questionExplanationLines } from "@/game/explanation";
import type { AnswerRecord, BankQuestion, RoundConfig } from "@/game/types";

interface ExamReviewProps {
  config: RoundConfig;
  questions: BankQuestion[];
  answers: Record<string, AnswerRecord>;
  flaggedIds: string[];
  onFinalize: () => void;
  onHome: () => void;
}

export function ExamReview({ config, questions, answers, flaggedIds, onFinalize, onHome }: ExamReviewProps) {
  const correct = questions.filter((question) => answers[question.id]?.correct).length;
  const unanswered = questions.filter((question) => answers[question.id]?.selectedIndex === null).length;
  const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  return <main className="exam-review page-shell">
    <header className="exam-review-header"><div><span className="eyebrow">CBT EXAM REVIEW</span><h1>{config.subject}</h1><p>Your selections have been marked. Review the corrections below before saving this mock to your exam log.</p></div><button className="button button-outline" onClick={onHome}>Exit without saving</button></header>
    <section className="exam-review-summary"><div><CheckCircle2 size={20} /><strong>{correct} / {questions.length}</strong><span>correct</span></div><div><BarChart3 size={20} /><strong>{accuracy}%</strong><span>accuracy</span></div><div><Flag size={20} /><strong>{flaggedIds.length}</strong><span>flagged</span></div><div><XCircle size={20} /><strong>{unanswered}</strong><span>unanswered</span></div></section>
    <section className="exam-review-list" aria-label="Exam question review">{questions.map((question, index) => {
      const answer = answers[question.id];
      const isCorrect = Boolean(answer?.correct);
      const selectedText = answer?.selectedIndex === null || answer?.selectedIndex === undefined ? "No answer selected" : question.options[answer.selectedIndex];
      return <article className={`exam-review-item ${isCorrect ? "review-correct" : "review-wrong"}`} key={question.id}><div className="exam-review-index"><span>{String(index + 1).padStart(2, "0")}</span>{flaggedIds.includes(question.id) && <Flag size={14} />}</div><div className="exam-review-copy"><span className="question-topic-label">Topic: {question.topic}</span><h2>{question.question}</h2><p><strong>Your answer:</strong> {selectedText}</p><p><strong>Correct answer:</strong> {question.answer_text}</p><div className="explanation-block">{questionExplanationLines(question).map((line, lineIndex) => <p key={`${question.id}-line-${lineIndex}`}>{line}</p>)}</div></div><span className="review-verdict">{isCorrect ? <><CheckCircle2 size={16} /> Correct</> : <><XCircle size={16} /> Review</>}</span></article>;
    })}</section>
    <footer className="exam-review-footer"><div><span className="eyebrow">READY TO LOG</span><strong>Save this CBT attempt to your performance history.</strong></div><button className="button button-dark" onClick={onFinalize}>Save exam log <ArrowRight size={16} /></button></footer>
  </main>;
}
