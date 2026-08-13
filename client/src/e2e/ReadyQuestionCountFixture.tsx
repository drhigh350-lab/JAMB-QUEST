import { useEffect, useState } from "react";
import Home from "@/pages/Home";

export default function ReadyQuestionCountFixture() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), 250);
    return () => window.clearTimeout(timeout);
  }, []);
  return <Home
    loading={false}
    loadError={null}
    progress={{ totalAnswered: 0, totalCorrect: 0, bestScore: 0, lastScore: 0, roundsPlayed: 0, wrongIds: [], subjectBest: {} }}
    canReview={false}
    onRetryLoad={() => undefined}
    onStart={() => undefined}
    auth={{ loading: false, isAuthenticated: false, profileName: "Learner", targetScore: 380, onLogout: () => undefined, onSaveProfile: () => undefined, savingProfile: false }}
    questionCount={ready ? 1975 : 1000}
    questionCountReady={ready}
    questionSources={[]}
    comeback={{ dailyMinimum: 10, currentStreak: 0, longestStreak: 0, comebackXp: 0, level: 1, recoveryPending: false, consistencyScore: 0, today: { dateKey: "today", questionsAnswered: 0, correctCount: 0, completedMinimum: false, xpEarned: 0 }, activity: [], badges: [] }}
    reminder={{ enabled: false, reminderTime: "19:00", pushEnabled: false }}
    examHistory={[]}
    weakTopics={[]}
    onUpdateDailyMinimum={() => undefined}
    onEnablePush={() => undefined}
    onDisablePush={() => undefined}
    pushWorking={false}
    pushStatus="idle"
    pwa={{ isOnline: true, canInstall: false, installStatus: "idle", onInstall: () => undefined }}
  />;
}
