import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("collapsed-first study layout", () => {
  it("places Revision Return Queue in Progress rather than the Practice route", () => {
    const source = readFileSync("client/src/pages/Home.tsx", "utf8");
    const practice = source.indexOf('{activeTab === "practice"');
    const progress = source.indexOf('{activeTab === "progress"');
    const queue = source.indexOf("<RevisionReturnQueue onStart={onStart} />");
    expect(practice).toBeGreaterThan(-1);
    expect(progress).toBeGreaterThan(practice);
    expect(queue).toBeGreaterThan(progress);
  });

  it("keeps major Practice and Progress functions collapsed until the learner opens them", () => {
    const source = readFileSync("client/src/pages/Home.tsx", "utf8");
    expect(source).not.toContain('title="Today’s JAMB practice" note={`${selectedState.today.questionsAnswered} of ${selectedState.dailyGoalCount} questions${selectedState.dailyGoalTopic ? ` · ${dailyGoalTopicLabel}` : " today"}`} defaultOpen');
    expect(source).not.toContain('title="Choose your practice path" note={isLekkiPalette ? "Lekki novel · choose 10, 20, 40, or 50 questions" : "Single Subject for focused repair, or Standard CBT for a full two-hour simulation"} defaultOpen');
    expect(source).not.toContain('title="Choose from the JAMB syllabus" note="Use this when you want a deliberate revision path: choose one official section, then one exact topic or a broad section drill." defaultOpen');
    expect(source).not.toContain('title={balancedCoreFocus ? `Strengthen ${balancedCoreFocus.subject}` : "Create your first evidence"} note={progressNextAction} defaultOpen');
    expect(source).toContain('title={balancedCoreFocus ? `Core focus: ${balancedCoreFocus.subject}` : "Create your first evidence"}');
  });

  it("uses a restrained ink typewriter caret instead of a long yellow first-load marker", () => {
    const css = readFileSync("client/src/index.css", "utf8");
    expect(css).toContain('.quest-typing-caret { width: 2px; height: .86em');
    expect(css).toContain('background: rgba(18,40,63,.62)');
    expect(css).not.toContain('.quest-typing-caret { width: 3px; height: 1.14em');
  });
});
