/* Field Notes Arcade: results read like a stamped score receipt with a useful next action. */

import { ArrowLeft, BookOpenCheck, RotateCcw, Trophy } from "lucide-react";
import type { BankQuestion, RoundConfig } from "@/game/types";

interface ResultSummaryProps {
  config: RoundConfig;
  questions: BankQuestion[];
  answers: Record<string, { correct: boolean }>;
  score: number;
  correctCount: number;
  bestScore: number;
  onRetry: () => void;
  onReview: () => void;
  onHome: () => void;
}

export function ResultSummary({ config, questions, answers, score, correctCount, bestScore, onRetry, onReview, onHome }: ResultSummaryProps) {
  const accuracy = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  const missed = questions.filter((question) => answers[question.id] && !answers[question.id].correct);
  const isBest = score >= bestScore && score > 0;
  return (
    <main className="result-layout page-shell">
      <div className="result-receipt paper-panel">
        <div className="result-topline"><span className="eyebrow">ROUND COMPLETE</span><Trophy size={20} /></div>
        <div className="result-sticker-wrap"><div className="score-seal" aria-label="Score seal"><span className="brand-symbol brand-symbol-small" aria-hidden="true"><i /><i /><i /><i /></span><small>MARK</small></div></div>
        <p className="result-kicker">{isBest ? "NEW BEST MARK" : "GOOD REP"}</p>
        <div className="big-score">{score.toLocaleString()}</div>
        <p className="score-caption">points on the {config.subject} {config.mode === "cbt" ? "CBT simulation" : "sprint"}</p>
        <div className="receipt-rule" />
        <div className="receipt-stats"><span>Correct <strong>{correctCount}/{questions.length}</strong></span><span>Accuracy <strong>{accuracy}%</strong></span><span>Review <strong>{missed.length}</strong></span></div>
        <div className="result-actions">
          <button className="button button-primary" onClick={onRetry}><RotateCcw size={16} /> Try another round</button>
          {missed.length > 0 && <button className="button button-outline" onClick={onReview}><BookOpenCheck size={16} /> Review misses</button>}
          <button className="text-button" onClick={onHome}><ArrowLeft size={15} /> Back to desk</button>
        </div>
      </div>
      <div className="result-ledger paper-panel">
        <div className="section-heading"><span className="eyebrow">AFTER ACTION</span><h2>What to keep</h2><p>Every wrong answer is a note for the next round. Keep the explanation close.</p></div>
        <div className="result-list">
          {missed.length > 0 ? missed.slice(0, 4).map((question, index) => <div className="missed-row" key={question.id}><span className="missed-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{question.topic}</strong><p>{question.question}</p></div></div>) : <div className="empty-review"><Trophy size={24} /><strong>Clean sheet.</strong><p>You cleared every question in this round. Try a harder mode or subject.</p></div>}
        </div>
        {missed.length > 4 && <p className="more-note">+ {missed.length - 4} more in your review set</p>}
      </div>
    </main>
  );
}
