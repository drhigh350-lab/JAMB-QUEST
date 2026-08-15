import json
from pathlib import Path
path = Path('reports/biology_explanation_batch_001_staged.json')
data = json.loads(path.read_text())
targets = {'biology-dr-high-0022', 'biology-dr-high-0030', 'biology-dr-high-0031'}
for record in data:
    if record['externalId'] in targets:
        record['topic'] = 'Transport'
path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
print({'repaired': sum(r['externalId'] in targets for r in data)})
