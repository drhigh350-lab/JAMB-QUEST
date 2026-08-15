import json
from pathlib import Path

myschool = json.loads(Path('reports/myschool_biology_1983_answer_key.json').read_text())['records']
schoolngr = json.loads(Path('reports/schoolngr_biology_bounded_answer_key.json').read_text())['records']
rows = []
for left, right in zip(myschool, schoolngr):
    rows.append({'question': left['question'], 'myschool': left['answer'], 'schoolngr': right['answer'], 'agreement': left['answer'] == right['answer'], 'myschoolUrl': left['url'], 'schoolngrUrl': right['url']})
result = {'sourceA': 'Myschool', 'sourceB': 'SchoolNGR', 'subject': 'Biology', 'year': 1983, 'records': rows, 'agreements': sum(row['agreement'] for row in rows), 'disagreements': sum(not row['agreement'] for row in rows)}
Path('reports/biology_1983_answer_key_agreement.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({k: result[k] for k in ('subject', 'year', 'agreements', 'disagreements')}))
