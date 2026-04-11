"""
Image processor for popular_products.json
1. Remove background (rembg)
2. 500x500 white background
3. Logo stamp bottom-right (80x80, 70% opacity)
4. Save to processed_images/ with same filename
"""

import json
from pathlib import Path

from PIL import Image
from rembg import remove

# -- Config -------------------------------------------------------------------
INPUT_JSON   = "popular_products.json"
LOGO_PATH    = Path(r"C:\Users\rnjsa\fishing-reservation\logo.png")
OUTPUT_DIR   = Path("processed_images")
CANVAS_SIZE  = (500, 500)
LOGO_SIZE    = (80, 80)
LOGO_OPACITY = 0.7
LOGO_MARGIN  = 10

OUTPUT_DIR.mkdir(exist_ok=True)


def remove_bg(img: Image.Image) -> Image.Image:
    return remove(img.convert("RGBA"))


def fit_on_canvas(subject: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", CANVAS_SIZE, (255, 255, 255, 255))
    subject = subject.copy()
    subject.thumbnail(CANVAS_SIZE, Image.LANCZOS)
    x = (CANVAS_SIZE[0] - subject.width) // 2
    y = (CANVAS_SIZE[1] - subject.height) // 2
    canvas.paste(subject, (x, y), mask=subject.split()[3])
    return canvas


def stamp_logo(base: Image.Image, logo: Image.Image) -> Image.Image:
    logo = logo.copy().resize(LOGO_SIZE, Image.LANCZOS).convert("RGBA")
    r, g, b, a = logo.split()
    a = a.point(lambda v: int(v * LOGO_OPACITY))
    logo.putalpha(a)
    x = CANVAS_SIZE[0] - LOGO_SIZE[0] - LOGO_MARGIN
    y = CANVAS_SIZE[1] - LOGO_SIZE[1] - LOGO_MARGIN
    base.paste(logo, (x, y), mask=logo.split()[3])
    return base


def process(src: Path, dst: Path, logo: Image.Image):
    print(f"  {src.name} ...", end=" ", flush=True)
    try:
        img = Image.open(src)
        no_bg = remove_bg(img)
        canvas = fit_on_canvas(no_bg)
        canvas = stamp_logo(canvas, logo)
        canvas.convert("RGB").save(dst, "JPEG", quality=92)
        print("done")
    except Exception as e:
        print(f"FAILED: {e}")


def main():
    with open(INPUT_JSON, encoding="utf-8") as f:
        products = json.load(f)

    if not LOGO_PATH.exists():
        print(f"[error] logo not found: {LOGO_PATH}")
        return
    logo = Image.open(LOGO_PATH).convert("RGBA")
    print(f"[logo] {LOGO_PATH.name} ({logo.size})")

    targets = [p for p in products if p.get("image_file") and Path(p["image_file"]).exists()]
    print(f"[OK] {len(targets)}개 이미지 처리 시작\n")

    for i, prod in enumerate(targets, 1):
        src = Path(prod["image_file"])
        dst = OUTPUT_DIR / src.name
        print(f"[{i:02d}/{len(targets)}] {prod['name'][:40]}")
        process(src, dst, logo)
        prod["processed_image"] = str(dst)

    with open(INPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"\n[done] {OUTPUT_DIR}/ 에 저장 완료")


if __name__ == "__main__":
    main()
