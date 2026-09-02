import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const db = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
const ownerReview = readFileSync(new URL("../client/src/components/OwnerQuestionReview.tsx", import.meta.url), "utf8");
const challenge = readFileSync(new URL("../client/src/components/ChallengeMode.tsx", import.meta.url), "utf8");
const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")) as { buildCommand: string; outputDirectory: string; installCommand: string };
const handover = readFileSync(new URL("../OWNER_AND_VERCEL.md", import.meta.url), "utf8");

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

  it("keeps Arcade out of Practice and exposes it as its own tab", () => {
    expect(home).toContain('{ id: "arcade", label: "Arcade", icon: Swords }');
    expect(home).toContain('if (activeTab === "arcade") return <GameArcade');
    expect(home).not.toContain('data-testid="game-arcade-destination"');
  });

  it("keeps the first Arena discovery slice wired to safe public challenges", () => {
    expect(router).toContain("discover: publicProcedure");
    expect(router).toContain("visibility: z.enum([\"link_only\", \"public\"]).default(\"link_only\")");
    expect(challenge).toContain("Public Arena — show it in Discover");
    expect(challenge).toContain("Short description (optional)");
  });

  it("keeps owner corrections guarded and visible in the review desk", () => {
    expect(router).toContain("correctApprovedQuestion: adminProcedure");
    expect(router).toContain("correctionHistory: adminProcedure");
    expect(db).toContain("Lekki Headmaster records are protected");
    expect(db).toContain("Only approved JAMB Quest questions can be corrected here");
    expect(ownerReview).toContain("Correct this question");
    expect(ownerReview).toContain("Save correction");
  });

  it("keeps the Vercel handover explicit and buildable", () => {
    expect(vercel.installCommand).toBe("pnpm install --frozen-lockfile");
    expect(vercel.buildCommand).toBe("pnpm run build");
    expect(vercel.outputDirectory).toBe("dist/public");
    expect(handover).toContain("frontend-only Vercel deployment is not a complete JAMB Quest deployment");
    expect(handover).toContain("The repository is `drhigh350-lab/JAMB-QUEST`");
  });
});
