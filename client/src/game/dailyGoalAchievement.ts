export type DailyGoalAchievement = {
  learnerName: string;
  dateKey: string;
  goalCount: number;
  questionsAnswered: number;
  correctCount: number;
  streak: number;
};

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

export function buildDailyGoalAchievementSvg(achievement: DailyGoalAchievement): string {
  const accuracy = achievement.questionsAnswered ? Math.round((achievement.correctCount / achievement.questionsAnswered) * 100) : 0;
  const learnerName = escapeXml(achievement.learnerName.trim() || "JAMB Quest learner");
  const dateLabel = escapeXml(achievement.dateKey || "today");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" role="img" aria-label="JAMB Quest daily goal completion wallpaper"><rect width="1080" height="1920" fill="#12283f"/><path d="M0 1560 L1080 1330 L1080 1920 L0 1920 Z" fill="#f4b228"/><rect x="46" y="46" width="988" height="1828" rx="40" fill="#fffdf5" stroke="#12283f" stroke-width="18"/><rect x="78" y="78" width="924" height="1764" rx="24" fill="none" stroke="#f4b228" stroke-width="8"/><text x="540" y="198" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="23" font-weight="800" letter-spacing="6">JAMB QUEST · DAILY SYSTEM</text><line x1="126" y1="270" x2="954" y2="270" stroke="#f4b228" stroke-width="5"/><g transform="translate(540 650)"><circle r="124" fill="#f4b228" stroke="#12283f" stroke-width="18"/><path d="M-38 -82 H38 V-36 H84 V38 H38 V84 H-38 V38 H-84 V-36 H-38 Z" fill="#12283f"/><path d="M-112 96 L-178 286 L-62 234 L0 326 L62 234 L178 286 L112 96" fill="#2f7d4a" stroke="#12283f" stroke-width="14" stroke-linejoin="round"/></g><text x="540" y="1110" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="72" font-weight="900">GOAL COMPLETE</text><text x="540" y="1180" text-anchor="middle" fill="#2f7d4a" font-family="Arial, sans-serif" font-size="40" font-weight="800" textLength="680" lengthAdjust="spacingAndGlyphs">${learnerName}</text><text x="540" y="1300" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="31" textLength="820" lengthAdjust="spacingAndGlyphs">${achievement.correctCount}/${achievement.questionsAnswered} correct · ${accuracy}% accuracy</text><text x="540" y="1360" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="28" textLength="760" lengthAdjust="spacingAndGlyphs">${achievement.goalCount} question goal · ${achievement.streak} day system</text><text x="540" y="1420" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="24">${dateLabel}</text><text x="540" y="1728" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="20" font-weight="900" letter-spacing="4">BUILD YOUR SYSTEM.</text><text x="540" y="1770" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="20" font-weight="900" letter-spacing="4">WIN JAMB.</text></svg>`;
}

function createDailyGoalAchievementFile(achievement: DailyGoalAchievement) {
  return { svg: buildDailyGoalAchievementSvg(achievement), filename: `jamb-quest-goal-complete-${(achievement.dateKey || "today").replace(/[^a-z0-9-]/gi, "-")}.svg` };
}

export function downloadDailyGoalAchievement(achievement: DailyGoalAchievement): void {
  const file = createDailyGoalAchievementFile(achievement);
  downloadSvgCard(file.svg, file.filename);
}

export async function shareDailyGoalAchievement(achievement: DailyGoalAchievement): Promise<ShareCardResult> {
  const file = createDailyGoalAchievementFile(achievement);
  return shareSvgCard({ ...file, width: 1080, height: 1920, title: "JAMB Quest · Goal complete", text: "I completed my JAMB Quest goal today. Build your system. Win JAMB." });
}
import { downloadSvgCard, shareSvgCard, type ShareCardResult } from "./shareCardFile";
