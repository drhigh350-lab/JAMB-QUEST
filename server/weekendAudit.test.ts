import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("weekend learner-flow audit", () => {
  it("anchors weakness analysis to the newest persisted rounds", () => {
    const db = readFileSync(resolve(root, "server/db.ts"), "utf8");
    expect(db).toContain("orderBy(desc(quizRounds.completedAt)).limit(12)");
    expect(db).not.toContain("const recentRounds = rounds.reverse().map");
    expect(db).toContain("const latestFullMock = rounds.find");
  });

  it("keeps today’s goal as a real launchable session", () => {
    const panel = readFileSync(resolve(root, "client/src/components/DailyMissionPanel.tsx"), "utf8");
    expect(panel).toContain("Start today's mission");
    expect(panel).toContain("onStart(config)");
  });

  it("keeps the question palette after the active question", () => {
    const shell = readFileSync(resolve(root, "client/src/components/QuizShell.tsx"), "utf8");
    const game = readFileSync(resolve(root, "client/src/game/useQuizGame.ts"), "utf8");
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const mobileStyles = readFileSync(resolve(root, "client/src/field-notes-overrides.css"), "utf8");
    expect(shell.indexOf("<QuestionCard")).toBeLessThan(shell.indexOf("<QuestionLedger"));
    expect(shell).toContain("question-palette-bottom");
    expect(game).toContain("const navigateQuestion");
    expect(game).not.toContain("if (!isCbt || index < 0 || index >= roundQuestions.length) return;");
    expect(app).toContain("onNavigate={game.navigateQuestion}");
    expect(mobileStyles).toContain(".cbt-ledger-stack { order: initial; }");
    expect(mobileStyles).not.toContain(".cbt-ledger-stack { order: -1; }");
  });

  it("does not auto-leave the opening until the entire live quote has finished typing", () => {
    const opening = readFileSync(resolve(root, "client/src/components/QuestOpening.tsx"), "utf8");
    expect(opening).toContain("const quoteComplete = typedLength >= quoteLength");
    expect(opening).toContain("if (hold || !quoteComplete) return;");
    expect(opening).toContain("reducedMotion ? 900 : 1800");
    expect(opening).not.toContain("getTypewriterDuration(dailyQuote)");
  });
});
