import type { RoundConfig, RoundSubject, Subject } from "./types";

export type WeakTopicInput = { topic: string; subject?: string | null; misses: number; accuracy: number };
export type RoundAnalyticsInput = { subject: string; questionCount: number; correctCount: number; durationSeconds: number; completedAt: Date };
export type CoreSubjectFocus = { subject: Subject; attempts: number; accuracy: number };

const studySubjects: Subject[] = ["Use of English", "Biology", "Chemistry", "Physics"];
const isSubject = (value: string | null | undefined): value is Subject => studySubjects.includes(value as Subject);

export function isRoundTimed(config: Pick<RoundConfig, "mode" | "timing"> | null | undefined) {
  return config?.mode === "cbt" || config?.timing === "timed";
}

export function selectDailyMission({ weakTopics, fallbackSubject, wrongIds, recoveryPending, coreSubjectFocus = null }: { weakTopics: WeakTopicInput[]; fallbackSubject: Subject; wrongIds: string[]; recoveryPending: boolean; coreSubjectFocus?: CoreSubjectFocus | null }) {
  if (recoveryPending && wrongIds.length) {
    const questionIds = wrongIds.slice(0, 20);
    return { label: "Repair recent mistakes", note: `Revisit ${questionIds.length} question${questionIds.length === 1 ? "" : "s"} you previously missed before starting new material.`, config: { subject: "Full JAMB Mock" as RoundSubject, mode: "review" as const, count: questionIds.length, questionIds, recoveryOrigin: "missed-questions" } satisfies RoundConfig };
  }
  if (coreSubjectFocus) {
    return { label: `${coreSubjectFocus.subject} core practice`, note: `${coreSubjectFocus.accuracy}% accuracy across ${coreSubjectFocus.attempts} recorded ${coreSubjectFocus.attempts === 1 ? "question" : "questions"}. Strengthen the subject with a balanced 20-question core round; exact topic repairs stay in Progress.`, config: { subject: coreSubjectFocus.subject, mode: "sprint" as const, count: 20, timing: "study" } satisfies RoundConfig };
  }
  const weakness = weakTopics.find((topic) => isSubject(topic.subject));
  if (weakness && isSubject(weakness.subject)) {
    return { label: `${weakness.subject}: ${weakness.topic}`, note: `${weakness.accuracy}% accuracy from ${weakness.misses} recorded miss${weakness.misses === 1 ? "" : "es"}. Fix this first with 20 focused questions.`, config: { subject: weakness.subject, mode: "sprint" as const, count: 20, timing: "study", topic: weakness.topic } satisfies RoundConfig };
  }
  return { label: "4-subject diagnostic baseline", note: "Start with 20 questions—five each from English, Biology, Chemistry, and Physics. Your next mission will target the weakest evidence.", config: { subject: "Full JAMB Mock" as RoundSubject, mode: "sprint" as const, count: 20, timing: "study" } satisfies RoundConfig };
}

export function summariseRoundAnalytics(rounds: RoundAnalyticsInput[]) {
  const attempted = rounds.reduce((total, round) => total + round.questionCount, 0);
  const duration = rounds.reduce((total, round) => total + Math.max(0, round.durationSeconds), 0);
  const averageSecondsPerQuestion = attempted ? Math.round(duration / attempted) : null;
  const latestFullMock = rounds.find((round) => round.subject === "Full JAMB Mock" && round.questionCount === 180) ?? null;
  const estimatedUtmeScore = latestFullMock ? Math.round((latestFullMock.correctCount / 180) * 400) : null;
  return { attempted, averageSecondsPerQuestion, estimatedUtmeScore };
}

export function selectProgressNextAction({ accuracy, averageSecondsPerQuestion, fallback }: { accuracy: number; averageSecondsPerQuestion: number | null; fallback: string }) {
  if (!accuracy || averageSecondsPerQuestion === null) return fallback;
  if (accuracy < 70) {
    return `Accuracy is ${accuracy}%. Even at ${averageSecondsPerQuestion}s per question, complete today's core-subject repair before taking on more material; quick answers only help when they are correct.`;
  }
  if (averageSecondsPerQuestion > 75) {
    return `Accuracy is ${accuracy}%, but pace is ${averageSecondsPerQuestion}s per question—above the 75-second CBT rhythm. Use today's 20-question mission as a timed speed drill while protecting accuracy.`;
  }
  return fallback;
}
