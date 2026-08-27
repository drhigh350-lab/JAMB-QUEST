import { describe, expect, it } from "vitest";
import { toPlayableAuthorisedQuestion } from "./db";

function ownerDiagramRow(externalId: string) {
  return {
    id: 1170001,
    externalId,
    subject: "Biology",
    topic: "Heredity",
    difficulty: "medium" as const,
    questionText: "Use the diagram to answer this question. What is the genotypic ratio of the F₂ generation?",
    optionsJson: JSON.stringify(["2 : 1 : 1", "3 : 1", "1 : 1", "1 : 2 : 1"]),
    answerIndex: 3,
    explanation: "The cross produces one RR, two Rr, and one rr offspring.",
    diagramUrl: "/manus-storage/owner-rr-cross-clean-20260826_58261e88.png",
    explanationStatus: "approved" as const,
    sourceLabel: "Owner-supplied Biology 2025 diagram questions · verified key and explanation",
  };
}

describe("owner-verified Page 1–2 diagram release", () => {
  it("releases only the eight cleared Page 2 owner records with their existing supplied pictures", () => {
    expect(toPlayableAuthorisedQuestion(ownerDiagramRow("OWNER-BIO-DIAGRAM-2025-001"))).not.toBeNull();
    expect(toPlayableAuthorisedQuestion(ownerDiagramRow("OWNER-BIO-DIAGRAM-2025-008"))).not.toBeNull();
  });

  it("keeps the next owner-page record held until the owner clears it separately", () => {
    expect(toPlayableAuthorisedQuestion(ownerDiagramRow("OWNER-BIO-DIAGRAM-2025-009"))).toBeNull();
  });
});
