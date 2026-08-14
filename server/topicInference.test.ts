import { describe, expect, it } from "vitest";
import { inferTopicFromQuestion, inferVerifiedTopic } from "../shared/topicInference";

describe("verified topic inference", () => {
  it("assigns a specific topic only when question wording supports it", () => {
    expect(inferVerifiedTopic("Chemistry", "If hydrogen diffuses in 40 seconds, how long will gas M take?")).toBe("Gas Laws and Diffusion");
    expect(inferVerifiedTopic("Biology", "The basic structural and functional unit of life is the:")).toBe("Cell Biology and Metabolism");
  });

  it("leaves unsupported placeholder questions unclassified instead of inventing a topic", () => {
    expect(inferVerifiedTopic("Physics", "Which option is correct?")).toBeNull();
    expect(inferTopicFromQuestion("Physics", "Which option is correct?", "To be tagged during syllabus mapping")).toBe("Unclassified");
  });
});
