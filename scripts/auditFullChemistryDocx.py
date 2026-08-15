import json
import re
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET

DOCX = Path('/home/ubuntu/upload/#JAMBCHEMISTRYPASTQUESTIONS-DR.docx')
OUT = Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_full_format_audit.json')
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

with zipfile.ZipFile(DOCX) as archive:
    root = ET.fromstring(archive.read('word/document.xml'))

paragraphs = []
for paragraph in root.findall('.//w:p', NS):
    text = ''.join(node.text or '' for node in paragraph.findall('.//w:t', NS)).strip()
    if text:
        paragraphs.append(text)

patterns = {
    'bracketed_question_headers': r'^\[QUESTION\s+\d+\]',
    'plain_numbered_questions': r'^\d{1,4}[.)]\s+\S+',
    'markdown_bold_numbered_questions': r'^\*{1,2}\d{1,4}[.)]\s+\S+',
    'question_word_numbered': r'^QUESTION\s+\d+',
    'answer_key_lines': r'^(?:Answer\s*(?:Key|:)|Correct\s*Answer\s*:)',
    'option_a_lines': r'^A[.)]\s+',
    'option_b_lines': r'^B[.)]\s+',
}
counts = {name: sum(bool(re.search(pattern, paragraph, re.I)) for paragraph in paragraphs) for name, pattern in patterns.items()}

# Track every likely question-start paragraph by source order, retain a sample of each format.
question_starts = []
for index, paragraph in enumerate(paragraphs):
    matched = [name for name, pattern in patterns.items() if name in ('bracketed_question_headers', 'plain_numbered_questions', 'markdown_bold_numbered_questions', 'question_word_numbered') and re.search(pattern, paragraph, re.I)]
    if matched:
        question_starts.append({'paragraphIndex': index, 'format': matched[0], 'text': paragraph})

format_samples = {}
for entry in question_starts:
    format_samples.setdefault(entry['format'], [])
    if len(format_samples[entry['format']]) < 12:
        format_samples[entry['format']].append(entry)

audit = {
    'sourceFile': str(DOCX),
    'paragraphCount': len(paragraphs),
    'patternCounts': counts,
    'likelyQuestionStartCount': len(question_starts),
    'formatBreakdown': dict(Counter(entry['format'] for entry in question_starts)),
    'formatSamples': format_samples,
    'firstParagraphs': paragraphs[:40],
    'lastParagraphs': paragraphs[-40:],
}
OUT.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({
    'paragraphCount': audit['paragraphCount'],
    'patternCounts': audit['patternCounts'],
    'likelyQuestionStartCount': audit['likelyQuestionStartCount'],
    'formatBreakdown': audit['formatBreakdown'],
}, indent=2))
