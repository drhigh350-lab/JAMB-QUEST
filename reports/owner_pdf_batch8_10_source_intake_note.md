# Owner PDF and Batch 8–10 Intake Evidence

The owner supplied `jamb_questions_only.pdf` together with `Batch8_Chem201-250_Phys1-50.md`, `Physics_Batch9_Q51-150.md`, and `Physics_Batch10_Q151-250_FINAL.md` on 25 August 2026. The PDF is the raw source for question stems and four answer options; the Markdown files provide answer letters, answer text, and explanations.

The PDF’s Physics section contains exactly 250 numbered records. Its Physics questions 1–50 align with Batch 8, 51–150 align with Batch 9, and 151–250 align with Batch 10. The owner-supplied active Physics 250-record source already present in the database does **not** share these stems/options and is not used as a mapping shortcut.

The read-only stage report `owner_pdf_physics_1_250_staged_20260825.json` establishes a source-backed release subset of 206 Physics records. It separately holds 17 exact active-bank duplicates, 26 wrapper variants that repeat earlier PDF concepts, and one answer conflict: Physics 77 has the raw PDF option `40 N` at supplied key C, while the new Markdown says `C — 10 N`. No protected question, option, answer key, topic, eligibility, explanation, or learner total has been changed at this point.

The Chemistry Q201–250 Markdown section is explicitly described by its author as repeat/wrapper content. It remains a duplicate hold and will not be released as a new learner question. Any future explanation-only update must first match an exact raw Chemistry stem and selected option.
