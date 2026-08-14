# Submitted JAMB CBT Brief — Implementation Map

This document records the user-supplied product brief in `pasted_content.txt` and separates immediate product upgrades from ideas that require reliable question metadata or additional validated learning material.

## Immediate product work

| Brief requirement | Current state | Next implementation action |
|---|---|---|
| Standard 180-question CBT with timer, grid, flags, calculator and review | Present | Add JAMB keyboard muscle-memory controls and stronger pre-submit actions. |
| Study mode versus strict exam mode | Partially present as sprint/CBT | Rename and clarify mode behavior so study has no pressure while CBT stays strict. |
| Exact wrong-question recovery | Present but incomplete | Make every Progress action open its exact stored question set and show clear no-match feedback. |
| Weak-topic action and target-led study plan | Partially present | Add transparent score estimate, target gap, and pace-based next action. |
| Question accuracy as the product foundation | Present | Continue approved-only gameplay and hold uncertain material outside the bank. |
| Offline-first reliability | Present for app shell and model bank | Extend only when content packages and sync requirements are ready. |

## Protected staged capabilities

The following ideas are valuable but must not be invented without reliable source material or explicit scope approval: past-question year filtering, full-text question search, topic-plus-difficulty filters, flashcards, formula vault, rich passages and diagrams, question-report editorial workflow, AI explanation levels, and error-classification categories. These depend on validated tags, source years, media, content records, or a clear learner data model.

## Design constraints extracted from the brief

The simulator should prioritize JAMB realism, simple navigation, high-quality explanations, clear recovery actions, and offline reliability. AI must remain an explanation layer; it must never become the source of truth for answer keys. Learner interfaces should organize around improving a score rather than exposing a crowded list of modules.
