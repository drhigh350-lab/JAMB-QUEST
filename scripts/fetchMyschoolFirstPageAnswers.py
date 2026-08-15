import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

subject = sys.argv[1]
year = sys.argv[2]
url = f'https://myschool.ng/classroom/{subject}?exam_type=jamb&exam_year={year}'
html = requests.get(url, headers={'User-Agent': 'Mozilla/5.0 JAMB-Quest research verifier'}, timeout=30).text
soup = BeautifulSoup(html, 'html.parser')
records = []
seen = set()
for link in soup.find_all('a', href=True):
    href = link['href']
    if not re.search(rf'/classroom/{re.escape(subject)}/\d+', href):
        continue
    question_url = urljoin(url, href)
    if question_url in seen:
        continue
    seen.add(question_url)
    page = BeautifulSoup(requests.get(question_url, headers={'User-Agent': 'Mozilla/5.0 JAMB-Quest research verifier'}, timeout=30).text, 'html.parser')
    text = ' '.join(page.stripped_strings)
    match = re.search(r'Correct Option\s+([A-E])', text, re.I)
    records.append({'url': question_url, 'answer': match.group(1).upper() if match else None, 'question': (re.search(rf'JAMB\s+{year}\s+(.*?)\s+Download Offline App', text, re.I) or [None, None])[1]})
    if len(records) == 5:
        break
out = Path(f'reports/myschool_{subject}_{year}_first_page_answer_key.json')
out.write_text(json.dumps({'source': url, 'subject': subject, 'year': year, 'records': records}, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'subject': subject, 'year': year, 'records': len(records), 'answers': [r['answer'] for r in records]}))
