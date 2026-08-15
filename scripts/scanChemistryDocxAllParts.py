import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

DOCX = Path('/home/ubuntu/upload/#JAMBCHEMISTRYPASTQUESTIONS-DR.docx')
OUT = Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_all_parts_scan.json')
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
patterns = {
    'bracketedQuestion': r'\[QUESTION\s+\d+\]',
    'plainNumbered': r'(?m)^\s*\d{1,4}[.)]\s+\S+',
    'answerKey': r'(?im)^\s*(?:answer\s*(?:key|:)|correct\s*answer\s*:)',
    'optionA': r'(?im)^\s*A[.)]\s+',
}

parts = []
with zipfile.ZipFile(DOCX) as archive:
    for name in sorted(archive.namelist()):
        if not (name.startswith('word/') and name.endswith('.xml')):
            continue
        try:
            root = ET.fromstring(archive.read(name))
        except ET.ParseError:
            continue
        text = '\n'.join(''.join(node.text or '' for node in p.findall('.//w:t', NS)).strip() for p in root.findall('.//w:p', NS))
        counts = {key: len(re.findall(pattern, text)) for key, pattern in patterns.items()}
        if any(counts.values()):
            parts.append({'part': name, 'counts': counts, 'characters': len(text), 'sample': text[:1200]})

summary = {
    'partsWithQuestionSignals': parts,
    'totals': {key: sum(part['counts'][key] for part in parts) for key in patterns},
}
OUT.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(summary['totals'], indent=2))
for part in parts:
    print(part['part'], part['counts'])
