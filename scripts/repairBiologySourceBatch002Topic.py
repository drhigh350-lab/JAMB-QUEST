import json
from pathlib import Path
path = Path('reports/biology_explanation_batch_002_staged.json')
records = json.loads(path.read_text())
repairs = {
    'biology-dr-high-0060': 'Humans and environment',
    'biology-dr-high-0044': 'Coordination and control',
}
for record in records:
    if record['externalId'] in repairs:
        record['topic'] = repairs[record['externalId']]
path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'repairs': repairs}))
