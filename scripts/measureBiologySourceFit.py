import json
import textwrap
from pathlib import Path
parsed = json.loads(Path('reports/biology_docx_parsed.json').read_text())['records']
audit = {x['sourceId']: x for x in json.loads(Path('reports/biology_quality_audit.json').read_text())['details']}
used = set()
for path in Path('reports').glob('biology_explanation_batch_*_staged.json'):
    used.update(x.get('externalId') for x in json.loads(path.read_text()))
for width in (40, 45, 50, 55, 60):
    matches = []
    for record in parsed:
        if record['sourceId'] in used or not audit[record['sourceId']]['releaseCandidate']:
            continue
        explanation = ' '.join((record.get('explanation') or '').split())
        lines = textwrap.wrap(explanation, width=width, break_long_words=False, break_on_hyphens=False)
        if 4 <= len(lines) <= 5:
            matches.append(record['sourceId'])
    print(width, len(matches), matches)
