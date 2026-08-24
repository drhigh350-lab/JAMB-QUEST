import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("dedicated JAMB syllabus Topic Drill", () => {
  it("keeps official-area selection and deliberate untimed drill launch outside Syllabus Journey", () => {
    const drill = readFileSync(resolve(import.meta.dirname, "../client/src/components/TopicDrill.tsx"), "utf8");
    const journey = readFileSync(resolve(import.meta.dirname, "../client/src/components/SyllabusJourney.tsx"), "utf8");
    expect(drill).toContain("OFFICIAL JAMB SYLLABUS");
    expect(drill).toContain("Official syllabus area");
    expect(drill).toContain("Specific topic");
    expect(drill).toContain('aria-label="Choose specific topic for topic drill"');
    expect(drill).toContain("const activeGroup");
    expect(drill).toContain("Choose official syllabus area");
    expect(drill).toContain("Choose a specific topic to continue.");
    expect(drill).toContain('disabled={!selectedGroup || !selectedTopic || !activeCount}');
    expect(drill).toContain('mode: "sprint", count: drillCount, timing: "study", topic: activeTopic');
    expect(drill).toContain("Start {drillCount}-question Topic Drill");
    expect(journey).not.toContain("journey-start-drill");
    expect(journey).not.toContain("journey-drill-count");
  });
});
