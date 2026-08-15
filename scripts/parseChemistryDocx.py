import json
import re
import subprocess
from pathlib import Path

SOURCE = Path('/home/ubuntu/upload/#JAMBCHEMISTRYPASTQUESTIONS-DR.docx')
OUTPUT = Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_parsed.json')
RAW = Path('/tmp/jamb_chemistry_structured.txt')

xml = subprocess.check_output(['unzip', '-p', str(SOURCE), 'word/document.xml'], text=True)
text = re.sub(r'<w:tab[^>]*/>', '\t', xml)
text = text.replace('</w:p>', '\n')
text = re.sub(r'<[^>]+>', '', text)
text = (text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
            .replace('&quot;', '"').replace('&#39;', "'"))
text = re.sub(r'\[span_\d+\](?:\(start_span\)|\(end_span\))?', '', text)
text = re.sub(r'\r', '', text)
RAW.write_text(text, encoding='utf-8')

blocks = re.split(r'(?=^\[QUESTION\s+\d+\])', text, flags=re.MULTILINE)
records = []
for block in blocks:
    head = re.match(r'^\[QUESTION\s+(\d+)\]\s*\n', block)
    if not head:
        continue
    number = int(head.group(1))
    body = block[head.end():]
    answer_match = re.search(r'^Answer Key:\s*([A-E])', body, flags=re.MULTILINE | re.IGNORECASE)
    explanation_match = re.search(r'^Explanation:\s*\n?(.*?)(?=^[-=]{5,}$|\Z)', body, flags=re.MULTILINE | re.DOTALL)
    answer_key = answer_match.group(1).upper() if answer_match else None
    before_answer = body[:answer_match.start()] if answer_match else body
    option_matches = list(re.finditer(r'^(?P<label>[A-E])[.]\s*(?P<text>.+)$', before_answer, flags=re.MULTILINE))
    if not option_matches:
        continue
    question_text = before_answer[:option_matches[0].start()].strip()
    options = []
    for index, match in enumerate(option_matches):
        option_text = match.group('text').strip()
        next_start = option_matches[index + 1].start() if index + 1 < len(option_matches) else len(before_answer)
        trailing = before_answer[match.end():next_start].strip()
        if trailing:
            option_text = f'{option_text} {trailing}'
        options.append(option_text)
    explanation = ''
    if explanation_match:
        explanation = re.sub(r'\s+', ' ', explanation_match.group(1)).strip(' -')
    records.append({
        'externalId': f'chem-docx-{number:03d}',
        'sourceNumber': number,
        'subject': 'Chemistry',
        'topic': '',
        'difficulty': 'medium',
        'question': re.sub(r'\s+', ' ', question_text).strip(),
        'options': options,
        'answerIndex': ord(answer_key) - ord('A') if answer_key else None,
        'answerKey': answer_key,
        'sourceExplanation': explanation,
        'sourceText': block.strip(),
    })

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps({'sourceFile': SOURCE.name, 'recordCount': len(records), 'records': records}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'recordCount': len(records), 'withAnswerKey': sum(bool(r['answerKey']) for r in records), 'withOptions': sum(bool(r['options']) for r in records), 'fourOption': sum(len(r['options']) == 4 for r in records), 'fiveOption': sum(len(r['options']) == 5 for r in records)}))
