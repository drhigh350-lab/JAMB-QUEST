from pathlib import Path

from PIL import Image, ImageOps

source = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-0405-schoolngr-original.webp")
output = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-0405-schoolngr-source-panel.png")

# Crop only the detached scan specks above the complete original I–IV figure.
# All anatomy, leader lines, and labels remain untouched.
image = Image.open(source).convert("RGB")
panel = image.crop((0, 44, image.width, image.height))
panel = ImageOps.expand(panel, border=8, fill="#ffffff")
panel.save(output, "PNG", optimize=True)
print(output)
