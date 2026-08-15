import json
import re
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET

DOCX = Path('/home/ubuntu/upload/#JAMBCHEMISTRYPASTQUESTIONS-DR.docx')
OUT = Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_full_parsed.json')
AUDIT = Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_full_parse_audit.json')
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

def clean(text: str) -> str:
    text = re.sub(r'\[span_\d+\]\(start_span\)|\[span_\d+\]\(end_span\)', '', text)
    text = text.replace('**', '').replace('*', '')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

with zipfile.ZipFile(DOCX) as archive:
    root = ET.fromstring(archive.read('word/document.xml'))

paragraphs = []
for paragraph in root.findall('.//w:p', NS):
    text = ''.join(node.text or '' for node in paragraph.findall('.//w:t', NS)).strip()
    if text:
        paragraphs.append(text)

start_re = re.compile(r'^(?:\*{1,2})?(\d{1,4})[.)]\s+(.+)$')
bracket_re = re.compile(r'^\[QUESTION\s+(\d+)\]$', re.I)
option_re = re.compile(r'^(?:\*{0,2})?([A-E])[.)]\s*(.+?)(?:\*{0,2})?$', re.I)
answer_re = re.compile(r'^(?:\*{0,2})?(?:Correct\s+Answer|Answer\s*Key|Answer)\s*:\s*([A-E])(?:[.)]\s*(.*))?', re.I)

starts = []
for index, paragraph in enumerate(paragraphs):
    plain = clean(paragraph)
    bracket = bracket_re.match(plain)
    if bracket:
        starts.append({'index': index, 'sourceNumber': int(bracket.group(1)), 'format': 'bracketed', 'questionLead': ''})
        continue
    match = start_re.match(paragraph)
    if match and match.group(1).isdigit():
        starts.append({'index': index, 'sourceNumber': int(match.group(1)), 'format': 'numbered', 'questionLead': clean(match.group(2))})

records = []
candidate_blocks = []
for position, start in enumerate(starts):
    end = starts[position + 1]['index'] if position + 1 < len(starts) else len(paragraphs)
    block = paragraphs[start['index']:end]
    question_lines = [start['questionLead']] if start['questionLead'] else []
    options = {}
    answer_key = None
    answer_text = None
    explanation_lines = []
    state = 'question'
    for raw in block[1:] if start['format'] == 'numbered' else block[1:]:
        line = clean(raw)
        if not line or line in {'---', '--------------------------------------------------------------------------------', '================================================================================'}:
            continue
        answer_match = answer_re.match(raw.strip())
        if answer_match:
            answer_key = answer_match.group(1).upper()
            answer_text = clean(answer_match.group(2) or '') or None
            state = 'answer'
            continue
        if line.lower().startswith('explanation:'):
            state = 'explanation'
            remainder = line.split(':', 1)[1].strip()
            if remainder:
                explanation_lines.append(remainder)
            continue
        option_match = option_re.match(raw.strip())
        if option_match and state in {'question', 'options'}:
            options[option_match.group(1).upper()] = clean(option_match.group(2))
            state = 'options'
            continue
        if state == 'question':
            question_lines.append(line)
        elif state == 'explanation':
            explanation_lines.append(line.lstrip('- ').strip())
    question = ' '.join(line for line in question_lines if line)
    ordered_options = [options[key] for key in 'ABCDE' if key in options]
    valid_options = len(ordered_options) in (4, 5) and list(options) == list('ABCDE'[:len(ordered_options)])
    valid_answer = answer_key in options if answer_key else False
    candidate = {
        'sourceNumber': start['sourceNumber'],
        'sourceFormat': start['format'],
        'question': question,
        'options': ordered_options,
        'answerKey': answer_key,
        'answerText': answer_text or (options.get(answer_key) if answer_key else None),
        'sourceExplanation': '\n'.join(explanation_lines).strip() or None,
        'validOptions': valid_options,
        'validAnswer': valid_answer,
        'paragraphStart': start['index'],
    }
    candidate_blocks.append(candidate)
    if question and valid_options and valid_answer:
        records.append(candidate)

numbers = [entry['sourceNumber'] for entry in records if entry['sourceFormat'] == 'numbered']
audit = {
    'paragraphCount': len(paragraphs),
    'headerCount': len(starts),
    'candidateBlockCount': len(candidate_blocks),
    'validRecordCount': len(records),
    'formatCounts': dict(Counter(record['sourceFormat'] for record in records)),
    'numberedQuestionRange': {'min': min(numbers) if numbers else None, 'max': max(numbers) if numbers else None, 'distinct': len(set(numbers))},
    'invalidBlocks': [
        {'sourceNumber': item['sourceNumber'], 'sourceFormat': item['sourceFormat'], 'question': item['question'], 'validOptions': item['validOptions'], 'validAnswer': item['validAnswer']}
        for item in candidate_blocks if not (item['question'] and item['validOptions'] and item['validAnswer'])
    ],
}
OUT.write_text(json.dumps({'records': records}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
AUDIT.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({key: audit[key] for key in ('headerCount', 'candidateBlockCount', 'validRecordCount', 'formatCounts', 'numberedQuestionRange')}, indent=2))
