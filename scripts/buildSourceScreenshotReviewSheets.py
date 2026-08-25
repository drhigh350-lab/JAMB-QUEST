from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

PROJECT = Path('/home/ubuntu/jamb-quiz-game')
CLASSIFICATION = PROJECT / 'reports' / 'learner_diagram_classification_20260825.json'
ASSET_AUDIT = PROJECT / 'reports' / 'learner_diagram_asset_checks_20260825.json'
OUT = Path('/home/ubuntu/jamb-intake-tmp/source-screenshot-diagram-review')

CELL_W, CELL_H, COLUMNS, ROWS = 600, 400, 2, 3


def fit(image: Image.Image, width: int, height: int) -> Image.Image:
    image = image.convert('RGB')
    image.thumbnail((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (width, height), '#fffdf6')
    canvas.paste(image, ((width - image.width) // 2, (height - image.height) // 2))
    return canvas


classification = json.loads(CLASSIFICATION.read_text())
asset_audit = json.loads(ASSET_AUDIT.read_text())
cache_by_id = {check['id']: check.get('cachePath') for check in asset_audit['checks']}
records = [record for record in classification['records'] if record['decision'] == 'review_source_screenshot']
OUT.mkdir(parents=True, exist_ok=True)
font = ImageFont.load_default()
manifest: list[dict] = []

for page_start in range(0, len(records), COLUMNS * ROWS):
    page_records = records[page_start:page_start + COLUMNS * ROWS]
    sheet = Image.new('RGB', (CELL_W * COLUMNS, CELL_H * ROWS), '#e8ded0')
    draw = ImageDraw.Draw(sheet)
    for idx, record in enumerate(page_records):
        x = (idx % COLUMNS) * CELL_W
        y = (idx // COLUMNS) * CELL_H
        draw.rectangle((x + 7, y + 7, x + CELL_W - 8, y + CELL_H - 8), fill='#fffdf6', outline='#12283f', width=2)
        cache_path = cache_by_id.get(record['id'])
        if cache_path and Path(cache_path).exists():
            thumb = fit(Image.open(cache_path), CELL_W - 28, CELL_H - 90)
            sheet.paste(thumb, (x + 14, y + 14))
        else:
            draw.rectangle((x + 14, y + 14, x + CELL_W - 15, y + CELL_H - 92), fill='#f3d8d1')
            draw.text((x + 24, y + 32), 'Missing cached review image', fill='#8b2b42', font=font)
        caption = f"{record['subject']} · {record['externalId']}\n{record['topic'][:60]}"
        draw.rectangle((x + 14, y + CELL_H - 78, x + CELL_W - 15, y + CELL_H - 14), fill='#f4a72c')
        draw.multiline_text((x + 22, y + CELL_H - 70), caption, fill='#12283f', font=font, spacing=3)
        manifest.append({
            'externalId': record['externalId'],
            'subject': record['subject'],
            'topic': record['topic'],
            'diagramUrl': record['diagramUrl'],
            'cachePath': cache_path,
            'sheet': f"source-screenshot-review-{page_start // (COLUMNS * ROWS) + 1:02d}.png",
        })
    sheet.save(OUT / f"source-screenshot-review-{page_start // (COLUMNS * ROWS) + 1:02d}.png", 'PNG')

(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'count': len(records), 'directory': str(OUT), 'pages': (len(records) + COLUMNS * ROWS - 1) // (COLUMNS * ROWS)}, indent=2))
