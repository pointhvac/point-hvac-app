"""
Android icon hazirlayici.
resources/icon.png dosyasini 1024x1024 kare + seffaf kenarli hale getirir.
Orijinali resources/icon_original.png olarak yedekler.
"""
from pathlib import Path
from PIL import Image

TARGET_SIZE = 1024
ROOT = Path(__file__).resolve().parent.parent
ICON_PATH = ROOT / "resources" / "icon.png"
BACKUP_PATH = ROOT / "resources" / "icon_original.png"


def main() -> None:
    if not ICON_PATH.exists():
        raise FileNotFoundError(f"Icon bulunamadi: {ICON_PATH}")

    img = Image.open(ICON_PATH).convert("RGBA")
    w, h = img.size
    print(f"Orijinal boyut: {w} x {h}")

    # Yedek al (sadece ilk calistirmada)
    if not BACKUP_PATH.exists():
        img.save(BACKUP_PATH)
        print(f"Yedek olusturuldu: {BACKUP_PATH.name}")

    # Uzun kenari hedef boyuta olcekle, orani koru
    scale = TARGET_SIZE / max(w, h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = img.resize((new_w, new_h), Image.LANCZOS)

    # Seffaf kare canvas, merkeze yerlestir
    canvas = Image.new("RGBA", (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
    offset_x = (TARGET_SIZE - new_w) // 2
    offset_y = (TARGET_SIZE - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)

    canvas.save(ICON_PATH, "PNG")
    print(f"Yeni boyut: {TARGET_SIZE} x {TARGET_SIZE}")
    print(f"Kaydedildi: {ICON_PATH}")


if __name__ == "__main__":
    main()
