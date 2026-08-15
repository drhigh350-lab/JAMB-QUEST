import json
from pathlib import Path

path = Path('reports/biology_explanation_batch_001.json')
data = json.loads(path.read_text())
for record in data['records']:
    lines = [line.strip() for line in record.get('lines', []) if line.strip()]
    record['lineCount'] = len(lines)
    record['status'] = 'ready' if len(lines) == 4 and all(8 <= len(line.split()) <= 50 for line in lines) else 'hold'
    record['holdReason'] = None if record['status'] == 'ready' else 'line-count-or-length-contract'
data['readyCount'] = sum(record['status'] == 'ready' for record in data['records'])
data['holdCount'] = sum(record['status'] == 'hold' for record in data['records'])
data['revalidated'] = True
path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'batch': data['batch'], 'readyCount': data['readyCount'], 'holdCount': data['holdCount']}))
