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

const subscriptCharacters: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "+": "₊",
  "-": "₋",
};

const latexSymbols: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  Delta: "Δ",
  theta: "θ",
  lambda: "λ",
  mu: "μ",
  pi: "π",
  rho: "ρ",
  sigma: "σ",
  Sigma: "Σ",
  phi: "φ",
  omega: "ω",
  Omega: "Ω",
  pm: "±",
  times: "×",
  cdot: "·",
  div: "÷",
  equiv: "≡",
  propto: "∝",
  le: "≤",
  leq: "≤",
  ge: "≥",
  geq: "≥",
  neq: "≠",
  approx: "≈",
  infty: "∞",
  rightarrow: "→",
  leftarrow: "←",
  leftrightarrow: "↔",
  rightleftharpoons: "⇌",
  circ: "°",
  degree: "°",
};

function unicodeExponent(value: string, symbols: Record<string, string>): string {
  return Array.from(value).map((character) => symbols[character] ?? character).join("");
}

/**
 * Converts common source LaTeX into readable plain Unicode. It intentionally
 * does not interpret equations or change the stored question source.
 */
function formatCommonLatex(value: string): string {
  let formatted = value
    .replace(/\$([^$]+)\$/g, (_match, content: string) => (/\\[A-Za-z]+|[{}^_]/.test(content) ? content : _match))
    .replace(/\\\[\s*([^\]]+?)\s*\\\]/g, "$1")
    .replace(/\\\(\s*([^\)]+?)\s*\\\)/g, "$1")
    .replace(/\\(?:text|textrm|mathrm|mathbf|mathit|operatorname)\{([^{}]*)\}/g, "$1")
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2")
    .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
    .replace(/\\(?:left|right)\b\s*/g, "")
    .replace(/\\[,!;:\s]+/g, " ")
    .replace(/\^\{\\(?:circ|degree)\}|\^\\(?:circ|degree)/g, "°")
    .replace(/\\(?:circ|degree)/g, "°")
    .replace(/\\([A-Za-z]+)\b/g, (_match, name: string) => latexSymbols[name] ?? name)
    .replace(/[{}]/g, "");

  formatted = formatted
    .replace(/([A-Za-z])�([0-9+-])/g, (_match, base: string, subscript: string) => `${base}${unicodeExponent(subscript, subscriptCharacters)}`)
    .replace(/([A-Za-z0-9)\]])\^\{?([0-9+-]+)\}?/g, (_match, base: string, exponent: string) => (
      `${base}${unicodeExponent(exponent, superscriptCharacters)}`
    ))
    .replace(/([A-Za-z0-9)\]])_\{?([0-9+-]+)\}?/g, (_match, base: string, subscript: string) => (
      `${base}${unicodeExponent(subscript, subscriptCharacters)}`
    ));

  return formatted.replace(/\s{2,}/g, " ").trim();
}

/**
 * Keeps the stored source wording intact while presenting compact numerical
 * exponents in readable Unicode notation on learner cards.
 */
export function formatLearnerText(value: string | null | undefined): string {
  if (typeof value !== "string") return value ?? "";
  return formatCommonLatex(value);
}
