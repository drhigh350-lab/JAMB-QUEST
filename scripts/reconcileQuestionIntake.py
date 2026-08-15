import json
from pathlib import Path

root = Path('/home/ubuntu/jamb-quiz-game')
reports = root / 'reports'

def load(name):
    path = reports / name
    return json.loads(path.read_text()) if path.exists() else None

summary = {}
for name in ['question_count_reconciliation.json', 'all_subject_pdf_audit.json', 'active_syllabus_explanation_audit.json', 'authorised_playable_gap_audit.json', 'biology_docx_inventory.json', 'chemistry_docx_full_inventory.json', 'biology_docx_batch_001_import_receipt.json', 'owner_batches_aug15_import_receipt.json']:
    data = load(name)
    if data is not None:
        summary[name] = data

batch_rows = []
for path in sorted(reports.glob('legacy_explanation_batch_*_apply_receipt.json')):
    data = json.loads(path.read_text())
    batch_rows.append({'file': path.name, 'data': data})
summary['legacyApplyReceipts'] = batch_rows

for path in sorted(reports.glob('biology_explanation_batch_*.json')):
    if path.name.endswith('_staged.json') or path.name == 'biology_explanation_batch_001.json' or path.name == 'biology_explanation_batch_002.json':
        data = json.loads(path.read_text())
        records = data if isinstance(data, list) else data.get('records', [])
        summary.setdefault('biologyBatches', {})[path.name] = {'records': len(records), 'statuses': {}}
        for record in records:
            status = record.get('status', 'unknown')
            summary['biologyBatches'][path.name]['statuses'][status] = summary['biologyBatches'][path.name]['statuses'].get(status, 0) + 1

for path in sorted(reports.glob('legacy_explanation_batch_*_output.json')):
    data = json.loads(path.read_text())
    records = data if isinstance(data, list) else data.get('records', [])
    statuses = {}
    for record in records:
        status = record.get('status', 'unknown')
        statuses[status] = statuses.get(status, 0) + 1
    summary.setdefault('legacyOutputs', {})[path.name] = {'records': len(records), 'statuses': statuses}

out = reports / 'question_intake_reconciliation_aug15.json'
out.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + '\n')
print(f'Wrote {out}')
print('Source files:')
for path in sorted((root / 'research_answer_key_sources').glob('*.pdf')):
    print(f'  {path.name}: {path.stat().st_size} bytes')
print('Legacy apply receipts:', len(batch_rows))
print('Biology batch files:', len(summary.get('biologyBatches', {})))
print('Legacy output files:', len(summary.get('legacyOutputs', {})))
