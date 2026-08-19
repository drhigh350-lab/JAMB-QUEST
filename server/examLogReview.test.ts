import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAnswerReview } from "./db";

describe("saved CBT correction log", () => {
  it("preserves selected answers, correction state, timeout, and flag data from a stored attempt", () => {
    const review = parseAnswerReview(JSON.stringify([{ questionId: "authorised-219", subject: "Physics", topic: "Motion", selectedIndex: 2, correct: false, timedOut: false, flagged: true }]));
    expect(review).toEqual([{ questionId: "authorised-219", subject: "Physics", topic: "Motion", selectedIndex: 2, correct: false, timedOut: false, flagged: true }]);
  });

  it("uses a protected single-round query and a full-CBT-style read-only correction viewer with explicit answer filters", () => {
    const router = readFileSync(resolve(import.meta.dirname, "routers.ts"), "utf8");
    const db = readFileSync(resolve(import.meta.dirname, "db.ts"), "utf8");
    const game = readFileSync(resolve(import.meta.dirname, "../client/src/game/useQuizGame.ts"), "utf8");
    const home = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
    const review = readFileSync(resolve(import.meta.dirname, "../client/src/components/ExamReview.tsx"), "utf8");
    expect(router).toContain("cbtHistory: protectedProcedure.query");
    expect(router).toContain("roundReview: protectedProcedure.input");
    expect(router).toContain("roundReview: protectedProcedure.input(z.object({ roundId: z.number().int().positive() })).mutation");
    expect(db).toContain("getLearnerCbtHistory");
    expect(db).toContain(".limit(100)");
    expect(game).toContain("openHistoricalReview");
    expect(game).toContain("if (isHistoricalReview)");
    expect(game).toContain('historicalFilter, setHistoricalFilter');
    expect(game).toContain("filterHistoricalReview");
    expect(home).toContain("Open full correction");
    expect(review).toContain("SAVED CBT CORRECTION");
    expect(review).toContain("SAVED CBT CORRECTION");
    expect(review).toContain("will not change your score or create another attempt");
    const shell = readFileSync(resolve(import.meta.dirname, "../client/src/components/QuizShell.tsx"), "utf8");
    expect(shell).toContain("SAVED CBT CORRECTION / READ ONLY");
    expect(shell).toContain("Wrong / unanswered");
    expect(shell).toContain("Green = correct · red = review");
  });
});
