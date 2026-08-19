# JBquestions Upload Intake — Initial Safe Inspection

Both uploaded CSV files use the existing explanation-revision export schema. Their headers include `record_id`, source, subject, topic, question, options, answer, current explanation, word count, and the rendered generic-fallback preview. The inspected leading records in both files begin with the same model-bank identifiers (`ENG-001`, `ENG-002`, and onward).

> No uploaded question has been imported, staged, or used to overwrite a live record. The next step is a full row-count, record-ID, content-hash, and duplicate comparison against the current explanation-revision export and active bank.

The uploaded Python file will remain unexecuted. It is reference material only until its text has been inspected for the explanation format it describes.
