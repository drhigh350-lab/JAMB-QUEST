import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const project = "/home/ubuntu/jamb-quiz-game";

describe("question palette placement", () => {
  it("renders Previous and Next before the ledger after the active question and gives the workspace a bottom-palette layout hook", () => {
    const shell = readFileSync(`${project}/client/src/components/QuizShell.tsx`, "utf8");
    const stylesheet = readFileSync(`${project}/client/src/index.css`, "utf8");
    expect(shell.indexOf("<QuestionCard")).toBeLessThan(shell.indexOf("<QuestionLedger"));
    expect(shell.indexOf("cbt-nav-actions")).toBeLessThan(shell.indexOf("<QuestionLedger"));
    expect(shell).toContain("quiz-workspace question-palette-bottom");
    expect(stylesheet).toContain(".quiz-workspace.question-palette-bottom");
    const mobileStyles = readFileSync(`${project}/client/src/field-notes-overrides.css`, "utf8");
    expect(mobileStyles).not.toContain(".cbt-ledger-stack { order: -1; }");
    expect(mobileStyles).toContain(".cbt-ledger-stack { order: initial; }");
    expect(mobileStyles).toContain(".question-palette-bottom .cbt-actions { position: sticky;");
    expect(mobileStyles).toContain("env(safe-area-inset-bottom)");
    expect(mobileStyles).toContain(".question-palette-bottom .cbt-actions .cbt-nav-actions { grid-column: 1 / -1; }");
  });
});
