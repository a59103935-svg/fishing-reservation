"""
Upload rank 1-10 products to Supabase
- Images -> Storage "products" bucket
- Metadata -> products table
"""

import json
import os
import re
from pathlib import Path

from supabase import create_client

# -- Config -------------------------------------------------------------------
INPUT_JSON    = "popular_products.json"
IMAGE_DIR     = Path("processed_images")
BUCKET        = "products"
RANK_LIMIT    = 10

# Read .env.local
env = {}
env_path = Path(".env.local")
if env_path.exists():
    for line in env_path.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()

SUPABASE_URL      = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY      = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit("[error] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not found in .env.local")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# -- Category auto-classify ---------------------------------------------------
CATEGORY_RULES = [
    (["집어등", "램프", "케미", "배터리", "건전지"], "집어등"),
    (["가위", "라인커터", "커터"],                    "낚시가위"),
    (["칼", "칼집", "칼보호"],                        "낚시칼"),
    (["에기", "에깅", "이카"],                        "에기"),
    (["바늘", "채비", "텐빈", "훅", "스틱"],          "채비"),
    (["쿨러", "아이스"],                              "쿨러"),
    (["합사", "라인", "줄"],                          "낚싯줄"),
    (["집게", "그립"],                                "낚시집게"),
    (["로드", "낚싯대"],                              "낚싯대"),
]

def classify(name: str) -> str:
    for keywords, cat in CATEGORY_RULES:
        if any(kw in name for kw in keywords):
            return cat
    return "기타"


# -- Image upload -------------------------------------------------------------
def upload_image(rank: int, product_id: str) -> str:
    """Upload processed image to Storage, return public URL."""
    img_path = IMAGE_DIR / f"{rank:03d}.jpg"
    if not img_path.exists():
        print(f"  [warn] image not found: {img_path}")
        return ""

    storage_path = f"{product_id}.jpg"
    with open(img_path, "rb") as f:
        data = f.read()

    try:
        supabase.storage.from_(BUCKET).upload(
            path=storage_path,
            file=data,
            file_options={"content-type": "image/jpeg", "upsert": "true"},
        )
    except Exception as e:
        print(f"  [warn] upload failed: {e}")
        return ""

    res = supabase.storage.from_(BUCKET).get_public_url(storage_path)
    return res


# -- Main ---------------------------------------------------------------------
def main():
    with open(INPUT_JSON, encoding="utf-8") as f:
        products = json.load(f)

    targets = [p for p in products if p.get("rank", 99) <= RANK_LIMIT]
    targets.sort(key=lambda p: p["rank"])
    print(f"[OK] rank 1~{RANK_LIMIT} products: {len(targets)}개\n")

    for prod in targets:
        rank = prod["rank"]
        name = prod["name"]
        price = prod["price"]
        product_id = prod["product_id"]
        category = classify(name)

        print(f"[{rank:02d}] {name[:45]}")
        print(f"      category: {category} | price: {price:,}원")

        # Check duplicate
        existing = supabase.table("products").select("id").eq("name", name).execute()
        if existing.data:
            print(f"      [skip] 이미 존재하는 상품")
            continue

        # Upload image
        print(f"      uploading image...", end=" ", flush=True)
        image_url = upload_image(rank, product_id)
        print("done" if image_url else "no image")

        # Insert product (image_url 컬럼이 없으면 제외)
        row = {
            "name":        name,
            "price":       price,
            "category":    category,
            "description": "",
            "stock":       20,
            "is_active":   True,
            "sort_order":  rank,
        }
        if image_url:
            try:
                # image_url 컬럼 존재 여부 확인 후 추가
                test = supabase.table("products").select("image_url").limit(1).execute()
                row["image_url"] = image_url
            except Exception:
                print(f"      [info] image_url 컬럼 없음, 스킵 (URL: {image_url[:60]}...)")

        try:
            supabase.table("products").insert(row).execute()
            print(f"      [OK] inserted")
        except Exception as e:
            print(f"      [error] insert failed: {e}")

    print("\n[done] 완료")


if __name__ == "__main__":
    main()
