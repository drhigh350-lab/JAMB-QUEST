import { describe, expect, it } from "vitest";
import { toPlayableAuthorisedQuestion } from "./db";

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
