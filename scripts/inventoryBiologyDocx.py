import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

source = Path('/home/ubuntu/upload/JAMBBIOLOGYPASTQUESTION(DR.HIGH).docx')
if not source.exists():
    raise SystemExit(f'Missing source: {source}')
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
paragraphs = []
with zipfile.ZipFile(source) as archive:
    xml_parts = sorted(name for name in archive.namelist() if name.startswith('word/') and name.endswith('.xml'))
    for part in xml_parts:
        root = ET.fromstring(archive.read(part))
        for paragraph in root.findall('.//w:p', ns):
            text = ''.join(node.text or '' for node in paragraph.findall('.//w:t', ns)).strip()
            if text:
                paragraphs.append({'part': part, 'text': text})

question_re = re.compile(r'^\s*(?:\[QUESTION\s+|QUESTION\s+|\[\s*)?(\d{1,4})(?:\s*\])?(?:[.)]\s+|\s*$)', re.I)
answer_signal_re = re.compile(r'\b(?:answer|correct\s+answer|answer\s+key|explanation)\b', re.I)
option_re = re.compile(r'^\s*[A-E][.)]\s+', re.I)
questions = []
for index, paragraph in enumerate(paragraphs):
    match = question_re.match(paragraph['text'])
    if not match:
        continue
    questions.append({
        'sourceParagraph': index,
        'part': paragraph['part'],
        'number': int(match.group(1)),
        'text': paragraph['text'][:240],
        'nearbyOptions': sum(1 for item in paragraphs[index + 1:index + 12] if option_re.match(item['text'])),
        'nearbyAnswerSignals': sum(1 for item in paragraphs[index:index + 20] if answer_signal_re.search(item['text'])),
        'nearbyAnswerLines': [item['text'] for item in paragraphs[index:index + 20] if re.match(r'^\\s*(?:Answer|Correct Answer|Explanation)\\s*:', item['text'], re.I)],
    })

numbers = [item['number'] for item in questions]
report = {
    'source': str(source),
    'xmlParts': xml_parts,
    'paragraphCount': len(paragraphs),
    'questionStartCount': len(questions),
    'uniqueQuestionNumbers': len(set(numbers)),
    'minQuestionNumber': min(numbers) if numbers else None,
    'maxQuestionNumber': max(numbers) if numbers else None,
    'questionNumbersOverTwenty': sorted({number for number in numbers if number > 20})[:100],
    'withFourOrMoreNearbyOptions': sum(1 for item in questions if item['nearbyOptions'] >= 4),
    'withAnswerSignals': sum(1 for item in questions if item['nearbyAnswerSignals'] > 0),
    'sampleQuestions': questions[:20],
}
output = Path('/home/ubuntu/jamb-quiz-game/reports/biology_docx_inventory.json')
output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({key: report[key] for key in ('paragraphCount', 'questionStartCount', 'uniqueQuestionNumbers', 'minQuestionNumber', 'maxQuestionNumber', 'withFourOrMoreNearbyOptions', 'withAnswerSignals')}, indent=2))
