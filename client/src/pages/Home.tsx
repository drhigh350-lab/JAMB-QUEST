/* JAMB Quest: compact study desk. The daily action remains visible; supporting tools live in focused, tappable groups. */

import React, { useEffect, useState } from "react";
import { startLogin } from "@/const";
import { ArrowRight, Atom, Award, BellOff, BellRing, BookmarkCheck, BookOpen, CalendarCheck2, CheckCircle2, CircleHelp, CircleUserRound, Clock3, Download, Flame, FlaskConical, Leaf, ListChecks, LogIn, Medal, RotateCcw, Send, ShieldCheck, Sparkles, Target, Trophy, Wifi, WifiOff, Zap } from "lucide-react";
import { ProfilePanel } from "@/components/ProfilePanel";
import { DailyMissionPanel } from "@/components/DailyMissionPanel";
import { ProgressSignals } from "@/components/ProgressSignals";
import { selectDailyMission, selectProgressNextAction, summariseRoundAnalytics } from "@/game/dailyMission";
import type { RoundConfig, RoundSubject, StoredProgress, Subject } from "@/game/types";
import "../lekki-palette.css";

const subjects: Array<{ name: Subject; short: string; note: string; icon: typeof BookOpen; tint: string }> = [
  { name: "Use of English", short: "ENG", note: "Lexis, structure & oral forms", icon: BookOpen, tint: "subject-english" },
  { name: "Biology", short: "BIO", note: "Life, ecology & heredity", icon: Leaf, tint: "subject-biology" },
  { name: "Chemistry", short: "CHE", note: "Matter, reactions & industry", icon: FlaskConical, tint: "subject-chemistry" },
  { name: "Physics", short: "PHY", note: "Forces, waves & electricity", icon: Atom, tint: "subject-physics" },
];

const badgeDefinitions = [
  { key: "first-step", label: "First step", note: "Earn your first study XP", icon: Sparkles },
  { key: "returner", label: "Returner", note: "Complete a system after a gap", icon: RotateCcw },
  { key: "three-day-builder", label: "3-day builder", note: "Build a three-day system", icon: Flame },
  { key: "seven-day-builder", label: "7-day builder", note: "Keep the system running", icon: Award },
  { key: "hundred-mark-club", label: "1,000 XP", note: "Earn serious JAMB momentum", icon: Medal },
];

type AppTab = "practice" | "progress" | "profile" | "about";
type StudyPalette = Subject | "Lekki";
type ComebackState = {
  dailyMinimum: number; currentStreak: number; longestStreak: number; comebackXp: number; level: number; recoveryPending: boolean; consistencyScore: number;
  today: { dateKey: string; questionsAnswered: number; correctCount: number; completedMinimum: boolean; xpEarned: number };
  activity: Array<{ dateKey: string; questionsAnswered: number; correctCount: number; completedMinimum: boolean; recoveryAction: boolean; xpEarned: number }>;
  badges: string[];
};
type ReminderState = { enabled: boolean; reminderTime: string; pushEnabled: boolean };

interface HomeProps {
  loading: boolean; loadError: string | null; progress: StoredProgress; canReview: boolean; onRetryLoad: () => void; onStart: (config: RoundConfig) => void; questionCount: number; questionCountReady: boolean;
  questionSources?: Array<{ id: number; label: string; sourceType: "model" | "authorised"; permissionNote: string | null }>;
  auth: { loading: boolean; isAuthenticated: boolean; profileName: string; targetScore: number; onLogout: () => void; onSaveProfile: (displayName: string, targetScore: number) => void; savingProfile: boolean };
  examHistory: Array<{ id: number; subject: string; mode: string; questionCount: number; correctCount: number; score: number; durationSeconds: number; flaggedCount: number; missedQuestionIds: string[]; completedAt: Date }>;
  weakTopics: Array<{ topic: string; subject?: string | null; misses: number; attempts: number; accuracy: number }>;
  subjectPerformance?: Array<{ subject: string; attempts: number; accuracy: number }>;
  fullMockSubjectPerformance?: Array<{ subject: string; attempts: number; accuracy: number }>;
  availableTopics?: Array<{ subject: Subject; topic: string }>;
  bookmarks?: Array<{ questionId: string; subject: string; topic: string; createdAt: Date }>;
  comparison?: { latest: { id: number; accuracy: number; durationSeconds: number; flaggedCount: number; completedAt: Date } | null; previous: { id: number; accuracy: number; durationSeconds: number; flaggedCount: number; completedAt: Date } | null; accuracyChange: number | null; recommendation: string };
  comeback?: ComebackState; reminder?: ReminderState; onUpdateDailyMinimum: (dailyMinimum: number) => void; onEnablePush: () => void; onDisablePush: () => void; onTestPush?: () => void; pushWorking: boolean; pushStatus: "idle" | "unsupported" | "denied" | "enabling" | "enabled" | "disabled" | "failed" | "test-sent" | "test-failed";
  pwa: { isOnline: boolean; canInstall: boolean; installStatus: "idle" | "installing" | "installed" | "dismissed"; onInstall: () => void };
  resumableCbt?: { currentIndex: number; questionIds: string[]; secondsLeft: number } | null; onResumeCbt?: () => void; onDiscardResumableCbt?: () => void;
}

