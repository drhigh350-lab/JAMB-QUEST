import re
import requests
from bs4 import BeautifulSoup
url = 'https://myschool.ng/classroom/biology/287?exam_type=jamb'
response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=30)
print(response.status_code, len(response.text))
soup = BeautifulSoup(response.text, 'html.parser')
print('title=', soup.title.get_text(' ', strip=True) if soup.title else '')
for needle in ['Correct Option', 'Epiphytes', 'an epiphyte', 'Explanation']:
    print(needle, needle.lower() in response.text.lower())
text = re.sub(r'\s+', ' ', soup.get_text(' ', strip=True))
for pattern in [r'Correct Option\s*([A-E])', r'Explanation\s*Correct Option\s*[A-E]\s*(.*?)(?:Get Myschool|Post your Contribution|Comments|$)']:
    match = re.search(pattern, text, re.I)
    print(pattern, bool(match), match.group(0)[:400] if match else '')
options = []
for line in soup.get_text("\n", strip=True).splitlines():
    match = re.match(r"^([A-E])\s+(.*)$", re.sub(r"\s+", " ", line or "").strip(), re.I)
    if match and match.group(2).strip() not in options:
        options.append(match.group(2).strip())
heading = soup.find("h1") or soup.find("h2") or soup.find("h3")
question = re.sub(r"\s+", " ", heading.get_text(" ", strip=True) if heading else "").strip()
main = soup.select_one('main') or soup
print('main exists', bool(soup.select_one('main')), 'main option rows', len(main.select('div.flex.items-center.gap-6')))
print('question=', question)
print('options=', len(options), options[:8])
for needle in ['a parasite', 'an epiphyte', 'a saprophyte', 'a predator', 'a hermaphrodite']:
    node = soup.find(string=lambda value: value and needle in value.lower())
    if node:
        parent = node.parent
        print('NODE', needle, parent.name, parent.get('class'), parent.parent.name if parent.parent else None, parent.parent.get('class') if parent.parent else None)
        print(str(parent.parent)[:1200])
print('text=', text[:1800])
