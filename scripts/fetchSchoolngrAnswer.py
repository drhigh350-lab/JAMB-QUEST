import json
import re
import sys
from pathlib import Path
import requests
from bs4 import BeautifulSoup

subject = sys.argv[1] if len(sys.argv) > 1 else 'biology'
ids = [int(value) for value in sys.argv[2:]]
rows = []
for question_id in ids:
    url = f'https://www.schoolngr.com/classroom/{subject}/{question_id}'
    html = requests.get(url, headers={'User-Agent': 'Mozilla/5.0 JAMB-Quest research verifier'}, timeout=30).text
    match = re.search(r'Correct Answer:\s*</?[^>]*>\s*Option\s*([A-E])', html, re.I)
    soup = BeautifulSoup(html, 'html.parser')
    title = soup.title.get_text(' ', strip=True) if soup.title else ''
    rows.append({'questionId': question_id, 'url': url, 'answer': match.group(1).upper() if match else None, 'title': title})
out = Path(f'reports/schoolngr_{subject}_bounded_answer_key.json')
out.write_text(json.dumps({'subject': subject, 'records': rows}, indent=2) + '\n')
print(json.dumps({'subject': subject, 'records': rows}))
