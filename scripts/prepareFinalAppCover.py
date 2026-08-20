from pathlib import Path

from PIL import Image


SOURCE = Path("/home/ubuntu/webdev-static-assets/jamb-quest-final-app-cover-512.png")
TARGET = Path("/home/ubuntu/webdev-static-assets/jamb-quest-final-app-cover-192.png")


def main() -> None:
    with Image.open(SOURCE) as image:
        image.convert("RGBA").resize((192, 192), Image.Resampling.LANCZOS).save(TARGET)


if __name__ == "__main__":
    main()
