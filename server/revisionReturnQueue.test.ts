import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseRevisionReturnQueue, removeRevisionReturn, returnDueLabel, scheduleRevisionReturn, snoozeRevisionReturn } from "../client/src/game/revisionReturnQueue";

describe("Revision Return Queue", () => {
  const base = { subject: "Biology" as const, topic: "Nutrition and digestion", questionIds: ["BIO-1", "BIO-2"], reason: "syllabus-quiz" as const };

  it("stores only bounded, exact approved-question IDs in a separate local queue", () => {
    const scheduled = scheduleRevisionReturn(parseRevisionReturnQueue(null), base, 3, 1_700_000_000_000);
    expect(scheduled.items).toHaveLength(1);
    expect(scheduled.items[0]).toMatchObject({ ...base, dueAt: 1_700_259_200_000 });
    expect(parseRevisionReturnQueue(JSON.stringify({ version: 1, items: [{ ...scheduled.items[0], questionIds: ["BIO-1", "BIO-1", 3] }] })).items[0]?.questionIds).toEqual(["BIO-1"]);
    expect(parseRevisionReturnQueue(JSON.stringify({ version: 99, items: scheduled.items })).items).toEqual([]);
  });

  it("keeps return dates learner-controlled through snooze and removal", () => {
    const scheduled = scheduleRevisionReturn(parseRevisionReturnQueue(null), base, 1, 1_700_000_000_000);
    const id = scheduled.items[0]!.id;
    const snoozed = snoozeRevisionReturn(scheduled, id, 7, 1_700_000_000_000);
    expect(snoozed.items[0]?.dueAt).toBe(1_700_604_800_000);
    expect(returnDueLabel(1_700_000_000_000, 1_700_000_000_000)).toBe("Due now");
    expect(removeRevisionReturn(snoozed, id).items).toEqual([]);
  });

  it("launches exact review cards with a distinct recovery reason and never writes CBT state", () => {
    const panel = readFileSync("client/src/components/RevisionReturnQueue.tsx", "utf8");
    const journey = readFileSync("client/src/components/SyllabusJourney.tsx", "utf8");
    const storage = readFileSync("client/src/game/revisionReturnQueue.ts", "utf8");
    expect(panel).toContain('recoveryOrigin: "revision-return"');
    expect(panel).toContain("questionIds: item.questionIds");
    expect(journey).toContain("OPTIONAL SPACED RETURN");
    expect(journey).toContain("scheduleReturn(1)");
    expect(storage).toContain("jambQuest.revisionReturnQueue.v1");
    expect(storage).not.toContain("active-cbt");
    expect(storage).not.toContain("recordRound");
  });
});
