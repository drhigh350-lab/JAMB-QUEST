from pathlib import Path
from PIL import Image, ImageOps

UPLOAD = Path('/home/ubuntu/upload')
OUT = Path('/home/ubuntu/webdev-static-assets/recovered-owner-original-diagrams')
REPORT = Path('/home/ubuntu/jamb-quiz-game/reports/recovered_original_crop_manifest_aug18.tsv')
OUT.mkdir(parents=True, exist_ok=True)

physics = [
    ('OWNER-PHY-DIAGRAM-2026-001', 'Screenshot_2026-08-17-07-43-37-976_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-002', 'Screenshot_2026-08-17-07-43-27-636_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-003', 'Screenshot_2026-08-17-07-43-13-638_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-004', 'Screenshot_2026-08-17-07-43-04-025_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-005', 'Screenshot_2026-08-17-07-42-58-491_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-006', 'Screenshot_2026-08-17-07-42-49-630_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-007', 'Screenshot_2026-08-17-07-42-40-006_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-008', 'Screenshot_2026-08-17-07-42-27-274_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-009', 'Screenshot_2026-08-17-07-42-07-906_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-010', 'Screenshot_2026-08-17-07-41-57-260_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-011', 'Screenshot_2026-08-17-07-41-43-651_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-012', 'Screenshot_2026-08-17-07-41-36-232_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-013', 'Screenshot_2026-08-17-07-41-24-376_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-014', 'Screenshot_2026-08-17-07-40-58-205_com.myschool.cbt.jpg'),
    ('OWNER-PHY-DIAGRAM-2026-015', 'Screenshot_2026-08-17-07-40-39-641_com.myschool.cbt.jpg'),
]

chemistry = [
    ('OWNER-CHEM-DIAGRAM-2026-001', 'Screenshot_2026-08-17-07-36-21-763_com.myschool.cbt.jpg'),
    ('OWNER-CHEM-DIAGRAM-2026-002', 'Screenshot_2026-08-17-07-35-32-636_com.myschool.cbt.jpg'),
    ('OWNER-CHEM-DIAGRAM-2026-003', 'Screenshot_2026-08-17-07-34-53-384_com.myschool.cbt.jpg'),
    ('OWNER-CHEM-DIAGRAM-2026-004', 'Screenshot_2026-08-17-07-34-30-852_com.myschool.cbt.jpg'),
    ('OWNER-CHEM-DIAGRAM-2026-005', 'Screenshot_2026-08-17-07-34-20-959_com.myschool.cbt.jpg'),
    ('OWNER-CHEM-DIAGRAM-2026-006', 'Screenshot_2026-08-17-07-33-54-841_com.myschool.cbt.jpg'),
    ('OWNER-CHEM-DIAGRAM-2026-007', 'Screenshot_2026-08-17-07-33-27-563_com.myschool.cbt.jpg'),
    ('OWNER-CHEM-DIAGRAM-2026-008', 'Screenshot_2026-08-17-07-33-01-885_com.myschool.cbt.jpg'),
    ('OWNER-CHEM-DIAGRAM-2026-009', 'Screenshot_2026-08-17-07-32-30-140_com.myschool.cbt.jpg'),
]

initial_biology = [
    ('OWNER-BIO-DIAGRAM-2025-001', 'Screenshot_2026-08-17-07-09-05-372_com.myschool.cbt.jpg'),
    ('OWNER-BIO-DIAGRAM-2025-002', 'Screenshot_2026-08-17-07-08-42-467_com.myschool.cbt.jpg'),
    ('OWNER-BIO-DIAGRAM-2025-003', 'Screenshot_2026-08-17-07-08-28-458_com.myschool.cbt.jpg'),
    ('OWNER-BIO-DIAGRAM-2025-004', 'Screenshot_2026-08-17-07-08-02-664_com.myschool.cbt.jpg'),
    ('OWNER-BIO-DIAGRAM-2025-005', 'Screenshot_2026-08-17-07-07-53-147_com.myschool.cbt.jpg'),
    ('OWNER-BIO-DIAGRAM-2025-006', 'Screenshot_2026-08-17-07-07-27-520_com.myschool.cbt.jpg'),
    ('OWNER-BIO-DIAGRAM-2025-007', 'Screenshot_2026-08-17-07-07-08-579_com.myschool.cbt.jpg'),
    ('OWNER-BIO-DIAGRAM-2025-008', 'Screenshot_2026-08-17-07-06-58-242_com.myschool.cbt.jpg'),
    ('OWNER-BIO-DIAGRAM-2025-009', 'Screenshot_2026-08-17-07-06-43-415_com.myschool.cbt.jpg'),
]

