/* Field Notes Arcade: the quiz shell keeps the ledger, question sheet, and timer in one visible workspace. */

import { ArrowLeft, Flag, Flame, Pause, Send, TimerReset } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { QuestionCard } from "./QuestionCard";
import { QuestionLedger } from "./QuestionLedger";
import { JambCalculator } from "./JambCalculator";
import type { AnswerRecord, BankQuestion, RoundConfig } from "@/game/types";

interface QuizShellProps {
  config: RoundConfig;
  questions: BankQuestion[];
  currentIndex: number;
  currentQuestion: BankQuestion;
  selectedIndex: number | null;
  answered: boolean;
  currentAnswer?: AnswerRecord;
  secondsLeft: number;
  streak: number;
  answers: Record<string, AnswerRecord>;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  onQuit: () => void;
  flaggedIds?: string[];
  onNavigate?: (index: number) => void;
  onToggleFlag?: () => void;
  onFinishCbt?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  bookmarkedQuestionIds?: string[];
  onToggleBookmark?: () => void;
}

export function QuizShell({ config, questions, currentIndex, currentQuestion, selectedIndex, answered, currentAnswer, secondsLeft, streak, answers, onSelect, onSubmit, onNext, onQuit, flaggedIds = [], onNavigate, onToggleFlag, onFinishCbt, isPaused = false, onTogglePause, bookmarkedQuestionIds = [], onToggleBookmark }: QuizShellProps) {
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const timerState = secondsLeft <= 10 ? "timer-hot" : secondsLeft <= 20 ? "timer-warm" : "";
  const cbtMode = config.mode === "cbt";
  const currentFlagged = flaggedIds.includes(currentQuestion.id);
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const firstMatchingIndex = (predicate: (question: BankQuestion) => boolean) => questions.findIndex(predicate);
  const reviewMatching = (predicate: (question: BankQuestion) => boolean) => {
    const index = firstMatchingIndex(predicate);
    if (index < 0) return;
    setSubmitConfirmOpen(false);
    onNavigate?.(index);
  };
  useEffect(() => {
    if (!cbtMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      const key = event.key.toUpperCase();
      if (["A", "B", "C", "D", "P", "N", "S", "R", "Y"].includes(key)) event.preventDefault();
      const optionIndex = ["A", "B", "C", "D"].indexOf(key);
      if (optionIndex >= 0 && !isPaused) onSelect(optionIndex);
      if (key === "P") onNavigate?.(Math.max(0, currentIndex - 1));
      if (key === "N") onNavigate?.(Math.min(questions.length - 1, currentIndex + 1));
      if (key === "S") setSubmitConfirmOpen(true);
      if (key === "R" && submitConfirmOpen) setSubmitConfirmOpen(false);
      if (key === "Y" && submitConfirmOpen) { setSubmitConfirmOpen(false); onFinishCbt?.(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cbtMode, currentIndex, isPaused, onFinishCbt, onNavigate, onSelect, questions.length, submitConfirmOpen]);
  return (
    <main className="quiz-layout page-shell">
      <header className="quiz-header">
        <button className="icon-button" onClick={onQuit} aria-label="Leave round"><ArrowLeft size={19} /></button>
        <div className="quiz-header-title"><span className="eyebrow">{cbtMode ? "JAMB CBT MOCK" : config.mode === "review" ? "REVIEW MISSES" : "QUICK SPRINT"}</span><strong>{config.subject}</strong></div>
        <div className="quiz-header-controls"><JambCalculator /><div className={`timer-block ${timerState} ${isPaused ? "timer-paused" : ""}`}><TimerReset size={17} /><span>{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</span></div></div>
      </header>
      <div className="quiz-progress-row"><div className="progress-track"><span style={{ width: `${((cbtMode ? answeredCount : currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div><span>{cbtMode ? `${answeredCount} answered` : `${currentIndex + 1} / ${questions.length}`}</span>{streak > 1 && <span className="streak-badge"><Flame size={15} /> {streak} streak</span>}{cbtMode ? <><button className="pause-hint pause-control" onClick={onTogglePause}><Pause size={13} /> {isPaused ? "Resume exam" : "Pause exam"}</button><span className="keyboard-hint" title="A–D answer · P previous · N next · S submit · R return · Y confirm">Keys: A–D · P/N · S/R/Y</span></> : <span className="pause-hint"><Pause size={13} /> Timer runs live</span>}</div>
      <div className="quiz-workspace">
        <QuestionCard question={currentQuestion} index={currentIndex} total={questions.length} selectedIndex={selectedIndex} answered={answered} answer={currentAnswer} onSelect={onSelect} onSubmit={onSubmit} onNext={onNext} cbtMode={cbtMode} onSaveAndNext={onNext} isBookmarked={bookmarkedQuestionIds.includes(currentQuestion.id)} onToggleBookmark={onToggleBookmark} />
        <div className="cbt-ledger-stack"><QuestionLedger questions={questions} currentIndex={currentIndex} answers={answers} cbtMode={cbtMode} flaggedIds={flaggedIds} onNavigate={onNavigate} />
          {cbtMode && <div className="cbt-actions"><div className="cbt-nav-actions"><button className="button button-outline" onClick={() => onNavigate?.(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>Previous</button><button className="button button-outline" onClick={() => onNavigate?.(Math.min(questions.length - 1, currentIndex + 1))} disabled={currentIndex === questions.length - 1}>Next</button></div><button className={`button ${currentFlagged ? "button-primary" : "button-outline"}`} onClick={onToggleFlag}><Flag size={15} /> {currentFlagged ? "Unflag question" : "Flag for review"}</button><AlertDialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}><AlertDialogTrigger asChild><button className="button button-dark">Finish & review <Send size={15} /></button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Review before submission</AlertDialogTitle><AlertDialogDescription>Use the real JAMB-style review step before finalising this mock. Keyboard: R returns to the exam; Y confirms the review screen.</AlertDialogDescription></AlertDialogHeader><div className="cbt-submit-summary"><div><strong>{answeredCount}/{questions.length}</strong><span>answered</span></div><div><strong>{unansweredCount}</strong><span>unanswered</span></div><div><strong>{flaggedIds.length}</strong><span>flagged</span></div></div><div className="cbt-submit-review-actions"><button className="button button-outline" disabled={!unansweredCount} onClick={() => reviewMatching((question) => !answers[question.id])}>Review unanswered</button><button className="button button-outline" disabled={!flaggedIds.length} onClick={() => reviewMatching((question) => flaggedIds.includes(question.id))}>Review flagged</button></div><AlertDialogFooter><AlertDialogCancel>Continue exam</AlertDialogCancel><AlertDialogAction onClick={() => { setSubmitConfirmOpen(false); onFinishCbt?.(); }}>Review my answers</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>}
        </div>
      </div>
    </main>
  );
}
