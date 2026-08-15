# Public JAMB-Question Source Coverage Research

**Purpose.** This note evaluates publicly accessible JAMB practice platforms as **coverage references**, not as text sources for automatic ingestion into JAMB Quest. The aim is to support the user’s 10,000-question target without copying third-party collections or misrepresenting permission.

## Findings

| Platform reviewed | Publicly described coverage | Reuse signal observed | Safe JAMB Quest use |
|---|---|---|---|
| [MySchoolNG JAMB CBT Simulator](https://myschool.ng/classroom/exam/jamb) | A JAMB simulator with subject selection, practice and full-test modes, exam-year selection, English-novel and comprehension options. The page describes its questions as “real, official JAMB past questions.” | Its [Terms of Use](https://myschool.ng/terms-of-use) state that the service is for personal use and prohibit copying, modifying, publishing, transmitting, distributing, displaying, or selling proprietary material without written permission. They also prohibit automated use. | **Coverage/reference research only.** Do not scrape or import question wording, answer choices, explanations, or media. Seek written licence/API permission before any reuse. |
| [Awajis JAMB CBT Practice](https://jambcbt.awajis.com/) | Public subject pages include English, Biology, Chemistry, Physics, and Lekki Headmaster, and the site describes its CBT simulator as using real JAMB past questions. | The reviewed page describes access as free but did not supply an explicit reusable-content licence. | **Coverage/reference research only** until the publisher gives written reuse rights. |
| [JAMB Prep Academy](https://jambprepacademy.com/) | The public page advertises free past questions, CBT practice, topic search, explanations, and performance analytics. | The reviewed public landing page did not provide an explicit licence granting question-bank reproduction rights. | **Coverage/reference research only** until a clear licence or direct written permission is obtained. |

## Decision

> “Free to access” is not the same as “free to copy into another product.”

JAMB Quest will not automatically extract or reproduce question text, answer options, explanations, diagrams, or other content from these platforms. The reviewed MySchoolNG terms explicitly prohibit this without written permission. Public platforms are still useful for a **coverage map**: which subjects, years, topics, practice modes, and novel content are commonly available.

## Safe 10,000-Question Strategy

| Workstream | What JAMB Quest may do now | What is required before release |
|---|---|---|
| Owner-supplied batches | Import directly through the existing trusted intake, preserving supplied wording, answer keys, topics, and explanations. | Continue duplicate, malformed-card, and structural safeguards. |
| Coverage mapping | Compare high-level subject, topic, year, and format coverage against publicly visible platform navigation. | Store only metadata/coverage observations, not copied question content. |
| Third-party licensing | Contact a platform owner for a written content licence, approved export, API, or syndication agreement. | Written authorisation defining permitted question, answer, explanation, image, and attribution use. |
| Original authorised content | Commission or obtain question material from rights holders and subject experts with explicit release permission. | Keep a source ledger, answer review, and explanation-quality gate before publication. |

## Practical Next Step

The fastest safe route to 10,000 questions is to continue accepting the user’s trusted direct batches while using the public platforms only to identify missing syllabus areas. If a third-party collection is needed, obtain written permission or a licensed feed first; JAMB Quest can then import it through the existing provenance-aware pipeline.

## References

1. [MySchoolNG JAMB CBT Practice 2027 Simulator](https://myschool.ng/classroom/exam/jamb)
2. [MySchoolNG Terms of Use](https://myschool.ng/terms-of-use)
3. [Awajis JAMB CBT Practice](https://jambcbt.awajis.com/)
4. [JAMB Prep Academy](https://jambprepacademy.com/)
