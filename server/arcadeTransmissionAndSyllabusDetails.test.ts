import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Arcade transmission and syllabus detail upgrades", () => {
  it("adds one real-time, reduced-motion-safe study signal to every Arcade question loop", () => {
    const signal = read("client/src/components/ArcadeTransmission.tsx");
    const styles = read("client/src/components/arcade-transmission.css");
    const expedition = read("client/src/components/QuestRush.tsx");
    const president = read("client/src/components/PresidentsDesk.tsx");
    const archive = read("client/src/components/GreatArchive.tsx");

    expect(signal).toContain("prefers-reduced-motion: reduce");
    expect(signal).toContain("Repair signal logged");
    expect(styles).toContain("@media(prefers-reduced-motion:reduce)");
    expect(expedition).toContain('<ArcadeTransmission world="expedition"');
    expect(president).toContain('<ArcadeTransmission world="asterra"');
    expect(archive).toContain('<ArcadeTransmission world="archive"');
    expect(signal).not.toContain("localStorage");
    expect(signal).not.toContain("CBT");
  });

  it("shows a study objective and only source-tagged approved-card subtopics without changing official topic or quiz boundaries", () => {
    const journey = read("client/src/components/SyllabusJourney.tsx");
    expect(journey).toContain("LEARNING OBJECTIVE");
    expect(journey).toContain("APPROVED-CARD SUBTOPICS");
    expect(journey).toContain("data-testid=\"syllabus-topic-focus\"");
    expect(journey).toContain("question.subtopic.trim()");
    expect(journey).toContain('selectSyllabusJourneyQuiz(questions, subject, activeTopic, 5');
    expect(journey).toContain("awaiting matching approved questions");
    expect(journey).not.toContain("recordRound");
  });
});
