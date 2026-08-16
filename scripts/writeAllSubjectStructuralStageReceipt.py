import json
from pathlib import Path

root = Path('/home/ubuntu/jamb-quiz-game')
audit = json.loads((root / 'reports/all_subject_pdf_audit.json').read_text())
subjects = {}
for subject, summary in audit['subjectSummary'].items():
    if subject in {'Use of English', 'Biology', 'Chemistry', 'Physics'}:
        subjects[subject] = {
            'questionStartCount': summary['questionStartCount'],
            'optionLineCount': summary['optionLineCount'],
            'years': summary['years'],
            'structuralStatus': 'inventoried-only; answer-key hold',
        }
receipt = {
    'source': audit['source'],
    'inScopeSubjects': list(subjects),
    'totalQuestionStarts': sum(item['questionStartCount'] for item in subjects.values()),
    'subjects': subjects,
    'stagingDecision': 'No gameplay staging or import. Structural inventory is complete, but all records remain held until reliable answer keys are available and corroborated.',
    'answerKeyEvidence': 'The source PDF has no embedded usable answer key; external cross-checks conflict by subject and are insufficient for bulk release.',
}
path = root / 'reports/all_subject_pdf_structural_stage_receipt.json'
path.write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt, indent=2))
