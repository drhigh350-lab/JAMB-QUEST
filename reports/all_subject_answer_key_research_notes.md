# All-subject PDF answer-key research notes

## Local inventory

The held file is `826050738-Jamb-2025-questions-and-Past-Questions-All-Subjects-compressed.pdf`. The local audit reports 843 pages and approximately 3,095 in-scope question starts: 1,177 Use of English, 682 Biology, 533 Chemistry, and 703 Physics. The extracted source contains no usable answer key or explicit correct-answer markers for the question blocks.

## Source review 1: Larnedu Chemistry PDF

URL: https://www.larnedu.com/wp-content/uploads/2019/03/JAMB-Chemistry-Past-Questions-1983-2004.pdf

The PDF is a 77-page Chemistry question compilation. The visible pages show question text and options, but the inspected opening pages do not show an answer-key section. It may still be useful for text comparison, but it is not yet evidence of correct options.

## Source review 2: Studypool Chemistry document

URL: https://www.studypool.com/documents/15114178/-chemistry-past-question-and-answers-1983-2004

The page is a user-generated 71-page document and its accessible preview shows Chemistry question text and options. The preview ends before any answer-key section and the full page is gated behind sign-in/captcha. It is not sufficient as an independently verified answer source at this stage.

## Interim decision

No answer keys have been released from the held PDF. External pages that merely reproduce question text or provide gated/user-generated previews are not treated as reliable answer evidence.

## Source review 3: Jambite

URL: https://www.jambite.com/free-past-question/jamb

Jambite claims to provide more than 2,000 free past questions with solved answers and explanations for multiple years, but the public landing page exposes only year navigation and requires signup for more content. It does not itself expose a machine-readable answer key for the held 1983–2004 PDF.

## Source review 4: EduSphere download index

URL: https://edusphereng.wordpress.com/2024/04/13/free-download-jamb-past-questions-answers-in-pdf-all-subjects/

EduSphere publishes direct Google Drive links labelled as Biology, Chemistry, Physics, and Use of English “Past Questions and Answers” for 1983–2004. The page is an index, not an answer-key transcription, so the linked files must be retrieved and audited. Relevant links are:

- Biology: https://drive.google.com/open?id=1v6bc02G_MzjQAHVDvzOIH93mgTFs9qEz
- Chemistry: https://drive.google.com/open?id=1YZoiSe1gX3BuyrWxOr8eJL5YlLIFCCzg
- Physics: https://drive.google.com/open?id=1n1ipOgai1fYKXwZQOmwpmRoknoB9Uqt7
- Use of English: https://drive.google.com/open?id=1KFGyOAFjApps7umaALv3dFpcu-fWlnxB

These links are promising corroboration candidates, but no question is released until the downloaded files are checked for actual answer keys, subject/year alignment, and licensing/provenance compatibility.

## Source review 5: Myschool Biology 1983

Index URL: https://myschool.ng/classroom/biology?exam_type=jamb&exam_year=1983

Individual question URL: https://myschool.ng/classroom/biology/2376?exam_type=jamb&exam_year=1983

Myschool exposes the 1983 Biology question set and individual question pages. For Question 1, “Root hairs are developed from the”, the page explicitly marks **Correct Option b**. However, the discussion contains conflicting user comments claiming D or E, while the page’s selected answer is B and the site says a correction was made. This demonstrates that Myschool can provide answer-key evidence, but question-level confidence must account for conflicts and should not automatically accept comment content.

## Research implication

The external source can support a controlled cross-check workflow: match exact subject/year/question text, record the site’s explicit selected option separately from user discussions, and release only when the authoritative page answer is present and no unresolved contradiction remains.

## Source review 6: SchoolNGR Biology 1983

Index URL: https://www.schoolngr.com/classroom/jamb/biology?examyear=1983

Question URL: https://www.schoolngr.com/classroom/biology/6890

SchoolNGR exposes the same first Biology 1983 question and its answer interaction. The page highlights option **B — Epidermis of root** as the answer when “Show Answer” is activated. This independently corroborates Myschool’s explicit option B for the same question. The page does not show a complete answer key in the static listing, so it is best used as a question-level corroboration source rather than as a bulk answer export.

## Evidence status

For the first Biology 1983 question, two independent public providers agree on B. This is enough to mark that one exact record as cross-checked evidence, but not enough to release the entire held PDF. Bulk release still requires matching and evidence coverage across each question, subject, and year.

## Machine-readable corroboration

On SchoolNGR Question 1, the revealed page DOM contains `Correct Answer: Option B` and marks the option element `B — Epidermis of root` with the `correct` class. This is stronger than relying on the page’s static text or community discussion and independently agrees with Myschool’s explicit Correct Option B.

## Bounded agreement test: Biology 1983 Questions 1–5

The first five Biology 1983 records were compared using explicit answer labels from Myschool and SchoolNGR. All five agree: B, D, E, C, and B respectively. The result is 5 agreements and 0 disagreements. This supports a cautious exact-text, subject/year/question-level cross-check workflow, but it does not by itself establish coverage for the remaining approximately 3,090 held records.

## Bounded agreement test: four subjects, 1983 Questions 1–5

The same explicit-label comparison was run for the first five 1983 questions in each in-scope subject. Biology agreed 5/5. Chemistry agreed only 1/5, Physics 2/5, and Use of English 2/5 between Myschool and SchoolNGR. These conflicts are material: the two public providers are not interchangeable answer authorities for the sample. Therefore, the all-subject PDF cannot be bulk-released from this evidence alone. The correct safe action is to retain the held source, investigate exact question alignment and source provenance, and release only records with stronger evidence or user-provided/licensed answer keys.

## Bounded agreement test: four subjects, 1984 Questions 1–5

A second-year sample was collected and compared. Biology agreed 5/5, Chemistry 4/5, Physics 0/5, and Use of English 1/5 between Myschool and SchoolNGR. Biology is consistently corroborated in the two sampled years, while Physics and English show substantial source disagreement. This reinforces the decision not to infer answer keys from general model knowledge or to bulk-import the all-subject PDF using a single public provider.
