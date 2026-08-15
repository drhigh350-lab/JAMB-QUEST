/* Field Notes Arcade: import validation must reject ambiguous or malformed authorised question payloads before storage. */

import { describe, expect, it } from "vitest";
import { authorisedImportSchema } from "./questionImport";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";

const validImport = {
  sourceLabel: "Owner-authorised practice set",
  permissionNote: "The owner has permission to use this practice set in JAMB Quest.",
  fileName: "biology-set.json",
  storageKey: "imports/biology-set.json",
  questions: [{
    externalId: "BIO-ACCESS-001",
    subject: "Biology",
    topic: "Ecology",
    difficulty: "medium",
    question: "Which relationship benefits both organisms in an ecosystem?",
    options: ["Parasitism", "Mutualism", "Predation", "Competition"],
    answerIndex: 1,
  }],
};

describe("authorisedImportSchema", () => {
  it("accepts a provenance-complete four-option question import", () => {
    expect(authorisedImportSchema.parse(validImport).questions).toHaveLength(1);
  });

  it("accepts a five-option question when the answer index points to option E", () => {
    const fiveOption = structuredClone(validImport);
    fiveOption.questions[0].options.push("Commensalism");
    fiveOption.questions[0].answerIndex = 4;
    expect(authorisedImportSchema.parse(fiveOption).questions[0].options).toHaveLength(5);
  });

  it("normalizes common labels to official syllabus areas", () => {
    expect(resolveSyllabusTopic("Physics", "Mechanics")).toBe("Motion");
    expect(resolveSyllabusTopic("Biology", "Genetics")).toBe("Heredity");
    expect(resolveSyllabusTopic("Use of English", "Lekki Headmaster - Chapter 4")).toBe("Approved reading text");
  });

  it("rejects unmapped topics and explanations over five non-empty lines", () => {
    const unmapped = structuredClone(validImport);
    unmapped.questions[0].topic = "Unverified random category";
    expect(authorisedImportSchema.safeParse(unmapped).success).toBe(false);

    const tooLong = structuredClone(validImport);
    tooLong.questions[0].explanation = "One.\nTwo.\nThree.\nFour.\nFive.\nSix.";
    expect(authorisedImportSchema.safeParse(tooLong).success).toBe(false);
  });

  it("rejects duplicate external IDs and invalid answer bounds", () => {
    const duplicate = structuredClone(validImport);
    duplicate.questions.push({ ...duplicate.questions[0] });
    expect(authorisedImportSchema.safeParse(duplicate).success).toBe(false);
    expect(authorisedImportSchema.safeParse({ ...validImport, questions: [{ ...validImport.questions[0], answerIndex: 4 }] }).success).toBe(false);
    const invalidFiveOption = structuredClone(validImport);
    invalidFiveOption.questions[0].options.push("Commensalism");
    invalidFiveOption.questions[0].answerIndex = 5;
    expect(authorisedImportSchema.safeParse(invalidFiveOption).success).toBe(false);
  });
});
