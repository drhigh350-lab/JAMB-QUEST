# Achievement Card Typography Visual Check

The regenerated 1080×1920 portrait achievement-card preview was visually reviewed on 22 August 2026 using the representative **Century builder / Dr. High** card.

The title, learner name, achievement note, evidence value, earned context, and footer rendered at their natural proportions. No `textLength` or `lengthAdjust` glyph squeezing remains. The evidence text wraps into two readable lines rather than being horizontally compressed.

The local `file://` preview cannot resolve the app-relative wordmark asset, so it displays a broken-image placeholder only in this isolated file preview. The production generator now converts the wordmark asset to an absolute app URL before SVG-to-PNG conversion, which is the path used by live sharing.
