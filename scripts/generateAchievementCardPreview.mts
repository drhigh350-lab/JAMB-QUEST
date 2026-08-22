import { writeFile } from "node:fs/promises";

const previewOrigin = "https://3000-iobewn6v6k0sqroneio5d-c3a4c244.us4.manus.computer";
(globalThis as typeof globalThis & { window?: { location: { origin: string } } }).window = { location: { origin: previewOrigin } };
const { buildAchievementShareCardSvg } = await import("../client/src/game/achievementShareCard");

const svg = buildAchievementShareCardSvg({
  key: "answers-250",
  label: "Knowledge builder",
  note: "Get 250 answers correct",
  category: "mastery",
  target: 250,
  evidenceValue: 342,
  learnerName: "Dr. High",
  earnedOn: "Recorded in JAMB Quest",
});
await writeFile("/tmp/jamb-quest-achievement-card-preview.svg", svg, "utf8");
console.log("/tmp/jamb-quest-achievement-card-preview.svg");
