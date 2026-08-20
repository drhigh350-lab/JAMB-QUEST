import { writeFile } from "node:fs/promises";
import { buildAchievementShareCardSvg } from "../client/src/game/achievementShareCard.ts";

const svg = buildAchievementShareCardSvg({
  key: "answers-250",
  label: "Question hunter",
  note: "Answer 250 questions",
  category: "practice",
  target: 250,
  evidenceValue: 437,
  learnerName: "Divine High",
  earnedOn: "Recorded in JAMB Quest",
});

await writeFile("/home/ubuntu/jamb-quest-achievement-card-preview.svg", svg, "utf8");
