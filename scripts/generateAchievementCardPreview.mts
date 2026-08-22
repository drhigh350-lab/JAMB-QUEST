import { writeFile } from "node:fs/promises";
import { buildAchievementShareCardSvg } from "../client/src/game/achievementShareCard";

const svg = buildAchievementShareCardSvg({
  key: "answers-100",
  label: "Century builder",
  note: "Answer 100 questions",
  category: "practice",
  target: 100,
  evidenceValue: 437,
  learnerName: "Dr. High",
  earnedOn: "Recorded in JAMB Quest",
});
await writeFile("/tmp/jamb-quest-achievement-card-preview.svg", svg, "utf8");
console.log("/tmp/jamb-quest-achievement-card-preview.svg");
