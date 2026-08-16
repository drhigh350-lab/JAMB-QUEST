import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const project = "/home/ubuntu/jamb-quiz-game";

describe("question palette placement", () => {
  it("renders the ledger after the active question and gives the workspace a bottom-palette layout hook", () => {
    const shell = readFileSync(`${project}/client/src/components/QuizShell.tsx`, "utf8");
    const stylesheet = readFileSync(`${project}/client/src/index.css`, "utf8");
    expect(shell.indexOf("<QuestionCard")).toBeLessThan(shell.indexOf("<QuestionLedger"));
    expect(shell).toContain("quiz-workspace question-palette-bottom");
    expect(stylesheet).toContain(".quiz-workspace.question-palette-bottom");
  });
});
