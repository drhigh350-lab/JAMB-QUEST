/* JAMB Quest: compact study desk. The daily action remains visible; supporting tools live in focused, tappable groups. */

import React, { useEffect, useState } from "react";
import { startLogin } from "@/const";
import { ArrowRight, Atom, Award, BellOff, BellRing, BookmarkCheck, BookOpen, CalendarCheck2, CheckCircle2, CircleHelp, CircleUserRound, Clock3, Download, Flame, FlaskConical, Leaf, ListChecks, LogIn, Map as MapIcon, Medal, RotateCcw, Send, Share2, ShieldCheck, Sparkles, Target, Trophy, Wifi, WifiOff, Zap } from "lucide-react";
import { ProfilePanel } from "@/components/ProfilePanel";
import { OwnerQuestionReview } from "@/components/OwnerQuestionReview";
import { DailyMissionPanel } from "@/components/DailyMissionPanel";
import { ProgressSignals } from "@/components/ProgressSignals";
import { selectDailyMission, selectProgressNextAction, summariseRoundAnalytics, type CoreSubjectFocus } from "@/game/dailyMission";
import { STANDARD_FULL_CBT_SECONDS, type RoundConfig, type RoundSubject, type StoredProgress, type Subject } from "@/game/types";
import { OFFICIAL_SYLLABUS_AREAS } from "@shared/syllabusTopicMap";
import { getSyllabusParentGroups } from "@shared/syllabusTopicGroups";
import { summariseAchievements } from "@/game/achievements";
import { downloadDailyGoalAchievement, shareDailyGoalAchievement } from "@/game/dailyGoalAchievement";
import { downloadAchievementShareCard, shareAchievementShareCard } from "@/game/achievementShareCard";
import { OfflineStudyPackPanel, type PwaControls } from "@/components/OfflineStudyPackPanel";
import { QuestRush } from "@/components/QuestRush";
import { GameArcade, type ArcadeMode } from "@/components/GameArcade";
import { PresidentsDesk } from "@/components/PresidentsDesk";
import { GreatArchive } from "@/components/GreatArchive";
import "@/components/study-expedition-entry.css";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

function formatCbtTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secondsPart = safeSeconds % 60;
  return hours ? `${hours}h ${minutes.toString().padStart(2, "0")}m` : `${minutes}m ${secondsPart.toString().padStart(2, "0")}s`;
}
type ComebackState = {
  dailyMinimum: number; dailyGoalCount?: number; dailyGoalSubject?: string | null; dailyGoalTopic?: string | null; currentStreak: number; longestStreak: number; comebackXp: number; level: number; recoveryPending: boolean; consistencyScore: number;
  today: { dateKey: string; questionsAnswered: number; correctCount: number; completedMinimum: boolean; xpEarned: number };
  activity: Array<{ dateKey: string; questionsAnswered: number; correctCount: number; completedMinimum: boolean; recoveryAction: boolean; xpEarned: number }>;
  badges: string[];
};
type ReminderState = { enabled: boolean; reminderTime: string; pushEnabled: boolean; providerEnabled?: boolean; providerQueue?: { scheduledCount: number; nextScheduledAt: Date | null; horizonDays: number } };

interface HomeProps {
  loading: boolean; loadError: string | null; progress: StoredProgress; canReview: boolean; onRetryLoad: () => void; onStart: (config: RoundConfig) => void; questionCount: number; questionCountReady: boolean;
  initialTab?: AppTab; onActiveTabChange?: (tab: AppTab) => void;
  questionSources?: Array<{ id: number; label: string; sourceType: "model" | "authorised"; permissionNote: string | null }>;
  auth: { loading: boolean; isAuthenticated: boolean; profileName: string; targetScore: number; onLogout: () => void; onSaveProfile: (displayName: string, targetScore: number) => void; savingProfile: boolean };
  examHistory: Array<{ id: number; subject: string; mode: string; questionCount: number; correctCount: number; score: number; durationSeconds: number; flaggedCount: number; missedQuestionIds: string[]; completedAt: Date }>;
  onOpenExamLog?: (roundId: number) => void; examReviewOpening?: boolean; examReviewError?: string | null;
  weakTopics: Array<{ topic: string; subject?: string | null; misses: number; attempts: number; accuracy: number }>;
  topicConfidence?: Array<{ topic: string; subject?: string | null; attempts: number; accuracy: number; confidence: "Building" | "Strong" | "Repair" }>;
  subjectPerformance?: Array<{ subject: string; attempts: number; accuracy: number }>;
  fullMockSubjectPerformance?: Array<{ subject: string; attempts: number; accuracy: number }>;
  coreSubjectFocus?: { subject: string; attempts: number; accuracy: number } | null;
  availableTopics?: Array<{ subject: Subject; topic: string }>;
  bookmarks?: Array<{ questionId: string; subject: string; topic: string; createdAt: Date }>;
  questionReports?: Array<{ id: number; questionId: string; subject: string; topic: string; reason: string; status: "open" | "reviewing" | "resolved" | "dismissed"; createdAt: Date; statusUpdatedAt: Date }>;
  isOwner?: boolean;
  ownerQuestionReports?: Array<{ id: number; questionId: string; subject: string; topic: string; reason: string; note: string | null; status: "open" | "reviewing" | "resolved" | "dismissed"; createdAt: Date; statusUpdatedAt: Date }>;
  onOwnerReportStatus?: (reportId: number, status: "open" | "reviewing" | "resolved" | "dismissed") => void;
  ownerReportUpdatingId?: number | null;
  activeQuestions?: import("@/game/types").BankQuestion[];
  comparison?: { latest: { id: number; accuracy: number; durationSeconds: number; flaggedCount: number; completedAt: Date } | null; previous: { id: number; accuracy: number; durationSeconds: number; flaggedCount: number; completedAt: Date } | null; accuracyChange: number | null; recommendation: string };
  comeback?: ComebackState; reminder?: ReminderState; achievementStats?: { activeDays: number; completedGoalDays: number; cbtRounds: number; fullMocks: number; recordedStudyMinutes: number; subjectsPractised: string[] }; onUpdateDailyMinimum: (dailyMinimum: number) => void; onUpdateDailyGoal?: (dailyGoalCount: number, dailyGoalSubject: Subject | null, dailyGoalTopic: string | null) => void; onEnablePush: () => void; onDisablePush: () => void; onTestPush?: () => void; pushWorking: boolean; pushStatus: "idle" | "unsupported" | "denied" | "enabling" | "enabled" | "disabled" | "failed" | "test-sent" | "test-failed";
  pwa: PwaControls;
  resumableCbt?: { config: RoundConfig; currentIndex: number; questionIds: string[]; answers: Record<string, { selectedIndex: number | null; correct: boolean; timedOut: boolean }>; secondsLeft: number } | null; onResumeCbt?: () => void; onDiscardResumableCbt?: () => void;
}

