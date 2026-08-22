import { useEffect } from "react";
import type { BankQuestion } from "@/game/types";
import Home from "@/pages/Home";

const questions: BankQuestion[] = ["Use of English", "Biology", "Chemistry", "Physics"].flatMap((subject) => Array.from({ length: 6 }, (_, index) => ({ id: `arcade-launch-${subject}-${index + 1}`, subject: subject as BankQuestion["subject"], topic: `${subject} fixture territory`, subtopic: "Fixture", difficulty: "medium", question_type: "multiple_choice", question: `Approved-style arcade fixture question ${index + 1}: choose the correct option.`, options: ["Option A", "Option B", "Option C", "Option D"], answer_index: 0, answer_text: "Option A", explanation: "This controlled fixture verifies the arcade uses available question cards and opens a safe correction-capable mode.", tags: [], source: "fixture" })));

export function GameArcadeLaunchFixture() {
  const destination = new URLSearchParams(window.location.search).get("destination");
  useEffect(() => {
    const openArcade = window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[data-testid="game-arcade-path"]')?.click());
    const openDestination = window.setTimeout(() => {
      if (destination === "expedition") document.querySelector<HTMLButtonElement>(".expedition-world .button")?.click();
      if (destination === "president") document.querySelector<HTMLButtonElement>(".president-world .button")?.click();
      if (destination === "archive") document.querySelector<HTMLButtonElement>(".archive-world .button")?.click();
    }, 80);
    return () => { window.cancelAnimationFrame(openArcade); window.clearTimeout(openDestination); };
  }, [destination]);
  return <Home
    loading={false} loadError={null} progress={{ totalAnswered: 0, totalCorrect: 0, bestScore: 0, lastScore: 0, roundsPlayed: 0, wrongIds: [], subjectBest: {} }} canReview={false} onRetryLoad={() => undefined} onStart={() => undefined}
    auth={{ loading: false, isAuthenticated: false, profileName: "Fixture Learner", targetScore: 380, onLogout: () => undefined, onSaveProfile: () => undefined, savingProfile: false }} questionCount={questions.length} questionCountReady questionSources={[]} availableTopics={[]} examHistory={[]} weakTopics={[]} bookmarks={[]}
    onUpdateDailyMinimum={() => undefined} onEnablePush={() => undefined} onDisablePush={() => undefined} pushWorking={false} pushStatus="idle" pwa={{ isOnline: true, canInstall: false, installStatus: "idle", onInstall: () => undefined }} activeQuestions={questions}
  />;
}
