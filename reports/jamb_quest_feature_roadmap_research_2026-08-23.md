# JAMB Quest Feature Roadmap: Evidence-Grounded Revision Loops

**Purpose.** This note evaluates useful next features for JAMB Quest after the Syllabus Journey repair. It does not recommend adding features merely because they are common in quiz apps. The proposed work must preserve the approved-question bank, exact correction, learner agency, and the distinction between a personal study record and an official mastery claim.

## What the evidence supports

Retrieval practice is a reasonable foundation for JAMB Quest because low-stakes questions can act as practice, not merely assessment. A classroom-focused review found the applied literature broadly favourable to retrieval practice, including multiple-choice formats, while cautioning that comparisons with stronger alternatives are less conclusive. It also describes corrective feedback as a relevant design condition rather than decorative “right/wrong” messaging.[1]

Spacing should become a visible revision habit rather than a generic daily streak. A 2025 classroom-focused meta-analysis of 31 effect sizes found a moderate advantage for distributed over massed practice, while noting that spacing means returning to material after a real gap, not simply making one session longer.[2] This supports a small, transparent “return to this topic” queue based on a learner’s own prior attempts.

Planning and monitoring should give learners actionable choices rather than a passive dashboard. Students in a study-planning and monitoring dashboard study found dashboards helpful for planning and monitoring, although they also asked for further information; the design implication is to pair every status with a next action.[3] A self-regulated learning study likewise frames productive learning as a cycle of planning, strategic engagement, monitoring, reflection, and adaptation rather than a score alone.[4]

> **Design rule:** A JAMB Quest feature earns its place only if it helps a learner choose a next approved question set, understand a correction, return after an interval, or plan a realistic syllabus step.

## Recommended feature sequence

| Priority | Feature | Learner value | Safe first version | Evidence connection |
|---|---|---|---|---|
| **1** | **Revision Return Queue** | Converts misses and low-confidence topics into a short, dated next-review list. | After a Syllabus Journey quiz or Arcade turn, offer up to five exact approved cards due tomorrow, in three days, or in seven days; the learner can snooze or remove each item. | Retrieval with feedback and distributed practice.[1][2] |
| **2** | **Topic Confidence Check** | Lets the learner distinguish “I got it right” from “I understand it.” | Optional *Sure / Not sure* tap before answer feedback. Only the learner’s own confidence and result determine a suggested revisit; it never changes an answer or claims diagnosis. | Monitoring and adaptation are core SRL processes.[4] |
| **3** | **Weekly Syllabus Road** | Turns the existing journey into a realistic plan without pretending every topic is complete. | Learner selects 3–5 question-ready areas for a week; the app shows “study, quiz, revisit” state and one next action per area. | Student-facing dashboards support planning and monitoring when they are actionable.[3] |
| **4** | **Exam Mistake Patterns** | Helps a learner notice whether errors cluster by topic, subject, or confidence. | A private “what to revisit next” summary from real completed attempts, limited to counts and exact correction links. | Feedback and reflection close the practice loop.[1][4] |
| **5** | **Worked-Example Compare** | Supports science questions that need a method, not only a chosen option. | For approved explanations that contain a calculation/process, show a collapsed “method steps” view using existing explanation text only; do not invent solution steps. | Feedback is more useful when it helps the learner act on an error.[1] |

## What not to add now

| Temptation | Why it is not the next priority |
|---|---|
| Arbitrary coins, paid boosts, random chests, or chance cards | They do not improve retrieval, correction, or planning and would conflict with the question-first learning design. |
| A score that labels someone “mastered” after one quiz | A single short quiz is only evidence from one attempt. JAMB Quest should show score, attempt count, and revisit state instead. |
| A huge static dashboard | Research on student-facing dashboards points to planning and monitoring value, but learners need a clear next action, not more charts.[3] |
| AI-written explanations without a protected review gate | Question integrity and answer safety are more important than bulk rewriting. The existing v5 explanation process should remain the boundary. |

## Recommended next implementation

The strongest next addition is the **Revision Return Queue**. It is small enough to validate, connects directly to the Syllabus Journey and Arcade repair cards, relies only on exact approved question IDs and local dates, and gives the learner a concrete reason to return. It should be optional, local-first, editable, and kept completely separate from CBT history.

## References

[1] Moreira, B. F. T., Pinto, T. S. S., Starling, D. S. V., & Jaeger, A. (2019). *Retrieval Practice in Classroom Settings: A Review of Applied Research*. Frontiers in Education. https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2019.00005/full

[2] Mawson, R. D., & Kang, S. H. K. (2025). *The Distributed Practice Effect on Classroom Learning: A Meta-Analytic Review of Applied Research*. Behavioral Sciences, 15(6), 771. https://pmc.ncbi.nlm.nih.gov/articles/PMC12189222/

[3] Silvola, A., Sjöblom, A., Näykki, P., Gedrimiene, E., & Muukkonen, H. (2023). *Learning analytics for academic paths: student evaluations of two dashboards for study planning and monitoring*. Frontline Learning Research, 11(2), 78–98. https://www.frontlinelearningresearch.org/index.php/journal/article/view/1277

[4] Hadwin, A. F., Sukhawathanakul, P., Rostampour, R., & Bahena-Olivares, L. M. (2022). *Do Self-Regulated Learning Practices and Intervention Mitigate the Impact of Academic Challenges and COVID-19 Distress on Academic Performance During Online Learning?* Frontiers in Psychology, 13, 813529. https://pmc.ncbi.nlm.nih.gov/articles/PMC8966875/
