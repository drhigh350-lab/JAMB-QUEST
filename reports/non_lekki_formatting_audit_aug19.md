# Non-Lekki Question Formatting Audit — August 19

## Scope

The audit inspected **3,665 live non-Lekki questions** outside the previously exported short-explanation revision CSV. The bundled model bank and active authorised bank were both included. The optional Lekki Headmaster novel was explicitly excluded.

## Safe learner-facing repairs

| Check | Records identified | Treatment |
| --- | ---: | --- |
| ASCII numerical exponent such as `F^6` | 84 | The learner interface now presents numerical exponents as Unicode superscripts, for example `F⁶`, without changing stored source text. |
| Retained short underscore English blank | 31 | The learner interface now renders a clear five-underscore answer gap without changing stored source text. |
| Explicitly truncated English passage stem | 1 | Record `1020002` is held from gameplay because its retained source states that the question stem was cut off. No replacement context was invented. |

## Source-review candidates

The audit identified **187 authorised Use-of-English records** whose sentence-and-options form may need the original instruction or emphasis restored. These are not automatically rewritten: a topic label alone is not enough evidence to infer whether the prompt should say “opposite in meaning,” “nearest in meaning,” or another direction. The audit CSV is retained at `/home/ubuntu/jamb-quest-non-lekki-formatting-audit.csv` for source-by-source review.

> The future-batch gate accepts display-safe gaps and detects ASCII exponent presentation needs, but directs any explicitly missing English stem or context to review instead of inventing wording.

For every incoming 100-question JSON batch, run `pnpm tsx scripts/checkQuestionFormattingBatch.mts <batch.json> <report.json>` before staging or importing. A non-zero result means at least one record is explicitly incomplete and must remain outside gameplay until its source context is available.
