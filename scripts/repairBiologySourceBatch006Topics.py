import json
from pathlib import Path
path = Path('reports/biology_explanation_batch_006_staged.json')
records = json.loads(path.read_text())
repairs = {
    'biology-dr-high-0083': 'Transport',
    'biology-dr-high-0110': 'Transport',
}
for record in records:
    if record['externalId'] in repairs:
        record['topic'] = repairs[record['externalId']]
path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'repairs': repairs}))
