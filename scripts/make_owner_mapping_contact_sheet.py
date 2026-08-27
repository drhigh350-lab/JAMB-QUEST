from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

image_dir = Path('/home/ubuntu/upload')
output_path = Path('/home/ubuntu/jamb-quiz-game/reports/owner_mapping_available_images_contact_sheet.png')
paths = sorted(image_dir.glob('362*.png'))
cell_width, cell_height, label_height = 340, 270, 36
columns = 3
rows = (len(paths) + columns - 1) // columns
canvas = Image.new('RGB', (columns * cell_width, rows * (cell_height + label_height)), 'white')
draw = ImageDraw.Draw(canvas)
font = ImageFont.load_default()

for index, path in enumerate(paths):
    source = Image.open(path).convert('RGB')
    source.thumbnail((cell_width - 20, cell_height - 20))
    x = (index % columns) * cell_width + (cell_width - source.width) // 2
    y = (index // columns) * (cell_height + label_height) + (cell_height - source.height) // 2
    canvas.paste(source, (x, y))
    label_x = (index % columns) * cell_width + 10
    label_y = (index // columns) * (cell_height + label_height) + cell_height + 10
    draw.text((label_x, label_y), path.name, fill='black', font=font)

output_path.parent.mkdir(parents=True, exist_ok=True)
canvas.save(output_path)
print(output_path)
