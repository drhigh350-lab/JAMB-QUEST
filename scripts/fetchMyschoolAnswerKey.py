import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

subject = sys.argv[1] if len(sys.argv) > 1 else 'biology'
year = sys.argv[2] if len(sys.argv) > 2 else '1983'
url = f'https://myschool.ng/classroom/{subject}?exam_type=jamb&exam_year={year}'
headers = {'User-Agent': 'Mozilla/5.0 JAMB-Quest research verifier'}
records = []
seen_urls = set()
for page_number in range(1, 21):
    page_url = f'{url}&page={page_number}'
    html = requests.get(page_url, headers=headers, timeout=30).text
    soup = BeautifulSoup(html, 'html.parser')
    page_links = soup.find_all('a', href=True)
    if not page_links:
        break
    for link in page_links:
        href = link['href']
        if not re.search(rf'/classroom/{re.escape(subject)}/\d+', href):
            continue
        question_url = urljoin(url, href)
        if question_url in seen_urls:
            continue
        seen_urls.add(question_url)
        page = BeautifulSoup(requests.get(question_url, headers=headers, timeout=30).text, 'html.parser')
        text = ' '.join(page.stripped_strings)
        match = re.search(r'Correct Option\s+([A-E])', text, re.I)
        question_match = re.search(rf'JAMB\s+{year}\s+(.*?)\s+Download Offline App', text, re.I)
        if match:
            records.append({'url': question_url, 'answer': match.group(1).upper(), 'question': question_match.group(1).strip() if question_match else None})
        if len(records) >= 1000:
            break
    if len(records) >= 1000:
        break
out = Path(f'reports/myschool_{subject}_{year}_answer_key.json')
out.write_text(json.dumps({'source': url, 'subject': subject, 'year': year, 'records': records}, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'source': url, 'subject': subject, 'year': year, 'records': len(records), 'output': str(out)}))
