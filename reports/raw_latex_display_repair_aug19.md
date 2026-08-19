# Raw LaTeX Display Repair — 19 August 2026

## Reported defect

An active Chemistry question displayed source LaTeX commands such as `25^\circ\text{C}` and `1\text{atm}` directly to learners. This was not an acceptable learner-facing format.

## Repair

The shared display formatter now converts common source notation without rewriting stored question records. It renders temperature and unit expressions such as `25°C`, `1 atm`, and `760 mmHg`; chemical indices such as `H₂O` and `SO₄²⁻`; and common mathematical symbols, fractions, square roots, and reaction arrows. The formatter is used for prompts, source contexts, answer options, and explanation text in both practice/CBT and saved CBT corrections.

## Audit and prevention

The current 1,000-question model bank contains zero raw LaTeX-command records. The authorised active bank has 23 Chemistry records with source command syntax; the display repair covers their prompt, option, and explanation fields. The future-batch gate now marks any raw LaTeX command syntax as `needs_review`, so it must be converted before release.

## Validation

The exact reported STP syntax, common scientific units, chemical subscripts/superscripts, fractions, and reaction arrows are covered by regression tests. Full validation passed: 76 Vitest files / 199 tests, TypeScript, and production build.
