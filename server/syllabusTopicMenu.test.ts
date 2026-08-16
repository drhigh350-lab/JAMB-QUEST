import { describe, expect, it } from "vitest";
import { OFFICIAL_SYLLABUS_AREAS, resolveSyllabusTopic } from "../shared/syllabusTopicMap";

describe("official JAMB syllabus topic menu contract", () => {
  it("uses only canonical official labels for every core subject", () => {
    for (const [subject, topics] of Object.entries(OFFICIAL_SYLLABUS_AREAS)) {
      expect(topics.length).toBeGreaterThan(0);
      for (const topic of topics) {
        expect(resolveSyllabusTopic(subject as keyof typeof OFFICIAL_SYLLABUS_AREAS, topic)).toBe(topic);
      }
    }
  });
});
