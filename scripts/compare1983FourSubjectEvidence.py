import json
from pathlib import Path

schoolngr = json.loads(Path('reports/schoolngr_1983_bounded_crosscheck.json').read_text())
results = {}
for subject in ['biology', 'chemistry', 'physics', 'english-language']:
    myschool_path = Path(f'reports/myschool_{subject}_1983_answer_key.json')
    myschool = json.loads(myschool_path.read_text())['records']
    other = schoolngr[subject]['records']
    rows = []
    for left, right in zip(myschool[:5], other[:5]):
        rows.append({'myschool': left['answer'], 'schoolngr': right['answer'], 'agreement': left['answer'] == right['answer'], 'myschoolUrl': left['url'], 'schoolngrUrl': right['url'], 'question': left.get('question')})
    results[subject] = {'records': rows, 'agreements': sum(r['agreement'] for r in rows), 'disagreements': sum(not r['agreement'] for r in rows)}
Path('reports/1983_four_subject_answer_key_agreement.json').write_text(json.dumps(results, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({subject: {'agreements': data['agreements'], 'disagreements': data['disagreements']} for subject, data in results.items()}))
