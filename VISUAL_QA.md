# Visual QA Notes

## First preview pass

The home screen renders cleanly at desktop width with the intended chalk-cream paper field, ink-navy type, maize action blocks, clay headline accent, asymmetric hero, inline four-tab logo, and subject collage. The remote question-bank JSON loaded successfully and the header showed `1,000 QUESTIONS READY`.

The default Biology sprint started from the hero CTA. The live round rendered a real Biology question with four options, a 00:35 timer, progress indicator, question ledger, difficulty badge, and disabled submit state until an option is selected. The composition reads as a study sheet and avoids the failed-image placeholders from the first pass because the visual anchor now uses deliberate CSS collage elements.

## Next verification targets

Select an option and submit it to verify selected/correct/wrong feedback, then advance through a short round to confirm result persistence. Capture the same states at narrow mobile width and inspect the browser console for runtime errors after the interaction pass.

## Interaction pass

Selecting option C visibly changed the answer strip to the maize selected state and enabled submission. Submitting it changed the correct option to leaf green, marked question 01 in the dark question ledger, displayed the `CORRECT` feedback block with an explanation, and replaced the submit action with `Next question`. The timer continued to decrement and the progress rail advanced visually.

The next-question control advanced the round to question 02, reset the answer state and timer, and moved the ledger’s maize current marker to 02. Selecting the first option again produced the intended high-contrast maize selection state and re-enabled the submit button.

A controlled autoplay run advanced through the full 10-question Biology sprint. The question ledger correctly accumulated green correct markers and clay review markers, the progress bar reached 10/10, and an incorrect answer displayed the `REVIEW` state with the explanatory correction. The browser extraction showed the final `See result` action; one additional view is needed to confirm the result receipt itself because the annotated viewport briefly showed a stale submit label while the page state was transitioning.

The result receipt is now verified: it shows `ROUND COMPLETE`, score `284`, correct count `2/10`, accuracy `20%`, review count `8`, the `NEW BEST MARK` state, a prominent maize score seal, a `Try another round` CTA, a `Review misses` CTA, and an after-action ledger listing missed topics. The result composition preserves the asymmetric receipt-and-ledger layout at desktop width.
