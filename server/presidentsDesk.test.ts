import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("President’s Desk civic strategy mode", () => {
  it("uses approved questions for fictional, correction-led project strategy without paid or chance mechanics", () => {
    const component = readFileSync("client/src/components/PresidentsDesk.tsx", "utf8");
    const arcade = readFileSync("client/src/components/GameArcade.tsx", "utf8");

    expect(component).toContain("setCommonwealth(profile.presidentsDesk)");
    expect(component).toContain("writeArcadeProfile({ ...profile, presidentsDesk: next })");
    expect(component).toContain("Asterra is fictional");
    expect(component).toContain("questions.filter((question) => question.subject === currentMinistry.subject)");
    expect(component).toContain("selectedIndex === current.answer_index");
    expect(component).toContain("formatLearnerText(current.explanation)");
    expect(component).toContain("onOpenCorrection(currentMinistry.subject, misses)");
    expect(component).toContain("president-study-map");
    expect(component).toContain("Start 5 questions");
    expect(component).toContain("playerName");
    expect(component).not.toContain("Nigeria");
    expect(component).not.toContain("payment");
    expect(arcade).toContain('onSelect("president")');
    expect(arcade).toContain("The Great Archive");
    expect(arcade).toContain("Reset only Game Arcade progression?");
  });
});
