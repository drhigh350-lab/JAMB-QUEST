import csv
from pathlib import Path

path = Path('/home/ubuntu/jamb-quiz-game/reports/diagram_questions_pages_3_to_6_owner_review.csv')
with path.open(newline='', encoding='utf-8') as handle:
    rows = list(csv.DictReader(handle))

assert rows, 'CSV has no data rows'
assert all(row['source_page'] in {'3', '4', '5', '6'} for row in rows)
assert all(row['current_action'] == 'Hold for owner review; no picture changed' for row in rows)
assert all(row['subject'] in {'Biology', 'Chemistry', 'Physics'} for row in rows)
assert len(rows) == 24, len(rows)
print(f'validated_rows={len(rows)}')
print('subjects=' + ','.join(sorted({row["subject"] for row in rows})))
print('pages=' + ','.join(sorted({row["source_page"] for row in rows})))
