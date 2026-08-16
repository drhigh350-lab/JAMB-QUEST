# Open quality-gate classification

This note records the remaining unchecked items in `todo.md` after the autonomous all-subject safe-import pass.

## Evidence-bound holds

The all-subject PDF has been structurally audited, but its Chemistry, Physics, and English answer keys conflict across external providers. No bulk release is permitted until a reliable authoritative key or a user-provided key is available. The PDF therefore remains parsed/audited but unstaged for gameplay.

The held Biology batch 2 and legacy batch 11 explanation runs returned empty or failed structured model responses. They remain held because no source-preserving concise explanation is available. They may be retried only when the structured endpoint is stable or when supplied explanations are available.

The diagram audit identified 48 wording-level candidates. These are not automatically visual requirements: several refer to missing source diagrams, while others are ordinary conceptual questions where a diagram would be decorative rather than necessary. No visual is added without a verified instructional need and sufficient source context.

## Deferred product capabilities

Topic-plus-difficulty search, error classification, dynamic flashcards, formula vault, rich passage/diagram support, and explanation-level controls remain staged capabilities. They require either more reliable metadata, validated visual sources, or an explicit product-scope decision; they are not needed to release the current quality-gated bank.

Daily reminder deployment and live no-duplicate verification require a real opted-in learner and the deployed callback schedule. Historical model-bank provenance and regeneration remain separate from the owner-authorised source pass because the original generation run cannot be reconstructed from available metadata.

## Current release state

The current safe-import release contains 2,279 authorised playable records plus the 1,000-question model bank, for 3,279 learner-facing questions. All runtime over-cap explanations have been resolved through source-preserving shortening. Remaining authorised exclusions are 369 needs-review records and 342 unmapped-topic records.
