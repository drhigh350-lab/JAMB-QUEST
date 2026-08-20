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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="JAMB Quest daily goal completion achievement"><rect width="1600" height="900" fill="#12283f"/><path d="M0 690 L1600 470 L1600 900 L0 900 Z" fill="#f4b228"/><rect x="74" y="74" width="1452" height="752" rx="28" fill="#fffdf5" stroke="#12283f" stroke-width="16"/><rect x="104" y="104" width="1392" height="692" rx="12" fill="none" stroke="#f4b228" stroke-width="8"/><g transform="translate(800 252)"><circle r="116" fill="#f4b228" stroke="#12283f" stroke-width="18"/><path d="M-36 -78 H36 V-34 H82 V36 H36 V80 H-36 V36 H-82 V-34 H-36 Z" fill="#12283f"/><path d="M-104 87 L-174 224 L-68 180 L-2 260 L68 180 L174 224 L104 87" fill="#2f7d4a" stroke="#12283f" stroke-width="14" stroke-linejoin="round"/></g><text x="800" y="444" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="8">JAMB QUEST · DAILY SYSTEM</text><text x="800" y="530" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="68" font-weight="800">GOAL COMPLETE</text><text x="800" y="596" text-anchor="middle" fill="#2f7d4a" font-family="Arial, sans-serif" font-size="40" font-weight="700">${learnerName}</text><text x="800" y="655" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="31">${achievement.correctCount}/${achievement.questionsAnswered} correct · ${accuracy}% accuracy · ${achievement.goalCount} question goal</text><text x="800" y="708" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="25">${achievement.streak} day system · ${dateLabel}</text><text x="800" y="762" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="4">BUILD YOUR SYSTEM. WIN JAMB.</text></svg>`;
}

function createDailyGoalAchievementFile(achievement: DailyGoalAchievement) {
  return new File([buildDailyGoalAchievementSvg(achievement)], `jamb-quest-goal-complete-${(achievement.dateKey || "today").replace(/[^a-z0-9-]/gi, "-")}.svg`, { type: "image/svg+xml;charset=utf-8" });
}

export function downloadDailyGoalAchievement(achievement: DailyGoalAchievement): void {
  if (typeof document === "undefined") return;
  const file = createDailyGoalAchievementFile(achievement);
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function shareDailyGoalAchievement(achievement: DailyGoalAchievement): Promise<"shared" | "downloaded" | "unavailable"> {
  if (typeof navigator === "undefined") return "unavailable";
  const file = createDailyGoalAchievementFile(achievement);
  const data = { title: "JAMB Quest · Goal complete", text: "I completed my JAMB Quest goal today. Build your system. Win JAMB.", files: [file] };
  try {
    if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(data))) {
      await navigator.share(data);
      return "shared";
    }
  } catch {
    // A dismissed native sheet leaves the learner with a download fallback.
  }
  if (typeof document !== "undefined") {
    downloadDailyGoalAchievement(achievement);
    return "downloaded";
  }
  return "unavailable";
}
