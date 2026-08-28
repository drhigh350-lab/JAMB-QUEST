import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const challenge = readFileSync(new URL("../client/src/components/ChallengeMode.tsx", import.meta.url), "utf8");

describe("Challenge Mode shared-link UI contract", () => {
  it("passes the complete approved bank separately from the normal game list", () => {
    expect(app).toContain("challengeQuestions={authorisedQuestionsQuery.data ?? offlineAuthorisedQuestions}");
    expect(home).toContain("const arcadeQuestions = challengeQuestions.length ? challengeQuestions : activeQuestions;");
    expect(home).toContain("<ChallengeMode questions={arcadeQuestions}");
  });

  it("shows subject filters and shared challenge actions", () => {
    expect(challenge).toContain("Choose question subject");
    expect(challenge).toContain("Play this challenge");
    expect(challenge).toContain("See leaderboard");
    expect(challenge).toContain("Create your own");
  });
});
