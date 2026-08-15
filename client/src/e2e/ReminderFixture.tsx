import { useState } from "react";
import Home from "@/pages/Home";

export default function ReminderFixture() {
  const [pushStatus, setPushStatus] = useState<"idle" | "test-sent">("idle");
  return <Home
    loading={false}
    loadError={null}
    progress={{ totalAnswered: 0, totalCorrect: 0, bestScore: 0, lastScore: 0, roundsPlayed: 0, wrongIds: [], subjectBest: {} }}
    canReview={false}
    onRetryLoad={() => undefined}
    onStart={() => undefined}
    auth={{ loading: false, isAuthenticated: true, profileName: "Fixture Learner", targetScore: 380, onLogout: () => undefined, onSaveProfile: () => undefined, savingProfile: false }}
    questionCount={2068}
    questionCountReady
    examHistory={[]}
    weakTopics={[]}
    bookmarks={[]}
    reminder={{ enabled: true, reminderTime: "19:00", pushEnabled: true }}
    onUpdateDailyMinimum={() => undefined}
    onEnablePush={() => undefined}
    onDisablePush={() => undefined}
    onTestPush={() => setPushStatus("test-sent")}
    pushWorking={false}
    pushStatus={pushStatus}
    pwa={{ isOnline: true, canInstall: false, installStatus: "idle", onInstall: () => undefined }}
  />;
}
