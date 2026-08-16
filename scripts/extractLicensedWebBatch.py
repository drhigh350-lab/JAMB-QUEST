import json
import re
import time
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

BASE = "https://myschool.ng"
OUT = Path("/home/ubuntu/jamb-import-staging/myschool_licensed_web_batch_aug16.json")
HEADERS = {"User-Agent": "JAMBQuestResearch/1.0 (licensed content audit)"}
SUBJECTS = [("Biology", "biology", 1), ("Chemistry", "chemistry", 1), ("Physics", "physics", 1)]

def clean(value):
    return re.sub(r"\s+", " ", value or "").strip()

def get(url):
    response = requests.get(url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser")

def index_links(subject_slug, pages):
    links, seen = [], set()
    for page in range(1, pages + 1):
        soup = get(f"{BASE}/classroom/{subject_slug}?exam_type=jamb&page={page}")
        print(f"index {subject_slug} page {page}", flush=True)
        for anchor in soup.select('a[href*="/classroom/"]'):
            href = anchor.get("href", "")
            if not re.search(rf"/classroom/{re.escape(subject_slug)}/(\d+)", href):
                continue
            full = urljoin(BASE, href)
            if full not in seen:
                seen.add(full)
                links.append(full)
        time.sleep(0.1)
    return links

def detail(subject, url):
    soup = get(url)
    main = soup.select_one("main") or soup
    text = clean(main.get_text(" ", strip=True))
    answer_match = re.search(r"Correct Option\s*([A-E])", text, re.I)
    if not answer_match:
        return None
    explanation_match = re.search(r"Explanation\s*Correct Option\s*[A-E]\s*(.*?)(?:Get Myschool|Post your Contribution|Comments|$)", text, re.I)
    explanation = clean(explanation_match.group(1) if explanation_match else "")
    options = []
    for row in main.select("div.flex.items-center.gap-6"):
        label = row.select_one("span")
        value_node = row.select_one("p")
        if label and value_node and re.fullmatch(r"[A-E]", clean(label.get_text(" ", strip=True)), re.I):
            value = clean(value_node.get_text(" ", strip=True))
            if value and value not in options:
                options.append(value)
    heading = soup.find("h1") or soup.find("h2") or soup.find("h3")
    question = clean(heading.get_text(" ", strip=True) if heading else "")
    if not question or question.lower() in {"biology", "chemistry", "physics"}:
        title = clean(soup.title.get_text(" ", strip=True) if soup.title else "")
        question = re.sub(r"\s*[-|].*$", "", title)
    year_match = re.search(r"JAMB\s+(\d{4})", text, re.I)
    year = year_match.group(1) if year_match else "unknown"
    if not question or len(options) not in (4, 5) or not explanation:
        return None
    return {
        "subject": subject,
        "year": year,
        "sourceQuestionNumber": int(re.search(r"/([0-9]+)", url).group(1)),
        "question": question,
        "options": options,
        "answerLetter": answer_match.group(1).upper(),
        "tag": "",
        "explanation": explanation,
        "questionFile": url,
        "answerFile": url,
    }

records, failures = [], []
for subject, slug, pages in SUBJECTS:
    for url in index_links(slug, pages):
        try:
            record = detail(subject, url)
            if record:
                records.append(record)
            else:
                failures.append({"subject": subject, "url": url, "reason": "missing complete answer-bearing structure"})
        except Exception as exc:
            failures.append({"subject": subject, "url": url, "reason": str(exc)})
        if len(records) >= 48:
            break
        time.sleep(0.1)
    if len(records) >= 48:
        break

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({"records": records[:48], "failures": failures, "source": "Myschool question-detail pages", "permissionNote": "User stated that their paid JAMB content license covers the designated trusted source; verify exact source coverage before release."}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps({"records": len(records[:48]), "failures": len(failures), "bySubject": {subject: sum(1 for item in records[:48] if item["subject"] == subject) for subject, _, _ in SUBJECTS}}, indent=2))
