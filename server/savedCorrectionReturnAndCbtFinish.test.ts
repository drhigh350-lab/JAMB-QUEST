import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync("client/src/App.tsx", "utf8");
const home = readFileSync("client/src/pages/Home.tsx", "utf8");
const shell = readFileSync("client/src/components/QuizShell.tsx", "utf8");
const styles = readFileSync("client/src/field-notes-overrides.css", "utf8");

describe("saved correction return and CBT finish controls", () => {
  it("returns historical corrections to the Progress tab and excludes them from active-CBT exit handling", () => {
    expect(app).toContain("setHomeTab(\"progress\")");
    expect(app).toContain("jambQuestSavedCorrection");
    expect(app).toContain("game.screen !== \"quiz\" || !game.isCbt || game.historicalReview");
    expect(app).toContain("returnToProgress");
    expect(home).toContain("initialTab?: AppTab");
    expect(home).toContain("onActiveTabChange?.(activeTab)");
  });

  it("keeps mobile finish and review actions fully opaque and places navigation before the ledger", () => {
    expect(shell.indexOf("cbt-nav-actions")).toBeLessThan(shell.indexOf("<QuestionLedger"));
    expect(shell).toContain('className="cbt-finish-dialog"');
    expect(shell).toContain('className="cbt-finish-action"');
    expect(styles).toContain(".cbt-finish-dialog");
    expect(styles).toContain("opacity: 1 !important");
    expect(styles).toContain(".cbt-finish-footer");
  });
});
