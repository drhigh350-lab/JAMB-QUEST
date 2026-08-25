from pathlib import Path

from PIL import Image, ImageOps

UPLOAD = Path('/home/ubuntu/upload')
OUT = Path('/home/ubuntu/webdev-static-assets/jamb-quest-diagrams')
OUT.mkdir(parents=True, exist_ok=True)

# Each box was reviewed against the original owner screenshot. It contains only the
# tested figure panel and intentionally excludes source headers, question wording,
# answer options, explanation controls, and navigation UI.
RECOVERIES = [
    ('OWNER-PHY-DIAGRAM-2026-003', 'Screenshot_2026-08-17-07-43-13-638_com.myschool.cbt.jpg', (48, 415, 400, 638)),
    ('OWNER-PHY-DIAGRAM-2026-005', 'Screenshot_2026-08-17-07-42-58-491_com.myschool.cbt.jpg', (48, 271, 566, 628)),
    ('OWNER-PHY-DIAGRAM-2026-007', 'Screenshot_2026-08-17-07-42-40-006_com.myschool.cbt.jpg', (48, 205, 585, 718)),
    ('OWNER-PHY-DIAGRAM-2026-008', 'Screenshot_2026-08-17-07-42-27-274_com.myschool.cbt.jpg', (48, 284, 654, 662)),
]

for external_id, filename, box in RECOVERIES:
    image = Image.open(UPLOAD / filename).convert('RGB')
    panel = ImageOps.expand(image.crop(box), border=10, fill='#ffffff')
    output = OUT / f'{external_id.lower()}-source-panel.png'
    panel.save(output, 'PNG', optimize=True)
    print(output)