final_biology = [
    ('OWNER-BIO-DIAGRAM-2026-001', '350949.jpg'), ('OWNER-BIO-DIAGRAM-2026-002', '350948.jpg'),
    ('OWNER-BIO-DIAGRAM-2026-003', '350947.jpg'), ('OWNER-BIO-DIAGRAM-2026-004', '350946.jpg'),
    ('OWNER-BIO-DIAGRAM-2026-005', '350945.jpg'), ('OWNER-BIO-DIAGRAM-2026-006', '350944.jpg'),
    ('OWNER-BIO-DIAGRAM-2026-007', '350943.jpg'), ('OWNER-BIO-DIAGRAM-2026-008', '350942.jpg'),
    ('OWNER-BIO-DIAGRAM-2026-009', '350941.jpg'), ('OWNER-BIO-DIAGRAM-2026-010', '350940.jpg'),
    ('OWNER-BIO-DIAGRAM-2026-011', 'Screenshot_2026-08-17-08-48-44-488_com.myschool.cbt.jpg'),
    ('OWNER-BIO-DIAGRAM-2026-012', 'Screenshot_2026-08-17-08-48-17-305_com.myschool.cbt.jpg'),
    ('OWNER-BIO-DIAGRAM-2026-013', 'Screenshot_2026-08-17-08-47-51-181_com.myschool.cbt.jpg'),
]

# Crops are intentionally conservative. They retain only the original source figure panel
# and exclude the answer choices, selected option state, explanations, and navigation UI.
SETS = [
    (physics, (38, 335, 682, 600)),
    (chemistry, (38, 330, 682, 590)),
    (initial_biology, (38, 245, 682, 610)),
    (final_biology, (38, 130, 682, 535)),
]

CROP_OVERRIDES = {
    'OWNER-CHEM-DIAGRAM-2026-005': (38, 350, 682, 445),
    'OWNER-CHEM-DIAGRAM-2026-006': (38, 350, 682, 430),
    'OWNER-CHEM-DIAGRAM-2026-007': (38, 350, 682, 430),
    'OWNER-CHEM-DIAGRAM-2026-009': (38, 350, 682, 430),
}

lines = ['external_id\tsource_file\tcrop_box\toutput_file']
for records, box in SETS:
    for external_id, source_file in records:
        source = UPLOAD / source_file
        if not source.exists():
            raise FileNotFoundError(source)
        image = Image.open(source).convert('RGB')
        crop_box = CROP_OVERRIDES.get(external_id, box)
        crop = image.crop(crop_box)
        crop = ImageOps.expand(crop, border=8, fill='#ffffff')
        output = OUT / f'{external_id.lower()}.png'
        crop.save(output, optimize=True)
        lines.append(f'{external_id}\t{source_file}\t{crop_box}\t{output}')

REPORT.write_text('\n'.join(lines) + '\n')

def contact_sheet(label, records):
    cell_w, cell_h, columns = 260, 170, 4
    rows = (len(records) + columns - 1) // columns
    sheet = Image.new('RGB', (columns * cell_w, rows * cell_h), '#f7f2e6')
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for index, (external_id, _) in enumerate(records):
        image = Image.open(OUT / f'{external_id.lower()}.png').convert('RGB')
        image.thumbnail((cell_w - 16, cell_h - 38))
        x = (index % columns) * cell_w + (cell_w - image.width) // 2
        y = (index // columns) * cell_h + 4
        sheet.paste(image, (x, y))
        draw.text(((index % columns) * cell_w + 6, (index // columns) * cell_h + cell_h - 22), external_id.rsplit('-', 1)[-1], fill='#102a43', font=font)
    sheet.save(Path('/home/ubuntu/jamb-quiz-game/reports') / f'{label}_original_crop_contact.png')

contact_sheet('physics', physics)
contact_sheet('chemistry', chemistry)
contact_sheet('biology_initial', initial_biology)
contact_sheet('biology_final', final_biology)
print(f'created {len(lines) - 1} original-only crops in {OUT}')
