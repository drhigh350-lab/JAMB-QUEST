import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

source = Path('/home/ubuntu/upload/JAMBBIOLOGYPASTQUESTION(DR.HIGH).docx')
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(source) as archive:
    root = ET.fromstring(archive.read('word/document.xml'))
paragraphs = [''.join(node.text or '' for node in paragraph.findall('.//w:t', ns)).strip() for paragraph in root.findall('.//w:body/w:p', ns)]
paragraphs = [text for text in paragraphs if text]
heading_re = re.compile(r'^QUESTION\s+(\d{1,4})$', re.I)
answer_re = re.compile(r'^Answer:\s*([A-E])\s*(?:\((.*?)\))?.*$', re.I)
explanation_re = re.compile(r'^Explanation:\s*(.*)$', re.I)
option_re = re.compile(r'(?<![A-Za-z])([A-E])[.)]\s+')
questions = []
start = None
for index, text in enumerate(paragraphs + ['QUESTION __END__']):
    heading = heading_re.match(text)
    if heading or index == len(paragraphs):
        if start is not None:
            block = paragraphs[start:index]
            number = int(heading_re.match(paragraphs[start]).group(1))
            answer_pos = next((pos for pos, line in enumerate(block) if answer_re.match(line)), None)
            explanation_pos = next((pos for pos, line in enumerate(block) if explanation_re.match(line)), None)
            content_end = answer_pos if answer_pos is not None else len(block)
            content = block[1:content_end]
            combined_content = ' '.join(content).strip()
            option_matches = list(re.finditer(r'(?<![A-Za-z])([A-E])[.)]\s+', combined_content, re.I))
            options = []
            for option_index, match in enumerate(option_matches):
                end = option_matches[option_index + 1].start() if option_index + 1 < len(option_matches) else len(combined_content)
                options.append(match.group(1).upper() + '. ' + combined_content[match.end():end].strip())
            first_option_start = option_matches[0].start() if option_matches else len(combined_content)
            question_text = combined_content[:first_option_start].strip()
            answer_match = answer_re.match(block[answer_pos]) if answer_pos is not None else None
            explanation = block[explanation_pos][len('Explanation:'):].strip() if explanation_pos is not None else ''
            questions.append({
                'sourceId': f'biology-dr-high-{len(questions) + 1:04d}',
                'sourceNumber': number,
                'questionText': question_text,
                'options': options,
                'answerLetter': answer_match.group(1).upper() if answer_match else None,
                'answerText': answer_match.group(2).strip() if answer_match and answer_match.group(2) else None,
                'explanation': explanation,
                'rawBlock': block,
            })
        start = index if index < len(paragraphs) else None

report = {
    'source': str(source),
    'recordCount': len(questions),
    'completeAnswerCount': sum(1 for item in questions if item['answerLetter']),
    'fourOrFiveOptionCount': sum(1 for item in questions if len(item['options']) in (4, 5)),
    'explanationCount': sum(1 for item in questions if item['explanation']),
    'records': questions,
}
output = Path('/home/ubuntu/jamb-quiz-game/reports/biology_docx_parsed.json')
output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({key: report[key] for key in ('recordCount', 'completeAnswerCount', 'fourOrFiveOptionCount', 'explanationCount')}, indent=2))
