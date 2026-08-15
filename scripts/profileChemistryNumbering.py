import json
import re
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET

DOCX = Path('/home/ubuntu/upload/#JAMBCHEMISTRYPASTQUESTIONS-DR.docx')
OUT = Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_numbering_profile.json')
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

with zipfile.ZipFile(DOCX) as archive:
    root = ET.fromstring(archive.read('word/document.xml'))
paragraphs = []
for paragraph in root.findall('.//w:p', NS):
    text = ''.join(node.text or '' for node in paragraph.findall('.//w:t', NS)).strip()
    if text:
        paragraphs.append(text)

matches = []
for index, paragraph in enumerate(paragraphs):
    match = re.match(r'^\*{1,2}(\d{1,4})[.)]\s+', paragraph)
    if match:
        matches.append({'paragraphIndex': index, 'number': int(match.group(1)), 'text': paragraph[:240]})

counts = Counter(entry['number'] for entry in matches)
first_occurrence = {}
for entry in matches:
    first_occurrence.setdefault(entry['number'], entry)
profile = {
    'markdownNumberedLineCount': len(matches),
    'distinctNumbers': len(counts),
    'maxNumber': max(counts) if counts else None,
    'numberFrequency': dict(sorted(counts.items())),
    'firstOccurrenceByNumber': [first_occurrence[number] for number in sorted(first_occurrence)],
}
OUT.write_text(json.dumps(profile, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'markdownNumberedLineCount': len(matches), 'distinctNumbers': len(counts), 'maxNumber': profile['maxNumber'], 'numbersWithMultipleLines': sum(1 for count in counts.values() if count > 1)}, indent=2))
