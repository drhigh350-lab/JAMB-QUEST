import json
from pathlib import Path
rows = json.loads(Path('reports/diagram_candidate_audit.json').read_text())['records']
for row in rows[:80]:
    print(f"{row['file']} | {row['externalId']} | {row['subject']} | {row['topic']} | {','.join(row['groups'])} | {row['question']}")
