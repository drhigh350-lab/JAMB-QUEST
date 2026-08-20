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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="JAMB Quest achievement card for ${label}"><rect width="1600" height="900" fill="#12283f"/><path d="M0 740 L1600 520 L1600 900 L0 900 Z" fill="${style.accent}"/><rect x="64" y="64" width="1472" height="772" rx="34" fill="#fffdf5" stroke="#12283f" stroke-width="18"/><rect x="97" y="97" width="1406" height="706" rx="20" fill="none" stroke="${style.accent}" stroke-width="8"/><g transform="translate(160 154)"><path d="M0 0 H58 L47 64 H-11 Z" fill="#12283f"/><path d="M66 0 H124 L135 64 H55 Z" fill="${style.accent}"/><path d="M-11 72 H47 L58 136 H-22 Z" fill="#12283f"/><path d="M55 72 H135 L124 136 H44 Z" fill="#12283f"/></g><text x="272" y="174" fill="#12283f" font-family="Arial, sans-serif" font-size="30" font-weight="800" letter-spacing="6">JAMB QUEST</text><text x="272" y="218" fill="#12283f" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="4">${style.label}</text><g transform="translate(800 356)"><circle r="142" fill="${style.accent}" stroke="#12283f" stroke-width="18"/><circle r="100" fill="#fffdf5" stroke="#12283f" stroke-width="8"/><text x="0" y="38" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="118" font-weight="900">${style.icon}</text><path d="M-118 122 L-198 302 L-70 250 L0 336 L70 250 L198 302 L118 122" fill="#12283f" stroke="#12283f" stroke-width="14" stroke-linejoin="round"/></g><text x="800" y="588" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="68" font-weight="900">${label}</text><text x="800" y="646" text-anchor="middle" fill="#2f7d4a" font-family="Arial, sans-serif" font-size="36" font-weight="800">${learnerName}</text><text x="800" y="698" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="29">${note}</text><text x="800" y="742" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="25" font-weight="700">${escapeXml(evidence)} · ${earnedOn}</text><text x="800" y="782" text-anchor="middle" fill="#12283f" font-family="Arial, sans-serif" font-size="20" font-weight="800" letter-spacing="4">BUILD YOUR SYSTEM. WIN JAMB.</text></svg>`;
}

function createCardFile(card: EarnedAchievementShareCard) {
  const blob = new Blob([buildAchievementShareCardSvg(card)], { type: "image/svg+xml;charset=utf-8" });
  return new File([blob], `jamb-quest-${safeFilename(card.label)}-achievement.svg`, { type: blob.type });
}

export function downloadAchievementShareCard(card: EarnedAchievementShareCard): void {
  if (typeof document === "undefined") return;
  const file = createCardFile(card);
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function shareAchievementShareCard(card: EarnedAchievementShareCard): Promise<"shared" | "downloaded" | "unavailable"> {
  if (typeof navigator === "undefined") return "unavailable";
  const file = createCardFile(card);
  const data = {
    title: `JAMB Quest · ${card.label}`,
    text: `I earned the ${card.label} achievement in JAMB Quest. Build your system. Win JAMB.`,
    files: [file],
  };
  try {
    if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(data))) {
      await navigator.share(data);
      return "shared";
    }
  } catch {
    // A dismissed native share sheet leaves the achievement available to download instead.
  }
  if (typeof document !== "undefined") {
    downloadAchievementShareCard(card);
    return "downloaded";
  }
  return "unavailable";
}
