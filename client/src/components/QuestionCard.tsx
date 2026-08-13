/* Field Notes Arcade: answer choices behave like marked strips on a study sheet. */

import { CheckCircle2, Clock3, Send, XCircle } from "lucide-react";
import type { AnswerRecord, BankQuestion } from "@/game/types";

interface QuestionCardProps {
  question: BankQuestion;
  index: number;
  total: number;
  selectedIndex: number | null;
  answered: boolean;
  answer?: AnswerRecord;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onNext: () => void;
}

export function QuestionCard({ question, index, total, selectedIndex, answered, answer, onSelect, onSubmit, onNext }: QuestionCardProps) {
  const letters = ["A", "B", "C", "D"];
  const ownerProvided = question.tags.includes("owner-provided");
  return (
    <section className="question-card" aria-labelledby="question-title">
      <div className="question-card-topline">
        <div className="question-meta">
          <span className="subject-chip">{question.subject}</span>
          <span className="meta-divider">/</span>
          <span>Question {String(index + 1).padStart(2, "0")} of {String(total).padStart(2, "0")}</span>
          {ownerProvided && <span className="question-provenance">OWNER-PROVIDED · VERIFICATION PENDING</span>}
        </div>
        <span className={`difficulty difficulty-${question.difficulty}`}>{question.difficulty}</span>
      </div>
      <div className="question-rule" />
      <div className="question-copy">
        <span className="eyebrow">{question.topic.toUpperCase()}</span>
        <h1 id="question-title">{question.question}</h1>
      </div>
      <div className="option-list" role="radiogroup" aria-label="Answer options">
        {question.options.map((option, optionIndex) => {
          const isSelected = selectedIndex === optionIndex;
          const isCorrect = answered && optionIndex === question.answer_index;
          const isWrong = answered && isSelected && !isCorrect;
          return (
            <button
              key={`${question.id}-${optionIndex}`}
              className={`option-strip ${isSelected ? "option-selected" : ""} ${isCorrect ? "option-correct" : ""} ${isWrong ? "option-wrong" : ""}`}
              onClick={() => !answered && onSelect(optionIndex)}
              role="radio"
              aria-checked={isSelected}
              disabled={answered}
            >
              <span className="option-letter">{letters[optionIndex]}</span>
              <span className="option-text">{option}</span>
              <span className="option-state">
                {isCorrect && <CheckCircle2 size={18} />}
                {isWrong && <XCircle size={18} />}
              </span>
            </button>
          );
        })}
      </div>
      {answered ? (
        <div className={`answer-feedback ${answer?.correct ? "feedback-correct" : "feedback-wrong"}`}>
          <div className="feedback-stamp">{answer?.correct ? "CORRECT" : answer?.timedOut ? "TIME" : "REVIEW"}</div>
          <div className="feedback-copy">
            <strong>{answer?.correct ? "That mark counts." : answer?.timedOut ? "The clock moved on." : "Not this time."}</strong>
            <p>{question.explanation}</p>
          </div>
          <button className="button button-dark button-small" onClick={onNext}>
            {index === total - 1 ? "See result" : "Next question"} <Send size={15} />
          </button>
        </div>
      ) : (
        <div className="question-actions">
          <p className="hint-line"><Clock3 size={15} /> Select an answer, then lock it in.</p>
          <button className="button button-primary" onClick={onSubmit} disabled={selectedIndex === null}>
            Submit answer <Send size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
