import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Download, Eye, FileText, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { BankQuestion, Subject } from "@/game/types";
import { loadQuestionBank } from "@/game/questionBank";
import "./owner-question-review.css";

const SUBJECTS: Array<{ subject: Subject; short: string }> = [
  { subject: "Use of English", short: "ENG" },
  { subject: "Biology", short: "BIO" },
  { subject: "Chemistry", short: "CHE" },
  { subject: "Physics", short: "PHY" },
];

type ReviewRecord = {
  id: string;
  externalId: string;
  subject: Subject;
  topic: string;
  difficulty: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  diagramUrl?: string | null;
  sourceLabel: string;
  sourceKind: "Owner-authorised ledger" | "Managed model bank";
};

function asModelRecord(question: BankQuestion): ReviewRecord {
  return {
    id: question.id,
    externalId: question.id,
    subject: question.subject,
    topic: question.topic,
    difficulty: question.difficulty,
    question: question.question,
    options: question.options,
    answerIndex: question.answer_index,
    explanation: question.explanation,
    diagramUrl: question.diagram_url,
    sourceLabel: question.source || "Model Questions · Original JAMB-aligned",
    sourceKind: "Managed model bank",
  };
}

export function OwnerQuestionReview({ isOwner, activeQuestions }: { isOwner: boolean; activeQuestions: BankQuestion[] }) {
  const [subject, setSubject] = useState<Subject>("Use of English");
  const [page, setPage] = useState(0);
  const [loadedModelQuestions, setLoadedModelQuestions] = useState<BankQuestion[]>([]);
  const pageSize = 24;
  const summaryQuery = trpc.qualityReview.approvedQuestionSummary.useQuery(undefined, { enabled: isOwner, retry: false });
  const activeModelQuestions = activeQuestions.length ? activeQuestions.filter((question) => !question.id.startsWith("authorised-")) : loadedModelQuestions;
  const authorisedStart = Math.max(0, page * pageSize - activeModelQuestions.filter((question) => question.subject === subject).length);
  const authorisedPage = Math.floor(authorisedStart / 30);
  const authorisedOffset = authorisedStart % 30;
  const authorisedQuery = trpc.qualityReview.approvedQuestionPage.useQuery({ subject, page: authorisedPage, pageSize: 30 }, { enabled: isOwner, retry: false });
  const modelQuestions = useMemo(() => activeModelQuestions.filter((question) => question.subject === subject).map(asModelRecord), [activeModelQuestions, subject]);
  const modelPageCount = Math.max(1, Math.ceil(modelQuestions.length / pageSize));
  const authorisedCount = summaryQuery.data?.find((entry) => entry.subject === subject)?.authorisedCount ?? 0;
  const total = authorisedCount + modelQuestions.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const modelSlice = modelQuestions.slice(page * pageSize, page * pageSize + pageSize);
  const remaining = Math.max(0, pageSize - modelSlice.length);
  const authorisedSlice = (authorisedQuery.data?.questions ?? []).slice(authorisedOffset, authorisedOffset + remaining).map((record) => ({ ...record, sourceKind: "Owner-authorised ledger" as const }));
  const records: ReviewRecord[] = [...modelSlice, ...authorisedSlice];
  const downloadReviewPage = () => {
    const escape = (value: string) => `"${value.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    const csv = [
      ["Record ID", "Subject", "Topic", "Difficulty", "Question", "Option A", "Option B", "Option C", "Option D", "Option E", "Answer", "Explanation", "Source"].map(escape).join(","),
      ...records.map((record) => [record.externalId, record.subject, record.topic, record.difficulty, record.question, ...record.options, record.options[record.answerIndex] ?? "", record.explanation, record.sourceLabel].map(escape).join(",")),
    ].join("\\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `jamb-quest-${subject.toLowerCase().replace(/\\s+/g, "-")}-review-page-${page + 1}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };
  const overallActive = (summaryQuery.data ?? []).reduce((sum, entry) => sum + entry.authorisedCount, 0) + activeModelQuestions.length;

  useEffect(() => {
    if (!isOwner || activeQuestions.length) return;
    const controller = new AbortController();
    void loadQuestionBank(controller.signal).then(setLoadedModelQuestions).catch(() => setLoadedModelQuestions([]));
    return () => controller.abort();
  }, [activeQuestions.length, isOwner]);
  useEffect(() => { setPage(0); }, [subject]);
  useEffect(() => { if (page >= pageCount) setPage(Math.max(0, pageCount - 1)); }, [page, pageCount]);
  if (!isOwner) return null;

  return <section className="owner-question-review tab-section" aria-labelledby="owner-question-review-title" data-testid="owner-question-review">
    <header className="owner-review-head">
      <div>
        <span className="eyebrow">OWNER ONLY / QUESTION SCRUTINY</span>
        <h2 id="owner-question-review-title">Question bank review desk</h2>
        <p>Browse one live JAMB Quest question bank by subject. Each record keeps its answer, explanation, and source evidence for audit, but the learner-facing bank is never split into separate collections.</p>
      </div>
      <div className="owner-review-total"><ShieldCheck size={18} /><span><b>{overallActive.toLocaleString()}</b><small>reviewable records</small></span></div>
    </header>

    <div className="owner-review-subjects" role="tablist" aria-label="Question-review subject filter">
      {SUBJECTS.map((item) => {
        const modelCount = activeModelQuestions.filter((question) => question.subject === item.subject).length;
        const ledgerCount = summaryQuery.data?.find((entry) => entry.subject === item.subject)?.authorisedCount ?? 0;
        return <button role="tab" aria-selected={subject === item.subject} key={item.subject} className={subject === item.subject ? "active" : ""} onClick={() => setSubject(item.subject)}><b>{item.short}</b><span>{item.subject}</span><small>{(modelCount + ledgerCount).toLocaleString()} reviewable</small></button>;
      })}
    </div>

    <div className="owner-review-toolbar"><div className="owner-review-unified"><ShieldCheck size={15} /><span>ONE LIVE JAMB QUEST BANK</span><b>{total.toLocaleString()}</b></div><span className="owner-review-range"><Eye size={14} /> {total ? `${page * pageSize + 1}–${Math.min(total, (page + 1) * pageSize)} of ${total.toLocaleString()}` : "No active records"}</span><button className="owner-review-export" onClick={downloadReviewPage} disabled={!records.length}><Download size={14} /> Download this page</button></div>

    {authorisedQuery.isLoading ? <div className="owner-review-loading">Loading the live question bank for {subject}…</div> : authorisedQuery.error ? <div className="owner-review-error">The private review desk could not load this subject. Refresh and try again.</div> : <div className="owner-question-list">
      {records.map((record, index) => <details key={record.id} className="owner-question-card" open={index === 0}>
        <summary><span className="owner-question-number">{String(page * pageSize + index + 1).padStart(3, "0")}</span><span className="owner-question-title"><b>{record.topic}</b><small>{record.sourceKind} · {record.difficulty}</small></span><ArrowRight size={16} /></summary>
        <div className="owner-question-body">
          <p className="owner-question-stem">{record.question}</p>
          <ol className="owner-question-options" type="A">{record.options.map((option, optionIndex) => <li key={`${record.id}-${optionIndex}`} className={optionIndex === record.answerIndex ? "correct" : ""}><span>{option}</span>{optionIndex === record.answerIndex && <b>Answer</b>}</li>)}</ol>
          <div className="owner-question-explanation"><span><FileText size={14} /> Explanation</span><p>{record.explanation || "No learner explanation was supplied."}</p></div>
          {record.diagramUrl && <p className="owner-question-diagram">Diagram asset attached to this source record.</p>}
          <footer><span><b>Record</b> {record.externalId}</span><span><b>Source</b> {record.sourceLabel}</span></footer>
        </div>
      </details>)}
      {!records.length && <p className="compact-empty">No active JAMB Quest questions are ready for this subject.</p>}
    </div>}

    {total > pageSize && <nav className="owner-review-pagination" aria-label="Question review pagination"><button onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}><ArrowLeft size={15} /> Previous</button><span>Page {page + 1} of {pageCount}</span><button onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page >= pageCount - 1}>Next <ArrowRight size={15} /></button></nav>}
  </section>;
}
