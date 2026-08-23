import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("owner physical-screening corrections", () => {
  it("keeps Standard CBT first and leaves the subject desk compact until it is deliberately opened", () => {
    const home = readFileSync("client/src/pages/Home.tsx", "utf8");
    const standard = home.indexOf('data-testid="standard-cbt-path"');
    const subjectDesk = home.indexOf('className="practice-subject-path"');
    expect(standard).toBeGreaterThan(-1);
    expect(subjectDesk).toBeGreaterThan(standard);
    expect(home).toContain('<details className="practice-subject-path">');
    expect(home).not.toContain('data-testid="lekki-palette"');
    expect(home).not.toContain('data-testid="lekki-chapter-start"');
  });

  it("keeps the Home daily goal while placing level, XP, and streak evidence in Profile or Progress", () => {
    const home = readFileSync("client/src/pages/Home.tsx", "utf8");
    const practice = home.slice(home.indexOf('{activeTab === "practice"'), home.indexOf('{activeTab === "progress"'));
    expect(practice).toContain("Today’s study goal");
    expect(practice).not.toContain("compact-system-metrics");
    expect(home).toContain('<span>day streak</span>');
    expect(home).toContain('<span>study XP</span>');
    expect(home).toContain('<span>study level</span>');
  });

  it("uses source-neutral, visible detail cards and immediately starts an exact ready-topic quiz after confirmation", () => {
    const journey = readFileSync("client/src/components/SyllabusJourney.tsx", "utf8");
    expect(journey).toContain('const startQuiz = (profileSource = profile)');
    expect(journey).toContain('const nextProfile = confirmSyllabusRead(profile, subject, activeTopic);');
    expect(journey).toContain('if (topicCounts[activeTopic]) startQuiz(nextProfile);');
    expect(journey).toContain('<span>SUBTOPICS</span>');
    expect(journey).not.toMatch(/supplied .*syllabus PDF|Condensed from/i);
  });
});
