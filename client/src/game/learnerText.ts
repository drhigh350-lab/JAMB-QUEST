const superscriptCharacters: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
};

/**
 * Keeps the stored source wording intact while presenting compact numerical
 * exponents in readable Unicode notation on learner cards.
 */
export function formatLearnerText(value: string | null | undefined): string {
  if (typeof value !== "string") return value ?? "";
  return value.replace(/([A-Za-z0-9)\]])\^([0-9+-]+)/g, (_match, base: string, exponent: string) => (
    `${base}${Array.from(exponent).map((character) => superscriptCharacters[character] ?? character).join("")}`
  ));
}
