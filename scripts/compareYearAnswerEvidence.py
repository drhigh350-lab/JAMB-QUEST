import json
import sys
from pathlib import Path

year = sys.argv[1] if len(sys.argv) > 1 else '1984'
subjects = ['biology', 'chemistry', 'physics', 'english-language']
schoolngr = json.loads(Path(f'reports/schoolngr_{year}_bounded_crosscheck.json').read_text())
results = {}
for subject in subjects:
    myschool = json.loads(Path(f'reports/myschool_{subject}_{year}_first_page_answer_key.json').read_text())['records']
    other = schoolngr[subject]['records']
    rows = []
    for left, right in zip(myschool[:5], other[:5]):
        rows.append({'myschool': left['answer'], 'schoolngr': right['answer'], 'agreement': left['answer'] == right['answer'], 'myschoolUrl': left['url'], 'schoolngrUrl': right['url'], 'question': left.get('question')})
    results[subject] = {'records': rows, 'agreements': sum(r['agreement'] for r in rows), 'disagreements': sum(not r['agreement'] for r in rows)}
Path(f'reports/{year}_four_subject_answer_key_agreement.json').write_text(json.dumps(results, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({subject: {'agreements': data['agreements'], 'disagreements': data['disagreements']} for subject, data in results.items()}))
