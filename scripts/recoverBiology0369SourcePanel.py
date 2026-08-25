from pathlib import Path

from PIL import Image, ImageOps

source = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-0369-schoolngr-original.png")
output = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-0369-schoolngr-source-panel.png")

# Reviewed against the exact matching public-source question. The box removes only
# the clipped source text above the panel; labels I–IV and the complete digestive
# figure remain inside the crop. No prompt, options, answer, or explanation is included.
image = Image.open(source).convert("RGB")
panel = ImageOps.expand(image.crop((0, 70, 375, 336)), border=10, fill="#ffffff")
panel.save(output, "PNG", optimize=True)
print(output)
