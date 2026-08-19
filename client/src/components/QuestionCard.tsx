/* Field Notes Arcade: answer choices behave like marked strips on a study sheet. */

import React, { useState } from "react";
import { Bookmark, BookmarkCheck, CheckCircle2, Clock3, FlagTriangleRight, Send, XCircle } from "lucide-react";
import type { AnswerRecord, BankQuestion } from "@/game/types";
import { normalisedTopic, questionExplanationLines } from "@/game/explanation";
import { preserveEnglishCompletionGap, splitQuestionPresentation } from "@/game/questionPresentation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QuestionCardProps {
  question: BankQuestion;
  index: number;
  total: number;
  subjectLabel?: string;
  selectedIndex: number | null;
  answered: boolean;
  answer?: AnswerRecord;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  cbtMode?: boolean;
  onSaveAndNext?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onReportQuestion?: (input: { reason: "wrong_answer" | "missing_context" | "broken_diagram" | "confusing_wording" | "other"; note?: string }) => Promise<{ accepted: boolean; receipt: { id: number; status: "open" | "reviewing" | "resolved" | "dismissed" } | null }>;
}

export function QuestionCard({ question, index, total, subjectLabel, selectedIndex, answered, answer, onSelect, onSubmit, onNext, cbtMode = false, onSaveAndNext, isBookmarked = false, onToggleBookmark, onReportQuestion }: QuestionCardProps) {
  const letters = ["A", "B", "C", "D", "E"];
  const explanationLines = questionExplanationLines(question);
  const topic = normalisedTopic(question.topic);
  const presentation = splitQuestionPresentation(preserveEnglishCompletionGap(question.question, question.subject));
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<"wrong_answer" | "missing_context" | "broken_diagram" | "confusing_wording" | "other">("wrong_answer");
  const [reportNote, setReportNote] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [reportReceipt, setReportReceipt] = useState<{ id: number; status: "open" | "reviewing" | "resolved" | "dismissed" } | null>(null);
  const submitReport = async () => {
    if (!onReportQuestion) return;
    try {
      setReportStatus("sending");
      const result = await onReportQuestion({ reason: reportReason, note: reportNote.trim() || undefined });
      setReportReceipt(result.receipt ? { id: result.receipt.id, status: result.receipt.status } : null);
      setReportStatus("sent");
    } catch {
      setReportStatus("failed");
    }
  };
  return (
    <section className="question-card" aria-labelledby="question-title">
      <div className="question-card-topline">
        <div className="question-meta">
          <span>{subjectLabel ? `${subjectLabel} — ` : ""}Question {String(index + 1).padStart(2, "0")} of {String(total).padStart(2, "0")}</span>
        </div>
        <div className="question-card-tools">{topic !== "Unclassified" && <span className="question-topic-label">Topic: {topic}</span>}{onToggleBookmark && <button className={`bookmark-control ${isBookmarked ? "active" : ""}`} onClick={onToggleBookmark} aria-pressed={isBookmarked} title={isBookmarked ? "Remove saved question" : "Save question for revision"}>{isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}<span>{isBookmarked ? "Saved" : "Save"}</span></button>}{onReportQuestion && <button className="bookmark-control question-report-control" onClick={() => { setReportStatus("idle"); setReportReceipt(null); setReportOpen(true); }} title="Report a question issue"><FlagTriangleRight size={16} /><span>Report</span></button>}</div>
      </div>
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="question-report-dialog">
          <DialogHeader><span className="eyebrow">QUALITY REPORT / PRIVATE</span><DialogTitle>What needs review?</DialogTitle><DialogDescription>Your report goes only to the JAMB Quest owner review queue. It does not change this question or show to other learners.</DialogDescription></DialogHeader>
          {reportStatus === "sent" ? <div className="question-report-success"><CheckCircle2 size={18} /><span><b>Report received.</b> {reportReceipt ? `Receipt #${reportReceipt.id} is ${reportReceipt.status}.` : "It is open for owner review."}<small>Only you and the JAMB Quest owner can see this report. Its status appears in your Profile.</small></span></div> : <><label className="question-report-field"><span>Issue type</span><select value={reportReason} onChange={(event) => setReportReason(event.target.value as typeof reportReason)}><option value="wrong_answer">Wrong answer or answer key</option><option value="missing_context">Missing passage or instruction</option><option value="broken_diagram">Broken, missing, or unclear diagram</option><option value="confusing_wording">Confusing wording</option><option value="other">Other quality issue</option></select></label><label className="question-report-field"><span>Optional note</span><textarea maxLength={500} value={reportNote} onChange={(event) => setReportNote(event.target.value)} placeholder="Briefly tell us what you noticed." /></label>{reportStatus === "failed" && <p className="question-report-error">The report could not be saved. Please try again.</p>}</>}
          <DialogFooter>{reportStatus === "sent" ? <button className="button button-dark" onClick={() => setReportOpen(false)}>Done</button> : <><button className="button button-outline" onClick={() => setReportOpen(false)}>Cancel</button><button className="button button-dark" onClick={() => void submitReport()} disabled={reportStatus === "sending"}>{reportStatus === "sending" ? "Saving…" : "Send report"}</button></>}</DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="question-rule" />
      <div className="question-copy">
        <span className="eyebrow">QUESTION</span>
        {presentation.context && <div className="question-source-context"><span>{presentation.contextLabel}</span><p>{presentation.context}</p></div>}
        <h1 id="question-title">{presentation.prompt}</h1>
      </div>
      {question.diagram_url && <figure className="question-diagram"><img src={question.diagram_url} alt="Black-and-white instructional diagram for this question" loading="lazy" /><figcaption>Use the diagram with the question stem before choosing an answer.</figcaption></figure>}
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
            <div className="explanation-block" aria-label="Detailed explanation">{explanationLines.map((line, lineIndex) => <p key={`${question.id}-explanation-${lineIndex}`}>{line}</p>)}</div>
          </div>
          <button className="button button-dark button-small" onClick={onNext}>
            {index === total - 1 ? "See result" : "Next question"} <Send size={15} />
          </button>
        </div>
      ) : (
        <div className="question-actions">
          <p className="hint-line"><Clock3 size={15} /> {cbtMode ? "Your answer is saved. You can revisit or change it before final submission." : "Select an answer, then lock it in."}</p>
          <button className="button button-primary" onClick={cbtMode ? onSaveAndNext : onSubmit} disabled={!cbtMode && selectedIndex === null}>
            {cbtMode ? "Save & next" : "Submit answer"} <Send size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
