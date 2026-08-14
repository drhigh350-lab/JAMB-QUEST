/* Field Notes Arcade: the quiz shell keeps the ledger, question sheet, and timer in one visible workspace. */

import { ArrowLeft, Flag, Flame, Pause, Send, TimerReset } from "lucide-react";
import React, { useState } from "react";
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
  return (
    <main className="quiz-layout page-shell">
      <header className="quiz-header">
        <button className="icon-button" onClick={onQuit} aria-label="Leave round"><ArrowLeft size={19} /></button>
        <div className="quiz-header-title"><span className="eyebrow">{cbtMode ? "JAMB CBT MOCK" : config.mode === "review" ? "REVIEW MISSES" : "QUICK SPRINT"}</span><strong>{config.subject}</strong></div>
        <div className="quiz-header-controls"><JambCalculator /><div className={`timer-block ${timerState} ${isPaused ? "timer-paused" : ""}`}><TimerReset size={17} /><span>{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</span></div></div>
      </header>
      <div className="quiz-progress-row"><div className="progress-track"><span style={{ width: `${((cbtMode ? answeredCount : currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div><span>{cbtMode ? `${answeredCount} answered` : `${currentIndex + 1} / ${questions.length}`}</span>{streak > 1 && <span className="streak-badge"><Flame size={15} /> {streak} streak</span>}{cbtMode ? <button className="pause-hint pause-control" onClick={onTogglePause}><Pause size={13} /> {isPaused ? "Resume exam" : "Pause exam"}</button> : <span className="pause-hint"><Pause size={13} /> Timer runs live</span>}</div>
      <div className="quiz-workspace">
        <QuestionCard question={currentQuestion} index={currentIndex} total={questions.length} selectedIndex={selectedIndex} answered={answered} answer={currentAnswer} onSelect={onSelect} onSubmit={onSubmit} onNext={onNext} cbtMode={cbtMode} onSaveAndNext={onNext} isBookmarked={bookmarkedQuestionIds.includes(currentQuestion.id)} onToggleBookmark={onToggleBookmark} />
        <div className="cbt-ledger-stack"><QuestionLedger questions={questions} currentIndex={currentIndex} answers={answers} cbtMode={cbtMode} flaggedIds={flaggedIds} onNavigate={onNavigate} />
          {cbtMode && <div className="cbt-actions"><button className={`button ${currentFlagged ? "button-primary" : "button-outline"}`} onClick={onToggleFlag}><Flag size={15} /> {currentFlagged ? "Unflag question" : "Flag for review"}</button><AlertDialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}><AlertDialogTrigger asChild><button className="button button-dark">Finish & review <Send size={15} /></button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Finish this CBT mock?</AlertDialogTitle><AlertDialogDescription>You can still inspect every answer in the review screen. Once you save the exam log, this attempt becomes part of your performance history.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Continue exam</AlertDialogCancel><AlertDialogAction onClick={() => { setSubmitConfirmOpen(false); onFinishCbt?.(); }}>Review my answers</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>}
        </div>
      </div>
    </main>
  );
}
