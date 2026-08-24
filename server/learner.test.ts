import { describe, expect, it } from "vitest";
import { buildLedgerSnapshot, countGoalQuestions, parseAnswerReview, selectCoreSubjectFocus, selectFullMockSubjectPerformance, summariseSubjectPerformance, summariseTopicConfidenceFromRounds, summariseWeakTopicsFromRounds } from "./db";
import { selectDailyMission } from "../client/src/game/dailyMission";

describe("daily study goals", () => {
  it("counts all completed questions when no topic is selected", () => {
    expect(countGoalQuestions([{ subject: "Biology", topic: "Genetics" }], 20, null, null)).toBe(20);
  });

  it("counts only matching answer-review records for a topic goal", () => {
    expect(countGoalQuestions([
      { subject: "Biology", topic: "Genetics" },
      { subject: "Biology", topic: "Ecology" },
      { subject: "Biology", topic: "Genetics" },
      { subject: "Physics", topic: "Motion" },
    ], 4, "Biology", "Genetics")).toBe(2);
  });
});

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

describe("selectCoreSubjectFocus", () => {
  it("selects the lowest-performing core subject rather than the loudest narrow topic", () => {
    const focus = selectCoreSubjectFocus([
      { subject: "Use of English", attempts: 26, accuracy: 75 },
      { subject: "Biology", attempts: 24, accuracy: 84 },
      { subject: "Chemistry", attempts: 20, accuracy: 80 },
      { subject: "Physics", attempts: 30, accuracy: 70 },
    ]);
    expect(focus).toMatchObject({ subject: "Physics", attempts: 30, accuracy: 70 });
  });

  it("changes when new recorded subject evidence makes a different core subject the lowest performer", () => {
    const firstFocus = selectCoreSubjectFocus([
      { subject: "Biology", attempts: 20, accuracy: 78 },
      { subject: "Chemistry", attempts: 20, accuracy: 74 },
      { subject: "Physics", attempts: 20, accuracy: 66 },
    ]);
    const laterFocus = selectCoreSubjectFocus([
      { subject: "Biology", attempts: 20, accuracy: 64 },
      { subject: "Chemistry", attempts: 20, accuracy: 74 },
      { subject: "Physics", attempts: 40, accuracy: 79 },
    ]);
    expect(firstFocus?.subject).toBe("Physics");
    expect(laterFocus?.subject).toBe("Biology");
  });
});

describe("topic confidence ordering", () => {
  it("puts Repair evidence before Building evidence across subjects", () => {
    const confidence = summariseTopicConfidenceFromRounds([{ answerReviewJson: JSON.stringify([
      { subject: "Biology", topic: "Ecology", correct: true },
      { subject: "Biology", topic: "Ecology", correct: false },
      { subject: "Biology", topic: "Ecology", correct: false },
      { subject: "Chemistry", topic: "Atomic structure", correct: true },
      { subject: "Chemistry", topic: "Atomic structure", correct: false },
      { subject: "Physics", topic: "Forces", correct: true },
    ]) }]);
    expect(confidence.map((item) => item.confidence)).toEqual(["Repair", "Building", "Building"]);
    expect(confidence[0]).toMatchObject({ subject: "Biology", topic: "Ecology", accuracy: 33 });
  });
});

describe("diagnostic review loop", () => {
  it("turns persisted diagnostic answer reviews into the next weak-topic mission", () => {
    const weakTopics = summariseWeakTopicsFromRounds([{
      answerReviewJson: JSON.stringify([
        { questionId: "BIO-1", subject: "Biology", topic: "Genetics", correct: false },
        { questionId: "BIO-2", subject: "Biology", topic: "Genetics", correct: false },
        { questionId: "BIO-3", subject: "Biology", topic: "Genetics", correct: false },
        { questionId: "CHE-1", subject: "Chemistry", topic: "Atomic structure", correct: false },
        { questionId: "ENG-1", subject: "Use of English", topic: "Lexis", correct: true },
      ]),
    }]);
    expect(weakTopics[0]).toMatchObject({ subject: "Biology", topic: "Genetics", misses: 3, accuracy: 0 });
    expect(selectDailyMission({ weakTopics, fallbackSubject: "Physics", wrongIds: [], recoveryPending: false }).config).toMatchObject({ subject: "Biology", topic: "Genetics", count: 20, timing: "study" });
  });

  it("replaces internal mapping text in persisted review data with the actual question-derived topic before it reaches a daily mission", () => {
    const weakTopics = summariseWeakTopicsFromRounds([{
      answerReviewJson: JSON.stringify([{ questionId: "authorised-60074", subject: "Chemistry", topic: "To be tagged during syllabus mapping", correct: false }]),
    }], new Map([["authorised-60074", "Gas Laws and Diffusion"]]));
    expect(weakTopics).toMatchObject([{ subject: "Chemistry", topic: "Gas Laws and Diffusion", misses: 1 }]);
    expect(selectDailyMission({ weakTopics, fallbackSubject: "Biology", wrongIds: [], recoveryPending: false }).label).toContain("Gas Laws and Diffusion");
  });

  it("excludes unresolved topics from weakness guidance rather than presenting a generic classification", () => {
    const weakTopics = summariseWeakTopicsFromRounds([{ answerReviewJson: JSON.stringify([{ questionId: "authorised-unknown", subject: "Chemistry", topic: "Unclassified", correct: false }]) }]);
    expect(weakTopics).toEqual([]);
  });
});

describe("confidence and correction reasons", () => {
  it("derives Repair, Building, and Strong only from recorded topic attempts", () => {
    const confidence = summariseTopicConfidenceFromRounds([{
      answerReviewJson: JSON.stringify([
        { questionId: "BIO-1", subject: "Biology", topic: "Genetics", correct: false },
        { questionId: "BIO-2", subject: "Biology", topic: "Genetics", correct: false },
        { questionId: "BIO-3", subject: "Biology", topic: "Genetics", correct: true },
        { questionId: "PHY-1", subject: "Physics", topic: "Waves", correct: true },
        { questionId: "CHE-1", subject: "Chemistry", topic: "Atomic Structure", correct: true },
        { questionId: "CHE-2", subject: "Chemistry", topic: "Atomic Structure", correct: true },
        { questionId: "CHE-3", subject: "Chemistry", topic: "Atomic Structure", correct: true },
        { questionId: "CHE-4", subject: "Chemistry", topic: "Atomic Structure", correct: true },
        { questionId: "CHE-5", subject: "Chemistry", topic: "Atomic Structure", correct: false },
      ]),
    }]);
    expect(confidence).toContainEqual(expect.objectContaining({ subject: "Biology", topic: "Genetics", attempts: 3, accuracy: 33, confidence: "Repair" }));
    expect(confidence).toContainEqual(expect.objectContaining({ subject: "Physics", topic: "Waves", attempts: 1, confidence: "Building" }));
    expect(confidence).toContainEqual(expect.objectContaining({ subject: "Chemistry", topic: "Atomic Structure", attempts: 5, accuracy: 80, confidence: "Strong" }));
  });

  it("keeps a valid optional mistake reason in persisted answer review data", () => {
    expect(parseAnswerReview(JSON.stringify([{ questionId: "BIO-1", subject: "Biology", topic: "Genetics", correct: false, mistakeReason: "concept" }]))).toMatchObject([{ questionId: "BIO-1", mistakeReason: "concept" }]);
    expect(parseAnswerReview(JSON.stringify([{ questionId: "BIO-2", subject: "Biology", topic: "Genetics", correct: false, mistakeReason: "unsupported" }]))).toMatchObject([{ questionId: "BIO-2", mistakeReason: undefined }]);
  });
});
