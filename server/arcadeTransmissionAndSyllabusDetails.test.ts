import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { OFFICIAL_SYLLABUS_AREAS } from "../shared/syllabusTopicMap";
import { SYLLABUS_JOURNEY_DETAILS } from "../shared/syllabusJourneyDetails";

const read = (path: string) => readFileSync(path, "utf8");

describe("Arcade world board and syllabus detail upgrades", () => {
  it("places every Arcade question loop on a reduced-motion-safe virtual game board without touching CBT", () => {
    const board = read("client/src/components/ArcadeWorldBoard.tsx");
    const styles = read("client/src/components/arcade-world-board.css");
    const expedition = read("client/src/components/QuestRush.tsx");
    const president = read("client/src/components/PresidentsDesk.tsx");
    const archive = read("client/src/components/GreatArchive.tsx");
    const hub = read("client/src/components/GameArcade.tsx");

    expect(board).toContain('image: "/manus-storage/jamb-quest-expedition-world');
    expect(board).toContain('image: "/manus-storage/jamb-quest-asterra-world');
    expect(board).toContain('image: "/manus-storage/jamb-quest-archive-world');
    expect(board).toContain("setTypedMessage(message.slice(0, position))");
    expect(board).toContain("prefers-reduced-motion: reduce");
    expect(styles).toContain("@media(prefers-reduced-motion:reduce)");
    expect(expedition).toContain('<ArcadeWorldBoard world="expedition"');
    expect(president).toContain('<ArcadeWorldBoard world="asterra"');
    expect(archive).toContain('<ArcadeWorldBoard world="archive"');
    expect(board).not.toContain("localStorage");
    expect(board).not.toContain("CBT");
    expect(hub).toContain("RETURN BOARD / YOUR NEXT REAL MOVE");
    expect(hub).toContain("no streak penalty, paid advantage, or random reward");
  });

  it("shows an objective and subtopics for every official topic with a separate Topic Drill handoff and no source-processing copy", () => {
    const journey = read("client/src/components/SyllabusJourney.tsx");
    expect(journey).toContain("<span>LEARNING OBJECTIVE</span>");
    expect(journey).toContain("<span>SUBTOPICS</span>");
    expect(journey).not.toMatch(/supplied .*syllabus PDF|Condensed from/i);
    expect(journey).toContain("data-testid=\"syllabus-topic-focus\"");
    expect(journey).toContain("getSyllabusJourneyDetail(subject, activeTopic)");
    expect(journey).toContain('onStart({ subject, mode: "sprint", count, timing: "study", topic: activeTopic })');
    expect(journey).toContain("Open Topic Drill");
    expect(journey).not.toContain("selectSyllabusJourneyQuiz");
    expect(journey).not.toContain('setPhase("quiz")');
    expect(journey).not.toContain("recordRound");
    for (const [subject, topics] of Object.entries(OFFICIAL_SYLLABUS_AREAS)) {
      for (const topic of topics) expect(SYLLABUS_JOURNEY_DETAILS[subject][topic]).toBeDefined();
    }
  });
});
