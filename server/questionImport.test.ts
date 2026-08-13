/* Field Notes Arcade: import validation must reject ambiguous or malformed authorised question payloads before storage. */

import { describe, expect, it } from "vitest";
import { authorisedImportSchema } from "./questionImport";

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

  it("rejects duplicate external IDs and invalid answer bounds", () => {
    const duplicate = structuredClone(validImport);
    duplicate.questions.push({ ...duplicate.questions[0] });
    expect(authorisedImportSchema.safeParse(duplicate).success).toBe(false);
    expect(authorisedImportSchema.safeParse({ ...validImport, questions: [{ ...validImport.questions[0], answerIndex: 4 }] }).success).toBe(false);
  });
});
