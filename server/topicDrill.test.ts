import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("dedicated JAMB syllabus Topic Drill", () => {
  it("keeps deliberate official-area launch while making exact-topic refinement optional outside Syllabus Journey", () => {
    const drill = readFileSync(resolve(import.meta.dirname, "../client/src/components/TopicDrill.tsx"), "utf8");
    const journey = readFileSync(resolve(import.meta.dirname, "../client/src/components/SyllabusJourney.tsx"), "utf8");
    expect(drill).toContain("OFFICIAL JAMB SYLLABUS");
    expect(drill).toContain("Official syllabus area");
    expect(drill).toContain("Specific topic");
    expect(drill).toContain('aria-label="Optionally choose a specific topic for topic drill"');
    expect(drill).toContain("const activeGroup");
    expect(drill).toContain("Choose official syllabus area");
    expect(drill).toContain("Whole official area");
    expect(drill).toContain("const groupCount");
    expect(drill).toContain("const canStart");
    expect(drill).toContain('disabled={!canStart}');
    expect(drill).toContain('mode: "sprint", count: drillCount, timing: "study", topic: activeTopic');
    expect(drill).toContain('mode: "sprint", count: drillCount, timing: "study", topics: [...groupTopics]');
    expect(drill).toContain('const startLabel = exactTopicSelected ? `Start ${drillCount}-question Topic Drill` : `Start ${drillCount}-question Area Drill`;');
    expect(journey).not.toContain("journey-start-drill");
    expect(journey).not.toContain("journey-drill-count");
  });
});
