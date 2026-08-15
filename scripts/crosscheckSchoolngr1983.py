import json
import re
import sys
from pathlib import Path
import requests
from bs4 import BeautifulSoup

subjects = ['biology', 'chemistry', 'physics', 'english-language']
year = sys.argv[1] if len(sys.argv) > 1 else '1983'
headers = {'User-Agent': 'Mozilla/5.0 JAMB-Quest research verifier'}
results = {}
for subject in subjects:
    index = f'https://www.schoolngr.com/classroom/jamb/{subject}?examyear={year}'
    html = requests.get(index, headers=headers, timeout=30).text
    soup = BeautifulSoup(html, 'html.parser')
    urls = []
    for link in soup.find_all('a', href=True):
        href = link['href']
        if re.search(rf'/classroom/{re.escape(subject)}/\d+', href):
            if href.startswith('/'):
                href = 'https://www.schoolngr.com' + href
            if href not in urls:
                urls.append(href)
        if len(urls) >= 5:
            break
    rows = []
    for url in urls:
        text = requests.get(url, headers=headers, timeout=30).text
        match = re.search(r'Correct Answer:\s*</?[^>]*>\s*Option\s*([A-E])', text, re.I)
        title = BeautifulSoup(text, 'html.parser').title.get_text(' ', strip=True)
        rows.append({'url': url, 'answer': match.group(1).upper() if match else None, 'title': title})
    results[subject] = {'index': index, 'records': rows}
Path(f'reports/schoolngr_{year}_bounded_crosscheck.json').write_text(json.dumps(results, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({subject: len(data['records']) for subject, data in results.items()}))
