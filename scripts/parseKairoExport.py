import json
from pathlib import Path

raw = json.loads(Path('/home/ubuntu/jamb-quiz-game/reports/kairo_export_raw.json').read_text())
result = raw.get('result', '')
start = result.find('[')
end = result.rfind(']')
if start < 0 or end < start:
    raise SystemExit('No JSON array found in MCP result')
records = json.loads(result[start:end + 1])
Path('/home/ubuntu/jamb-import-staging/kairo_questions_aug16.json').write_text(json.dumps({'records': records}, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'records': len(records), 'subjects': {s: sum(1 for r in records if r.get('subject') == s) for s in sorted({r.get('subject') for r in records})}}, indent=2))
