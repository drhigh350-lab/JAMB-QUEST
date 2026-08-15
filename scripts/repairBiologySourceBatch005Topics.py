import json
from pathlib import Path
path = Path('reports/biology_explanation_batch_005_staged.json')
records = json.loads(path.read_text())
repairs = {
    'biology-dr-high-0054': 'Evolution and classification',
    'biology-dr-high-0065': 'Coordination and control',
    'biology-dr-high-0079': 'Coordination and control',
    'biology-dr-high-0080': 'Coordination and control',
    'biology-dr-high-0081': 'Coordination and control',
    'biology-dr-high-0106': 'Transport',
}
for record in records:
    if record['externalId'] in repairs:
        record['topic'] = repairs[record['externalId']]
path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'repairs': repairs}))
