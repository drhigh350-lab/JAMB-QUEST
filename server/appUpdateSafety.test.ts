import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isUnsavedQuestionFlow } from "../client/src/lib/appUpdateSafety";

describe("app update safety", () => {
  it("defers a pending update for a non-CBT question but makes it available after the learner exits", () => {
    expect(isUnsavedQuestionFlow("quiz", false)).toBe(true);
    expect(isUnsavedQuestionFlow("quiz", true)).toBe(false);
    expect(isUnsavedQuestionFlow("home", false)).toBe(false);
  });

  it("provides a deterministic deferred-update fixture and accurate learner wording", () => {
    const fixture = readFileSync(resolve(import.meta.dirname, "../client/src/e2e/DeferredAppUpdateFixture.tsx"), "utf8");
    const panel = readFileSync(resolve(import.meta.dirname, "../client/src/components/OfflineStudyPackPanel.tsx"), "utf8");
    expect(fixture).toContain('data-testid="leave-question-for-update"');
    expect(fixture).toContain('data-testid="deferred-update-status"');
    expect(fixture).toContain('get("afterExit") === "1"');
    expect(fixture).toContain('activeQuestionFlow ? "deferred"');
    expect(panel).toContain("Update ready after you leave this question");
    expect(panel).toContain('pwa.update.status === "deferred" ? "Finish question first" : "Update JAMB Quest"');
  });
});
