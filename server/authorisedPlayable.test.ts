import { describe, expect, it } from "vitest";
import { normaliseQuestionStem, toPlayableAuthorisedQuestion } from "./db";

describe("owner-provided playable question mapping", () => {
  it("maps a complete labelled source record into the same quiz contract as model questions", () => {
    const question = toPlayableAuthorisedQuestion({
      id: 12,
      subject: "Physics",
      topic: "Mechanics",
      difficulty: "medium",
      questionText: "Which quantity is measured in newtons?",
      optionsJson: JSON.stringify(["Force", "Energy", "Power", "Pressure"]),
      answerIndex: 0,
      explanation: null,
      sourceLabel: "Owner-provided Drive: TUTOR DAVE PHYSICS.pdf",
    });

    expect(question).toMatchObject({
      id: "authorised-12",
      subject: "Physics",
      answer_index: 0,
      answer_text: "Force",
      source: "Owner-provided Drive: TUTOR DAVE PHYSICS.pdf",
      tags: ["owner-provided", "verification-pending"],
    });
  });

  it("preserves a validated Lekki chapter label for the novel palette", () => {
    const question = toPlayableAuthorisedQuestion({
      id: 17,
      subject: "Use of English",
      topic: "The Lekki Headmaster · Chapter 1: Dusk",
      difficulty: "medium",
      questionText: "Who is present in chapter one?",
      optionsJson: JSON.stringify(["A", "B", "C", "D"]),
      answerIndex: 0,
      explanation: null,
      sourceLabel: "The Lekki Headmaster · Owner chapter batch",
    });
    expect(question?.topic).toBe("The Lekki Headmaster · Chapter 1: Dusk");
  });

  it("holds unmapped topics and over-cap explanations out of the quiz feed", () => {
    const base = {
      id: 14,
      subject: "Physics" as const,
      topic: "Unverified category",
      difficulty: "medium" as const,
      questionText: "Which quantity is measured in newtons?",
      optionsJson: JSON.stringify(["Force", "Energy", "Power", "Pressure"]),
      answerIndex: 0,
      explanation: "A newton is the SI unit of force.",
      sourceLabel: "Owner-provided source",
    };
    expect(toPlayableAuthorisedQuestion(base)).toBeNull();
    expect(toPlayableAuthorisedQuestion({ ...base, id: 15, topic: "Motion", explanation: "One.\nTwo.\nThree.\nFour.\nFive.\nSix." })).toBeNull();
    expect(toPlayableAuthorisedQuestion({ ...base, id: 16, subject: "Use of English", topic: "Lekki Headmaster - Chapter 1", explanation: null })).not.toBeNull();
  });

  it("holds diagram-referencing records until a diagram asset is linked", () => {
    const base = {
      id: 230,
      subject: "Chemistry" as const,
      topic: "Energy changes",
      difficulty: "medium" as const,
      questionText: "[Diagram Question] In the energy profile diagram above, X represents the:",
      optionsJson: JSON.stringify(["enthalpy", "enthalpy change", "activation energy", "activated complex"]),
      answerIndex: 2,
      explanation: "The arrow from the reactant level to the peak is the activation energy.",
      sourceLabel: "Owner-provided source",
    };
    expect(toPlayableAuthorisedQuestion(base)).toBeNull();
    expect(toPlayableAuthorisedQuestion({ ...base, diagramUrl: "/manus-storage/energy-profile.svg" })).not.toBeNull();
  });

  it("keeps an organic-structure question playable when its complete structure is written in the stem", () => {
    expect(toPlayableAuthorisedQuestion({
      id: 236,
      subject: "Chemistry",
      topic: "Organic compounds",
      difficulty: "medium",
      questionText: "CH3-CH2-C(=O)-O-CH2-CH3. The compound above is an",
      optionsJson: JSON.stringify(["ether", "ester", "alkanal", "alkanol"]),
      answerIndex: 1,
      explanation: "The written C(=O)-O- linkage is an ester functional group.",
      sourceLabel: "Owner-provided source",
    })).not.toBeNull();
  });

  it("removes the scraped diagram prefix, blocks an old generated screenshot asset, and permits only a reviewed owner-original recovery", () => {
    expect(normaliseQuestionStem("[Diagram Question] In the energy profile diagram above, X represents the:")).toBe("In the energy profile diagram above, X represents the:");
    expect(toPlayableAuthorisedQuestion({
      id: 234,
      externalId: "OWNER-CHEM-DIAGRAM-2026-004",
      subject: "Chemistry",
      topic: "Energy changes",
      difficulty: "medium",
      questionText: "[Diagram Question] In the energy profile diagram above, X represents the:",
      optionsJson: JSON.stringify(["enthalpy", "enthalpy change", "activation energy", "activated complex"]),
      answerIndex: 2,
      explanation: "A graph is needed to answer this question.",
      diagramUrl: "/manus-storage/rejected-generated-energy-profile.svg",
      sourceLabel: "Owner-supplied Chemistry diagram screenshots",
    })).toBeNull();
    expect(toPlayableAuthorisedQuestion({
      id: 235,
      externalId: "OWNER-CHEM-DIAGRAM-2026-004",
      subject: "Chemistry",
      topic: "Energy changes",
      difficulty: "medium",
      questionText: "In the energy profile diagram above, X represents the:",
      optionsJson: JSON.stringify(["enthalpy", "enthalpy change", "activation energy", "activated complex"]),
      answerIndex: 2,
      explanation: "A graph is needed to answer this question.",
      diagramUrl: "/manus-storage/owner-chem-diagram-2026-004_4f0abed0.png",
      sourceLabel: "Owner-supplied Chemistry diagram screenshots",
    })).not.toBeNull();
  });

  it("holds explicit figure and graph references until an asset is linked", () => {
    const base = {
      id: 231,
      subject: "Biology" as const,
      topic: "Support and movement",
      difficulty: "medium" as const,
      optionsJson: JSON.stringify(["A", "B", "C", "D"]),
      answerIndex: 0,
      explanation: "The labelled structure identifies the answer.",
      sourceLabel: "Owner-provided source",
    };
    expect(toPlayableAuthorisedQuestion({ ...base, questionText: "[DIAGRAM: a labelled spine diagram] The part labelled II is the" })).toBeNull();
    expect(toPlayableAuthorisedQuestion({ ...base, id: 232, questionText: "The graph above represents the motion of the body." })).toBeNull();
    expect(toPlayableAuthorisedQuestion({ ...base, id: 233, questionText: "[Refers to the osmosis set-up diagram in Q3] Which result is expected?", diagramUrl: "/manus-storage/osmosis.svg" })).not.toBeNull();
  });

  it("rejects malformed options before the record can enter the quiz feed", () => {
    expect(toPlayableAuthorisedQuestion({
      id: 13,
      subject: "Physics",
      topic: "Mechanics",
      difficulty: "medium",
      questionText: "Broken record",
      optionsJson: JSON.stringify(["A", "B", "C"]),
      answerIndex: 0,
      explanation: null,
      sourceLabel: "Owner-provided Drive: sample.pdf",
    })).toBeNull();
  });

  it("rejects an option that contains scraped answer or explanation metadata", () => {
    expect(toPlayableAuthorisedQuestion({
      id: 229,
      subject: "Physics",
      topic: "Equilibrium of Forces",
      difficulty: "medium",
      questionText: "Three concurrent forces are in equilibrium. If two of the forces are 8 N and 6 N at right angles to each other, the third force is",
      optionsJson: JSON.stringify(["14 N", "2 N", "10 N", "7 N ✓ Correct Answer: C Explanation: The resultant of the two forces is 10 N."]),
      answerIndex: 2,
      explanation: "Concurrent forces in equilibrium have a net vector sum of zero.",
      sourceLabel: "Owner-provided Drive: TUTOR DAVE PHYSICS.pdf",
    })).toBeNull();
  });
});
