/* Field Notes Arcade: the home desk sets context before the learner enters a timed round. */

import { useState } from "react";
import { ArrowRight, Atom, BookOpen, CheckCircle2, Clock3, FlaskConical, Leaf, ListChecks, Loader2, Sparkles, Target, Trophy, Zap } from "lucide-react";
import type { RoundConfig, StoredProgress, Subject } from "@/game/types";

const subjects: Array<{ name: Subject; short: string; note: string; icon: typeof BookOpen; tint: string }> = [
  { name: "Use of English", short: "ENG", note: "Lexis, structure & oral forms", icon: BookOpen, tint: "subject-english" },
  { name: "Biology", short: "BIO", note: "Life, ecology & heredity", icon: Leaf, tint: "subject-biology" },
  { name: "Chemistry", short: "CHE", note: "Matter, reactions & industry", icon: FlaskConical, tint: "subject-chemistry" },
  { name: "Physics", short: "PHY", note: "Forces, waves & electricity", icon: Atom, tint: "subject-physics" },
];

interface HomeProps {
  loading: boolean;
  loadError: string | null;
  progress: StoredProgress;
  canReview: boolean;
  onRetryLoad: () => void;
  onStart: (config: RoundConfig) => void;
}

export default function Home({ loading, loadError, progress, canReview, onRetryLoad, onStart }: HomeProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject>("Biology");
  const [mode, setMode] = useState<"sprint" | "cbt" | "review">("sprint");
  const [count, setCount] = useState(10);
  const selected = subjects.find((subject) => subject.name === selectedSubject)!;
  const SelectedIcon = selected.icon;
  const overallAccuracy = progress.totalAnswered ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100) : 0;

  const start = () => onStart({ subject: selectedSubject, mode, count });
  return (
    <main className="home-page">
      <header className="site-header page-shell">
        <div className="brand-lockup"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /><i /></span><div><strong>JAMB</strong><span>QUEST</span><small>FIELD NOTE</small></div></div>
        <nav className="header-nav"><a href="#subjects">Subjects</a><a href="#how-it-works">How it works</a><span className="header-status"><i /> {loading ? "Loading bank" : "1,000 questions ready"}</span></nav>
      </header>

      {loadError && <div className="load-error page-shell"><span>{loadError}</span><button className="text-button" onClick={onRetryLoad}>Try again <ArrowRight size={14} /></button></div>}

      <section className="hero-section page-shell">
        <div className="hero-copy">
          <div className="tape-label"><span /> YOUR NEXT MARK</div>
          <h1>Make the next<br /><em>mark count.</em></h1>
          <p className="hero-lede">A focused JAMB revision game built for short sprints, serious CBT practice, and the one topic you nearly know.</p>
          <div className="hero-actions"><button className="button button-primary button-large" onClick={start} disabled={loading || !!loadError}>{loading ? <><Loader2 className="spin" size={17} /> Loading bank</> : <>Start a {count}-question sprint <ArrowRight size={17} /></>}</button><span className="micro-note"><Zap size={14} /> No login. Your progress stays on this device.</span></div>
        </div>
        <div className="hero-visual paper-panel"><div className="subject-collage" role="img" aria-label="Study motifs for English, Biology, Chemistry, and Physics"><div className="collage-object collage-english"><BookOpen size={33} /><span>ENGLISH</span></div><div className="collage-object collage-biology"><Leaf size={42} /><span>BIOLOGY</span></div><div className="collage-object collage-chemistry"><FlaskConical size={34} /><span>CHEMISTRY</span></div><div className="collage-object collage-physics"><Atom size={36} /><span>PHYSICS</span></div><div className="collage-rule" /></div><div className="hero-visual-caption"><span>FIELD NOTES / 01</span><strong>Practice becomes progress.</strong></div><div className="hero-sticker">{overallAccuracy || "—"}<small>% accuracy</small></div></div>
      </section>

      <section className="desk-section page-shell" id="subjects">
        <div className="section-heading split-heading"><div><span className="eyebrow">01 / CHOOSE YOUR DESK</span><h2>Where are we warming up?</h2></div><div className="section-side-note"><span className="section-stamp">STUDY SLIPS / 04</span><span className="section-note">{progress.roundsPlayed ? `${progress.roundsPlayed} round${progress.roundsPlayed === 1 ? "" : "s"} in the ledger` : "Your first mark is waiting"}</span></div></div>
        <div className="subject-grid">
          {subjects.map((subject, subjectIndex) => { const Icon = subject.icon; const active = subject.name === selectedSubject; return <button key={subject.name} className={`subject-card ${subject.tint} ${active ? "subject-active" : ""}`} onClick={() => setSelectedSubject(subject.name)}><span className="subject-index">{subject.short}</span><span className="subject-slip-mark">SLIP / 0{subjectIndex + 1}</span><span className="subject-icon"><Icon size={25} strokeWidth={1.8} /></span><span className="subject-name">{subject.name}</span><span className="subject-note">{subject.note}</span><ArrowRight className="subject-arrow" size={17} /></button>; })}
        </div>
      </section>

      <section className="mode-section page-shell" id="how-it-works">
        <div className="mode-panel paper-panel"><div className="mode-panel-stamp">ROUND CARD / {mode === "cbt" ? "EXAM" : mode === "review" ? "REVIEW" : "SPRINT"}</div><div className="mode-intro"><span className="eyebrow">02 / SET THE ROUND</span><h2>Pick your pace.</h2><p>Start light, simulate the room, or return to what missed you last time.</p></div><div className="mode-controls"><div className="mode-tabs"><button className={mode === "sprint" ? "active" : ""} onClick={() => setMode("sprint")}><Zap size={16} /> Quick sprint</button><button className={mode === "cbt" ? "active" : ""} onClick={() => setMode("cbt")}><Clock3 size={16} /> CBT simulation</button><button className={`${mode === "review" ? "active" : ""} ${!canReview ? "disabled" : ""}`} onClick={() => canReview && setMode("review")}><ListChecks size={16} /> Review wrongs</button></div><div className="count-row"><span className="eyebrow">QUESTION COUNT</span><div className="count-options">{[10, 20, 40].map((value) => <button key={value} className={count === value ? "active" : ""} onClick={() => setCount(value)}>{value}<small>{value === 10 ? "MINI" : value === 20 ? "FOCUS" : "FULL"}</small></button>)}</div></div><button className="button button-dark mode-start" onClick={start} disabled={loading || !!loadError || (mode === "review" && !canReview)}>{mode === "review" ? "Open review set" : `Start ${selected.short} round`} <ArrowRight size={17} /></button></div></div>
      </section>

      <section className="progress-strip page-shell"><span className="progress-stamp">LEDGER OPEN</span><div className="progress-copy"><span className="eyebrow">YOUR LEDGER</span><h2>{progress.totalAnswered ? "The marks are adding up." : "The blank page is yours."}</h2><p>{progress.totalAnswered ? `${progress.totalCorrect} correct answers across ${progress.roundsPlayed} rounds.` : "Every round leaves a better version of you behind."}</p></div><div className="progress-metrics"><div><strong>{progress.totalAnswered || "—"}</strong><span>answered</span></div><div><strong>{progress.totalAnswered ? `${overallAccuracy}%` : "—"}</strong><span>accuracy</span></div><div><strong>{progress.bestScore || "—"}</strong><span>best mark</span></div></div><div className="progress-mark"><Trophy size={22} /><span>Keep<br />going.</span></div></section>

      <footer className="site-footer page-shell"><div className="footer-brand"><span className="brand-symbol brand-symbol-small" aria-hidden="true"><i /><i /><i /><i /></span><span>JAMB Quest / Field Notes Arcade</span></div><span>Original JAMB-aligned practice · Built for the next mark</span></footer>
    </main>
  );
}
