/* Field Notes Arcade: the ledger is a punched study index, not generic pagination. */

import { Check, Circle, X } from "lucide-react";
import type { AnswerRecord, BankQuestion } from "@/game/types";

interface QuestionLedgerProps {
  questions: BankQuestion[];
  currentIndex: number;
  answers: Record<string, AnswerRecord>;
  cbtMode?: boolean;
  flaggedIds?: string[];
  onNavigate?: (index: number) => void;
}

export function QuestionLedger({ questions, currentIndex, answers, cbtMode = false, flaggedIds = [], onNavigate }: QuestionLedgerProps) {
  return (
    <aside className="ledger-panel" aria-label="Question navigation">
      <div className="ledger-heading">
        <div>
          <span className="eyebrow">ROUND INDEX</span>
          <h3>Question ledger</h3>
        </div>
        <span className="ledger-count">{questions.length}</span>
      </div>
      <div className="ledger-grid">
        {questions.map((question, index) => {
          const answer = answers[question.id];
          const status = cbtMode ? (index === currentIndex ? "current" : answer ? "answered" : "open") : answer ? (answer.correct ? "correct" : "wrong") : index === currentIndex ? "current" : "open";
          const flagged = flaggedIds.includes(question.id);
          return (
            <button className={`ledger-item ledger-${status} ${flagged ? "ledger-flagged" : ""}`} key={question.id} aria-label={`Question ${index + 1}: ${flagged ? "flagged, " : ""}${status}`} onClick={() => onNavigate?.(index)} disabled={!onNavigate}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {status === "correct" && <Check size={12} strokeWidth={3} />}
              {status === "wrong" && <X size={12} strokeWidth={3} />}
              {status === "open" && <Circle size={9} />}
              {flagged && <b aria-hidden="true">!</b>}
            </button>
          );
        })}
      </div>
      <div className="ledger-legend">
        <span><i className="dot dot-current" /> Current</span>
        <span><i className="dot dot-correct" /> {cbtMode ? "Answered" : "Correct"}</span>
        <span><i className="dot dot-wrong" /> {cbtMode ? "Flagged" : "Review"}</span>
      </div>
    </aside>
  );
}
