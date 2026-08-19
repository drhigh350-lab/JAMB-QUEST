# Non-Lekki Question Formatting Audit — August 19

## Scope

The refreshed audit inspected **3,664 live non-Lekki questions** outside the previously exported short-explanation revision CSV across Use of English, Biology, Chemistry, and Physics. The bundled model bank and active authorised bank were both included. The optional Lekki Headmaster novel was explicitly excluded.

## Safe learner-facing repairs

| Check | Records identified | Treatment |
| --- | ---: | --- |
| ASCII numerical exponent such as `F^6` | 84 | The learner interface now presents numerical exponents as Unicode superscripts, for example `F⁶`, without changing stored source text. |
| Retained short underscore English blank | 31 | The learner interface now renders a clear five-underscore answer gap without changing stored source text. |
| Explicitly truncated English passage stem | 1 | Record `1020002` is held from gameplay because its retained source states that the question stem was cut off. No replacement context was invented. |

## Source-review candidates

The audit identified **187 authorised Use-of-English records** whose sentence-and-options form may need the original instruction or emphasis restored. These are not automatically rewritten: a topic label alone is not enough evidence to infer whether the prompt should say “opposite in meaning,” “nearest in meaning,” or another direction. The audit CSV is retained at `/home/ubuntu/jamb-quest-non-lekki-formatting-audit.csv` for source-by-source review. In total, the live audit now has 271 records with a formatting or source-review signal: 84 superscript-display needs, 31 short underscore gaps, and 187 source-context candidates (some records have more than one signal).

The retained owner English source files for questions 1–100 were inspected. They preserve topic labels, sentence stems, options, answer keys, and explanations, but they do not preserve a common original instruction line above the sentence-only lexis, grammar, idiom, and completion items. Their explanations frequently identify the tested relationship (for example, closest meaning or antonym), but that does not prove the exact original prompt wording. Those instructions therefore remain source-review candidates rather than being silently fabricated.

## Cross-subject audit result

The cross-subject run found no additional active Biology, Chemistry, or Physics record with an explicit source-loss marker or an unlinked referenced graph, diagram, table, structure, or apparatus visual. The 271 formatting signals were distributed as follows: 48 Chemistry, 36 Physics, 187 Use of English, and 0 Biology. The Chemistry and Physics signals are learner-text superscript presentation cases, already repaired at render time without changing source records. The Use-of-English signals are the 187 instruction/context candidates retained for source review, plus 31 display-safe short underscore gaps.

> The future-batch gate accepts display-safe gaps and detects ASCII exponent presentation needs, but directs any explicitly missing English stem or context to review instead of inventing wording.

For every incoming 100-question JSON batch, run `pnpm tsx scripts/checkQuestionFormattingBatch.mts <batch.json> <report.json>` before staging or importing. A non-zero result means at least one record is explicitly incomplete and must remain outside gameplay until its source context is available.