function guestComeback() {
  return { dailyMinimum: 10, dailyGoalCount: 10, dailyGoalSubject: null, dailyGoalTopic: null, currentStreak: 0, longestStreak: 0, comebackXp: 0, level: 1, recoveryPending: false, consistencyScore: 0, today: { dateKey: "today", questionsAnswered: 0, correctCount: 0, completedMinimum: false, xpEarned: 0 }, activity: [], badges: [] } satisfies ComebackState;
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

function AccuracyLineChart({ rounds }: { rounds: HomeProps["examHistory"] }) {
  const chartRounds = rounds.slice(0, 12).reverse();
  if (!chartRounds.length) return <div className="performance-empty">Complete a CBT attempt to plot your first accuracy line.</div>;
  const width = 640;
  const height = 190;
  const padding = { top: 18, right: 18, bottom: 34, left: 34 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const points = chartRounds.map((round, index) => {
    const accuracy = round.questionCount ? Math.round((round.correctCount / round.questionCount) * 100) : 0;
    return { accuracy, x: padding.left + (chartRounds.length === 1 ? innerWidth / 2 : (index / (chartRounds.length - 1)) * innerWidth), y: padding.top + ((100 - accuracy) / 100) * innerHeight, label: new Date(round.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  return <div className="performance-chart" aria-label="Accuracy over time line graph"><div className="performance-chart-head"><span>ACCURACY OVER TIME</span><strong>{points[points.length - 1]?.accuracy ?? 0}% latest</strong></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Accuracy over time"><line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} className="chart-axis-line" /><line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} className="chart-axis-line" />{[0, 50, 100].map((value) => { const y = padding.top + ((100 - value) / 100) * innerHeight; return <g key={value}><line x1={padding.left} y1={y} x2={width - padding.right} y2={y} className="chart-grid-line" /><text x={padding.left - 8} y={y + 3} textAnchor="end" className="chart-axis-label">{value}%</text></g>; })}<polyline points={polyline} className="chart-line" fill="none" />{points.map((point) => <g key={`${point.label}-${point.x}`}><circle cx={point.x} cy={point.y} r="5" className="chart-point" /><text x={point.x} y={height - 10} textAnchor="middle" className="chart-axis-label">{point.label}</text><title>{`${point.label}: ${point.accuracy}% accuracy`}</title></g>)}</svg></div>;
}

function SubjectAccuracyChart({ performance }: { performance: Array<{ subject: string; attempts: number; accuracy: number }> }) {
  const visible = subjects.map((subject) => ({ label: subject.short, accuracy: performance.find((item) => item.subject === subject.name)?.accuracy ?? 0, attempts: performance.find((item) => item.subject === subject.name)?.attempts ?? 0 }));
  if (!visible.some((item) => item.attempts > 0)) return <div className="performance-empty">Subject lines appear after you complete practice in each subject.</div>;
  return <div className="subject-chart" aria-label="Subject accuracy comparison"><div className="performance-chart-head"><span>SUBJECT ACCURACY</span><strong>real attempts only</strong></div><div className="subject-chart-grid">{visible.map((item) => <div className="subject-chart-row" key={item.label}><b>{item.label}</b><div className="subject-chart-track"><span style={{ width: `${Math.max(2, item.accuracy)}%` }} /></div><strong>{item.attempts ? `${item.accuracy}%` : "—"}</strong></div>)}</div></div>;
}

export default function Home({ initialTab = "practice", onActiveTabChange, loading, loadError, progress, canReview, onRetryLoad, onStart, auth, questionCount, questionCountReady, comeback, reminder, achievementStats, examHistory, onOpenExamLog = () => undefined, examReviewOpening = false, examReviewError = null, weakTopics, topicConfidence = [], subjectPerformance = [], fullMockSubjectPerformance = [], coreSubjectFocus = null, availableTopics = [], bookmarks = [], questionReports = [], isOwner = false, ownerQuestionReports = [], onOwnerReportStatus = () => undefined, ownerReportUpdatingId = null, activeQuestions = [], comparison, onUpdateDailyMinimum, onUpdateDailyGoal = () => undefined, onEnablePush, onDisablePush, onTestPush = () => undefined, pushWorking, pushStatus, pwa, resumableCbt = null, onResumeCbt = () => undefined, onDiscardResumableCbt = () => undefined }: HomeProps) {
  const [activeTab, setActiveTab] = useState<AppTab>(initialTab);
  useEffect(() => { onActiveTabChange?.(activeTab); }, [activeTab, onActiveTabChange]);
  const [selectedSubject, setSelectedSubject] = useState<Subject>("Biology");
  const [selectedPalette, setSelectedPalette] = useState<StudyPalette>("Biology");
  const [mode, setMode] = useState<"sprint" | "cbt" | "review">("sprint");
  const [count, setCount] = useState(10);
  const [topicDrillCount, setTopicDrillCount] = useState(20);
  const [lekkiCount, setLekkiCount] = useState(20);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedLekkiChapter, setSelectedLekkiChapter] = useState("");
  const [entranceReady, setEntranceReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [typedEntrance, setTypedEntrance] = useState("");
  const [includeLekkiInEnglish, setIncludeLekkiInEnglish] = useState(false);
  const [fullMockSetupOpen, setFullMockSetupOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("profile") === "open");
  const [customGoalInput, setCustomGoalInput] = useState("");
  const [customGoalError, setCustomGoalError] = useState("");
  const [achievementDownloaded, setAchievementDownloaded] = useState(false);
  const [arcadeMode, setArcadeMode] = useState<ArcadeMode | null>(null);
  const [gameArcadeOpen, setGameArcadeOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("jamb-quest-onboarding-v1") === "done");
  const selected = subjects.find((subject) => subject.name === selectedSubject)!;
  const selectableTopics = availableTopics.filter((item) => item.subject === selectedSubject && !item.topic.startsWith("The Lekki Headmaster")).map((item) => item.topic);
  const officialTopics = OFFICIAL_SYLLABUS_AREAS[selectedSubject];
  const syllabusParentGroups = getSyllabusParentGroups(selectedSubject);
  const topicQuestionCounts = selectableTopics.reduce<Record<string, number>>((counts, topic) => ({ ...counts, [topic]: (counts[topic] ?? 0) + 1 }), {});
  const hasLekkiPractice = availableTopics.some((item) => item.subject === "Use of English" && item.topic.startsWith("The Lekki Headmaster"));
  const isLekkiPalette = selectedPalette === "Lekki";
  const lekkiChapters = availableTopics.filter((item) => item.subject === "Use of English" && item.topic.startsWith("The Lekki Headmaster · Chapter")).map((item) => item.topic).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const selectedState = { ...guestComeback(), ...(comeback ?? {}), today: { ...guestComeback().today, ...(comeback?.today ?? {}) }, dailyGoalCount: comeback?.dailyGoalCount ?? comeback?.dailyMinimum ?? 10, dailyGoalSubject: comeback?.dailyGoalSubject ?? null, dailyGoalTopic: comeback?.dailyGoalTopic ?? null };
  const wrongIds = progress.wrongIds ?? [];
  const balancedCoreFocus: CoreSubjectFocus | null = coreSubjectFocus && subjects.some((subject) => subject.name === coreSubjectFocus.subject) ? { ...coreSubjectFocus, subject: coreSubjectFocus.subject as Subject } : null;
  const coreWeakTopics = weakTopics.filter((topic) => !topic.topic.startsWith("The Lekki Headmaster"));
  const optionalNovelWeakTopics = weakTopics.filter((topic) => topic.topic.startsWith("The Lekki Headmaster"));
  const confidenceByTopic = new Map(topicConfidence.map((item) => [`${item.subject ?? ""}\u0000${item.topic}`, item]));
  const confidenceRank = { Repair: 0, Building: 1, "Not started": 2, Strong: 3 } as const;
  const confidencePreview = subjects.flatMap((subject) => availableTopics.filter((item) => item.subject === subject.name && !item.topic.startsWith("The Lekki Headmaster")).map((item) => confidenceByTopic.get(`${item.subject}\u0000${item.topic}`) ?? { ...item, attempts: 0, accuracy: 0, confidence: "Not started" as const }).sort((left, right) => confidenceRank[left.confidence] - confidenceRank[right.confidence] || left.topic.localeCompare(right.topic)).slice(0, 2));
  const visibleQuestionCount = questionCountReady ? questionCount : null;
  const visibleQuestionLabel = visibleQuestionCount === null ? "Preparing your JAMB Quest system" : `${visibleQuestionCount.toLocaleString()} practice questions`;
  const dailyMission = selectDailyMission({ weakTopics: coreWeakTopics, fallbackSubject: selectedSubject, wrongIds, recoveryPending: selectedState.recoveryPending, coreSubjectFocus: balancedCoreFocus });
  const roundAnalytics = summariseRoundAnalytics(examHistory);
  const overallAccuracy = progress.totalAnswered ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100) : 0;
  const progressNextAction = selectProgressNextAction({ accuracy: overallAccuracy, averageSecondsPerQuestion: roundAnalytics.averageSecondsPerQuestion, fallback: dailyMission.note });
  const dailyPercent = Math.min(100, Math.round((selectedState.today.questionsAnswered / selectedState.dailyGoalCount) * 100));
  const targetLabel = auth.isAuthenticated ? `${auth.targetScore}` : "your score target";
  const showOnboarding = auth.isAuthenticated && progress.roundsPlayed === 0 && !onboardingDismissed;
  const dismissOnboarding = () => { window.localStorage.setItem("jamb-quest-onboarding-v1", "done"); setOnboardingDismissed(true); };
  const cbtHistory = examHistory.filter((round) => round.mode === "cbt").slice(0, 12);
  const dailyGoalTopicLabel = selectedState.dailyGoalSubject && selectedState.dailyGoalTopic ? `${selectedState.dailyGoalSubject} · ${selectedState.dailyGoalTopic}` : "Any subject";
  const achievementSummary = summariseAchievements({ totalAnswered: progress.totalAnswered, totalCorrect: progress.totalCorrect, roundsPlayed: progress.roundsPlayed, longestStreak: selectedState.longestStreak, comebackXp: selectedState.comebackXp, activeDays: achievementStats?.activeDays ?? selectedState.activity.length, completedGoalDays: achievementStats?.completedGoalDays ?? selectedState.activity.filter((activity) => activity.completedMinimum).length, cbtRounds: achievementStats?.cbtRounds ?? 0, fullMocks: achievementStats?.fullMocks ?? 0, subjectsPractised: achievementStats?.subjectsPractised ?? [], subjectPerformance });
  const heatmapEnd = /^\d{4}-\d{2}-\d{2}$/.test(selectedState.today.dateKey) ? selectedState.today.dateKey : new Date().toISOString().slice(0, 10);
  const activityByDate = new Map(selectedState.activity.map((activity) => [activity.dateKey, activity]));
  const heatmapDays = Array.from({ length: 28 }, (_, index) => {
    const date = new Date(`${heatmapEnd}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - (27 - index));
    const dateKey = date.toISOString().slice(0, 10);
    const activity = activityByDate.get(dateKey);
    const level = !activity ? 0 : activity.questionsAnswered >= selectedState.dailyGoalCount ? 4 : activity.questionsAnswered >= Math.max(20, selectedState.dailyGoalCount * .7) ? 3 : activity.questionsAnswered >= 10 ? 2 : 1;
    return { dateKey, activity, level };
  });
  const liveMessages = [
    selectedState.today.completedMinimum ? "Today’s study goal is complete. Protect the streak with one more deliberate round." : `${selectedState.dailyGoalCount - Math.min(selectedState.dailyGoalCount, selectedState.today.questionsAnswered)} questions remain in today’s system.`,
    balancedCoreFocus ? `Live focus: strengthen ${balancedCoreFocus.subject} with a balanced core round.` : "Live focus: finish your diagnostic to reveal the first subject signal.",
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
    unsupported: "This browser cannot receive push reminders. Your in-app daily system still works.", denied: "Browser notifications were declined. You can enable them later in your browser settings.", failed: "The reminder could not be set up on this device. Please try again later.", enabled: "JAMB Quest browser reminders are enabled on this device. The Lagos daily timetable is active.", disabled: "Browser reminders are off for this device. Your in-app system stays active.", "test-sent": "Test reminder sent. Check this device’s notification shade now.", "test-failed": "No reminder reached this device. Re-enable notifications and try the test again.",
  };
  const start = () => onStart({ subject: selectedSubject, mode, count, ...(mode === "sprint" ? { timing: "study" as const } : {}), ...(selectedSubject === "Use of English" ? { includeLekki: includeLekkiInEnglish } : {}) });
  const applyCustomGoal = () => {
    const value = Number(customGoalInput);
    if (!Number.isInteger(value) || value < 5 || value > 500) { setCustomGoalError("Choose a whole number from 5 to 500."); return; }
    onUpdateDailyGoal(value, selectedState.dailyGoalSubject && subjects.some((item) => item.name === selectedState.dailyGoalSubject) ? selectedState.dailyGoalSubject as Subject : null, selectedState.dailyGoalTopic ?? null);
    setCustomGoalError("");
    setCustomGoalInput("");
  };
  const startFullMock = () => setFullMockSetupOpen(true);
  const confirmFullMock = () => {
    onStart({ subject: "Full JAMB Mock", mode: "cbt", count: 180, durationSeconds: STANDARD_FULL_CBT_SECONDS });
    setFullMockSetupOpen(false);
  };
  const isStudySubject = (subject: string): subject is Subject => subjects.some((item) => item.name === subject);
  const startSubjectRepair = (focus: CoreSubjectFocus) => onStart({ subject: focus.subject, mode: "sprint", count: 20, timing: "study" });
  const startTopicDrill = (topic: { subject?: string | null; topic: string }) => { if (topic.subject && isStudySubject(topic.subject)) onStart({ subject: topic.subject, mode: "sprint", count: 20, timing: "study", topic: topic.topic }); };
  const startSelectedTopicDrill = () => {
    if (selectedTopic) {
      onStart({ subject: selectedSubject, mode: "sprint", count: topicDrillCount, timing: "study", topic: selectedTopic });
      return;
    }
  };
  const startParentGroupDrill = (topics: readonly string[]) => {
    if (topics.length) onStart({ subject: selectedSubject, mode: "sprint", count: topicDrillCount, timing: "study", topics: [...topics] });
  };
  const startLekkiRandom = () => onStart({ subject: "Use of English", mode: "sprint", count: lekkiCount, timing: "study", topic: "The Lekki Headmaster" });
  const startLekkiChapter = () => { if (selectedLekkiChapter) onStart({ subject: "Use of English", mode: "sprint", count: lekkiCount, timing: "study", topic: selectedLekkiChapter }); };
  const openBookmark = (bookmark: { questionId: string; subject: string; topic: string }) => { if (isStudySubject(bookmark.subject)) onStart({ subject: bookmark.subject, mode: "sprint", count: 1, timing: "study", questionIds: [bookmark.questionId], recoveryOrigin: "saved-question" }); };
  const openMissedQuestions = (questionIds: string[], subject: string) => { if (questionIds.length) { const roundSubject: RoundSubject = subject === "Full JAMB Mock" || isStudySubject(subject) ? subject : "Full JAMB Mock"; onStart({ subject: roundSubject, mode: "review", count: questionIds.length, questionIds, recoveryOrigin: "missed-questions" }); } };
  const revisionSteps = [
    balancedCoreFocus ? { key: "core-subject", label: `Strengthen ${balancedCoreFocus.subject}`, note: `${balancedCoreFocus.accuracy}% across ${balancedCoreFocus.attempts} recorded questions. Use a broad 20-question core round; exact topic repairs stay below.`, action: () => startSubjectRepair(balancedCoreFocus) } : null,
    bookmarks[0] ? { key: "saved", label: "Revisit a saved question", note: `${bookmarks.length} saved revision ${bookmarks.length === 1 ? "item is" : "items are"} ready for deliberate review.`, action: () => openBookmark(bookmarks[0]) } : null,
    comparison?.latest ? { key: "cbt", label: "Confirm with another CBT", note: "After the recovery action, use a timed CBT paper to measure the change under exam conditions.", action: startFullMock } : { key: "baseline", label: "Create your CBT baseline", note: "Open the standard two-hour CBT to give your study plan real evidence.", action: () => setActiveTab("practice") },
  ].filter((step): step is { key: string; label: string; note: string; action: () => void } => step !== null);
  const finalDayActions = [
    ...(wrongIds.length ? [{ key: "misses", label: `Review ${wrongIds.length} missed question${wrongIds.length === 1 ? "" : "s"}`, note: "Revisit your real mistakes first—do not spend final-day energy on random new sets.", action: () => openMissedQuestions(wrongIds, "Full JAMB Mock") }] : []),
    ...weakTopics.slice(0, 3).map((topic) => ({ key: `weakness-${topic.subject}-${topic.topic}`, label: `Repair ${topic.topic}`, note: `${topic.subject ?? "Focused"} · ${topic.accuracy}% accuracy. Use a short, untimed repair drill.`, action: () => startTopicDrill(topic) })),
    ...bookmarks.slice(0, 3).map((bookmark) => ({ key: `saved-${bookmark.questionId}`, label: `Revisit ${bookmark.topic}`, note: `${bookmark.subject} · saved for your own confidence check.`, action: () => openBookmark(bookmark) })),
  ];
  const desktopDesk = typeof window !== "undefined" && window.matchMedia("(min-width: 1100px)").matches;

  if (arcadeMode === "expedition") return <QuestRush questions={activeQuestions} defaultSubject={selectedSubject} onExit={() => setArcadeMode(null)} onOpenCorrection={(subject, questionIds) => {
    setArcadeMode(null);
    onStart({ subject, mode: "review", count: questionIds.length, questionIds, recoveryOrigin: "missed-questions" });
  }} />;
  if (arcadeMode === "president") return <PresidentsDesk questions={activeQuestions} onExit={() => setArcadeMode(null)} onOpenCorrection={(subject, questionIds) => { setArcadeMode(null); onStart({ subject, mode: "review", count: questionIds.length, questionIds, recoveryOrigin: "missed-questions" }); }} />;
  if (arcadeMode === "archive") return <GreatArchive questions={activeQuestions} onExit={() => setArcadeMode(null)} onOpenCorrection={(subject, questionIds) => { setArcadeMode(null); onStart({ subject, mode: "review", count: questionIds.length, questionIds, recoveryOrigin: "missed-questions" }); }} />;
  if (gameArcadeOpen) return <GameArcade onExit={() => setGameArcadeOpen(false)} onSelect={(mode) => { setGameArcadeOpen(false); setArcadeMode(mode); }} />;

  return <main className={`home-page tabbed-home compact-home ${entranceReady ? "entrance-ready" : ""}`}>
    <Dialog open={fullMockSetupOpen} onOpenChange={setFullMockSetupOpen}>
      <DialogContent className="jamb-cbt-setup-dialog">
        <DialogHeader>
          <span className="eyebrow">STANDARD CBT / READY CHECK</span>
          <DialogTitle>Confirm your JAMB simulation</DialogTitle>
          <DialogDescription>This creates a full 180-question CBT session. Your timer, answers, flags, and current question will be saved if you pause or leave accidentally.</DialogDescription>
        </DialogHeader>
        <div className="cbt-setup-grid">
          <div><b>60</b><span>Use of English</span></div><div><b>40</b><span>Biology</span></div><div><b>40</b><span>Chemistry</span></div><div><b>40</b><span>Physics</span></div>
        </div>
        <div className="cbt-ready-list" aria-label="CBT readiness checklist">
          <span><Clock3 size={15} /> 2-hour countdown</span><span><ListChecks size={15} /> Question palette and flags</span><span><Target size={15} /> JAMB calculator available in CBT</span><span><CheckCircle2 size={15} /> Answers, flags, and position save as you go</span><span><ShieldCheck size={15} /> Accidental exit asks before ending your CBT</span>
        </div>
        <DialogFooter><button className="button button-outline" onClick={() => setFullMockSetupOpen(false)}>Not yet</button><button className="button button-dark" onClick={confirmFullMock}>Start 2-hour CBT <ArrowRight size={16} /></button></DialogFooter>
      </DialogContent>
    </Dialog>
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
        {showOnboarding && <section className="compact-action-grid tab-section onboarding-rail" aria-labelledby="onboarding-title"><CompactPanel eyebrow="FIRST WEEK / 04 STEPS" title="Set up your JAMB Quest system" note="A short guided start. Nothing here replaces your real progress evidence." defaultOpen tone="maize"><div className="compact-system-status"><div><strong>01</strong><span>Set your name and target score</span></div><button className="text-button" onClick={() => setActiveTab("profile")}>Open profile <ArrowRight size={13} /></button></div><div className="compact-system-status"><div><strong>02</strong><span>Take one 10-question study round to create your first evidence</span></div><button className="text-button" onClick={() => onStart({ subject: selectedSubject, mode: "sprint", count: 10, timing: "study" })}>Start now <ArrowRight size={13} /></button></div><div className="compact-system-status"><div><strong>03</strong><span>Enable direct browser reminders only if they help your routine</span></div><button className="text-button" onClick={() => setActiveTab("profile")}>Open reminders <ArrowRight size={13} /></button></div><div className="compact-system-status"><div><strong>04</strong><span>After real rounds, Progress will show your actual strengths, misses, speed, and next repair</span></div><button className="text-button" onClick={() => setActiveTab("progress")}>See progress desk <ArrowRight size={13} /></button></div><button className="text-button" onClick={dismissOnboarding}>I know my way around</button></CompactPanel></section>}
        <section className="compact-action-grid tab-section entrance-item entrance-tools" aria-label="Practice tools">
          <CompactPanel eyebrow="01 / TODAY" title="Today’s JAMB practice" note={`${selectedState.today.questionsAnswered} of ${selectedState.dailyGoalCount} questions${selectedState.dailyGoalTopic ? ` · ${dailyGoalTopicLabel}` : " today"}`} defaultOpen tone="ink">
            <div className="compact-system-status"><div><strong>{selectedState.today.questionsAnswered}<small> / {selectedState.dailyGoalCount}</small></strong><span><CheckCircle2 size={14} /> {selectedState.today.completedMinimum ? "daily goal complete" : `${selectedState.dailyGoalCount - Math.min(selectedState.dailyGoalCount, selectedState.today.questionsAnswered)} questions to go`}</span></div><div className="compact-system-metrics"><span><b>{selectedState.level}</b> level</span><span><b>{selectedState.comebackXp}</b> XP</span><span><b>{selectedState.currentStreak}</b> streak</span></div></div>
            <div className="system-meter"><i style={{ width: `${dailyPercent}%` }} /></div>
            {selectedState.today.completedMinimum && <section className="daily-completion-summary" data-testid="daily-completion-summary" aria-label="Today's completed study summary"><div className="daily-completion-medal"><Medal size={22} aria-hidden="true" /><span><b>GOAL COMPLETE</b><small>Earned from today’s recorded study evidence.</small></span></div><b>{selectedState.today.correctCount}/{selectedState.today.questionsAnswered} correct · {selectedState.today.questionsAnswered ? Math.round((selectedState.today.correctCount / selectedState.today.questionsAnswered) * 100) : 0}% accuracy</b><small>{progressNextAction}</small><div className="daily-completion-actions"><button className="text-button" onClick={() => onStart(dailyMission.config)}>Start next repair <ArrowRight size={13} /></button><button className="text-button daily-achievement-download" onClick={() => { downloadDailyGoalAchievement({ learnerName: auth.isAuthenticated ? auth.profileName : "JAMB Quest learner", dateKey: selectedState.today.dateKey, goalCount: selectedState.dailyGoalCount, questionsAnswered: selectedState.today.questionsAnswered, correctCount: selectedState.today.correctCount, streak: selectedState.currentStreak }); setAchievementDownloaded(true); }}><Download size={13} /> {achievementDownloaded ? "Achievement downloaded" : "Download achievement"}</button><button className="text-button" onClick={() => { void shareDailyGoalAchievement({ learnerName: auth.isAuthenticated ? auth.profileName : "JAMB Quest learner", dateKey: selectedState.today.dateKey, goalCount: selectedState.dailyGoalCount, questionsAnswered: selectedState.today.questionsAnswered, correctCount: selectedState.today.correctCount, streak: selectedState.currentStreak }); }}><Share2 size={13} /> Share card</button></div></section>}
            {auth.isAuthenticated && <div className="compact-minimum"><span>Questions today</span>{[5, 10, 20, 40, 60, 100].map((value) => <button key={value} className={selectedState.dailyGoalCount === value ? "active" : ""} onClick={() => onUpdateDailyGoal(value, selectedState.dailyGoalSubject && subjects.some((item) => item.name === selectedState.dailyGoalSubject) ? selectedState.dailyGoalSubject as Subject : null, selectedState.dailyGoalTopic ?? null)}>{value}</button>)}</div>}
            <div className="compact-goal-setter" data-testid="goal-setter">
              <span><Target size={14} /> Today’s study goal <b>{selectedState.dailyGoalCount} questions</b></span>
              {auth.isAuthenticated ? <div className="daily-goal-controls"><label className="compact-custom-goal"><span>Choose any amount</span><input aria-label="Custom daily question goal" inputMode="numeric" type="number" min="5" max="500" step="1" placeholder="e.g. 100" value={customGoalInput} onChange={(event) => setCustomGoalInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") applyCustomGoal(); }} /><button type="button" onClick={applyCustomGoal}>Save</button></label><label className="compact-topic-select"><span>Optional topic</span><select value={selectedState.dailyGoalTopic ? `${selectedState.dailyGoalSubject}||${selectedState.dailyGoalTopic}` : ""} onChange={(event) => { const [subject, ...topicParts] = event.target.value.split("||"); onUpdateDailyGoal(selectedState.dailyGoalCount ?? 10, subject ? subject as Subject : null, topicParts.length ? topicParts.join("||") : null); }}><option value="">Any subject</option>{availableTopics.filter((item) => !item.topic.startsWith("The Lekki Headmaster")).map((item) => <option key={`${item.subject}||${item.topic}`} value={`${item.subject}||${item.topic}`}>{item.subject} · {item.topic}</option>)}</select></label>{customGoalError && <small className="compact-goal-error" role="alert">{customGoalError}</small>}</div> : <button className="text-button" onClick={startLogin}>Sign in to save today’s goal <ArrowRight size={13} /></button>}
            </div>
            <button className="compact-final-day-link" onClick={() => setActiveTab("progress")}><CalendarCheck2 size={14} /> Day before JAMB? Open your final-day review <ArrowRight size={13} /></button>
          </CompactPanel>

          <CompactPanel eyebrow="02 / PRACTICE" title="Choose your practice path" note={isLekkiPalette ? "Lekki novel · choose 10, 20, 40, or 50 questions" : "Single Subject for focused repair, or Standard CBT for a full two-hour simulation"} defaultOpen tone="paper">
            <div className="practice-route-grid" aria-label="Practice paths">
              <button data-testid="single-subject-path" className="practice-route active" onClick={() => { if (isLekkiPalette) { setSelectedPalette("Biology"); setSelectedSubject("Biology"); } setMode("sprint"); }}><BookOpen size={18} /><span><b>Single Subject</b><small>Study or timed CBT by subject</small></span><ArrowRight size={15} /></button>
              <button data-testid="standard-cbt-path" className="practice-route standard" onClick={startFullMock} disabled={loading || !!loadError}><Trophy size={18} /><span><b>Standard CBT</b><small>180 questions · 2 hours</small></span><ArrowRight size={15} /></button>
            </div>
            {isLekkiPalette ? <div className="compact-lekki-desk"><div className="compact-lekki-heading"><span>THE LEKKI HEADMASTER</span><small>650 keyed questions across 13 chapters</small></div><div className="compact-count-row"><span>Question count</span><div>{[10, 20, 40, 50].map((value) => <button data-testid={`lekki-count-${value}`} key={value} className={lekkiCount === value ? "active" : ""} onClick={() => setLekkiCount(value)}>{value}</button>)}</div></div><div className="compact-lekki-actions"><button data-testid="lekki-random-start" className="button button-dark" onClick={startLekkiRandom} disabled={loading || !!loadError}><Sparkles size={15} /> Random {lekkiCount} <ArrowRight size={15} /></button><label className="compact-topic-select"><span>Chapter selection</span><select value={selectedLekkiChapter} onChange={(event) => setSelectedLekkiChapter(event.target.value)}><option value="">Choose a chapter</option>{lekkiChapters.map((topic) => <option key={topic} value={topic}>{topic.replace("The Lekki Headmaster · ", "")}</option>)}</select></label><button data-testid="lekki-chapter-start" className="button button-outline" onClick={startLekkiChapter} disabled={!selectedLekkiChapter || loading || !!loadError}>Start {lekkiCount} in chapter <ArrowRight size={15} /></button></div></div> : <><div className="compact-subject-grid">{subjects.map((subject) => { const Icon = subject.icon; const active = selectedPalette === subject.name; return <button key={subject.name} className={`compact-subject ${subject.tint} ${active ? "active" : ""}`} onClick={() => { setSelectedPalette(subject.name); setSelectedSubject(subject.name); setSelectedTopic(""); }}><Icon size={17} /><span><b>{subject.short}</b><small>{subject.name}</small></span></button>; })}{hasLekkiPractice && <button data-testid="lekki-palette" className={`compact-subject subject-lekki ${isLekkiPalette ? "active" : ""}`} onClick={() => { setSelectedPalette("Lekki"); setMode("sprint"); setSelectedTopic(""); }}><BookOpen size={17} /><span><b>LEK</b><small>Lekki novel</small></span></button>}</div>{selectedSubject === "Use of English" && hasLekkiPractice && <section className="english-lekki-choice" aria-labelledby="english-lekki-title"><div><span id="english-lekki-title">Add The Lekki Headmaster?</span><small>Choose the English pool for this round. Dedicated novel practice remains available above.</small></div><div className="english-lekki-options"><button className={!includeLekkiInEnglish ? "active" : ""} onClick={() => setIncludeLekkiInEnglish(false)}>Core English only</button><button className={includeLekkiInEnglish ? "active" : ""} onClick={() => setIncludeLekkiInEnglish(true)}>Add Lekki novel</button></div></section>}<div className="compact-mode-tabs"><button className={mode === "sprint" ? "active" : ""} onClick={() => setMode("sprint")}><Zap size={15} /> Study</button><button className={mode === "cbt" ? "active" : ""} onClick={() => setMode("cbt")}><Clock3 size={15} /> CBT</button><button className={`${mode === "review" ? "active" : ""} ${!canReview ? "disabled" : ""}`} onClick={() => canReview && setMode("review")}><ListChecks size={15} /> Review</button></div><div className="compact-count-row"><span>Question count</span><div>{(mode === "cbt" ? [20, 40, 80] : [10, 20, 40]).map((value) => <button key={value} className={count === value ? "active" : ""} onClick={() => setCount(value)}>{value}</button>)}</div></div>{resumableCbt && <div className="compact-resume compact-resume-detailed"><div><span>CBT safely saved</span><b>{resumableCbt.config.subject === "Full JAMB Mock" ? "Full JAMB · 60 ENG / 40 BIO / 40 CHE / 40 PHY" : `${resumableCbt.config.subject} CBT`}</b><small>{Object.keys(resumableCbt.answers).length} of {resumableCbt.questionIds.length} answered · {formatCbtTime(resumableCbt.secondsLeft)} left · last saved at question {resumableCbt.currentIndex + 1}</small></div><div><button className="text-button" onClick={onResumeCbt}>Resume <ArrowRight size={13} /></button><button className="text-button" onClick={onDiscardResumableCbt}>Discard</button></div></div>}<button className="button button-dark compact-start" onClick={start} disabled={loading || !!loadError || (mode === "review" && !canReview)}>{mode === "review" ? "Open recovery set" : mode === "sprint" ? `Start ${selected.short} study` : `Start ${selected.short} CBT`} <ArrowRight size={17} /></button></>}
          </CompactPanel>

          <CompactPanel eyebrow="03 / TOPIC" title="Study by official JAMB syllabus area" note="Launch a broad syllabus section or choose one exact official area; unavailable areas stay visible until questions are loaded" defaultOpen={desktopDesk} tone="maize">
            <div className="compact-topic-groups official-topic-grid" role="list" aria-label={`${selected.name} official JAMB syllabus parent sections`}>{syllabusParentGroups.map((group) => { const readyCount = group.topics.reduce((sum, topic) => sum + (topicQuestionCounts[topic] ?? 0), 0); return <details className="syllabus-parent-group" key={group.label} open={group.topics.some((topic) => selectedTopic === topic)}><summary><span><b>{group.label}</b><small>{readyCount ? `${readyCount} questions ready` : "not loaded yet"}</small></span><ArrowRight size={15} /></summary><div className="syllabus-child-topics">{group.topics.map((topic) => { const countForTopic = topicQuestionCounts[topic] ?? 0; return <button role="listitem" key={topic} className={selectedTopic === topic ? "active" : ""} disabled={!countForTopic} onClick={() => setSelectedTopic(topic)}><b>{topic}</b><small>{countForTopic ? `${countForTopic} questions ready` : "not loaded yet"}</small><ArrowRight size={13} /></button>; })}</div><button data-testid={`parent-drill-${group.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`} className="parent-section-drill" onClick={() => startParentGroupDrill(group.topics)} disabled={!readyCount || loading || !!loadError}>Study all {group.label} <ArrowRight size={13} /></button></details>; })}</div>
            <label className="compact-topic-select"><span>Selected detailed area</span><select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}><option value="">Choose a detailed official syllabus area</option>{syllabusParentGroups.flatMap((group) => group.topics).map((topic) => <option key={topic} value={topic} disabled={!topicQuestionCounts[topic]}>{topic}{topicQuestionCounts[topic] ? ` (${topicQuestionCounts[topic]})` : " — not loaded yet"}</option>)}</select></label><div className="compact-count-row"><span>Drill size</span><div>{[10, 20, 40, 50].map((value) => <button data-testid={`topic-drill-count-${value}`} key={value} className={topicDrillCount === value ? "active" : ""} onClick={() => setTopicDrillCount(value)}>{value}</button>)}</div></div>
            <button className="button button-dark compact-start" onClick={startSelectedTopicDrill} disabled={!selectedTopic || !topicQuestionCounts[selectedTopic] || loading || !!loadError}>Start {topicDrillCount}-question drill <ArrowRight size={16} /></button>
          </CompactPanel>
        </section>
        <section className="study-expedition-destination tab-section" data-testid="study-expedition-destination" aria-labelledby="study-expedition-destination-title">
          <div className="study-expedition-destination-map" aria-hidden="true"><i /><i /><i /><i /><span>MAP</span></div>
          <div className="study-expedition-destination-copy"><span className="eyebrow">OPTIONAL GAME DESK / JAMB QUEST ARCADE</span><h2 id="study-expedition-destination-title">When you need a different way to practise.</h2><p>Choose Study Expedition, President’s Desk, or The Great Archive. Each world uses approved question cards, meaningful progression, and repair cards—without changing your normal Practice or CBT history.</p><div><span><ShieldCheck size={15} /> No timer</span><span><MapIcon size={15} /> Three game worlds</span><span><BookOpen size={15} /> Repair cards</span></div></div>
          <button data-testid="game-arcade-path" className="button button-dark study-expedition-destination-action" onClick={() => setGameArcadeOpen(true)} disabled={loading || !!loadError || activeQuestions.length < 5}><MapIcon size={17} /> Enter Game Arcade <ArrowRight size={17} /></button>
        </section>
      </>}

      {activeTab === "progress" && <>
        <section className="compact-progress-grid tab-section" aria-label="Progress tools">
          <CompactPanel eyebrow="01 / NEXT MOVE" title={balancedCoreFocus ? `Strengthen ${balancedCoreFocus.subject}` : "Create your first evidence"} note={progressNextAction} defaultOpen tone="maize">
            <ProgressSignals estimatedUtmeScore={roundAnalytics.estimatedUtmeScore} targetScore={auth.targetScore} averageSecondsPerQuestion={roundAnalytics.averageSecondsPerQuestion} accuracy={overallAccuracy} nextAction={progressNextAction} fullMockSubjectPerformance={fullMockSubjectPerformance} />
            <div className="compact-target-line"><span>YOUR TARGET</span><strong>{targetLabel}</strong><small>{auth.isAuthenticated ? "Your target is saved in Profile." : "Sign in to save and track your personal target."}</small></div>
            <div className="compact-subject-signals">{subjects.map((subject) => { const signal = subjectPerformance.find((item) => item.subject === subject.name); const weakTopic = coreWeakTopics.find((topic) => topic.subject === subject.name); return <article data-testid={`subject-signal-${subject.short}`} key={subject.name}><span>{subject.short}</span><strong>{signal ? `${signal.accuracy}%` : "—"}</strong><small>{weakTopic ? weakTopic.topic : "no core topic yet"}</small>{weakTopic && <button className="text-button" onClick={() => startTopicDrill(weakTopic)}>Fix in 20 <ArrowRight size={12} /></button>}</article>; })}</div><section className="topic-confidence-desk" aria-label="Topic confidence from real attempts"><div><span>TOPIC CONFIDENCE</span><small>Only your recorded attempts decide these labels.</small></div>{confidencePreview.length ? <div className="topic-confidence-list">{confidencePreview.map((item) => <article key={`${item.subject}-${item.topic}`}><span><b>{item.topic}</b><small>{item.subject} · {item.attempts ? `${item.accuracy}% across ${item.attempts}` : "no attempt yet"}</small></span><em className={`confidence-${item.confidence.toLowerCase().replace(/\s+/g, "-")}`}>{item.confidence}</em></article>)}</div> : <p className="compact-empty">Practice a loaded topic to create its first confidence signal.</p>}</section><SubjectAccuracyChart performance={subjectPerformance} /><AccuracyLineChart rounds={cbtHistory} />
            <ol className="compact-revision-steps">{revisionSteps.map((step, index) => <li key={step.key}><span>{index + 1}</span><div><b>{step.label}</b><small>{step.note}</small></div><button className="text-button" onClick={step.action}>Start <ArrowRight size={12} /></button></li>)}</ol>
          </CompactPanel>

          <CompactPanel eyebrow="02 / EXAM LOG" title="Open a saved CBT correction" note={`${cbtHistory.length} recent CBT attempt${cbtHistory.length === 1 ? "" : "s"} · scroll the log here, then reopen any one for full corrections`} tone="paper">
            <section className="compact-activity"><div><span>28-day study heatmap</span><strong>{selectedState.consistencyScore}% steady</strong></div><div className="study-heatmap" aria-label="28-day study heatmap">{heatmapDays.map((day) => <span key={day.dateKey} className={`heatmap-cell level-${day.level} ${day.activity?.recoveryAction ? "recovery" : ""}`} title={`${day.dateKey}: ${day.activity?.questionsAnswered ?? 0} questions`} />)}</div><small className="heatmap-legend">Less <i className="level-1" /> <i className="level-2" /> <i className="level-3" /> <i className="level-4" /> More</small></section>
            {cbtHistory.length ? <><AccuracyLineChart rounds={cbtHistory} /><div className="compact-log-list">{cbtHistory.map((round) => { const accuracy = round.questionCount ? Math.round((round.correctCount / round.questionCount) * 100) : 0; const misses = round.missedQuestionIds.length; return <article key={round.id}><span><b>{round.subject}</b><small>{new Date(round.completedAt).toLocaleString()} · {round.correctCount}/{round.questionCount} correct · {misses} {misses === 1 ? "miss" : "misses"} · {round.flaggedCount} {round.flaggedCount === 1 ? "flag" : "flags"} · {Math.max(0, Math.round(round.durationSeconds / 60))} min</small></span><strong aria-label={`${accuracy}% accuracy`}>{accuracy}%</strong><button className="text-button" onClick={() => onOpenExamLog(round.id)} disabled={examReviewOpening}>{examReviewOpening ? "Opening…" : "Open full correction"}</button></article>; })}</div>{examReviewError && <p className="compact-goal-error" role="alert">{examReviewError}</p>}</> : <p className="compact-empty">Complete a timed CBT mock to create an exam log you can reopen question-by-question.</p>}
            <div className="compact-comparison"><b>{comparison?.latest ? "Latest CBT comparison" : "Create your CBT benchmark"}</b><p>{comparison?.recommendation ?? "A full CBT mock gives the app the evidence needed for a personal comparison."}</p></div>
          </CompactPanel>

          <CompactPanel eyebrow="03 / WEEKLY REVISION" title="Use your revision shelf once this week" note={`${wrongIds.length} missed · ${bookmarks.length} saved · Final-day review stays separate`} tone="ink">
            {wrongIds.length > 0 && <button className="compact-missed-button" onClick={() => openMissedQuestions(wrongIds, "Full JAMB Mock")}>Open all {wrongIds.length} missed <ArrowRight size={14} /></button>}
            <div className="compact-weak-list">{coreWeakTopics.length ? coreWeakTopics.slice(0, 4).map((topic) => <article key={`${topic.subject}-${topic.topic}`}><span><b>{topic.topic}</b><small>{topic.subject} · {topic.accuracy}% accuracy</small></span><button className="text-button" onClick={() => startTopicDrill(topic)} disabled={!topic.subject}>Fix in 20 <ArrowRight size={12} /></button></article>) : <p className="compact-empty">Complete a core-subject round to turn real misses into focused repairs.</p>}</div>
            {optionalNovelWeakTopics.length > 0 && <details className="optional-novel-recovery"><summary>Optional Lekki recovery <span>{optionalNovelWeakTopics.length} chapter{optionalNovelWeakTopics.length === 1 ? "" : "s"}</span></summary>{optionalNovelWeakTopics.slice(0, 3).map((topic) => <article key={`${topic.subject}-${topic.topic}`}><span><b>{topic.topic.replace("The Lekki Headmaster · ", "")}</b><small>Use of English novel · {topic.accuracy}% accuracy</small></span><button className="text-button" onClick={() => startTopicDrill(topic)}>Fix in 20 <ArrowRight size={12} /></button></article>)}</details>}
            <div className="compact-saved-list">{bookmarks.length ? bookmarks.slice(0, 5).map((bookmark) => <article key={bookmark.questionId}><span><b>{bookmark.topic}</b><small>{bookmark.subject}</small></span><button className="text-button" onClick={() => openBookmark(bookmark)}>Open <ArrowRight size={12} /></button></article>) : <p className="compact-empty">Save any useful question to keep it on your revision shelf.</p>}</div>
            <div className="compact-badges"><span>{achievementSummary.earned.length} / 50 achievements</span>{achievementSummary.earned.slice(0, 6).map((badge) => <i className="unlocked" key={badge.key} title={badge.label}><Award size={15} /></i>)}{achievementSummary.next && <b>Next: {achievementSummary.next.label}</b>}</div>
          </CompactPanel>
          <CompactPanel eyebrow="04 / FINAL DAY" title="Your final-day review" note="Review evidence, protect confidence, and avoid random cramming" tone="maize">
            {finalDayActions.length ? <><ol className="final-day-actions">{finalDayActions.map((action, index) => <li key={action.key}><span>{index + 1}</span><div><b>{action.label}</b><small>{action.note}</small></div><button className="text-button" onClick={action.action}>Open <ArrowRight size={12} /></button></li>)}</ol><button className="button button-dark final-day-mock" onClick={startFullMock} disabled={loading || !!loadError}><Trophy size={15} /> Start 2-hour CBT <ArrowRight size={15} /></button></> : <div className="final-day-empty"><b>Build your review shelf first.</b><small>Finish one focused practice set, then your real misses, weak topic, and saved questions will appear here.</small><button className="button button-outline" onClick={() => setActiveTab("practice")}>Start a focused set <ArrowRight size={14} /></button></div>}
          </CompactPanel>
        </section>
      </>}

      {activeTab === "profile" && <>
        <section className="profile-summary tab-section"><div className="profile-monogram">{auth.profileName.slice(0, 1).toUpperCase()}</div><div><span className="eyebrow">YOUR STUDY PROFILE</span><h2>{auth.isAuthenticated ? auth.profileName : "Save your progress."}</h2><p>{auth.isAuthenticated ? `Your target is ${auth.targetScore}. Your systems and marks are stored with your sign-in.` : "You can practise as a guest. Sign in when you are ready to keep your progress across devices."}</p></div><div className="profile-summary-actions">{auth.isAuthenticated ? <button className="button button-dark" onClick={() => setProfileOpen(true)}>Edit profile <ArrowRight size={16} /></button> : <button className="button button-dark" onClick={startLogin}><LogIn size={16} /> Save my marks</button>}</div></section>
        <section className="mandate-section tab-section" data-testid="mandate-section" aria-labelledby="mandate-title">
          <div className="mandate-heading"><div className="mandate-seal" aria-hidden="true"><Target size={21} /></div><div><span className="eyebrow">OPERATION 380 / YOUR PROTOCOL</span><h2 id="mandate-title">The 380 Mandate</h2><p>Three rules for turning every study round into evidence, correction, and forward motion.</p></div></div>
          <div className="mandate-pledges">
            <article className="mandate-pledge mandate-error"><span>01</span><div><h3>The Error Audit Pledge</h3><p>I do not close a quiz or simulation until every wrong answer, educated guess, and distractor option has been reviewed, understood, and recorded in my correction loop.</p></div></article>
            <article className="mandate-pledge mandate-resilience"><span>02</span><div><h3>The “Never Miss Twice” Rule</h3><p>Slips happen, but momentum is built on resilience. If I miss a study block or fall below target, I make an immediate tactical adjustment and never allow two low-execution days in a row.</p></div></article>
            <article className="mandate-pledge mandate-correction"><span>03</span><div><h3>The 100% Correction Mandate</h3><p>A simulation without deep corrections is incomplete. I treat every daily round as a learning laboratory, not a scoreboard, until every mistake is conquered.</p></div></article>
          </div>
          <div className="mandate-benchmarks" aria-label="380 Mandate benchmarks"><div><span>TOPIC QUIZZES</span><strong>≥ 90%</strong><small>accuracy target</small></div><div><span>DAILY SIMULATION</span><strong>350 → 380</strong><small>scaling evidence</small></div><div><span>EXAM DAY</span><strong>{auth.targetScore}</strong><small>personal target</small></div></div>
        </section>
        {auth.isAuthenticated && <section className="report-receipts tab-section" aria-labelledby="report-receipts-title"><div><span className="eyebrow">QUALITY LOOP / PRIVATE</span><h2 id="report-receipts-title">Your question reports</h2><p>Only you and the JAMB Quest owner can see these receipts. A report never changes a live question automatically.</p></div>{questionReports.length ? <div className="report-receipt-list">{questionReports.map((report) => <article key={report.id}><span><b>{report.subject} · {report.topic}</b><small>{report.reason.replace(/_/g, " ")} · updated {new Date(report.statusUpdatedAt).toLocaleDateString()}</small></span><em className={`report-status-${report.status}`}>{report.status}</em></article>)}</div> : <p className="compact-empty">No private reports yet. Use Report on any question card when something needs review.</p>}</section>}
        {isOwner && <><OwnerQuestionReview isOwner={isOwner} activeQuestions={activeQuestions} /><details className="owner-report-desk tab-section"><summary><span><b>OWNER REVIEW QUEUE</b><small>{ownerQuestionReports.length} confidential reports</small></span><ArrowRight size={16} /></summary><div className="owner-report-list">{ownerQuestionReports.length ? ownerQuestionReports.map((report) => <article key={report.id}><div><b>{report.subject} · {report.topic}</b><small>{report.questionId} · {report.reason.replace(/_/g, " ")}</small>{report.note && <p>{report.note}</p>}</div><label><span>Status</span><select value={report.status} disabled={ownerReportUpdatingId === report.id} onChange={(event) => onOwnerReportStatus(report.id, event.target.value as typeof report.status)}><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></label></article>) : <p className="compact-empty">No learner reports are awaiting review.</p>}</div></details></>}
        <section className="notification-section tab-section"><div className="notification-copy"><BellRing size={24} /><div><h2>Three daily JAMB reminders</h2><p>JAMB Quest sends browser reminders directly to this device. Enable once, approve the browser prompt, then run a test before relying on the nudges. Your unfinished daily system can prompt you at 7:00 am, 1:00 pm, and 7:00 pm Lagos time; each window is sent at most once.</p>{reminder?.enabled && reminder?.pushEnabled && <p className="provider-queue-status"><CalendarCheck2 size={14} /> Direct browser push is ready on this device. Your managed Lagos schedule runs three times daily.</p>}{pushFeedbackMessages[pushStatus] && <p className="push-feedback" role="status">{pushFeedbackMessages[pushStatus]}</p>}</div></div><div className="notification-actions">{auth.isAuthenticated ? reminder?.enabled && reminder?.pushEnabled ? <><span className="notification-status"><CalendarCheck2 size={15} /> Direct browser reminders ready</span><button className="button button-outline" onClick={onTestPush} disabled={pushWorking}><Send size={15} /> {pushWorking ? "Testing" : "Send test"}</button><button className="button button-push" onClick={onDisablePush} disabled={pushWorking}><BellOff size={15} /> Turn off</button></> : <button className="button button-push" onClick={onEnablePush} disabled={pushWorking}><BellRing size={15} /> {pushWorking ? "Setting up" : "Enable on this device"}</button> : <button className="button button-push" onClick={startLogin}><LogIn size={15} /> Save reminders with profile</button>}</div></section>
        <OfflineStudyPackPanel pwa={pwa} />
        <details className="achievement-gallery tab-section"><summary><span><Award size={19} /> Achievements</span><strong>{achievementSummary.earned.length} / 50 earned</strong><small>{achievementSummary.next ? `Next: ${achievementSummary.next.label}` : "All achievement marks earned"}</small><ArrowRight size={16} /></summary><div className="achievement-category-key"><span>Practice</span><span>Consistency</span><span>Mastery</span><span>Exam</span></div><div className="achievement-grid">{achievementSummary.badges.map((badge) => <article className={`${badge.earned ? "earned" : "locked"} achievement-${badge.category}`} key={badge.key}><Award size={16} /><div><b>{badge.label}</b><small>{badge.note}</small>{badge.earned ? <span className="achievement-share-actions"><button className="text-button" onClick={() => downloadAchievementShareCard({ ...badge, learnerName: auth.isAuthenticated ? auth.profileName : "JAMB Quest learner", evidenceValue: badge.value, earnedOn: "Recorded in JAMB Quest" })}><Download size={12} /> Card</button><button className="text-button" onClick={() => { void shareAchievementShareCard({ ...badge, learnerName: auth.isAuthenticated ? auth.profileName : "JAMB Quest learner", evidenceValue: badge.value, earnedOn: "Recorded in JAMB Quest" }); }}><Share2 size={12} /> Share</button></span> : <em>{Math.min(badge.value, badge.target)} / {badge.target}</em>}</div></article>)}</div></details>
      </>}

      {activeTab === "about" && <>
        <section className="about-board tab-section"><div><span className="eyebrow">THE JAMB QUEST METHOD</span><h2>Goals point.<br />Systems carry.</h2><p>Wanting a strong JAMB score is useful, but it is not the differentiator. Winners and losers can share the same goal; the daily system—what you practise, correct, and repeat—creates different outcomes.</p></div><div className="about-principles"><div><b>01</b><span>Make today’s practice obvious</span></div><div><b>02</b><span>Make the next repair easy to start</span></div><div><b>03</b><span>Make correction part of every round</span></div></div></section>
        <section className="source-strip tab-section"><div><span className="eyebrow">A SYSTEM, NOT A WISH</span><h2><ShieldCheck size={20} /> Small actions, repeated.</h2><p>JAMB Quest turns preparation into a repeatable loop: choose the next useful round, answer under the right conditions, study the correction, identify the weakness, and return with a better move. That is how consistency compounds.</p></div><div className="source-list"><div className="source-chip source-model"><span>READY TO PRACTISE</span><strong>{visibleQuestionCount === null ? "Preparing JAMB Quest" : `${visibleQuestionCount.toLocaleString()} JAMB Quest questions`}</strong><small>One clean format for deliberate practice, correction, and targeted improvement.</small></div></div></section>
        <section className="about-board about-mini tab-section"><div><span className="eyebrow">THE DAILY COMPOUND</span><h2>Build the system.<br />Let the score follow.</h2><p>Start small enough to begin, make the next study action clear, and never leave a mistake unexamined. Your daily evidence—not motivation alone—shows what to practise next.</p></div><button className="button button-dark" onClick={() => setActiveTab("practice")}>Build today’s system <ArrowRight size={16} /></button></section>
        <section className="study-standards tab-section" aria-labelledby="study-standards-title"><div><span className="eyebrow">WHAT STAYS TRUE</span><h2 id="study-standards-title">Quality before quantity.</h2><p>The bank grows only when a question is clear, keyed safely, explained compactly, and placed under an exact official syllabus area. Strong preparation is not package hunting; it is deliberate practice with material you can trust.</p></div><div className="study-standards-grid"><article><b>Practice before motivation</b><small>Start the useful round, then let evidence create momentum.</small></article><article><b>Recover without punishment</b><small>A missed day becomes the next clear action, not a broken system.</small></article><article><b>One clean question bank</b><small>Every active question is presented for answer, correction, and the next repair.</small></article></div></section>
      </>}
    </div>
    <footer className="site-footer page-shell"><div className="footer-brand"><span className="brand-symbol brand-symbol-small" aria-hidden="true"><i /><i /><i /><i /></span><span>JAMB Quest / Your study system</span></div><span>Build toward your goal with a system.</span></footer>
    <nav className="app-tabbar" aria-label="Study sections">{tabItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)} aria-current={activeTab === id ? "page" : undefined}><Icon size={19} /><span>{label}</span></button>)}</nav>
    {auth.isAuthenticated && <ProfilePanel open={profileOpen} displayName={auth.profileName} targetScore={auth.targetScore} totalAnswered={progress.totalAnswered} accuracy={overallAccuracy} onClose={() => setProfileOpen(false)} onSave={auth.onSaveProfile} onLogout={auth.onLogout} saving={auth.savingProfile} />}
  </main>;
}
