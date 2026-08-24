import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("owner physical-screening corrections", () => {
  it("keeps Standard CBT first, leaves the core subject desk compact, and restores Lekki as a separate optional compact route", () => {
    const home = readFileSync("client/src/pages/Home.tsx", "utf8");
    const standard = home.indexOf('data-testid="standard-cbt-path"');
    const subjectDesk = home.indexOf('className="practice-subject-path"');
    expect(standard).toBeGreaterThan(-1);
    expect(subjectDesk).toBeGreaterThan(standard);
    expect(home).toContain('<details className="practice-subject-path">');
    expect(home).not.toContain('data-testid="lekki-palette"');
    expect(home).not.toContain('data-testid="lekki-chapter-start"');
    expect(home).toContain('data-testid="lekki-practice-path"');
    expect(home).toContain('data-testid="lekki-mixed-study-start"');
    expect(home).toContain('topic: selectedLekkiTopic || "The Lekki Headmaster"');
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

  it("keeps Practice concise while grouping its three optional Study tools in a separate compact panel", () => {
    const home = readFileSync("client/src/pages/Home.tsx", "utf8");
    expect(home).toContain("Choose a practice path or go deeper with the official syllabus. Your progress updates as you go.");
    expect(home).not.toContain("LIVE DESK");
    expect(home).not.toContain("Your goal is built through daily action");
    const practice = home.slice(home.indexOf('{activeTab === "practice"'), home.indexOf('{activeTab === "progress"'));
    expect(practice).toContain('aria-label="Study tools inside Practice"');
    expect(practice).toContain('data-testid="topic-drill-destination"');
    expect(practice).toContain('data-testid="syllabus-journey-destination"');
    expect(practice).toContain('data-testid="game-arcade-destination"');
  });

  it("uses source-neutral objectives and subtopics in a reading-only Syllabus Journey", () => {
    const journey = readFileSync("client/src/components/SyllabusJourney.tsx", "utf8");
    expect(journey).toContain('const nextProfile = confirmSyllabusRead(profile, subject, activeTopic);');
    expect(journey).toContain("WHAT TO READ");
    expect(journey).toContain("Continue your direction");
    expect(journey).not.toContain("Open Topic Drill");
    expect(journey).toContain('<span>SUBTOPICS</span>');
    expect(journey).not.toContain("selectSyllabusJourneyQuiz");
    expect(journey).not.toContain('setPhase("quiz")');
    expect(journey).not.toMatch(/supplied .*syllabus PDF|Condensed from/i);
  });

  it("gives the mobile CBT exit confirmation its own opaque, non-overlapping dialog surface", () => {
    const quizShell = readFileSync("client/src/components/QuizShell.tsx", "utf8");
    const styles = readFileSync("client/src/field-notes-overrides.css", "utf8");
    expect(quizShell).toContain('className="cbt-exit-dialog"');
    expect(quizShell).toContain('className="cbt-exit-footer"');
    expect(quizShell).toContain('initialExitConfirmationOpen = false');
    expect(styles).toContain('.cbt-exit-dialog');
    expect(styles).toContain('background: #fffdf5 !important');
    expect(styles).toContain('z-index: 80 !important');
    expect(styles).toContain('.cbt-exit-footer { grid-template-columns: 1fr; }');
  });
});
