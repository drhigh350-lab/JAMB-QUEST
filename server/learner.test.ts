import { describe, expect, it } from "vitest";
import { buildLedgerSnapshot, selectFullMockSubjectPerformance, summariseSubjectPerformance } from "./db";

describe("buildLedgerSnapshot", () => {
  it("hydrates valid persisted learner progress into the UI ledger shape", () => {
    const ledger = buildLedgerSnapshot({
      totalAnswered: 24,
      totalCorrect: 18,
      bestScore: 920,
      lastScore: 410,
      roundsPlayed: 3,
      wrongQuestionIds: JSON.stringify(["BIO-001", "PHY-022"]),
      subjectBestScores: JSON.stringify({ Biology: 920, Physics: 410 }),
    });

    expect(ledger).toEqual({
      totalAnswered: 24,
      totalCorrect: 18,
      bestScore: 920,
      lastScore: 410,
      roundsPlayed: 3,
      wrongIds: ["BIO-001", "PHY-022"],
      subjectBest: { Biology: 920, Physics: 410 },
    });
  });

  it("falls back safely when legacy stored JSON is malformed", () => {
    const ledger = buildLedgerSnapshot({
      totalAnswered: -3,
      totalCorrect: -1,
      bestScore: -2,
      lastScore: -9,
      roundsPlayed: -1,
      wrongQuestionIds: "not-json",
      subjectBestScores: "[]",
    });

    expect(ledger).toEqual({
      totalAnswered: 0,
      totalCorrect: 0,
      bestScore: 0,
      lastScore: 0,
      roundsPlayed: 0,
      wrongIds: [],
      subjectBest: {},
    });
  });
});

describe("summariseSubjectPerformance", () => {
  it("uses persisted answer reviews to calculate per-subject accuracy without creating evidence for untouched subjects", () => {
    expect(summariseSubjectPerformance([
      { subject: "Biology", correct: true },
      { subject: "Biology", correct: false },
      { subject: "Biology", correct: true },
      { subject: "Chemistry", correct: false },
      { subject: null, correct: true },
    ])).toEqual([
      { subject: "Biology", attempts: 3, accuracy: 67 },
      { subject: "Chemistry", attempts: 1, accuracy: 0 },
    ]);
  });
});

describe("selectFullMockSubjectPerformance", () => {
  it("returns contribution evidence only from the newest completed 180-question full mock", () => {
    expect(selectFullMockSubjectPerformance([
      { subject: "Full JAMB Mock", questionCount: 40, answerReviewJson: JSON.stringify([{ subject: "Biology", topic: "Ecology", correct: true }]) },
      { subject: "Full JAMB Mock", questionCount: 180, answerReviewJson: JSON.stringify([{ subject: "Biology", topic: "Ecology", correct: true }, { subject: "Biology", topic: "Ecology", correct: false }, { subject: "Physics", topic: "Forces", correct: true }]) },
    ])).toEqual([{ subject: "Biology", attempts: 2, accuracy: 50 }, { subject: "Physics", attempts: 1, accuracy: 100 }]);
    expect(selectFullMockSubjectPerformance([{ subject: "Biology", questionCount: 40, answerReviewJson: null }])).toEqual([]);
  });
});
