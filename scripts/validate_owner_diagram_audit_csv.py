import csv
import json
from pathlib import Path

reports = Path('/home/ubuntu/jamb-quiz-game/reports')
snapshot_path = reports / 'owner_diagram_audit_pages_1_to_6_live_snapshot.json'
csv_path = reports / 'owner_profile_diagram_questions_pages_3_to_6.csv'

snapshot = json.loads(snapshot_path.read_text(encoding='utf-8'))
pages = snapshot['pages']
assert [page['auditPage'] for page in pages] == [1, 2, 3, 4, 5, 6]
assert all(len(page['records']) == 20 for page in pages[:5])
assert len(pages[5]['records']) == 19

first_two = [record for page in pages[:2] for record in page['records']]
assert len(first_two) == 40
assert all(record['learnerVisible'] for record in first_two), 'A Page 1–2 record is still held'

website_rows = [
    (str(page['auditPage']), str(index + 1), str(record['id']), record['externalId'])
    for page in pages[2:6]
    for index, record in enumerate(page['records'])
]

with csv_path.open(newline='', encoding='utf-8') as handle:
    csv_rows = list(csv.DictReader(handle))

export_rows = [
    (row['owner_profile_page'], row['position_on_page'], row['database_id'], row['question_id'])
    for row in csv_rows
]

assert len(csv_rows) == 79, len(csv_rows)
assert {row['owner_profile_page'] for row in csv_rows} == {'3', '4', '5', '6'}
assert export_rows == website_rows, 'CSV order or question IDs differ from the live Owner Profile snapshot'

print(f'page_1_to_2_visible={len(first_two)}')
print(f'page_3_to_6_csv_rows={len(csv_rows)}')
print('csv_matches_live_owner_profile_snapshot=yes')
