# JAMB Quest Memory

The experience is a browser quiz game, not a 3D scene. The game-dev pipeline is adapted to a data-rich educational interface: the React UI is the game board, and the question-bank engine is the gameplay system. Babylon is intentionally not included because there is no spatial world, character, or canvas mechanic to justify it.

The question bank is an original JAMB-aligned practice set, not copied past-paper wording. The JSON asset is loaded from WebDev storage at `/manus-storage/jamb_high_yield_practice_bank_1000_e93a7fa1.json`. Answers are zero-based indices.

The chosen design is Field Notes Arcade. Avoid generic dashboard styling, purple gradients, Inter, excessive centered cards, or unmarked placeholders. Keep the brand’s tactile paper-and-ink language visible in every major state.
