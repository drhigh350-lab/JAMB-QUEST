from pathlib import Path

from PIL import Image, ImageOps

source = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-0402-schoolngr-original.png")
output = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-0402-schoolngr-source-panel.png")

# The SchoolNGR source exactly matches the held JAMB 2005 prompt. This box removes
# only detached source specks and white framing around the original urinary-system
# panel, retaining labels I–IV and all tested figure geometry.
image = Image.open(source).convert("RGB")
panel = ImageOps.expand(image.crop((40, 70, 340, 320)), border=10, fill="#ffffff")
panel.save(output, "PNG", optimize=True)
print(output)
