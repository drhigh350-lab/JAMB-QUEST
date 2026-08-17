export type AchievementEvidence = {
  totalAnswered: number;
  totalCorrect: number;
  roundsPlayed: number;
  longestStreak: number;
  comebackXp: number;
  activeDays: number;
  completedGoalDays: number;
  cbtRounds: number;
  fullMocks: number;
  subjectsPractised: string[];
  subjectPerformance: Array<{ subject: string; attempts: number; accuracy: number }>;
};

export type AchievementBadge = {
  key: string;
  label: string;
  note: string;
  category: "practice" | "consistency" | "mastery" | "exam";
  target: number;
  value: (evidence: AchievementEvidence) => number;
};

const thresholdBadges = (prefix: string, category: AchievementBadge["category"], measure: (evidence: AchievementEvidence) => number, entries: Array<[number, string, string]>): AchievementBadge[] => entries.map(([target, label, note]) => ({ key: `${prefix}-${target}`, label, note, category, target, value: measure }));

export const ACHIEVEMENT_BADGES: AchievementBadge[] = [
  ...thresholdBadges("answers", "practice", (e) => e.totalAnswered, [[1, "First mark", "Answer your first question"], [10, "Warm start", "Answer 10 questions"], [50, "Half-century", "Answer 50 questions"], [100, "Century builder", "Answer 100 questions"], [250, "Question hunter", "Answer 250 questions"], [500, "Practice engine", "Answer 500 questions"], [1000, "Four-figure focus", "Answer 1,000 questions"], [2500, "Bank breaker", "Answer 2,500 questions"]]),
  ...thresholdBadges("correct", "mastery", (e) => e.totalCorrect, [[10, "First corrections", "Get 10 answers correct"], [50, "Corrector", "Get 50 answers correct"], [100, "Accuracy hundred", "Get 100 answers correct"], [250, "Knowledge builder", "Get 250 answers correct"], [500, "Answer architect", "Get 500 answers correct"], [1000, "Mastery thousand", "Get 1,000 answers correct"]]),
  ...thresholdBadges("rounds", "practice", (e) => e.roundsPlayed, [[1, "Round one", "Complete your first round"], [5, "Practice rhythm", "Complete 5 rounds"], [10, "Ten-set system", "Complete 10 rounds"], [25, "Deliberate learner", "Complete 25 rounds"], [50, "Quest regular", "Complete 50 rounds"]]),
  ...thresholdBadges("streak", "consistency", (e) => e.longestStreak, [[3, "Three-day builder", "Reach a 3-day streak"], [7, "Week keeper", "Reach a 7-day streak"], [14, "Two-week system", "Reach a 14-day streak"], [30, "Monthly momentum", "Reach a 30-day streak"], [60, "Unbreakable", "Reach a 60-day streak"]]),
  ...thresholdBadges("active-days", "consistency", (e) => e.activeDays, [[3, "Show up", "Study on 3 different days"], [7, "Seven-day record", "Study on 7 different days"], [14, "Calendar builder", "Study on 14 different days"], [30, "Monthly record", "Study on 30 different days"], [60, "Long-game learner", "Study on 60 different days"]]),
  ...thresholdBadges("goal-days", "consistency", (e) => e.completedGoalDays, [[1, "Goal met", "Complete a daily study goal"], [5, "Five goals", "Complete 5 daily goals"], [10, "Goal system", "Complete 10 daily goals"], [25, "Quarter-century goals", "Complete 25 daily goals"], [50, "Goal legend", "Complete 50 daily goals"]]),
  ...thresholdBadges("xp", "practice", (e) => e.comebackXp, [[100, "Momentum", "Earn 100 XP"], [500, "Serious system", "Earn 500 XP"], [1000, "1,000 XP club", "Earn 1,000 XP"], [2500, "System strong", "Earn 2,500 XP"], [5000, "Quest champion", "Earn 5,000 XP"]]),
  ...thresholdBadges("cbt", "exam", (e) => e.cbtRounds, [[1, "Timed start", "Complete a timed CBT"], [5, "CBT regular", "Complete 5 timed CBTs"], [10, "Exam ready", "Complete 10 timed CBTs"]]),
  ...thresholdBadges("mock", "exam", (e) => e.fullMocks, [[1, "Full mock baseline", "Complete one 180-question mock"], [3, "Mock analyst", "Complete 3 full mocks"], [5, "Mock veteran", "Complete 5 full mocks"]]),
  { key: "accuracy-70", label: "Steady accuracy", note: "Reach 70% in a subject over 20 attempts", category: "mastery", target: 1, value: (e) => e.subjectPerformance.some((item) => item.attempts >= 20 && item.accuracy >= 70) ? 1 : 0 },
  { key: "accuracy-80", label: "Strong accuracy", note: "Reach 80% in a subject over 50 attempts", category: "mastery", target: 1, value: (e) => e.subjectPerformance.some((item) => item.attempts >= 50 && item.accuracy >= 80) ? 1 : 0 },
  { key: "accuracy-90", label: "Precision", note: "Reach 90% in a subject over 100 attempts", category: "mastery", target: 1, value: (e) => e.subjectPerformance.some((item) => item.attempts >= 100 && item.accuracy >= 90) ? 1 : 0 },
  { key: "subjects-2", label: "Two-subject balance", note: "Practise two core subjects", category: "mastery", target: 2, value: (e) => e.subjectsPractised.length },
  { key: "subjects-4", label: "Four-subject balance", note: "Practise all four core subjects", category: "mastery", target: 4, value: (e) => e.subjectsPractised.length },
];

export function summariseAchievements(evidence: AchievementEvidence) {
  const badges = ACHIEVEMENT_BADGES.map((badge) => {
    const value = Math.max(0, badge.value(evidence));
    return { ...badge, value, earned: value >= badge.target, progress: Math.min(1, value / badge.target) };
  });
  return { badges, earned: badges.filter((badge) => badge.earned), next: badges.find((badge) => !badge.earned) ?? null };
}
