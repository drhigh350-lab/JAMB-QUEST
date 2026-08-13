/* Field Notes Arcade: a focused study desk, with each mission surfaced only when it is useful. */

import React, { useState } from "react";
import { startLogin } from "@/const";
import { ArrowRight, Atom, Award, BellOff, BellRing, BookOpen, CalendarCheck2, CheckCircle2, CircleHelp, CircleUserRound, Clock3, Download, Flame, FlaskConical, Leaf, ListChecks, Loader2, LogIn, Medal, RotateCcw, ShieldCheck, Sparkles, Target, Trophy, Wifi, WifiOff, Zap } from "lucide-react";
import { ProfilePanel } from "@/components/ProfilePanel";
import type { RoundConfig, StoredProgress, Subject } from "@/game/types";

const subjects: Array<{ name: Subject; short: string; note: string; icon: typeof BookOpen; tint: string }> = [
  { name: "Use of English", short: "ENG", note: "Lexis, structure & oral forms", icon: BookOpen, tint: "subject-english" },
  { name: "Biology", short: "BIO", note: "Life, ecology & heredity", icon: Leaf, tint: "subject-biology" },
  { name: "Chemistry", short: "CHE", note: "Matter, reactions & industry", icon: FlaskConical, tint: "subject-chemistry" },
  { name: "Physics", short: "PHY", note: "Forces, waves & electricity", icon: Atom, tint: "subject-physics" },
];

const badgeDefinitions = [
  { key: "first-step", label: "First step", note: "Earn your first comeback XP", icon: Sparkles },
  { key: "returner", label: "Returner", note: "Complete a system after a gap", icon: RotateCcw },
  { key: "three-day-builder", label: "3-day builder", note: "Build a three-day system", icon: Flame },
  { key: "seven-day-builder", label: "7-day builder", note: "Keep the system running", icon: Award },
  { key: "hundred-mark-club", label: "1,000 XP", note: "Earn serious comeback momentum", icon: Medal },
];

type AppTab = "practice" | "progress" | "profile" | "about";
type ComebackState = {
  dailyMinimum: number; currentStreak: number; longestStreak: number; comebackXp: number; level: number; recoveryPending: boolean; consistencyScore: number;
  today: { dateKey: string; questionsAnswered: number; correctCount: number; completedMinimum: boolean; xpEarned: number };
  activity: Array<{ dateKey: string; questionsAnswered: number; correctCount: number; completedMinimum: boolean; recoveryAction: boolean; xpEarned: number }>;
  badges: string[];
};
type ReminderState = { enabled: boolean; reminderTime: string; pushEnabled: boolean };

interface HomeProps {
  loading: boolean; loadError: string | null; progress: StoredProgress; canReview: boolean; onRetryLoad: () => void; onStart: (config: RoundConfig) => void; questionCount: number; questionCountReady: boolean;
  auth: { loading: boolean; isAuthenticated: boolean; profileName: string; targetScore: number; onLogout: () => void; onSaveProfile: (displayName: string, targetScore: number) => void; savingProfile: boolean };
  questionSources: Array<{ id: number; label: string; sourceType: "model" | "authorised"; permissionNote: string | null }>;
  comeback?: ComebackState; reminder?: ReminderState; onUpdateDailyMinimum: (dailyMinimum: number) => void; onEnablePush: () => void; onDisablePush: () => void; pushWorking: boolean; pushStatus: "idle" | "unsupported" | "denied" | "enabling" | "enabled" | "disabled" | "failed";
  pwa: { isOnline: boolean; canInstall: boolean; installStatus: "idle" | "installing" | "installed" | "dismissed"; onInstall: () => void };
}

function guestComeback() {
  return { dailyMinimum: 10, currentStreak: 0, longestStreak: 0, comebackXp: 0, level: 1, recoveryPending: false, consistencyScore: 0, today: { dateKey: "today", questionsAnswered: 0, correctCount: 0, completedMinimum: false, xpEarned: 0 }, activity: [], badges: [] } satisfies ComebackState;
}

