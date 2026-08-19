# MySchool Public JAMB Flow Audit — August 19, 2026

## Scope and content boundary

This is a **feature-flow review only**. It records publicly visible navigation and setup patterns from MySchool’s JAMB pages. No MySchool question wording, answers, explanations, images, or bulk data was copied into JAMB Quest.

## Public flow observed

| Public page | Visible learner controls | Non-copying lesson for JAMB Quest |
| --- | --- | --- |
| [English JAMB practice](https://myschool.ng/classroom/english-language?exam_type=jamb) | Exam type, year, question type, topic, novel filters, paginated questions, explanation/discussion links, syllabus and lesson shortcuts | Keep direct subject/topic practice and make context, source integrity, and correction access clear. |
| [JAMB CBT simulator](https://myschool.ng/classroom/exam/jamb) | Compulsory English, three additional subject selectors, separate novel and comprehension choices, year selector, 35-minute practice and 120-minute full-test modes | Preserve JAMB Quest’s visible Standard CBT and subject drills, while checking setup clarity, optional-content controls, and session review. |

## Current JAMB Quest selection rules

JAMB Quest loads the 1,000-record bundled study bank and merges it with the authorised learner API. It normalizes topic labels and removes duplicate IDs before a round begins. A new session then selects a fresh shuffled set inside the learner’s requested boundary.

| Learner action | What is selected | Randomness and safeguards |
| --- | --- | --- |
| Single subject, no topic | Questions only from that subject | Fresh shuffle each launch; core English excludes Lekki by default. |
| Broad area or exact topic | Questions only from the selected syllabus area or topic | Fresh shuffle inside that scope; no unrelated fallback. |
| Missed or saved recovery | Only the requested question IDs | Fresh shuffled order, but no substitute questions. |
| Standard CBT | 60 Use of English, 40 Biology, 40 Chemistry, 40 Physics | Fresh shuffle within each subject; uses the visible two-hour session rule. |
| English with Lekki enabled | Core English plus selected optional novel content | Lekki is included only after the explicit learner choice or in dedicated novel practice. |

## Diagram safety status

The learner API exposes only approved records that pass the diagram-asset gate. A stem that explicitly requires a figure is withheld unless it has an attached visual. The current verified bank contains 29 figure-dependent records that remain held because no exact owner-original visual has been matched. No generated reconstruction or blank figure is released into CBT.

## Next audit focus

The remaining review should test the visible launch cards and mobile setup for clarity, then convert specific learner-reported loopholes into isolated fixes with regression coverage. The appropriate next input is a screen recording or voice note describing one exact tap path that feels confusing, slow, or broken.
