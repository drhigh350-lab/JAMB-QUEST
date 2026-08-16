# Official Topic Menu and Palette Visual Review

The updated Practice screen was reviewed at desktop (1280×720) and mobile (375×812) after skipping the opening sequence. The practice launcher retains its compact grouped-panel structure. The third panel now presents the learner-facing heading **“Study by official JAMB syllabus area”** and no longer exposes broad substitute groups such as “Mechanics & energy” or “Reading & literature.”

The official-topic panel remains compact and tappable at the mobile breakpoint. The selected subject panel, daily mission, and topic panel do not overlap. The QuestionLedger is rendered after the active QuestionCard in `QuizShell`, with the `question-palette-bottom` layout hook and breakpoint rules keeping the palette beneath the question across study and CBT modes.

The review did not identify a text-contrast, overflow, or layout-collision issue in the reviewed home views. Full interaction behavior is additionally covered by the new source-layout and canonical-syllabus tests.
