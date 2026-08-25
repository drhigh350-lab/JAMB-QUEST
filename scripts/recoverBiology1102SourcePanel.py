from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

source = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-1102-myschool-original.png")
output = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-1102-myschool-source-panel.png")

# Exact 2022 source figure. The image contains only the beak drawing; autocontrast
# and a fixed contrast adjustment improve print-scan legibility without adding,
# removing, relabelling, or redrawing any source geometry.
image = Image.open(source).convert("L")
panel = ImageOps.autocontrast(image, cutoff=1)
panel = ImageEnhance.Contrast(panel).enhance(1.8)
panel = ImageOps.expand(panel.convert("RGB"), border=10, fill="#ffffff")
panel.save(output, "PNG", optimize=True)
print(output)
