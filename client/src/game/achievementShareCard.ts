import type { AchievementBadge } from "./achievements";
import { downloadSvgCard, shareSvgCard, type ShareCardResult } from "./shareCardFile";

export type EarnedAchievementShareCard = Pick<AchievementBadge, "key" | "label" | "note" | "category" | "target"> & {
  learnerName: string;
  evidenceValue: number;
  earnedOn?: string;
};

const CATEGORY_STYLE = {
  practice: { accent: "#f4b228", label: "PRACTICE ACHIEVEMENT", icon: "◆" },
  consistency: { accent: "#2f7d4a", label: "CONSISTENCY ACHIEVEMENT", icon: "✦" },
  mastery: { accent: "#3b8399", label: "MASTERY ACHIEVEMENT", icon: "◈" },
  exam: { accent: "#b86d39", label: "EXAM ACHIEVEMENT", icon: "★" },
} as const;

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "achievement";
}

export function buildAchievementShareCardSvg(card: EarnedAchievementShareCard): string {
  const style = CATEGORY_STYLE[card.category];
  const learnerName = escapeXml(card.learnerName.trim() || "JAMB Quest learner");
  const label = escapeXml(card.label);
  const note = escapeXml(card.note);
  const evidence = `${Math.max(card.evidenceValue, card.target).toLocaleString()} / ${card.target.toLocaleString()} evidence reached`;
  const earnedOn = escapeXml(card.earnedOn || "Recorded in JAMB Quest");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" role="img" aria-label="JAMB Quest achievement wallpaper for ${label}"><rect width="1080" height="1920" fill="#12283f"/><path d="M0 1550 L1080 1330 L1080 1920 L0 1920 Z" fill="${style.accent}"/><rect x="46" y="46" width="988" height="1828" rx="40" fill="#fffdf5" stroke="#12283f" stroke-width="18"/><rect x="78" y="78" width="924" height="1764" rx="24" fill="none" stroke="${style.accent}" stroke-width="8"/><g transform="translate(126 142)"><path d="M0 0 H50 L41 56 H-9 Z" fill="#12283f"/><path d="M58 0 H108 L117 56 H49 Z" fill="${style.accent}"/><path d="M-9 64 H41 L50 120 H-18 Z" fill="#12283f"/><path d="M49 64 H117 L108 120 H40 Z" fill="#12283f"/></g><text x="248" y="154" fill="#12283f" font-family="Arial, sans-serif" font-size="27" font-weight="800" letter-spacing="5">JAMB QUEST</text><text x="248" y="196" fill="#12283f" font-family="Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="3">${style.label}</text><line x1="126" y1="270" x2="954" y2="270" stroke="${style.accent}" stroke-width="5"/><g transform="translate(540 650)"><circle r="128" fill="${style.accent}" stroke="#12283f" stroke-width="18"/><circle r="88" fill="#fffdf5" stroke="#12283f" stroke-width="8"/><text x="0" y="31" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="98" font-weight="900">${style.icon}</text><path d="M-104 108 L-178 294 L-62 246 L0 334 L62 246 L178 294 L104 108" fill="#12283f" stroke="#12283f" stroke-width="12" stroke-linejoin="round"/></g><text x="540" y="1135" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="66" font-weight="900" textLength="810" lengthAdjust="spacingAndGlyphs">${label}</text><text x="540" y="1200" text-anchor="middle" fill="#2f7d4a" font-family="Arial, sans-serif" font-size="40" font-weight="800" textLength="680" lengthAdjust="spacingAndGlyphs">${learnerName}</text><text x="540" y="1300" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="31" textLength="820" lengthAdjust="spacingAndGlyphs">${note}</text><text x="540" y="1360" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="27" font-weight="700" textLength="860" lengthAdjust="spacingAndGlyphs">${escapeXml(evidence)}</text><text x="540" y="1410" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="24" font-weight="700" textLength="760" lengthAdjust="spacingAndGlyphs">${earnedOn}</text><text x="540" y="1728" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="20" font-weight="900" letter-spacing="4">BUILD YOUR SYSTEM.</text><text x="540" y="1770" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="20" font-weight="900" letter-spacing="4">WIN JAMB.</text></svg>`;
}

function createCardFile(card: EarnedAchievementShareCard) {
  return { svg: buildAchievementShareCardSvg(card), filename: `jamb-quest-${safeFilename(card.label)}-achievement.svg` };
}

export function downloadAchievementShareCard(card: EarnedAchievementShareCard): void {
  const file = createCardFile(card);
  downloadSvgCard(file.svg, file.filename);
}

export async function shareAchievementShareCard(card: EarnedAchievementShareCard): Promise<ShareCardResult> {
  const file = createCardFile(card);
  return shareSvgCard({
    ...file,
    width: 1080,
    height: 1920,
    title: `JAMB Quest · ${card.label}`,
    text: `I earned the ${card.label} achievement in JAMB Quest. Build your system. Win JAMB.`,
  });
}
