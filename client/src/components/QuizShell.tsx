/* Field Notes Arcade: the quiz shell keeps the ledger, question sheet, and timer in one visible workspace. */

import { ArrowLeft, Flag, Flame, Pause, Send, TimerReset } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { QuestionCard } from "./QuestionCard";
import { QuestionLedger } from "./QuestionLedger";
import { JambCalculator } from "./JambCalculator";
import { isRoundTimed } from "@/game/dailyMission";
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
  onReportQuestion?: (input: { questionId: string; subject: BankQuestion["subject"]; topic: string; reason: "wrong_answer" | "missing_context" | "broken_diagram" | "confusing_wording" | "other"; note?: string }) => Promise<{ accepted: boolean; receipt: { id: number; status: "open" | "reviewing" | "resolved" | "dismissed" } | null }>;
  historicalReview?: boolean;
  historicalFilter?: "all" | "correct" | "wrong";
  onHistoricalFilter?: (filter: "all" | "correct" | "wrong") => void;
}

export function QuizShell({ config, questions, currentIndex, currentQuestion, selectedIndex, answered, currentAnswer, secondsLeft, streak, answers, onSelect, onSubmit, onNext, onQuit, flaggedIds = [], onNavigate, onToggleFlag, onFinishCbt, isPaused = false, onTogglePause, bookmarkedQuestionIds = [], onToggleBookmark, onReportQuestion, historicalReview = false, historicalFilter = "all", onHistoricalFilter }: QuizShellProps) {
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const timerState = secondsLeft <= 10 ? "timer-hot" : secondsLeft <= 20 ? "timer-warm" : "";
  const cbtMode = config.mode === "cbt";
  const displayCbt = cbtMode || historicalReview;
  const timedRound = isRoundTimed(config);
  const currentFlagged = flaggedIds.includes(currentQuestion.id);
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const fullMockCbt = displayCbt && config.subject === "Full JAMB Mock";
  const subjectIndices = fullMockCbt ? questions.map((question, index) => ({ question, index })).filter(({ question }) => question.subject === currentQuestion.subject).map(({ index }) => index) : [];
  const subjectPosition = fullMockCbt ? subjectIndices.indexOf(currentIndex) : currentIndex;
  const localQuestionIndex = fullMockCbt ? Math.max(0, subjectPosition) : currentIndex;
  const localQuestionTotal = fullMockCbt ? subjectIndices.length : questions.length;
  const previousIndex = fullMockCbt ? subjectIndices[Math.max(0, subjectPosition - 1)] ?? currentIndex : Math.max(0, currentIndex - 1);
  const nextIndex = fullMockCbt ? subjectIndices[Math.min(subjectIndices.length - 1, subjectPosition + 1)] ?? currentIndex : Math.min(questions.length - 1, currentIndex + 1);
  const canGoPrevious = currentIndex !== previousIndex;
  const canGoNext = currentIndex !== nextIndex;
  const navigatePrevious = () => onNavigate?.(previousIndex);
  const navigateNext = () => onNavigate?.(nextIndex);
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
      if (["A", "B", "C", "D", "E", "P", "N", "S", "R", "Y"].includes(key)) event.preventDefault();
      const optionIndex = ["A", "B", "C", "D", "E"].indexOf(key);
      if (optionIndex >= 0 && optionIndex < currentQuestion.options.length && !isPaused) onSelect(optionIndex);
      if (key === "P") navigatePrevious();
      if (key === "N") navigateNext();
      if (key === "S") setSubmitConfirmOpen(true);
      if (key === "R" && submitConfirmOpen) setSubmitConfirmOpen(false);
      if (key === "Y" && submitConfirmOpen) { setSubmitConfirmOpen(false); onFinishCbt?.(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cbtMode, currentIndex, isPaused, navigateNext, navigatePrevious, onFinishCbt, onSelect, submitConfirmOpen]);
  return (
    <main className="quiz-layout page-shell">
      <header className="quiz-header">
        {cbtMode && !historicalReview ? <AlertDialog open={exitConfirmOpen} onOpenChange={setExitConfirmOpen}><AlertDialogTrigger asChild><button className="icon-button" aria-label="Leave CBT and save progress"><ArrowLeft size={19} /></button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Leave this CBT?</AlertDialogTitle><AlertDialogDescription>Your answers, flags, question position, and remaining time are already saved on this device. You can resume from the Practice desk later.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Continue exam</AlertDialogCancel><AlertDialogAction onClick={() => { setExitConfirmOpen(false); onQuit(); }}>Save and exit</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> : <button className="icon-button" onClick={onQuit} aria-label="Leave round"><ArrowLeft size={19} /></button>}
        <div className="quiz-header-title"><span className="eyebrow">{historicalReview ? "SAVED CBT CORRECTION / READ ONLY" : cbtMode ? "JAMB CBT MOCK" : config.mode === "review" ? "REVIEW MISSES" : "STUDY MODE / UNTIMED"}</span><strong>{config.subject}</strong></div>
        <div className="quiz-header-controls"><JambCalculator />{historicalReview ? <span className="study-mode-status">Saved correction</span> : timedRound ? <div className={`timer-block ${timerState} ${isPaused ? "timer-paused" : ""}`}><TimerReset size={17} /><span>{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</span></div> : <span className="study-mode-status">Untimed study</span>}</div>
      </header>
      <div className="quiz-progress-row"><div className="progress-track"><span style={{ width: `${((cbtMode ? answeredCount : currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div><span>{cbtMode ? `${answeredCount} answered` : `${currentIndex + 1} / ${questions.length}`}</span>{streak > 1 && <span className="streak-badge"><Flame size={15} /> {streak} streak</span>}{historicalReview ? <span className="pause-hint">Green = correct · red = review</span> : cbtMode ? <><button className="pause-hint pause-control" onClick={onTogglePause}><Pause size={13} /> {isPaused ? "Resume exam" : "Pause exam"}</button><span className="keyboard-hint" title="A–E answer · P previous · N next · S submit · R return · Y confirm">Keys: A–E · P/N · S/R/Y</span></> : <span className="pause-hint">Untimed study</span>}</div>
      {historicalReview && <div className="saved-cbt-filter" aria-label="Saved CBT correction filter"><span>SHOW</span>{(["all", "correct", "wrong"] as const).map((filter) => <button key={filter} className={historicalFilter === filter ? "active" : ""} onClick={() => onHistoricalFilter?.(filter)}>{filter === "all" ? "All" : filter === "correct" ? "Correct only" : "Wrong / unanswered"}</button>)}</div>}
      <div className="quiz-workspace question-palette-bottom">
        <QuestionCard question={currentQuestion} index={localQuestionIndex} total={localQuestionTotal} subjectLabel={fullMockCbt ? currentQuestion.subject : undefined} selectedIndex={selectedIndex} answered={answered} answer={currentAnswer} onSelect={onSelect} onSubmit={onSubmit} onNext={historicalReview ? (canGoNext ? navigateNext : onQuit) : fullMockCbt ? navigateNext : onNext} cbtMode={cbtMode} onSaveAndNext={fullMockCbt ? navigateNext : onNext} isBookmarked={bookmarkedQuestionIds.includes(currentQuestion.id)} onToggleBookmark={onToggleBookmark} onReportQuestion={onReportQuestion ? ({ reason, note }) => onReportQuestion({ questionId: currentQuestion.id, subject: currentQuestion.subject, topic: currentQuestion.topic, reason, note }) : undefined} />
        <div className="cbt-ledger-stack"><QuestionLedger questions={questions} currentIndex={currentIndex} answers={answers} cbtMode={historicalReview ? false : cbtMode} fullMock={fullMockCbt} flaggedIds={flaggedIds} onNavigate={onNavigate} />
          {displayCbt && <div className="cbt-actions"><div className="cbt-nav-actions"><button className="button button-outline" onClick={navigatePrevious} disabled={!canGoPrevious}>Previous</button><button className="button button-outline" onClick={navigateNext} disabled={!canGoNext}>Next</button></div>{!historicalReview && <><button className={`button ${currentFlagged ? "button-primary" : "button-outline"}`} onClick={onToggleFlag}><Flag size={15} /> {currentFlagged ? "Unflag question" : "Flag for review"}</button><AlertDialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}><AlertDialogTrigger asChild><button className="button button-dark">Finish & review <Send size={15} /></button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Review before submission</AlertDialogTitle><AlertDialogDescription>Use the real JAMB-style review step before finalising this mock. Keyboard: R returns to the exam; Y confirms the review screen.</AlertDialogDescription></AlertDialogHeader><div className="cbt-submit-summary"><div><strong>{answeredCount}/{questions.length}</strong><span>answered</span></div><div><strong>{unansweredCount}</strong><span>unanswered</span></div><div><strong>{flaggedIds.length}</strong><span>flagged</span></div></div><div className="cbt-submit-review-actions"><button className="button button-outline" disabled={!unansweredCount} onClick={() => reviewMatching((question) => !answers[question.id])}>Review unanswered</button><button className="button button-outline" disabled={!flaggedIds.length} onClick={() => reviewMatching((question) => flaggedIds.includes(question.id))}>Review flagged</button></div><AlertDialogFooter><AlertDialogCancel>Continue exam</AlertDialogCancel><AlertDialogAction onClick={() => { setSubmitConfirmOpen(false); onFinishCbt?.(); }}>Review my answers</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>}</div>}
        </div>
      </div>
    </main>
  );
}
