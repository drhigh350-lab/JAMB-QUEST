import { useState } from "react";
import Home from "@/pages/Home";

const now = new Date("2026-08-13T19:00:00.000Z");

export default function ProgressAnalyticsFixture() {
  const [launchedConfig, setLaunchedConfig] = useState<string>("");
  return <><Home
    loading={false}
    loadError={null}
    progress={{ totalAnswered: 80, totalCorrect: 55, bestScore: 3200, lastScore: 2800, roundsPlayed: 3, wrongIds: ["BIO-001"], subjectBest: { Biology: 3200, Chemistry: 2700, Physics: 2500, "Use of English": 3000 } }}
    canReview
    onRetryLoad={() => undefined}
    onStart={(config) => setLaunchedConfig(JSON.stringify(config))}
    auth={{ loading: false, isAuthenticated: true, profileName: "Fixture Learner", targetScore: 380, onLogout: () => undefined, onSaveProfile: () => undefined, savingProfile: false }}
    questionCount={1975}
    questionCountReady
    questionSources={[]}
    comeback={{ dailyMinimum: 10, currentStreak: 3, longestStreak: 5, comebackXp: 450, level: 3, recoveryPending: false, consistencyScore: 64, today: { dateKey: "2026-08-13", questionsAnswered: 20, correctCount: 14, completedMinimum: true, xpEarned: 210 }, activity: [], badges: ["first-step"] }}
    reminder={{ enabled: false, reminderTime: "19:00", pushEnabled: false }}
    examHistory={[
      { id: 1, subject: "Full JAMB Mock", mode: "cbt", questionCount: 40, correctCount: 28, score: 2800, durationSeconds: 2100, flaggedCount: 4, completedAt: now },
      { id: 3, subject: "Full JAMB Mock", mode: "cbt", questionCount: 40, correctCount: 23, score: 2300, durationSeconds: 2250, flaggedCount: 6, completedAt: new Date("2026-08-11T19:00:00.000Z") },
      { id: 2, subject: "Biology", mode: "sprint", questionCount: 20, correctCount: 15, score: 1500, durationSeconds: 760, flaggedCount: 0, completedAt: new Date("2026-08-12T19:00:00.000Z") },
    ]}
    weakTopics={[{ topic: "Genetics", subject: "Biology", misses: 4, attempts: 6, accuracy: 33 }, { topic: "Stoichiometry", subject: "Chemistry", misses: 3, attempts: 5, accuracy: 40 }]}
    bookmarks={[{ questionId: "BIO-001", subject: "Biology", topic: "Genetics", createdAt: now }, { questionId: "CHE-010", subject: "Chemistry", topic: "Stoichiometry", createdAt: new Date("2026-08-12T19:00:00.000Z") }]}
    comparison={{ latest: { id: 1, accuracy: 70, durationSeconds: 2100, flaggedCount: 4, completedAt: now }, previous: { id: 3, accuracy: 58, durationSeconds: 2250, flaggedCount: 6, completedAt: new Date("2026-08-11T19:00:00.000Z") }, accuracyChange: 12, recommendation: "Run a focused 20-question drill on Genetics; it is your clearest recovery opportunity." }}
    onUpdateDailyMinimum={() => undefined}
    onEnablePush={() => undefined}
    onDisablePush={() => undefined}
    pushWorking={false}
    pushStatus="idle"
    pwa={{ isOnline: true, canInstall: false, installStatus: "idle", onInstall: () => undefined }}
  /><output data-testid="fixture-launched-config">{launchedConfig}</output></>;
}