export default function Home({ loading, loadError, progress, canReview, onRetryLoad, onStart, auth, questionCount, questionCountReady, questionSources, comeback, reminder, onUpdateDailyMinimum, onEnablePush, onDisablePush, pushWorking, pushStatus, pwa }: HomeProps) {
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const requested = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("tab");
    return requested === "progress" || requested === "profile" || requested === "about" ? requested : "practice";
  });
  const [selectedSubject, setSelectedSubject] = useState<Subject>("Biology");
  const [mode, setMode] = useState<"sprint" | "cbt" | "review">("sprint");
  const [count, setCount] = useState(10);
  const [profileOpen, setProfileOpen] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("profile") === "open");
  const selected = subjects.find((subject) => subject.name === selectedSubject)!;
  const selectedState = comeback ?? guestComeback();
  const overallAccuracy = progress.totalAnswered ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100) : 0;
  const dailyPercent = Math.min(100, Math.round((selectedState.today.questionsAnswered / selectedState.dailyMinimum) * 100));
  const readinessGap = Math.max(0, 90 - overallAccuracy);
  const tabItems: Array<{ id: AppTab; label: string; icon: typeof BookOpen }> = [
    { id: "practice", label: "Practice", icon: BookOpen },
    { id: "progress", label: "Progress", icon: Target },
    { id: "profile", label: "Profile", icon: CircleUserRound },
    { id: "about", label: "About", icon: CircleHelp },
  ];
  const pushFeedbackMessages: Partial<Record<HomeProps["pushStatus"], string>> = {
    unsupported: "This browser cannot receive push reminders. Your in-app daily system still works.",
    denied: "Browser notifications were declined. You can enable them later in your browser settings.",
    failed: "The reminder could not be set up on this device. Please try again later.",
    enabled: "Daily comeback reminders are now enabled for this device.",
    disabled: "Browser reminders are off for this device. Your in-app system stays active.",
  };
  const start = () => onStart({ subject: selectedSubject, mode, count });
  const dailyStart = () => {
    const nextMode = selectedState.recoveryPending ? "review" : "sprint";
    setMode(nextMode);
    setCount(selectedState.dailyMinimum);
    onStart({ subject: selectedSubject, mode: nextMode, count: selectedState.dailyMinimum });
  };

  return <main className="home-page tabbed-home">
    <header className="site-header page-shell">
      <button className="brand-lockup brand-button" onClick={() => setActiveTab("practice")} aria-label="Open practice"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /><i /></span><span><strong>JAMB</strong><span>QUEST</span><small>COME BACK</small></span></button>
      <nav className="header-nav" aria-label="Primary navigation">
        {tabItems.slice(0, 2).map(({ id, label }) => <button key={id} className={`header-tab ${activeTab === id ? "active" : ""}`} onClick={() => setActiveTab(id)}>{label}</button>)}
        <span className={`header-status ${pwa.isOnline ? "" : "offline"}`} data-testid="ready-question-count" data-ready={questionCountReady ? "true" : "false"}><i /> {loading ? "Loading bank" : pwa.isOnline ? `${questionCount.toLocaleString()} questions ready` : "Offline system"}</span>
        {auth.isAuthenticated ? <button className="profile-trigger" onClick={() => setActiveTab("profile")}><span>{auth.profileName.slice(0, 1).toUpperCase()}</span><b>{auth.profileName}</b></button> : <button className="sign-in-trigger" onClick={startLogin} disabled={auth.loading}><LogIn size={14} /> {auth.loading ? "Checking profile" : "Save my marks"}</button>}
      </nav>
    </header>
    {loadError && <div className="load-error page-shell"><span>{loadError}</span><button className="text-button" onClick={onRetryLoad}>Try again <ArrowRight size={14} /></button></div>}

    <section className="tab-hero page-shell">
      <div><span className="eyebrow">{activeTab === "practice" ? "COMEBACK FROM SETBACK" : `${activeTab.toUpperCase()} DESK`}</span><h1>{activeTab === "practice" ? <>Smash <em>380</em><br />with a system.</> : activeTab === "progress" ? <>Your work<br />is evidence.</> : activeTab === "profile" ? <>Your study<br />identity.</> : <>Know the<br />study desk.</>}</h1><p>{activeTab === "practice" ? "Choose a subject, take the next focused action, and let small repetitions do the heavy lifting." : activeTab === "progress" ? "Your accuracy, consistency, badges, and subject marks stay visible without getting in the way of practice." : activeTab === "profile" ? "Keep your profile, daily reminder, and installable study app in one calm control room." : "JAMB Quest keeps original model questions and owner-provided sources visibly distinct."}</p></div>
      <div className="tab-hero-stats"><div><strong>{overallAccuracy || "—"}</strong><span>% accuracy</span></div><div><strong>{selectedState.currentStreak}</strong><span>day system</span></div><div><strong>{progress.roundsPlayed}</strong><span>rounds</span></div></div>
    </section>

    <div className="tab-content page-shell">
      {activeTab === "practice" && <>
        <section className="come-back-banner tab-section"><div className="come-back-copy"><span className="come-back-chip"><RotateCcw size={13} /> THE COMEBACK LOOP</span><h2>Missed a day? <em>Return today.</em></h2><p>A missed day does not erase the system. The next completed minimum is the comeback.</p></div><div className="mission-metrics"><div><strong>{selectedState.level}</strong><span>builder level</span></div><div><strong>{selectedState.comebackXp}</strong><span>comeback XP</span></div><div><strong>{selectedState.today.questionsAnswered}</strong><span>today’s marks</span></div></div></section>
        <section className="system-section tab-section"><div className={`system-card ${selectedState.recoveryPending ? "recovery" : ""}`}><span className="eyebrow">TODAY’S SYSTEM / {selectedState.today.dateKey}</span><h2>{selectedState.recoveryPending ? "Restart small. You are still in it." : selectedState.today.completedMinimum ? "Today’s system is running." : "A small action keeps the system alive."}</h2><p>{selectedState.recoveryPending ? "Open a recovery set, correct one missed answer, and rebuild the rhythm." : `Your minimum is ${selectedState.dailyMinimum} questions. Once the system runs, the scoreboard can take care of itself.`}</p><div className="daily-progress"><strong>{selectedState.today.questionsAnswered}<small> / {selectedState.dailyMinimum}</small></strong><span><CheckCircle2 size={14} /> {selectedState.today.completedMinimum ? "minimum complete" : `${selectedState.dailyMinimum - Math.min(selectedState.dailyMinimum, selectedState.today.questionsAnswered)} marks to go`}</span></div><div className="system-meter"><i style={{ width: `${dailyPercent}%` }} /></div><div className="system-action"><button className="button button-dark" onClick={dailyStart} disabled={loading || !!loadError}>{loading ? <><Loader2 className="spin" size={16} /> Loading</> : selectedState.recoveryPending ? "Open recovery review" : "Run today’s system"} <ArrowRight size={16} /></button>{auth.isAuthenticated && <div className="count-options system-minimum">{[5, 10, 20].map((value) => <button key={value} className={selectedState.dailyMinimum === value ? "active" : ""} onClick={() => onUpdateDailyMinimum(value)}>{value}<small>DAILY</small></button>)}</div>}</div></div><div className="practice-note"><span className="eyebrow">TODAY’S CUE</span><h2>Start before you feel ready.</h2><p>Choose a desk below. A focused set is enough to keep the system alive.</p><div className="practice-note-rule" /><strong>{selected.short} / {selected.name}</strong></div></section>
        <section className="desk-section tab-section"><div className="section-heading split-heading"><div><span className="eyebrow">CHOOSE YOUR DESK</span><h2>Where are we returning?</h2></div><div className="section-side-note"><span className="section-stamp">STUDY SLIPS / 04</span><span className="section-note">{progress.roundsPlayed ? `${progress.roundsPlayed} rounds in your ledger` : "Your first return starts here"}</span></div></div><div className="subject-grid">{subjects.map((subject, subjectIndex) => { const Icon = subject.icon; const active = subject.name === selectedSubject; return <button key={subject.name} className={`subject-card ${subject.tint} ${active ? "subject-active" : ""}`} onClick={() => setSelectedSubject(subject.name)}><span className="subject-index">{subject.short}</span><span className="subject-slip-mark">SLIP / 0{subjectIndex + 1}</span><span className="subject-icon"><Icon size={25} strokeWidth={1.8} /></span><span className="subject-name">{subject.name}</span><span className="subject-note">{subject.note}</span><ArrowRight className="subject-arrow" size={17} /></button>; })}</div></section>
        <section className="mode-section tab-section"><div className="mode-panel paper-panel"><div className="mode-panel-stamp">ROUND CARD / {mode === "cbt" ? "EXAM" : mode === "review" ? "RECOVERY" : "SPRINT"}</div><div className="mode-intro"><span className="eyebrow">SET THE ROUND</span><h2>Pick your next action.</h2><p>Start light, simulate the room, or return to what missed you last time.</p></div><div className="mode-controls"><div className="mode-tabs"><button className={mode === "sprint" ? "active" : ""} onClick={() => setMode("sprint")}><Zap size={16} /> Quick sprint</button><button className={mode === "cbt" ? "active" : ""} onClick={() => setMode("cbt")}><Clock3 size={16} /> CBT simulation</button><button className={`${mode === "review" ? "active" : ""} ${!canReview ? "disabled" : ""}`} onClick={() => canReview && setMode("review")}><ListChecks size={16} /> Recovery review</button></div><div className="count-row"><span className="eyebrow">QUESTION COUNT</span><div className="count-options">{[10, 20, 40].map((value) => <button key={value} className={count === value ? "active" : ""} onClick={() => setCount(value)}>{value}<small>{value === 10 ? "MINI" : value === 20 ? "FOCUS" : "FULL"}</small></button>)}</div></div><button className="button button-dark mode-start" onClick={start} disabled={loading || !!loadError || (mode === "review" && !canReview)}>{mode === "review" ? "Open recovery set" : `Start ${selected.short} round`} <ArrowRight size={17} /></button></div></div></section>
      </>}

      {activeTab === "progress" && <>
        <section className="system-section tab-section"><div className="activity-card progress-card"><div className="activity-head"><div><span className="eyebrow">14-DAY CONSISTENCY</span><h3>Systems beat motivation.</h3></div><span className="activity-score">{selectedState.consistencyScore}% steady</span></div><div className="activity-bars">{Array.from({ length: 14 }, (_, index) => { const activity = selectedState.activity[index]; const amount = activity ? Math.min(100, Math.max(13, activity.questionsAnswered * 8)) : 11; return <span key={activity?.dateKey ?? index} className={`${activity?.completedMinimum ? "active" : ""} ${activity?.recoveryAction ? "recovery" : ""}`} style={{ height: `${amount}%` }} title={activity?.dateKey ?? "No system yet"} />; })}</div><div className="activity-foot"><span>older</span><span>today</span></div><div className="daily-progress"><strong>{selectedState.longestStreak}<small> days</small></strong><span><Flame size={14} /> longest system</span></div></div><div className="progress-summary"><span className="eyebrow">YOUR LEDGER</span><h2>{progress.totalAnswered ? "The marks are adding up." : "The blank page is yours."}</h2><div className="progress-metrics"><div><strong>{progress.totalAnswered || "—"}</strong><span>answered</span></div><div><strong>{progress.totalAnswered ? `${overallAccuracy}%` : "—"}</strong><span>accuracy</span></div><div><strong>{progress.bestScore || "—"}</strong><span>best mark</span></div></div></div></section>
        <section className="growth-section tab-section"><div className="mission-board"><span className="eyebrow">YOUR 380 MISSION</span><h2>Direction is 380.<br />The daily system is the win.</h2><p>Complete your minimum, learn from a wrong answer, and let the score become evidence of the system.</p><div className="trajectory-line"><div><span>Practice accuracy</span><strong>{overallAccuracy || "—"}%</strong></div><div><span>380 readiness milestone</span><strong>{overallAccuracy ? `${readinessGap}% to 90%` : "Start a round"}</strong></div></div><small className="trajectory-note">Readiness uses practice accuracy and consistency; it is not a prediction of your JAMB score.</small></div><div className="mastery-board"><span className="eyebrow">SUBJECT MOMENTUM</span><h2>Keep weak spots visible.</h2><p>Use the score marks as a cue for your next practice desk.</p><div className="mastery-list">{subjects.map((subject) => <div className="mastery-card" key={subject.name}><span>{subject.short}</span><strong>{progress.subjectBest[subject.name] ?? "—"}</strong><small>best mark</small></div>)}</div></div></section>
        <section className="badge-section tab-section"><div className="badge-heading"><div><span className="eyebrow">COMEBACK BADGES</span><h2>Evidence that you returned.</h2></div><span className="section-stamp">{selectedState.badges.length} / {badgeDefinitions.length} UNLOCKED</span></div><div className="badge-list">{badgeDefinitions.map((badge) => { const Icon = badge.icon; const unlocked = selectedState.badges.includes(badge.key); return <article className={`badge ${unlocked ? "unlocked" : ""}`} key={badge.key}><Icon size={20} /><h3>{badge.label}</h3><p>{badge.note}</p></article>; })}</div></section>
      </>}

      {activeTab === "profile" && <>
        <section className="profile-summary tab-section"><div className="profile-monogram">{auth.profileName.slice(0, 1).toUpperCase()}</div><div><span className="eyebrow">YOUR STUDY PROFILE</span><h2>{auth.isAuthenticated ? auth.profileName : "Save your comeback."}</h2><p>{auth.isAuthenticated ? `Your target is ${auth.targetScore}. Your systems and marks are stored with your sign-in.` : "You can practise as a guest. Sign in when you are ready to keep your progress across devices."}</p></div><div className="profile-summary-actions">{auth.isAuthenticated ? <button className="button button-dark" onClick={() => setProfileOpen(true)}>Edit profile <ArrowRight size={16} /></button> : <button className="button button-dark" onClick={startLogin}><LogIn size={16} /> Save my marks</button>}</div></section>
        <section className="notification-section tab-section"><div className="notification-copy"><BellRing size={24} /><div><h2>Daily comeback reminder</h2><p>Opt in on this device for a gentle nudge back to your system. You can switch it off anytime.</p>{pushFeedbackMessages[pushStatus] && <p className="push-feedback" role="status">{pushFeedbackMessages[pushStatus]}</p>}</div></div><div className="notification-actions">{auth.isAuthenticated ? reminder?.pushEnabled ? <><span className="notification-status"><CalendarCheck2 size={15} /> Daily reminder on</span><button className="button button-push" onClick={onDisablePush} disabled={pushWorking}><BellOff size={15} /> Turn off</button></> : <button className="button button-push" onClick={onEnablePush} disabled={pushWorking}><BellRing size={15} /> {pushWorking ? "Setting up" : "Enable on this device"}</button> : <button className="button button-push" onClick={startLogin}><LogIn size={15} /> Save reminders with profile</button>}</div></section>
        <section className="pwa-section tab-section" aria-label="Install and offline access"><div className="pwa-copy"><div className="pwa-icon" aria-hidden="true">{pwa.isOnline ? <Wifi size={22} /> : <WifiOff size={22} />}</div><div><span className="eyebrow">YOUR STUDY APP</span><h2>{pwa.isOnline ? "Keep JAMB Quest in your pocket." : "Offline system active."}</h2><p>{pwa.isOnline ? "Install JAMB Quest for a focused, app-like study desk. The app shell and model-bank practice remain ready if your connection drops." : "Your saved app shell and model-question practice remain available. Sync and reminders resume when you reconnect."}</p></div></div><div className="pwa-actions">{pwa.canInstall ? <button className="button button-dark" onClick={pwa.onInstall} disabled={pwa.installStatus === "installing"}><Download size={16} /> {pwa.installStatus === "installing" ? "Opening install" : "Install JAMB Quest"}</button> : pwa.installStatus === "installed" ? <span className="pwa-status"><CheckCircle2 size={16} /> Installed on this device</span> : <span className="pwa-status"><Download size={16} /> Use your browser menu to install</span>}</div></section>
      </>}

      {activeTab === "about" && <>
        <section className="about-board tab-section"><div><span className="eyebrow">THE JAMB QUEST METHOD</span><h2>Big score.<br />Small systems.</h2><p>JAMB Quest treats practice as a returnable system: show up, attempt a focused set, learn from what missed you, and come back tomorrow.</p></div><div className="about-principles"><div><b>01</b><span>Practice before motivation</span></div><div><b>02</b><span>Recover without punishment</span></div><div><b>03</b><span>Keep source labels clear</span></div></div></section>
        <section className="source-strip tab-section"><div><span className="eyebrow">QUESTION PROVENANCE</span><h2><ShieldCheck size={20} /> Know what you are practising.</h2><p>Original model questions and owner-provided source records are deliberately separated. Owner-provided wording stays labelled verification-pending; it is not presented as official JAMB wording.</p></div><div className="source-list">{questionSources.length ? questionSources.map((source) => <div className={`source-chip source-${source.sourceType}`} key={source.id}><span>{source.sourceType === "model" ? "MODEL" : "OWNER-PROVIDED"}</span><strong>{source.label}</strong><small>{source.permissionNote ?? "Source note available"}</small></div>) : <div className="source-chip source-model"><span>MODEL</span><strong>Original JAMB-aligned questions</strong><small>Owner-provided source sets can be added separately.</small></div>}</div></section>
        <section className="about-board about-mini tab-section"><div><span className="eyebrow">YOUR QUESTION BANK</span><h2>{questionCount.toLocaleString()} practice records, ready when you are.</h2><p>The PWA keeps the app shell and model bank prepared for resilient practice. New source material appears only after structured validation and provenance labelling.</p></div><button className="button button-dark" onClick={() => setActiveTab("practice")}>Go to practice <ArrowRight size={16} /></button></section>
      </>}
    </div>

    <footer className="site-footer page-shell"><div className="footer-brand"><span className="brand-symbol brand-symbol-small" aria-hidden="true"><i /><i /><i /><i /></span><span>JAMB Quest / Comeback System</span></div><span>Small systems. Big score. Keep returning.</span></footer>
    <nav className="app-tabbar" aria-label="Study sections">{tabItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)} aria-current={activeTab === id ? "page" : undefined}><Icon size={19} /><span>{label}</span></button>)}</nav>
    {auth.isAuthenticated && <ProfilePanel open={profileOpen} displayName={auth.profileName} targetScore={auth.targetScore} totalAnswered={progress.totalAnswered} accuracy={overallAccuracy} onClose={() => setProfileOpen(false)} onSave={auth.onSaveProfile} onLogout={auth.onLogout} saving={auth.savingProfile} />}
  </main>;
}
