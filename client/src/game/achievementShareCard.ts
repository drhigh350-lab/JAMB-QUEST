import { OFFICIAL_JAMB_QUEST_WORDMARK_URL } from "./jambQuestBrand";
import { downloadSvgCard, shareSvgCard, type ShareCardResult } from "./shareCardFile";
import type { AchievementBadge } from "./achievements";

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
  return value.replace(/[<>&"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "achievement";
}

function wordmarkHref() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return new URL(OFFICIAL_JAMB_QUEST_WORDMARK_URL, window.location.origin).href;
  }
  return OFFICIAL_JAMB_QUEST_WORDMARK_URL;
}

/** Break text by words instead of forcing glyphs to fit a fixed SVG width. */
function wrapCardText(value: string, maxCharacters: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && candidate.length > maxCharacters) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function svgTextBlock(lines: string[], x: number, y: number, lineHeight: number, attributes: string) {
  return `<text x="${x}" y="${y}" text-anchor="middle" ${attributes}>${lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join("")}</text>`;
}

export function buildAchievementShareCardSvg(card: EarnedAchievementShareCard): string {
  const style = CATEGORY_STYLE[card.category];
  const titleLines = wrapCardText(card.label, 20);
  const learnerLines = wrapCardText(card.learnerName.trim() || "JAMB Quest learner", 28);
  const noteLines = wrapCardText(card.note, 42);
  const evidenceLines = [`${Math.max(card.evidenceValue, card.target).toLocaleString()} / ${card.target.toLocaleString()}`, "evidence reached"];
  const earnedLines = wrapCardText(card.earnedOn || "Recorded in JAMB Quest", 38);
  const titleY = 1100;
  const titleBottom = titleY + (titleLines.length - 1) * 70;
  const learnerY = titleBottom + 92;
  const learnerBottom = learnerY + (learnerLines.length - 1) * 48;
  const noteY = learnerBottom + 70;
  const noteBottom = noteY + (noteLines.length - 1) * 40;
  const evidenceY = noteBottom + 66;
  const evidenceBottom = evidenceY + 42;
  const earnedY = evidenceBottom + 55;
  const title = svgTextBlock(titleLines, 540, titleY, 70, 'fill="#12283f" font-family="Arial, sans-serif" font-size="68" font-weight="900"');
  const learner = svgTextBlock(learnerLines, 540, learnerY, 48, 'fill="#2f7d4a" font-family="Arial, sans-serif" font-size="44" font-weight="800"');
  const note = svgTextBlock(noteLines, 540, noteY, 40, 'fill="#12283f" font-family="Arial, sans-serif" font-size="32"');
  const evidence = svgTextBlock(evidenceLines, 540, evidenceY, 42, 'fill="#12283f" font-family="Arial, sans-serif" font-size="31" font-weight="800"');
  const earned = svgTextBlock(earnedLines, 540, earnedY, 34, 'fill="#12283f" font-family="Arial, sans-serif" font-size="25" font-weight="700"');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" role="img" aria-label="JAMB Quest achievement wallpaper for ${escapeXml(card.label)}"><rect width="1080" height="1920" fill="#12283f"/><path d="M0 1550 L1080 1330 L1080 1920 L0 1920 Z" fill="${style.accent}"/><rect x="46" y="46" width="988" height="1828" rx="40" fill="#fffdf5" stroke="#12283f" stroke-width="18"/><rect x="78" y="78" width="924" height="1764" rx="24" fill="none" stroke="${style.accent}" stroke-width="8"/><image href="${wordmarkHref()}" x="124" y="110" width="438" height="126" preserveAspectRatio="xMinYMid meet"/><text x="126" y="258" fill="#12283f" font-family="Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="3">${style.label}</text><line x1="126" y1="294" x2="954" y2="294" stroke="${style.accent}" stroke-width="5"/><g transform="translate(540 650)"><circle r="128" fill="${style.accent}" stroke="#12283f" stroke-width="18"/><circle r="88" fill="#fffdf5" stroke="#12283f" stroke-width="8"/><text x="0" y="31" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="98" font-weight="900">${style.icon}</text><path d="M-104 108 L-178 294 L-62 246 L0 334 L62 246 L178 294 L104 108" fill="#12283f" stroke="#12283f" stroke-width="12" stroke-linejoin="round"/></g>${title}${learner}${note}${evidence}${earned}<text x="540" y="1728" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="20" font-weight="900" letter-spacing="4">BUILD YOUR SYSTEM.</text><text x="540" y="1770" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="20" font-weight="900" letter-spacing="4">WIN JAMB.</text></svg>`;
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
