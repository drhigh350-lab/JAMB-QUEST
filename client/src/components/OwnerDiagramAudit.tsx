import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, ImageOff, Search, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { Subject } from "@/game/types";
import "./owner-diagram-audit.css";

const SUBJECTS: Array<{ value: Subject | "all"; label: string }> = [
  { value: "all", label: "All subjects" }, { value: "Use of English", label: "Use of English" }, { value: "Biology", label: "Biology" }, { value: "Chemistry", label: "Chemistry" }, { value: "Physics", label: "Physics" },
];

function OwnerDiagramPreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  useEffect(() => { setFailed(false); setOpen(false); setReloadToken(0); }, [src]);
  const imageSrc = `${src}${src.includes("?") ? "&" : "?"}diagramRetry=${reloadToken}`;
  const retry = () => { setFailed(false); setReloadToken((token) => token + 1); };
  return <>
    {failed ? <div className="owner-diagram-missing"><ImageOff size={17} /><span>This picture could not open yet.</span><button type="button" onClick={retry}>Try again</button></div> : <figure><button type="button" className="owner-diagram-image-button" onClick={() => setOpen(true)} aria-label="View picture larger"><img key={imageSrc} src={imageSrc} alt="Owner preview of linked question diagram" loading="eager" decoding="async" onLoad={() => setFailed(false)} onError={() => setFailed(true)} /></button><figcaption><button type="button" className="owner-diagram-view-button" onClick={() => setOpen(true)}>View picture larger <ExternalLink size={13} /></button></figcaption></figure>}
    {open && !failed && <div className="owner-diagram-lightbox" role="dialog" aria-modal="true" aria-label="Picture viewer" onClick={() => setOpen(false)}><div className="owner-diagram-lightbox-panel" onClick={(event) => event.stopPropagation()}><button type="button" className="owner-diagram-close" onClick={() => setOpen(false)}>Close</button><img src={imageSrc} alt="Enlarged owner question diagram" /></div></div>}
  </>;
}

export function OwnerDiagramAudit({ isOwner }: { isOwner: boolean }) {
  const [subject, setSubject] = useState<Subject | "all">("all");
  const [state, setState] = useState<"all" | "missing" | "linked">("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const query = trpc.qualityReview.diagramAuditPage.useQuery({ subject, state, search, page, pageSize }, { enabled: isOwner, retry: false });
  const pageCount = useMemo(() => Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize)), [query.data?.total]);
  if (!isOwner) return null;
  const applyFilters = () => { setPage(0); setSearch(searchDraft.trim()); };
  const resetPage = <T,>(value: T, setter: (next: T) => void) => { setter(value); setPage(0); };

  return <details className="owner-diagram-audit tab-section" data-testid="owner-diagram-audit">
    <summary><span><b>OWNER DIAGRAM AUDIT</b><small>See every question that has a diagram or needs one</small></span><ShieldCheck size={17} /></summary>
    <div className="owner-diagram-audit-body">
      <p>This is only for you. It does not add a missing picture to student practice.</p>
      <div className="owner-diagram-audit-controls">
        <label><span>Subject</span><select value={subject} onChange={(event) => resetPage(event.target.value as Subject | "all", setSubject)}>{SUBJECTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label><span>Picture</span><select value={state} onChange={(event) => resetPage(event.target.value as "all" | "missing" | "linked", setState)}><option value="all">All</option><option value="missing">Needs picture</option><option value="linked">Has picture link</option></select></label>
        <label className="owner-diagram-search"><span>Find question</span><div><input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") applyFilters(); }} placeholder="Question ID or words" /><button onClick={applyFilters} aria-label="Find diagram question"><Search size={16} /></button></div></label>
      </div>
      {query.isLoading ? <p className="compact-empty">Loading your diagram questions…</p> : query.error ? <p className="compact-empty">The diagram list could not load. Refresh and try again.</p> : <>
        <div className="owner-diagram-counts"><span><b>{query.data?.total ?? 0}</b> diagram questions</span><span className="missing"><b>{query.data?.missingCount ?? 0}</b> need a real picture</span><span className="linked"><b>{query.data?.linkedCount ?? 0}</b> have a picture link</span></div>
        <div className="owner-diagram-list">{query.data?.records.map((record) => <details key={record.id} className="owner-diagram-card" open={record.id === query.data.records[0]?.id}>
          <summary><span className={record.diagramUrl ? "diagram-state-linked" : "diagram-state-missing"}>{record.diagramUrl ? "HAS PICTURE" : "NEEDS PICTURE"}</span><span><b>{record.externalId}</b><small>{record.subject} · {record.topic}</small></span><em className={record.learnerVisible ? "learner-visible" : "learner-held"}>{record.learnerVisible ? "Students can see" : "Held from students"}</em></summary>
          <div className="owner-diagram-card-body"><p>{record.question}</p>{record.diagramUrl ? <OwnerDiagramPreview src={record.diagramUrl} /> : <div className="owner-diagram-missing"><ImageOff size={17} /><span>No safe picture is linked. Keep this question out of student practice until you have the real one.</span></div>}<ol type="A">{record.options.map((option, index) => <li key={`${record.id}-${index}`} className={index === record.answerIndex ? "answer" : ""}>{option}{index === record.answerIndex && <b>Saved answer</b>}</li>)}</ol><div className="owner-diagram-source"><span><b>Source:</b> {record.sourceLabel}</span><span><b>Status:</b> {record.explanationStatus}</span></div></div>
        </details>)}{!query.data?.records.length && <p className="compact-empty">No diagram questions match this search.</p>}</div>
        {(query.data?.total ?? 0) > pageSize && <div className="owner-diagram-pagination"><button disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}><ArrowLeft size={15} /> Previous</button><span>Page {page + 1} of {pageCount}</span><button disabled={page >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>Next <ArrowRight size={15} /></button></div>}
      </>}
    </div>
  </details>;
}
