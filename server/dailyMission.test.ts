import { describe, expect, it } from "vitest";
import { isRoundTimed, selectDailyMission, selectProgressNextAction, summariseRoundAnalytics } from "../client/src/game/dailyMission";

describe("daily study mission", () => {
  it("prioritises exact recovery items before a weak-topic mission", () => {
    const recovery = selectDailyMission({ weakTopics: [{ subject: "Biology", topic: "Genetics", misses: 4, accuracy: 33 }], fallbackSubject: "Physics", wrongIds: ["BIO-1", "CHE-2"], recoveryPending: true });
    expect(recovery.config).toMatchObject({ subject: "Full JAMB Mock", mode: "review", count: 2, questionIds: ["BIO-1", "CHE-2"], recoveryOrigin: "missed-questions" });
  });

  it("uses a four-subject diagnostic only when no recovery or weak-topic evidence exists", () => {
    const diagnostic = selectDailyMission({ weakTopics: [], fallbackSubject: "Biology", wrongIds: [], recoveryPending: false });
    expect(diagnostic).toMatchObject({ label: "4-subject diagnostic baseline", config: { subject: "Full JAMB Mock", mode: "sprint", count: 20, timing: "study" } });
  });

  it("assigns a 20-question mission to the weakest available topic and calculates concise round analytics", () => {
    const mission = selectDailyMission({ weakTopics: [{ subject: "Chemistry", topic: "Stoichiometry", misses: 3, accuracy: 40 }], fallbackSubject: "Biology", wrongIds: [], recoveryPending: false });
    expect(mission.config).toMatchObject({ subject: "Chemistry", mode: "sprint", count: 20, topic: "Stoichiometry" });
    expect(summariseRoundAnalytics([{ subject: "Full JAMB Mock", questionCount: 180, correctCount: 144, durationSeconds: 7200, completedAt: new Date() }])).toEqual({ attempted: 180, averageSecondsPerQuestion: 40, estimatedUtmeScore: 320 });
  });

  it("uses a broad core-subject mission when a balanced subject focus is available, leaving narrow topic repair inside Progress", () => {
    const mission = selectDailyMission({ weakTopics: [{ subject: "Use of English", topic: "The Lekki Headmaster · Chapter 10: Passport Pains", misses: 26, accuracy: 74 }, { subject: "Physics", topic: "Reflection", misses: 6, accuracy: 70 }], fallbackSubject: "Biology", wrongIds: [], recoveryPending: false, coreSubjectFocus: { subject: "Physics", attempts: 30, accuracy: 70 } });
    expect(mission.label).toBe("Physics core practice");
    expect(mission.config).toMatchObject({ subject: "Physics", mode: "sprint", count: 20, timing: "study" });
    expect(mission.config.topic).toBeUndefined();
    expect(mission.note).toContain("exact topic repairs stay in Progress");
  });

  it("withholds the UTME score estimate until a full 180-question mock is complete", () => {
    expect(summariseRoundAnalytics([{ subject: "Biology", questionCount: 40, correctCount: 35, durationSeconds: 1200, completedAt: new Date() }]).estimatedUtmeScore).toBeNull();
    expect(summariseRoundAnalytics([{ subject: "Full JAMB Mock", questionCount: 80, correctCount: 62, durationSeconds: 4800, completedAt: new Date() }]).estimatedUtmeScore).toBeNull();
  });

  it("changes the next action for slow-but-accurate versus inaccurate-but-fast work", () => {
    const fallback = "Fix Genetics first with 20 focused questions.";
    expect(selectProgressNextAction({ accuracy: 80, averageSecondsPerQuestion: 100, fallback })).toContain("timed speed drill");
    expect(selectProgressNextAction({ accuracy: 50, averageSecondsPerQuestion: 30, fallback })).toContain("core-subject repair");
  });

  it("keeps Study and recovery rounds untimed while preserving strict CBT timing", () => {
    expect(isRoundTimed({ mode: "sprint", timing: "study" })).toBe(false);
    expect(isRoundTimed({ mode: "review" })).toBe(false);
    expect(isRoundTimed({ mode: "cbt" })).toBe(true);
  });
});
