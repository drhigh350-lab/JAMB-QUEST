from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

UPLOAD = Path('/home/ubuntu/upload')
OUT = Path('/home/ubuntu/jamb-quiz-game/reports')
OUT.mkdir(exist_ok=True)

SETS = {
    'physics_retained_originals_contact.png': [
        'Screenshot_2026-08-17-07-43-37-976_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-43-27-636_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-43-13-638_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-43-04-025_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-42-58-491_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-42-49-630_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-42-40-006_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-42-27-274_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-42-07-906_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-41-57-260_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-41-43-651_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-41-36-232_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-41-24-376_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-40-58-205_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-40-39-641_com.myschool.cbt.jpg',
    ],
    'biology_final_retained_originals_contact.png': [
        '350949.jpg', '350948.jpg', '350947.jpg', '350946.jpg', '350945.jpg', '350944.jpg',
        '350943.jpg', '350942.jpg', '350941.jpg', '350940.jpg',
        'Screenshot_2026-08-17-08-48-44-488_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-08-48-17-305_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-08-47-51-181_com.myschool.cbt.jpg',
    ],
    'unassigned_aug17_source_candidates_contact.png': [
        'Screenshot_2026-08-17-07-07-08-579_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-07-53-147_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-07-27-520_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-08-02-664_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-08-28-458_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-36-21-763_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-34-53-384_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-34-30-852_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-33-54-841_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-32-30-140_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-33-01-885_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-33-08-993_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-33-27-563_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-35-32-636_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-34-20-959_com.myschool.cbt.jpg',
    ],
    'initial_biology_retained_originals_contact.png': [
        'Screenshot_2026-08-17-07-06-09-917_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-06-26-632_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-06-43-415_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-06-58-242_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-07-08-579_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-07-27-520_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-07-53-147_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-08-02-664_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-08-28-458_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-08-42-467_com.myschool.cbt.jpg',
        'Screenshot_2026-08-17-07-09-05-372_com.myschool.cbt.jpg',
    ],
}

font = ImageFont.load_default()

def make_contact(filename, names):
    cell_w, cell_h = 260, 360
    columns = 4
    rows = (len(names) + columns - 1) // columns
    sheet = Image.new('RGB', (columns * cell_w, rows * cell_h), '#f7f2e6')
    draw = ImageDraw.Draw(sheet)
    for index, name in enumerate(names):
        path = UPLOAD / name
        if not path.exists():
            continue
        image = Image.open(path).convert('RGB')
        image.thumbnail((cell_w - 20, cell_h - 55))
        x = (index % columns) * cell_w + (cell_w - image.width) // 2
        y = (index // columns) * cell_h + 8
        sheet.paste(image, (x, y))
        draw.text(((index % columns) * cell_w + 8, (index // columns) * cell_h + cell_h - 40), f'{index + 1}. {name[:31]}', fill='#102a43', font=font)
    sheet.save(OUT / filename)

for filename, names in SETS.items():
    make_contact(filename, names)
    print(f'created {OUT / filename}')
