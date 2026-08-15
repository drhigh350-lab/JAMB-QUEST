import json
import re
from pathlib import Path

pdf_text = Path('/tmp/jamb_all_subjects.txt').read_text(errors='ignore')
source = json.loads(Path('reports/myschool_biology_1983_answer_key.json').read_text())['records']

def norm(value):
    return re.sub(r'[^a-z0-9]+', '', value.lower())

section_match = re.search(r'Biology 1983(.*?)(?=\f\s*(?:Biology|Chemistry|Physics|Use of English|Mathematics)\s+\d{4}|\Z)', pdf_text, re.S | re.I)
section = section_match.group(1) if section_match else ''
section_normalised = norm(section)
rows = []
for record in source:
    question = record.get('question') or ''
    option_start = re.search(r'\s+a\s+.*?\s+b\s+', question, flags=re.I)
    stem = question[:option_start.start()].strip() if option_start else question.strip()
    token = norm(stem)
    found = bool(token and token in section_normalised)
    rows.append({**record, 'matchedPdfCandidates': [{'section': 'Biology 1983', 'stem': stem}] if found else [], 'matchStatus': 'exact-stem-candidate' if found else 'not-found'})
Path('reports/biology_1983_researched_match_report.json').write_text(json.dumps({'sourcePdfText': '/tmp/jamb_all_subjects.txt', 'records': rows}, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'records': len(rows), 'matched': sum(r['matchStatus'] != 'not-found' for r in rows), 'unmatched': sum(r['matchStatus'] == 'not-found' for r in rows)}))
