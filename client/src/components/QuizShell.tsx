/* Field Notes Arcade: the quiz shell keeps the ledger, question sheet, and timer in one visible workspace. */

import { ArrowLeft, Flame, Pause, TimerReset } from "lucide-react";
import { QuestionCard } from "./QuestionCard";
import { QuestionLedger } from "./QuestionLedger";
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
}

export function QuizShell({ config, questions, currentIndex, currentQuestion, selectedIndex, answered, currentAnswer, secondsLeft, streak, answers, onSelect, onSubmit, onNext, onQuit }: QuizShellProps) {
  const timerState = secondsLeft <= 10 ? "timer-hot" : secondsLeft <= 20 ? "timer-warm" : "";
  return (
    <main className="quiz-layout page-shell">
      <header className="quiz-header">
        <button className="icon-button" onClick={onQuit} aria-label="Leave round"><ArrowLeft size={19} /></button>
        <div className="quiz-header-title"><span className="eyebrow">{config.mode === "cbt" ? "CBT SIMULATION" : config.mode === "review" ? "REVIEW MISSES" : "QUICK SPRINT"}</span><strong>{config.subject}</strong></div>
        <div className={`timer-block ${timerState}`}><TimerReset size={17} /><span>{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</span></div>
      </header>
      <div className="quiz-progress-row"><div className="progress-track"><span style={{ width: `${((currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div><span>{currentIndex + 1} / {questions.length}</span>{streak > 1 && <span className="streak-badge"><Flame size={15} /> {streak} streak</span>}<span className="pause-hint"><Pause size={13} /> Timer runs live</span></div>
      <div className="quiz-workspace">
        <QuestionCard question={currentQuestion} index={currentIndex} total={questions.length} selectedIndex={selectedIndex} answered={answered} answer={currentAnswer} onSelect={onSelect} onSubmit={onSubmit} onNext={onNext} />
        <QuestionLedger questions={questions} currentIndex={currentIndex} answers={answers} />
      </div>
    </main>
  );
}