function guestComeback() {
  return { dailyMinimum: 10, currentStreak: 0, longestStreak: 0, comebackXp: 0, level: 1, recoveryPending: false, consistencyScore: 0, today: { dateKey: "today", questionsAnswered: 0, correctCount: 0, completedMinimum: false, xpEarned: 0 }, activity: [], badges: [] } satisfies ComebackState;
}

function broadTopicGroup(subject: Subject, topic: string) {
  const value = topic.toLocaleLowerCase();
  if (subject === "Biology") {
    if (/cell|nutrition|respiration|circulation|excretion|nervous|hormone|reproduction|health|disease/.test(value)) return "Life processes & health";
    if (/ecology|environment|cycle|population|adaptation|conservation/.test(value)) return "Ecology & survival";
    if (/genetic|evolution|inheritance|variation|chromosome/.test(value)) return "Genetics & continuity";
    if (/classification|microorganism|bacter|fung|protist|plant|animal/.test(value)) return "Diversity & classification";
    return "Living systems";
  }
  if (subject === "Chemistry") {
    if (/atomic|periodic|bond|structure|element/.test(value)) return "Atoms, bonding & periodicity";
    if (/mole|gas|equation|reaction|acid|base|salt|electrolysis|redox/.test(value)) return "Reactions & calculations";
    if (/organic|hydrocarbon|polymer|petroleum/.test(value)) return "Organic & industrial chemistry";
    return "Matter, energy & practical chemistry";
  }
  if (subject === "Physics") {
    if (/motion|force|mechanic|equilibrium|projectile|work|energy|machine/.test(value)) return "Mechanics & energy";
    if (/wave|sound|light|optic|lens/.test(value)) return "Waves, sound & optics";
    if (/electric|magnet|circuit|current|resistance/.test(value)) return "Electricity & magnetism";
    return "Heat, matter & modern physics";
  }
  if (/comprehension|prose|poetry|drama|literature|passage/.test(value)) return "Reading & literature";
  if (/oral|phonetic|stress|intonation|vowel|consonant/.test(value)) return "Oral English";
  if (/grammar|structure|lexis|register|idiom|meaning|word/.test(value)) return "Language use & expression";
  return "English skills";
}

function CompactPanel({ eyebrow, title, note, defaultOpen = false, children, tone = "paper" }: { eyebrow: string; title: string; note: string; defaultOpen?: boolean; children: React.ReactNode; tone?: "paper" | "ink" | "maize" }) {
  return <details className={`compact-panel compact-panel-${tone}`} open={defaultOpen}>
    <summary>
      <span className="compact-panel-index">{eyebrow}</span>
      <span className="compact-panel-copy"><strong>{title}</strong><small>{note}</small></span>
      <ArrowRight className="compact-panel-arrow" size={18} aria-hidden="true" />
    </summary>
    <div className="compact-panel-body">{children}</div>
  </details>;
}

