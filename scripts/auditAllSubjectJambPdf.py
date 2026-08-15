import json
import re
from collections import Counter, defaultdict
from pathlib import Path

source = Path('/tmp/jamb_all_subjects.txt')
if not source.exists():
    raise SystemExit('Expected extracted PDF text at /tmp/jamb_all_subjects.txt')
lines = source.read_text(encoding='utf-8', errors='ignore').splitlines()
subjects = ('Use of English', 'Biology', 'Chemistry', 'Physics', 'Mathematics')
heading_re = re.compile(r'^\s*(Use of English|Biology|Chemistry|Physics|Mathematics)\s+(19\d{2}|20\d{2})\s*$')
question_re = re.compile(r'^\s*(\d{1,3})[.)]\s+\S')
option_re = re.compile(r'^\s*[A-E][.)]\s+\S')

sections = []
current = None
for index, line in enumerate(lines, start=1):
    match = heading_re.match(line)
    if match:
        if current:
            current['endLine'] = index - 1
            sections.append(current)
        current = {'subject': match.group(1), 'year': int(match.group(2)), 'startLine': index, 'questionNumbers': [], 'optionLines': 0}
        continue
    if not current:
        continue
    question = question_re.match(line)
    if question:
        current['questionNumbers'].append(int(question.group(1)))
    if option_re.match(line):
        current['optionLines'] += 1
if current:
    current['endLine'] = len(lines)
    sections.append(current)

by_subject = defaultdict(lambda: {'sectionCount': 0, 'questionStartCount': 0, 'optionLineCount': 0, 'years': []})
for section in sections:
    bucket = by_subject[section['subject']]
    bucket['sectionCount'] += 1
    bucket['questionStartCount'] += len(section['questionNumbers'])
    bucket['optionLineCount'] += section['optionLines']
    bucket['years'].append(section['year'])

report = {
    'source': str(source),
    'pageSignal': 'extractable text',
    'inScopeSubjects': ['Use of English', 'Biology', 'Chemistry', 'Physics'],
    'subjectSummary': {subject: {
        **summary,
        'years': sorted(summary['years']),
        'yearRange': [min(summary['years']), max(summary['years'])] if summary['years'] else None,
    } for subject, summary in sorted(by_subject.items())},
    'sections': [{
        **section,
        'questionStartCount': len(section['questionNumbers']),
        'firstQuestion': min(section['questionNumbers']) if section['questionNumbers'] else None,
        'lastQuestion': max(section['questionNumbers']) if section['questionNumbers'] else None,
        'questionNumbers': None,
    } for section in sections],
    'fourSubjectQuestionStartTotal': sum(by_subject[subject]['questionStartCount'] for subject in ('Use of English', 'Biology', 'Chemistry', 'Physics')),
}
out = Path('/home/ubuntu/jamb-quiz-game/reports/all_subject_pdf_audit.json')
out.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({
    'fourSubjectQuestionStartTotal': report['fourSubjectQuestionStartTotal'],
    'subjects': {subject: report['subjectSummary'].get(subject, {}) for subject in subjects},
    'sectionCount': len(sections),
}, indent=2))
