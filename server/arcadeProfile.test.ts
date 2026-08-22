import { describe, expect, it } from "vitest";
import { ARCADE_PROFILE_KEY, ARCADE_PROFILE_VERSION, cleanArcadeDisplayName, emptyArcadeProfile, parseArcadeProfile, selectArcadeQuestions, writeArcadeProfile } from "../client/src/game/arcadeProfile";
import type { BankQuestion } from "../client/src/game/types";

const question = (id: string, subject: BankQuestion["subject"]): BankQuestion => ({ id, subject, topic: "Fixture topic", subtopic: "Fixture", difficulty: "medium", question_type: "multiple_choice", question: "Which option is correct?", options: ["A", "B", "C", "D"], answer_index: 0, answer_text: "A", explanation: "A safe fixture explanation.", tags: [], source: "fixture" });

describe("shared Game Arcade profile", () => {
  it("rejects malformed or unsupported profile records without touching learner question data", () => {
    expect(parseArcadeProfile("not-json")).toEqual(emptyArcadeProfile());
    expect(parseArcadeProfile(JSON.stringify({ version: 999, expedition: { stamps: { Biology: 90 } } }))).toEqual(emptyArcadeProfile());
  });

  it("normalizes only bounded arcade progression values and ignores unsupported stamp keys", () => {
    const profile = parseArcadeProfile(JSON.stringify({ version: ARCADE_PROFILE_VERSION, expedition: { stamps: { Biology: 8, History: 900, Physics: -4 }, routes: ["Biology:scout", "Biology:scout", 4] }, presidentsDesk: { treasury: -3, confidence: 88, insight: 6.9, terms: 2, projects: { education: 99, health: 2 } } }));
    expect(profile.expedition.stamps).toMatchObject({ Biology: 8, Physics: 0 });
    expect(profile.expedition.stamps).not.toHaveProperty("History");
    expect(profile.expedition.routes).toEqual(["Biology:scout"]);
    expect(profile.presidentsDesk).toMatchObject({ treasury: 0, confidence: 6, insight: 6, terms: 2, projects: { education: 3, health: 2, energy: 0, innovation: 0 } });
    expect(profile.greatArchive).toEqual({ tiles: {}, blueprints: { balanced: 0, mastery: 0, repair: 0 }, restoredWings: [] });
  });

  it("keeps a short, clean display name as arcade-only personalisation", () => {
    expect(cleanArcadeDisplayName("  Ada   Okafor  ")).toBe("Ada Okafor");
    expect(cleanArcadeDisplayName("A".repeat(30))).toHaveLength(24);
    expect(parseArcadeProfile(JSON.stringify({ ...emptyArcadeProfile(), displayName: "  Zainab   " })).displayName).toBe("Zainab");
  });

  it("writes one arcade-only key and selects exact subject questions without creating or altering them", () => {
    let captured: [string, string] | undefined;
    writeArcadeProfile(emptyArcadeProfile(), { setItem: (key, value) => { captured = [key, value]; } });
    expect(captured?.[0]).toBe(ARCADE_PROFILE_KEY);
    expect(parseArcadeProfile(captured?.[1]).version).toBe(ARCADE_PROFILE_VERSION);
    const biology = question("BIO-1", "Biology");
    const selected = selectArcadeQuestions([biology, question("PHY-1", "Physics")], "Biology", 5);
    expect(selected).toEqual([biology]);
    expect(selected[0]?.options).toEqual(["A", "B", "C", "D"]);
  });
});
