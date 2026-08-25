from __future__ import annotations

import json
import math
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image, ImageDraw, ImageFont, UnidentifiedImageError

PROJECT = Path('/home/ubuntu/jamb-quiz-game')
REPORT_PATH = PROJECT / 'reports' / 'learner_diagram_inventory_20260825.json'
AUDIT_DIR = Path('/home/ubuntu/jamb-intake-tmp/diagram-asset-audit')
OUTPUT_PATH = PROJECT / 'reports' / 'learner_diagram_asset_checks_20260825.json'
PRODUCTION_ORIGIN = 'https://jambquiz-kmqgtf9m.manus.space'

CARD_WIDTH = 340
CARD_HEIGHT = 236
COLUMNS = 3
ROWS = 4
PAGE_SIZE = COLUMNS * ROWS


def display_url(value: str) -> str:
    return value if value.startswith(('http://', 'https://')) else f'{PRODUCTION_ORIGIN}{value}'


def label(record: dict) -> str:
    return f"{record['subject']} · {record['externalId']}\n{record.get('topic', '')[:44]}"


def fit_image(image: Image.Image, width: int, height: int) -> Image.Image:
    image = image.convert('RGB')
    image.thumbnail((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (width, height), '#f5f1e8')
    canvas.paste(image, ((width - image.width) // 2, (height - image.height) // 2))
    return canvas


def main() -> None:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    payload = json.loads(REPORT_PATH.read_text())
    linked = [record for record in payload['records'] if record['inventoryClass'] == 'linked_asset']
    font = ImageFont.load_default()
    checks: list[dict] = []
    thumbnails: list[tuple[dict, Image.Image | None, str]] = []

    for index, record in enumerate(linked, start=1):
        source_url = display_url(record['diagramUrl'])
        check = {
            'bank': record['bank'],
            'id': record['id'],
            'externalId': record['externalId'],
            'subject': record['subject'],
            'topic': record['topic'],
            'diagramUrl': record['diagramUrl'],
            'sourceUrl': source_url,
            'status': 'unknown',
        }
        thumbnail: Image.Image | None = None
        note = ''
        try:
            response = requests.get(source_url, timeout=20)
            check['httpStatus'] = response.status_code
            check['contentType'] = response.headers.get('content-type', '')
            check['byteLength'] = len(response.content)
            if response.status_code != 200:
                check['status'] = 'unavailable'
                note = f"HTTP {response.status_code}"
            else:
                image = Image.open(BytesIO(response.content))
                check['status'] = 'available'
                check['width'] = image.width
                check['height'] = image.height
                check['format'] = image.format
                cache_name = f"{index:03d}_{record['subject'].replace(' ', '_')}_{record['externalId'].replace('/', '_')}.png"
                cache_path = AUDIT_DIR / cache_name
                image.convert('RGB').save(cache_path, 'PNG')
                check['cachePath'] = str(cache_path)
                thumbnail = fit_image(image, CARD_WIDTH - 18, CARD_HEIGHT - 58)
                if image.width < 240 or image.height < 160:
                    note = f"small {image.width}×{image.height}"
        except (requests.RequestException, UnidentifiedImageError, OSError) as error:
            check['status'] = 'unavailable'
            check['error'] = str(error)
            note = 'download/decode failed'
        checks.append(check)
        thumbnails.append((record, thumbnail, note))

    page_paths: list[str] = []
    for page_start in range(0, len(thumbnails), PAGE_SIZE):
        page = Image.new('RGB', (COLUMNS * CARD_WIDTH, ROWS * CARD_HEIGHT), '#e9e2d4')
        draw = ImageDraw.Draw(page)
        for offset, (record, thumbnail, note) in enumerate(thumbnails[page_start:page_start + PAGE_SIZE]):
            col = offset % COLUMNS
            row = offset // COLUMNS
            x, y = col * CARD_WIDTH, row * CARD_HEIGHT
            draw.rectangle((x + 5, y + 5, x + CARD_WIDTH - 6, y + CARD_HEIGHT - 6), fill='#fffdf6', outline='#172b42', width=2)
            if thumbnail:
                page.paste(thumbnail, (x + 9, y + 9))
            else:
                draw.rectangle((x + 9, y + 9, x + CARD_WIDTH - 10, y + CARD_HEIGHT - 60), fill='#f4d4ce')
                draw.text((x + 18, y + 34), 'UNAVAILABLE ASSET', fill='#8b2b42', font=font)
            label_y = y + CARD_HEIGHT - 51
            draw.rectangle((x + 9, label_y - 4, x + CARD_WIDTH - 10, y + CARD_HEIGHT - 10), fill='#f6b12d')
            draw.multiline_text((x + 14, label_y), label(record), fill='#172b42', font=font, spacing=2)
            if note:
                draw.text((x + CARD_WIDTH - 115, y + 12), note[:18], fill='#8b2b42', font=font)
        page_number = page_start // PAGE_SIZE + 1
        page_path = AUDIT_DIR / f'diagram-contact-sheet-{page_number:02d}.png'
        page.save(page_path, 'PNG')
        page_paths.append(str(page_path))

    summary = {
        'generatedAt': payload['generatedAt'],
        'scope': 'Read-only availability and dimension checks for currently linked learner diagram assets. Visual accuracy, answer leakage, and source correctness require subsequent review.',
        'counts': {
            'linkedAssets': len(checks),
            'available': sum(check['status'] == 'available' for check in checks),
            'unavailable': sum(check['status'] != 'available' for check in checks),
            'small': sum(check.get('width', 0) < 240 or check.get('height', 0) < 160 for check in checks if check['status'] == 'available'),
        },
        'contactSheets': page_paths,
        'checks': checks,
    }
    OUTPUT_PATH.write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps({'reportPath': str(OUTPUT_PATH), 'counts': summary['counts'], 'contactSheets': page_paths}, indent=2))


if __name__ == '__main__':
    main()
