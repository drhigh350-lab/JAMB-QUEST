import { useState } from "react";
import Home from "@/pages/Home";

export default function TopicPracticeFixture() {
  const [launchedConfig, setLaunchedConfig] = useState("");
  return <><Home
    loading={false}
    loadError={null}
    progress={{ totalAnswered: 0, totalCorrect: 0, bestScore: 0, lastScore: 0, roundsPlayed: 0, wrongIds: [], subjectBest: {} }}
    canReview={false}
    onRetryLoad={() => undefined}
    onStart={(config) => setLaunchedConfig(JSON.stringify(config))}
    auth={{ loading: false, isAuthenticated: false, profileName: "Fixture Learner", targetScore: 380, onLogout: () => undefined, onSaveProfile: () => undefined, savingProfile: false }}
    questionCount={2420}
    questionCountReady
    questionSources={[]}
    availableTopics={[{ subject: "Biology", topic: "Cell Biology" }, { subject: "Biology", topic: "Ecology" }, { subject: "Chemistry", topic: "Gas Laws and Diffusion" }]}
    examHistory={[]}
    weakTopics={[]}
    bookmarks={[]}
    onUpdateDailyMinimum={() => undefined}
    onEnablePush={() => undefined}
    onDisablePush={() => undefined}
    pushWorking={false}
    pushStatus="idle"
    pwa={{ isOnline: true, canInstall: false, installStatus: "idle", onInstall: () => undefined }}
  /><output data-testid="fixture-launched-config">{launchedConfig}</output></>;
}
