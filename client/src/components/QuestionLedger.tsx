/* Field Notes Arcade: the ledger is a punched study index, not generic pagination. */

import React from "react";
import { Check, Circle, X } from "lucide-react";
import type { AnswerRecord, BankQuestion, Subject } from "@/game/types";

const fullMockSubjects: Subject[] = ["Use of English", "Biology", "Chemistry", "Physics"];

interface QuestionLedgerProps {
  questions: BankQuestion[];
  currentIndex: number;
  answers: Record<string, AnswerRecord>;
  cbtMode?: boolean;
  fullMock?: boolean;
  flaggedIds?: string[];
  onNavigate?: (index: number) => void;
}

export function QuestionLedger({ questions, currentIndex, answers, cbtMode = false, fullMock = false, flaggedIds = [], onNavigate }: QuestionLedgerProps) {
  const currentSubject = questions[currentIndex]?.subject;
  const palette = fullMock && currentSubject ? questions.map((question, index) => ({ question, index })).filter(({ question }) => question.subject === currentSubject) : questions.map((question, index) => ({ question, index }));
  const answeredInPalette = palette.filter(({ question }) => Boolean(answers[question.id])).length;
  const selectSubject = (subject: Subject) => {
    const candidates = questions.map((question, index) => ({ question, index })).filter(({ question }) => question.subject === subject);
    const firstUnanswered = candidates.find(({ question }) => !answers[question.id]);
    const target = firstUnanswered ?? candidates[0];
    if (target) onNavigate?.(target.index);
  };
  return (
    <aside className="ledger-panel" aria-label="Question navigation">
      {fullMock && currentSubject && <div className="full-mock-subject-nav" aria-label="Full mock subject navigator"><span className="eyebrow">FULL MOCK SUBJECTS</span><div role="tablist" aria-label="Choose a subject"><button type="button" role="tab" aria-selected={currentSubject === "Use of English"} className={currentSubject === "Use of English" ? "active" : ""} onClick={() => selectSubject("Use of English")}><span>English</span><b>{questions.filter((question) => question.subject === "Use of English" && answers[question.id]).length}/{questions.filter((question) => question.subject === "Use of English").length}</b></button>{fullMockSubjects.slice(1).map((subject) => <button type="button" role="tab" key={subject} aria-selected={currentSubject === subject} className={currentSubject === subject ? "active" : ""} onClick={() => selectSubject(subject)}><span>{subject}</span><b>{questions.filter((question) => question.subject === subject && answers[question.id]).length}/{questions.filter((question) => question.subject === subject).length}</b></button>)}</div></div>}
      <div className="ledger-heading">
        <div>
          <span className="eyebrow">{fullMock ? "ACTIVE SUBJECT" : "ROUND INDEX"}</span>
          <h3>{fullMock ? `${currentSubject} palette` : "Question ledger"}</h3>
        </div>
        <span className="ledger-count">{fullMock ? `${answeredInPalette}/${palette.length}` : questions.length}</span>
      </div>
      <div className="ledger-grid">
        {palette.map(({ question, index }, localIndex) => {
          const answer = answers[question.id];
          const status = cbtMode ? (index === currentIndex ? "current" : answer ? "answered" : "open") : answer ? (answer.correct ? "correct" : "wrong") : index === currentIndex ? "current" : "open";
          const flagged = flaggedIds.includes(question.id);
          const statusLabel = status === "open" ? "unanswered" : status;
          return (
            <button className={`ledger-item ledger-${status} ${flagged ? "ledger-flagged" : ""}`} key={question.id} aria-label={`${fullMock ? `${question.subject}, ` : ""}question ${fullMock ? localIndex + 1 : index + 1}: ${flagged ? "flagged, " : ""}${statusLabel}`} onClick={() => onNavigate?.(index)} disabled={!onNavigate}>
              <span>{String(fullMock ? localIndex + 1 : index + 1).padStart(2, "0")}</span>
              {(status === "correct" || (cbtMode && status === "answered")) && <Check size={12} strokeWidth={3} aria-hidden="true" />}
              {status === "wrong" && <X size={12} strokeWidth={3} />}
              {status === "open" && <Circle size={9} aria-hidden="true" />}
              {flagged && <b aria-hidden="true">!</b>}
            </button>
          );
        })}
      </div>
      <div className="ledger-legend">
        <span><i className="dot dot-current" /> Current</span>
        <span><i className="dot dot-correct" /> {cbtMode ? "Answered ✓" : "Correct"}</span>
        <span><i className="dot dot-open" /> {cbtMode ? "Unanswered ○" : "Open"}</span>
        <span><i className="dot dot-wrong" /> {cbtMode ? "Flagged !" : "Review"}</span>
      </div>
    </aside>
  );
}