export default function Home({ loading, loadError, progress, canReview, onRetryLoad, onStart, auth, questionCount, questionCountReady, comeback, reminder, examHistory, weakTopics, subjectPerformance = [], fullMockSubjectPerformance = [], availableTopics = [], bookmarks = [], comparison, onUpdateDailyMinimum, onEnablePush, onDisablePush, onTestPush = () => undefined, pushWorking, pushStatus, pwa, resumableCbt = null, onResumeCbt = () => undefined, onDiscardResumableCbt = () => undefined }: HomeProps) {
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const requested = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("tab");
    return requested === "progress" || requested === "profile" || requested === "about" ? requested : "practice";
  });
  const [selectedSubject, setSelectedSubject] = useState<Subject>("Biology");
  const [selectedPalette, setSelectedPalette] = useState<StudyPalette>("Biology");
  const [mode, setMode] = useState<"sprint" | "cbt" | "review">("sprint");
  const [count, setCount] = useState(10);
  const [topicDrillCount, setTopicDrillCount] = useState(20);
  const [lekkiCount, setLekkiCount] = useState(20);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedTopicGroup, setSelectedTopicGroup] = useState("");
  const [selectedLekkiChapter, setSelectedLekkiChapter] = useState("");
  const [entranceReady, setEntranceReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [typedEntrance, setTypedEntrance] = useState("");
  const [examReadiness, setExamReadiness] = useState({ device: false, focus: false, plan: false });
  const [profileOpen, setProfileOpen] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("profile") === "open");
  const selected = subjects.find((subject) => subject.name === selectedSubject)!;
  const selectableTopics = availableTopics.filter((item) => item.subject === selectedSubject && !item.topic.startsWith("The Lekki Headmaster")).map((item) => item.topic).sort((left, right) => left.localeCompare(right));
  const hasLekkiPractice = availableTopics.some((item) => item.subject === "Use of English" && item.topic.startsWith("The Lekki Headmaster"));
  const isLekkiPalette = selectedPalette === "Lekki";
  const topicGroups = Object.entries(selectableTopics.reduce<Record<string, string[]>>((groups, topic) => {
    const group = broadTopicGroup(selectedSubject, topic);
    groups[group] = [...(groups[group] ?? []), topic];
    return groups;
  }, {})).sort(([left], [right]) => left.localeCompare(right));
  const selectedGroupTopics = topicGroups.find(([group]) => group === selectedTopicGroup)?.[1] ?? [];
  const lekkiChapters = availableTopics.filter((item) => item.subject === "Use of English" && item.topic.startsWith("The Lekki Headmaster · Chapter")).map((item) => item.topic).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const selectedState = comeback ?? guestComeback();
  const visibleQuestionCount = questionCountReady ? questionCount : null;
  const visibleQuestionLabel = visibleQuestionCount === null ? "Preparing your JAMB Quest system" : `${visibleQuestionCount.toLocaleString()} practice questions`;
  const dailyMission = selectDailyMission({ weakTopics, fallbackSubject: selectedSubject, wrongIds: progress.wrongIds, recoveryPending: selectedState.recoveryPending });
  const roundAnalytics = summariseRoundAnalytics(examHistory);
  const overallAccuracy = progress.totalAnswered ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100) : 0;
  const progressNextAction = selectProgressNextAction({ accuracy: overallAccuracy, averageSecondsPerQuestion: roundAnalytics.averageSecondsPerQuestion, fallback: dailyMission.note });
  const dailyPercent = Math.min(100, Math.round((selectedState.today.questionsAnswered / selectedState.dailyMinimum) * 100));
  const targetLabel = auth.isAuthenticated ? `${auth.targetScore}` : "your goal";
  const liveMessages = [
    selectedState.today.completedMinimum ? "Today’s minimum is complete. Protect the streak with one more deliberate round." : `${selectedState.dailyMinimum - Math.min(selectedState.dailyMinimum, selectedState.today.questionsAnswered)} marks remain in today’s system.`,
    weakTopics[0] ? `Live focus: ${weakTopics[0].topic} is ready for a repair drill.` : "Live focus: finish your diagnostic to reveal the first weak topic.",
    visibleQuestionCount === null ? "Preparing your JAMB Quest system now." : `${visibleQuestionCount.toLocaleString()} practice questions are ready to support today’s system.`,
  ];
  const [liveMessageIndex, setLiveMessageIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setLiveMessageIndex((current) => (current + 1) % liveMessages.length), 4200);
    return () => window.clearInterval(timer);
  }, [liveMessages.length]);
  const liveMessage = liveMessages[liveMessageIndex % liveMessages.length];
  const entranceLine = activeTab === "practice" ? `Build toward ${targetLabel} with a system.` : activeTab === "progress" ? "Your evidence is ready. Turn the next miss into a focused repair." : activeTab === "profile" ? "Your study profile keeps useful marks and preferences together." : "Focused preparation. Clear weaknesses. Better next moves.";
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setPrefersReducedMotion(motion.matches);
    updateMotion();
    motion.addEventListener("change", updateMotion);
    const frame = window.requestAnimationFrame(() => setEntranceReady(true));
    return () => {
      motion.removeEventListener("change", updateMotion);
      window.cancelAnimationFrame(frame);
    };
  }, []);
  useEffect(() => {
    if (prefersReducedMotion) {
      setTypedEntrance(entranceLine);
      return;
    }
    setTypedEntrance("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedEntrance(entranceLine.slice(0, index));
      if (index >= entranceLine.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [entranceLine, prefersReducedMotion]);
  const tabItems: Array<{ id: AppTab; label: string; icon: typeof BookOpen }> = [
    { id: "practice", label: "Practice", icon: BookOpen }, { id: "progress", label: "Progress", icon: Target }, { id: "profile", label: "Profile", icon: CircleUserRound }, { id: "about", label: "About", icon: CircleHelp },
  ];
  const pushFeedbackMessages: Partial<Record<HomeProps["pushStatus"], string>> = {
    unsupported: "This browser cannot receive push reminders. Your in-app daily system still works.", denied: "Browser notifications were declined. You can enable them later in your browser settings.", failed: "The reminder could not be set up on this device. Please try again later.", enabled: "Daily JAMB reminders are now enabled for this device.", disabled: "Browser reminders are off for this device. Your in-app system stays active.", "test-sent": "Test reminder sent. Check this device’s notification shade now.", "test-failed": "No reminder reached this device. Re-enable notifications and try the test again.",
  };
  const start = () => onStart({ subject: selectedSubject, mode, count, ...(mode === "sprint" ? { timing: "study" as const } : {}) });
  const fullMockReady = Object.values(examReadiness).every(Boolean);
  const startFullMock = () => onStart({ subject: "Full JAMB Mock", mode: "cbt", count: 180 });
  const isStudySubject = (subject: string): subject is Subject => subjects.some((item) => item.name === subject);
  const startTopicDrill = (topic: { subject?: string | null; topic: string }) => { if (topic.subject && isStudySubject(topic.subject)) onStart({ subject: topic.subject, mode: "sprint", count: 20, timing: "study", topic: topic.topic }); };
  const startSelectedTopicDrill = () => {
    if (selectedTopic) {
      onStart({ subject: selectedSubject, mode: "sprint", count: topicDrillCount, timing: "study", topic: selectedTopic });
      return;
    }
    if (selectedTopicGroup && selectedGroupTopics.length) onStart({ subject: selectedSubject, mode: "sprint", count: topicDrillCount, timing: "study", topics: selectedGroupTopics });
  };
  const startLekkiRandom = () => onStart({ subject: "Use of English", mode: "sprint", count: lekkiCount, timing: "study", topic: "The Lekki Headmaster" });
  const startLekkiChapter = () => { if (selectedLekkiChapter) onStart({ subject: "Use of English", mode: "sprint", count: lekkiCount, timing: "study", topic: selectedLekkiChapter }); };
  const openBookmark = (bookmark: { questionId: string; subject: string; topic: string }) => { if (isStudySubject(bookmark.subject)) onStart({ subject: bookmark.subject, mode: "sprint", count: 1, timing: "study", questionIds: [bookmark.questionId], recoveryOrigin: "saved-question" }); };
  const openMissedQuestions = (questionIds: string[], subject: string) => { if (questionIds.length) { const roundSubject: RoundSubject = subject === "Full JAMB Mock" || isStudySubject(subject) ? subject : "Full JAMB Mock"; onStart({ subject: roundSubject, mode: "review", count: questionIds.length, questionIds, recoveryOrigin: "missed-questions" }); } };
  const revisionSteps = [
    weakTopics[0] ? { key: "drill", label: `Repair ${weakTopics[0].topic}`, note: `Run a 20-question ${weakTopics[0].subject ?? "focused"} drill from the most recent misses.`, action: () => startTopicDrill(weakTopics[0]) } : null,
    bookmarks[0] ? { key: "saved", label: "Revisit a saved question", note: `${bookmarks.length} saved revision ${bookmarks.length === 1 ? "item is" : "items are"} ready for deliberate review.`, action: () => openBookmark(bookmarks[0]) } : null,
    comparison?.latest ? { key: "cbt", label: "Confirm with another CBT", note: "After the recovery action, use a timed CBT paper to measure the change under exam conditions.", action: () => onStart({ subject: "Full JAMB Mock", mode: "cbt", count: 180 }) } : { key: "baseline", label: "Create your CBT baseline", note: "Complete the readiness check and take a timed mock so your study plan can use real evidence.", action: () => setActiveTab("practice") },
  ].filter((step): step is { key: string; label: string; note: string; action: () => void } => step !== null);

  return <main className={`home-page tabbed-home compact-home ${entranceReady ? "entrance-ready" : ""}`}>
    <header className="site-header page-shell entrance-item entrance-nav">
      <button className="brand-lockup brand-button" onClick={() => setActiveTab("practice")} aria-label="Open JAMB Quest practice"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /><i /></span><span className="brand-copy"><strong>JAMB Quest</strong><small>Your study system</small></span></button>
      <nav className="header-nav" aria-label="Primary navigation">
        {tabItems.slice(0, 2).map(({ id, label }) => <button key={id} className={`header-tab ${activeTab === id ? "active" : ""}`} onClick={() => setActiveTab(id)}>{label}</button>)}
        <span className={`header-status ${pwa.isOnline ? "" : "offline"}`} data-testid="ready-question-count" data-ready={questionCountReady ? "true" : "false"}><i /> {!questionCountReady || loading ? "Preparing JAMB Quest" : pwa.isOnline ? "JAMB Quest ready" : "Offline study ready"}</span>
        {auth.isAuthenticated ? <button className="profile-trigger" onClick={() => setActiveTab("profile")}><span>{auth.profileName.slice(0, 1).toUpperCase()}</span><b>{auth.profileName}</b></button> : <button className="sign-in-trigger" onClick={startLogin} disabled={auth.loading}><LogIn size={14} /> {auth.loading ? "Checking profile" : "Save my marks"}</button>}
      </nav>
    </header>
    {loadError && <div className="load-error page-shell"><span>{loadError}</span><button className="text-button" onClick={onRetryLoad}>Try again <ArrowRight size={14} /></button></div>}

    <section key={`hero-${activeTab}`} data-testid={`tab-cinematic-${activeTab}`} className="tab-hero page-shell compact-hero entrance-item entrance-hero tab-cinematic-entry">
      <div><span className="eyebrow">{activeTab === "practice" ? "YOUR JAMB QUEST SYSTEM" : `${activeTab.toUpperCase()} DESK`}</span><h1>{activeTab === "practice" ? <>Build toward<br /><em>{targetLabel}</em><br />with a system.</> : activeTab === "progress" ? <>Your work<br />is evidence.</> : activeTab === "profile" ? <>Your study<br />identity.</> : <>Know the<br />study desk.</>}</h1><p>{activeTab === "practice" ? visibleQuestionCount === null ? "Preparing your study system before showing the practice total." : `Your goal is built through daily action: choose a subject, a Lekki chapter, or today’s mission. ${visibleQuestionLabel} are ready when you are.` : activeTab === "progress" ? "Open only the evidence you need: the next repair, your history, or your revision shelf." : activeTab === "profile" ? "Keep your profile, daily reminder, and installable study app in one calm control room." : "JAMB Quest gives you focused practice, correction, and targeted improvement."}</p><span className="hero-typewriter" role="status" aria-live="polite"><b>›</b> {typedEntrance}<i aria-hidden="true" /></span>{activeTab === "practice" && <span className="live-writing" role="status" aria-live="polite"><i aria-hidden="true" /><b>LIVE DESK</b> {liveMessage}</span>}</div>
      <div className="tab-hero-stats">{activeTab === "practice" ? <><div><strong>{auth.isAuthenticated ? auth.targetScore : "—"}</strong><span>your goal</span></div><div><strong>4</strong><span>core subjects</span></div><div><strong>13</strong><span>Lekki chapters</span></div></> : <><div><strong>{overallAccuracy || "—"}</strong><span>% accuracy</span></div><div><strong>{selectedState.currentStreak}</strong><span>day system</span></div><div><strong>{progress.roundsPlayed}</strong><span>rounds</span></div></>}</div>
    </section>

    <div key={`content-${activeTab}`} className="tab-content page-shell tab-cinematic-entry tab-cinematic-content">
      {activeTab === "practice" && <>
        <div className="entrance-item entrance-mission"><DailyMissionPanel label={dailyMission.label} note={dailyMission.note} config={dailyMission.config} onStart={onStart} /></div>
        <section className="compact-action-grid tab-section entrance-item entrance-tools" aria-label="Practice tools">
          <CompactPanel eyebrow="01 / TODAY" title="Today’s JAMB practice" note={`${selectedState.today.questionsAnswered} of ${selectedState.dailyMinimum} questions in today’s plan`} defaultOpen tone="ink">
            <div className="compact-system-status"><div><strong>{selectedState.today.questionsAnswered}<small> / {selectedState.dailyMinimum}</small></strong><span><CheckCircle2 size={14} /> {selectedState.today.completedMinimum ? "minimum complete" : `${selectedState.dailyMinimum - Math.min(selectedState.dailyMinimum, selectedState.today.questionsAnswered)} marks to go`}</span></div><div className="compact-system-metrics"><span><b>{selectedState.level}</b> level</span><span><b>{selectedState.comebackXp}</b> XP</span><span><b>{selectedState.currentStreak}</b> streak</span></div></div>
            <div className="system-meter"><i style={{ width: `${dailyPercent}%` }} /></div>
            {auth.isAuthenticated && <div className="compact-minimum"><span>Daily minimum</span>{[5, 10, 20].map((value) => <button key={value} className={selectedState.dailyMinimum === value ? "active" : ""} onClick={() => onUpdateDailyMinimum(value)}>{value}</button>)}</div>}
          </CompactPanel>

          <CompactPanel eyebrow="02 / PRACTICE" title="Start a focused round" note={isLekkiPalette ? "Lekki novel · choose 10, 20, 40, or 50 questions" : `${selected.short} selected · ${mode === "cbt" ? "timed CBT" : mode === "review" ? "recovery" : "untimed study"}`} defaultOpen tone="paper">
            <div className="compact-subject-grid">{subjects.map((subject) => { const Icon = subject.icon; const active = selectedPalette === subject.name; return <button key={subject.name} className={`compact-subject ${subject.tint} ${active ? "active" : ""}`} onClick={() => { setSelectedPalette(subject.name); setSelectedSubject(subject.name); setSelectedTopic(""); setSelectedTopicGroup(""); }}><Icon size={17} /><span><b>{subject.short}</b><small>{subject.name}</small></span></button>; })}{hasLekkiPractice && <button data-testid="lekki-palette" className={`compact-subject subject-lekki ${isLekkiPalette ? "active" : ""}`} onClick={() => { setSelectedPalette("Lekki"); setMode("sprint"); setSelectedTopic(""); setSelectedTopicGroup(""); }}><BookOpen size={17} /><span><b>LEK</b><small>Lekki novel</small></span></button>}</div>
            {isLekkiPalette ? <div className="compact-lekki-desk"><div className="compact-lekki-heading"><span>THE LEKKI HEADMASTER</span><small>650 keyed questions across 13 chapters</small></div><div className="compact-count-row"><span>Question count</span><div>{[10, 20, 40, 50].map((value) => <button data-testid={`lekki-count-${value}`} key={value} className={lekkiCount === value ? "active" : ""} onClick={() => setLekkiCount(value)}>{value}</button>)}</div></div><div className="compact-lekki-actions"><button data-testid="lekki-random-start" className="button button-dark" onClick={startLekkiRandom} disabled={loading || !!loadError}><Sparkles size={15} /> Random {lekkiCount} <ArrowRight size={15} /></button><label className="compact-topic-select"><span>Chapter selection</span><select value={selectedLekkiChapter} onChange={(event) => setSelectedLekkiChapter(event.target.value)}><option value="">Choose a chapter</option>{lekkiChapters.map((topic) => <option key={topic} value={topic}>{topic.replace("The Lekki Headmaster · ", "")}</option>)}</select></label><button data-testid="lekki-chapter-start" className="button button-outline" onClick={startLekkiChapter} disabled={!selectedLekkiChapter || loading || !!loadError}>Start {lekkiCount} in chapter <ArrowRight size={15} /></button></div></div> : <><div className="compact-mode-tabs"><button className={mode === "sprint" ? "active" : ""} onClick={() => setMode("sprint")}><Zap size={15} /> Study</button><button className={mode === "cbt" ? "active" : ""} onClick={() => setMode("cbt")}><Clock3 size={15} /> CBT</button><button className={`${mode === "review" ? "active" : ""} ${!canReview ? "disabled" : ""}`} onClick={() => canReview && setMode("review")}><ListChecks size={15} /> Review</button></div><div className="compact-count-row"><span>Question count</span><div>{(mode === "cbt" ? [20, 40, 80] : [10, 20, 40]).map((value) => <button key={value} className={count === value ? "active" : ""} onClick={() => setCount(value)}>{value}</button>)}</div></div>{resumableCbt && <div className="compact-resume"><span>CBT saved at question {resumableCbt.currentIndex + 1}</span><button className="text-button" onClick={onResumeCbt}>Resume <ArrowRight size={13} /></button><button className="text-button" onClick={onDiscardResumableCbt}>Discard</button></div>}{mode === "cbt" && <div className="compact-full-mock"><span>180-question full UTME mock</span><div className="compact-checks">{([{ key: "device", label: "Charged" }, { key: "focus", label: "Quiet time" }, { key: "plan", label: "Review misses" }] as const).map((item) => <label key={item.key}><input type="checkbox" checked={examReadiness[item.key]} onChange={() => setExamReadiness((current) => ({ ...current, [item.key]: !current[item.key] }))} /> {item.label}</label>)}</div><button className="button button-outline" onClick={startFullMock} disabled={loading || !!loadError || !fullMockReady}><Trophy size={15} /> {fullMockReady ? "Start full mock" : "Complete checks"}</button></div>}<button className="button button-dark compact-start" onClick={start} disabled={loading || !!loadError || (mode === "review" && !canReview)}>{mode === "review" ? "Open recovery set" : mode === "sprint" ? `Start ${selected.short} study` : `Start ${selected.short} CBT`} <ArrowRight size={17} /></button></>}
          </CompactPanel>

          <CompactPanel eyebrow="03 / TOPIC" title="Study by broad area" note="Choose a larger area first; exact drills appear only when useful" tone="maize">
            <div className="compact-topic-groups" role="list" aria-label={`${selected.name} study areas`}>{topicGroups.map(([group, topics]) => <button role="listitem" key={group} className={selectedTopicGroup === group ? "active" : ""} onClick={() => { setSelectedTopicGroup(group); setSelectedTopic(""); }}><b>{group}</b><small>{topics.length} focused topics</small><ArrowRight size={13} /></button>)}</div>
            {selectedTopicGroup && <><label className="compact-topic-select"><span>Exact drill in {selectedTopicGroup}</span><select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}><option value="">Choose an exact topic only if you need it</option>{selectedGroupTopics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}</select></label><div className="compact-count-row"><span>Drill size</span><div>{[10, 20, 40, 50].map((value) => <button data-testid={`topic-drill-count-${value}`} key={value} className={topicDrillCount === value ? "active" : ""} onClick={() => setTopicDrillCount(value)}>{value}</button>)}</div></div></>}
            <button className="button button-dark compact-start" onClick={startSelectedTopicDrill} disabled={!selectedTopicGroup || !selectedGroupTopics.length || loading || !!loadError}>Start {topicDrillCount}-question drill <ArrowRight size={16} /></button>
          </CompactPanel>
        </section>
      </>}

      {activeTab === "progress" && <>
        <section className="compact-progress-grid tab-section" aria-label="Progress tools">
          <CompactPanel eyebrow="01 / NEXT MOVE" title={weakTopics[0] ? `Fix ${weakTopics[0].topic}` : "Create your first evidence"} note={progressNextAction} defaultOpen tone="maize">
            <ProgressSignals estimatedUtmeScore={roundAnalytics.estimatedUtmeScore} targetScore={auth.targetScore} averageSecondsPerQuestion={roundAnalytics.averageSecondsPerQuestion} accuracy={overallAccuracy} nextAction={progressNextAction} fullMockSubjectPerformance={fullMockSubjectPerformance} />
            <div className="compact-target-line"><span>YOUR TARGET</span><strong>{targetLabel}</strong><small>{auth.isAuthenticated ? "Your target is saved in Profile." : "Sign in to save and track your personal target."}</small></div>
            <div className="compact-subject-signals">{subjects.map((subject) => { const signal = subjectPerformance.find((item) => item.subject === subject.name); const weakTopic = weakTopics.find((topic) => topic.subject === subject.name); return <article data-testid={`subject-signal-${subject.short}`} key={subject.name}><span>{subject.short}</span><strong>{signal ? `${signal.accuracy}%` : "—"}</strong><small>{weakTopic ? weakTopic.topic : "no weak topic yet"}</small>{weakTopic && <button className="text-button" onClick={() => startTopicDrill(weakTopic)}>Fix in 20 <ArrowRight size={12} /></button>}</article>; })}</div>
            <ol className="compact-revision-steps">{revisionSteps.map((step, index) => <li key={step.key}><span>{index + 1}</span><div><b>{step.label}</b><small>{step.note}</small></div><button className="text-button" onClick={step.action}>Start <ArrowRight size={12} /></button></li>)}</ol>
          </CompactPanel>

          <CompactPanel eyebrow="02 / EVIDENCE" title="See your performance history" note={`${examHistory.length} saved round${examHistory.length === 1 ? "" : "s"} · consistency and CBT trend`} tone="paper">
            <section className="compact-activity"><div><span>14-day consistency</span><strong>{selectedState.consistencyScore}% steady</strong></div><div className="activity-bars">{Array.from({ length: 14 }, (_, index) => { const activity = selectedState.activity[index]; const amount = activity ? Math.min(100, Math.max(13, activity.questionsAnswered * 8)) : 11; return <span key={activity?.dateKey ?? index} className={`${activity?.completedMinimum ? "active" : ""} ${activity?.recoveryAction ? "recovery" : ""}`} style={{ height: `${amount}%` }} />; })}</div></section>
            {examHistory.length ? <><div className="exam-trend compact-trend" aria-label="Recent exam accuracy chart">{examHistory.slice(-8).map((round) => { const accuracy = round.questionCount ? Math.round((round.correctCount / round.questionCount) * 100) : 0; return <div className="exam-trend-point" key={round.id}><span style={{ height: `${Math.max(10, accuracy)}%` }} title={`${accuracy}% accuracy`} /><small>{accuracy}%</small></div>; })}</div><div className="compact-log-list">{examHistory.slice(-4).reverse().map((round) => { const accuracy = round.questionCount ? Math.round((round.correctCount / round.questionCount) * 100) : 0; const missedCount = round.missedQuestionIds.length; return <article key={round.id}><span><b>{round.subject}</b><small>{round.mode === "cbt" ? "CBT mock" : "Practice"} · {new Date(round.completedAt).toLocaleDateString()}</small></span><strong>{accuracy}%</strong><button className="text-button" onClick={() => openMissedQuestions(round.missedQuestionIds, round.subject)} disabled={!missedCount}>{missedCount ? `Review ${missedCount}` : "No misses"}</button></article>; })}</div></> : <p className="compact-empty">Finish a practice set or CBT mock to build your evidence history.</p>}
            <div className="compact-comparison"><b>{comparison?.latest ? "Latest CBT comparison" : "Create your CBT benchmark"}</b><p>{comparison?.recommendation ?? "A full CBT mock gives the app the evidence needed for a personal comparison."}</p></div>
          </CompactPanel>

          <CompactPanel eyebrow="03 / REVISION" title="Open your revision shelf" note={`${progress.wrongIds.length} missed · ${bookmarks.length} saved`} tone="ink">
            {progress.wrongIds.length > 0 && <button className="compact-missed-button" onClick={() => openMissedQuestions(progress.wrongIds, "Full JAMB Mock")}>Open all {progress.wrongIds.length} missed <ArrowRight size={14} /></button>}
            <div className="compact-weak-list">{weakTopics.length ? weakTopics.slice(0, 4).map((topic) => <article key={`${topic.subject}-${topic.topic}`}><span><b>{topic.topic}</b><small>{topic.subject} · {topic.accuracy}% accuracy</small></span><button className="text-button" onClick={() => startTopicDrill(topic)} disabled={!topic.subject}>Fix in 20 <ArrowRight size={12} /></button></article>) : <p className="compact-empty">Complete a round to turn real misses into focused repairs.</p>}</div>
            <div className="compact-saved-list">{bookmarks.length ? bookmarks.slice(0, 5).map((bookmark) => <article key={bookmark.questionId}><span><b>{bookmark.topic}</b><small>{bookmark.subject}</small></span><button className="text-button" onClick={() => openBookmark(bookmark)}>Open <ArrowRight size={12} /></button></article>) : <p className="compact-empty">Save any useful question to keep it on your revision shelf.</p>}</div>
            <div className="compact-badges"><span>{selectedState.badges.length} / {badgeDefinitions.length} badges</span>{badgeDefinitions.map((badge) => { const Icon = badge.icon; return <i className={selectedState.badges.includes(badge.key) ? "unlocked" : ""} key={badge.key} title={badge.label}><Icon size={15} /></i>; })}</div>
          </CompactPanel>
        </section>
      </>}

      {activeTab === "profile" && <>
        <section className="profile-summary tab-section"><div className="profile-monogram">{auth.profileName.slice(0, 1).toUpperCase()}</div><div><span className="eyebrow">YOUR STUDY PROFILE</span><h2>{auth.isAuthenticated ? auth.profileName : "Save your progress."}</h2><p>{auth.isAuthenticated ? `Your target is ${auth.targetScore}. Your systems and marks are stored with your sign-in.` : "You can practise as a guest. Sign in when you are ready to keep your progress across devices."}</p></div><div className="profile-summary-actions">{auth.isAuthenticated ? <button className="button button-dark" onClick={() => setProfileOpen(true)}>Edit profile <ArrowRight size={16} /></button> : <button className="button button-dark" onClick={startLogin}><LogIn size={16} /> Save my marks</button>}</div></section>
        <section className="notification-section tab-section"><div className="notification-copy"><BellRing size={24} /><div><h2>Daily JAMB reminder</h2><p>Enable reminders on this device, approve the browser prompt, then run a test before relying on the daily nudge. Daily delivery runs at 7:00 pm UTC.</p>{pushFeedbackMessages[pushStatus] && <p className="push-feedback" role="status">{pushFeedbackMessages[pushStatus]}</p>}</div></div><div className="notification-actions">{auth.isAuthenticated ? reminder?.pushEnabled ? <><span className="notification-status"><CalendarCheck2 size={15} /> Reminder ready on this device</span><button className="button button-outline" onClick={onTestPush} disabled={pushWorking}><Send size={15} /> {pushWorking ? "Testing" : "Send test"}</button><button className="button button-push" onClick={onDisablePush} disabled={pushWorking}><BellOff size={15} /> Turn off</button></> : <button className="button button-push" onClick={onEnablePush} disabled={pushWorking}><BellRing size={15} /> {pushWorking ? "Setting up" : "Enable on this device"}</button> : <button className="button button-push" onClick={startLogin}><LogIn size={15} /> Save reminders with profile</button>}</div></section>
        <section className="pwa-section tab-section" aria-label="Install and offline access"><div className="pwa-copy"><div className="pwa-icon" aria-hidden="true">{pwa.isOnline ? <Wifi size={22} /> : <WifiOff size={22} />}</div><div><span className="eyebrow">YOUR STUDY APP</span><h2>{pwa.isOnline ? "Keep JAMB Quest in your pocket." : "Offline system active."}</h2><p>{pwa.isOnline ? "Install JAMB Quest for a focused, app-like study desk. The app shell and model-bank practice remain ready if your connection drops." : "Your saved app shell and model-question practice remain available. Sync and reminders resume when you reconnect."}</p></div></div><div className="pwa-actions">{pwa.canInstall ? <button className="button button-dark" onClick={pwa.onInstall} disabled={pwa.installStatus === "installing"}><Download size={16} /> {pwa.installStatus === "installing" ? "Opening install" : "Install JAMB Quest"}</button> : pwa.installStatus === "installed" ? <span className="pwa-status"><CheckCircle2 size={16} /> Installed on this device</span> : <span className="pwa-status"><Download size={16} /> Use your browser menu to install</span>}</div></section>
      </>}

      {activeTab === "about" && <>
        <section className="about-board tab-section"><div><span className="eyebrow">THE JAMB QUEST METHOD</span><h2>Big score.<br />Clear practice.</h2><p>JAMB Quest keeps practice direct: attempt a focused set, understand the correction, repair the weakness, and practise again with better evidence.</p></div><div className="about-principles"><div><b>01</b><span>Practice before motivation</span></div><div><b>02</b><span>Recover without punishment</span></div><div><b>03</b><span>Quality before quantity</span></div></div></section>
        <section className="source-strip tab-section"><div><span className="eyebrow">ONE QUESTION BANK</span><h2><ShieldCheck size={20} /> One focused place to prepare.</h2><p>Every available question follows the same clean JAMB Quest format: choose an answer, see the correction, understand the explanation, and use your result to decide what to practise next.</p></div><div className="source-list"><div className="source-chip source-model"><span>READY TO PRACTISE</span><strong>{questionCount.toLocaleString()} JAMB Quest questions</strong><small>Checked for a consistent question, answer, and explanation experience.</small></div></div></section>
        <section className="about-board about-mini tab-section"><div><span className="eyebrow">YOUR QUESTION BANK</span><h2>{questionCount.toLocaleString()} questions, ready when you are.</h2><p>JAMB Quest keeps your preparation simple: no package hunting, no confusing sets—just focused practice and evidence-led improvement.</p></div><button className="button button-dark" onClick={() => setActiveTab("practice")}>Go to practice <ArrowRight size={16} /></button></section>
      </>}
    </div>
    <footer className="site-footer page-shell"><div className="footer-brand"><span className="brand-symbol brand-symbol-small" aria-hidden="true"><i /><i /><i /><i /></span><span>JAMB Quest / Your study system</span></div><span>Build toward your goal with a system.</span></footer>
    <nav className="app-tabbar" aria-label="Study sections">{tabItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)} aria-current={activeTab === id ? "page" : undefined}><Icon size={19} /><span>{label}</span></button>)}</nav>
    {auth.isAuthenticated && <ProfilePanel open={profileOpen} displayName={auth.profileName} targetScore={auth.targetScore} totalAnswered={progress.totalAnswered} accuracy={overallAccuracy} onClose={() => setProfileOpen(false)} onSave={auth.onSaveProfile} onLogout={auth.onLogout} saving={auth.savingProfile} />}
  </main>;
}
