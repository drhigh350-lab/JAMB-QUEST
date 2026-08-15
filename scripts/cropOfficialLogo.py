from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/webdev-static-assets/jamb-quest-official-logo.png')
target = Path('/home/ubuntu/webdev-static-assets/jamb-quest-official-logo-tight.png')

image = Image.open(source).convert('RGBA')
alpha = image.getchannel('A')
bounds = alpha.getbbox()

if bounds is None:
    raise RuntimeError('The official logo has no visible pixels to crop.')

left, top, right, bottom = bounds
padding = 12
left = max(0, left - padding)
top = max(0, top - padding)
right = min(image.width, right + padding)
bottom = min(image.height, bottom + padding)
image.crop((left, top, right, bottom)).save(target, 'PNG', optimize=True)
print(target)
