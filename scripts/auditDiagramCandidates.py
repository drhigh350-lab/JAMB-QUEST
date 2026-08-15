import json
from pathlib import Path

keywords = {
    'structure': ['diagram', 'structure', 'labelled', 'labeled', 'cross-section', 'section of', 'part of', 'arrangement'],
    'process': ['cycle', 'pathway', 'sequence', 'flow', 'stages of', 'process of'],
    'spatial': ['location', 'where is', 'position', 'junction', 'layer', 'region', 'zone'],
    'apparatus': ['apparatus', 'set-up', 'setup', 'instrument', 'circuit', 'ray diagram'],
}
rows = []
paths = sorted(Path('reports').glob('*staged.json')) + sorted(Path('reports').glob('legacy_explanation_batch_*_input.json'))
for path in paths:
    try:
        payload = json.loads(path.read_text())
    except Exception:
        continue
    records = payload if isinstance(payload, list) else payload.get('records', [])
    for record in records:
        question = record.get('question') or record.get('questionText') or ''
        lower = question.lower()
        matched = sorted({group for group, terms in keywords.items() if any(term in lower for term in terms)})
        if matched:
            rows.append({'file': path.name, 'externalId': record.get('externalId') or record.get('id'), 'subject': record.get('subject'), 'topic': record.get('topic'), 'groups': matched, 'question': question})
out = Path('reports/diagram_candidate_audit.json')
out.write_text(json.dumps({'candidateCount': len(rows), 'records': rows}, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'candidateCount': len(rows), 'filesScanned': len(paths)}))
