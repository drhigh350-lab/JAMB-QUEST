import json
from pathlib import Path
path = Path('reports/biology_explanation_batch_003_staged.json')
records = json.loads(path.read_text())
repairs = {
    'biology-dr-high-0048': 'Support and movement',
    'biology-dr-high-0063': 'Excretion',
    'biology-dr-high-0070': 'Excretion',
    'biology-dr-high-0074': 'Excretion',
    'biology-dr-high-0088': 'Coordination and control',
}
for record in records:
    if record['externalId'] in repairs:
        record['topic'] = repairs[record['externalId']]
path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'repairs': repairs}))
