import json
import re
import sys
import textwrap
from pathlib import Path

batch_number = int(sys.argv[1]) if len(sys.argv) > 1 else 2
batch_size = int(sys.argv[2]) if len(sys.argv) > 2 else 20
wrap_width = int(sys.argv[3]) if len(sys.argv) > 3 else 65
parsed = {item['sourceId']: item for item in json.loads(Path('reports/biology_docx_parsed.json').read_text())['records']}
audit = {item['sourceId']: item for item in json.loads(Path('reports/biology_quality_audit.json').read_text())['details']}
used = set()
for prior in sorted(Path('reports').glob('biology_explanation_batch_*_staged.json')):
    for item in json.loads(prior.read_text()):
        used.add(item['externalId'])

candidates = []
for item in sorted(parsed.values(), key=lambda x: x['sourceNumber']):
    quality = audit.get(item['sourceId'], {})
    if item['sourceId'] in used or not quality.get('releaseCandidate'):
        continue
    explanation = re.sub(r'\s+', ' ', (item.get('explanation') or '').strip())
    if not explanation:
        continue
    lines = textwrap.wrap(explanation, width=wrap_width, break_long_words=False, break_on_hyphens=False)
    if not (4 <= len(lines) <= 5):
        continue
    candidates.append({
        'externalId': item['sourceId'],
        'subject': 'Biology',
        'topic': quality['topic'],
        'difficulty': 'medium',
        'question': item['questionText'],
        'options': item['options'],
        'answerIndex': ord(item['answerLetter']) - ord('A'),
        'explanation': '\n'.join(lines),
        'sourceLabel': f'Owner Biology DOCX · Supplied explanation reflow batch {batch_number:03d}',
        'permissionNote': 'Owner-provided Biology past-question DOCX supplied for JAMB Quest processing; supplied wording, answer key, and explanation content preserved, with line wrapping only for learner clarity.'
    })
selected = candidates[:batch_size]
out = Path(f'reports/biology_source_explanation_batch_{batch_number:03d}_staged.json')
out.write_text(json.dumps(selected, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'candidateCount': len(candidates), 'stagedRecords': len(selected), 'sourceIds': [x['externalId'] for x in selected]}))
