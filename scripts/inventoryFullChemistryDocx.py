import json
from collections import Counter
from pathlib import Path

parsed = json.loads(Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_full_parsed.json').read_text(encoding='utf-8'))['records']
audit = json.loads(Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_full_parse_audit.json').read_text(encoding='utf-8'))

valid_numbered = [r for r in parsed if r['sourceFormat'] == 'numbered']
valid_bracketed = [r for r in parsed if r['sourceFormat'] == 'bracketed']
numbered_counts = Counter(r['sourceNumber'] for r in valid_numbered)
bracketed_counts = Counter(r['sourceNumber'] for r in valid_bracketed)

inventory = {
    'sequentialNumberedSet': {
        'expectedRange': [1, 1020],
        'validParsedRecords': len(valid_numbered),
        'distinctValidNumbers': len(numbered_counts),
        'missingFromValidParse': [n for n in range(1, 1021) if n not in numbered_counts],
        'duplicateValidNumbers': {str(n): count for n, count in numbered_counts.items() if count > 1},
    },
    'bracketedSet': {
        'expectedRange': [1, 321],
        'validParsedRecords': len(valid_bracketed),
        'distinctValidNumbers': len(bracketed_counts),
        'missingFromValidParse': [n for n in range(1, 322) if n not in bracketed_counts],
        'duplicateValidNumbers': {str(n): count for n, count in bracketed_counts.items() if count > 1},
    },
    'documentInventory': {
        'sourceLabelledQuestionTotal': 1020 + 321,
        'validParsedQuestionTotal': len(parsed),
        'needsParserOrSourceReview': (1020 + 321) - len(parsed),
        'headerCountBeforeSequentialFiltering': audit['headerCount'],
    },
}
out = Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_full_inventory.json')
out.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({
    'sourceLabelledQuestionTotal': inventory['documentInventory']['sourceLabelledQuestionTotal'],
    'validParsedQuestionTotal': inventory['documentInventory']['validParsedQuestionTotal'],
    'needsParserOrSourceReview': inventory['documentInventory']['needsParserOrSourceReview'],
    'numberedMissing': len(inventory['sequentialNumberedSet']['missingFromValidParse']),
    'bracketedMissing': len(inventory['bracketedSet']['missingFromValidParse']),
}, indent=2))
