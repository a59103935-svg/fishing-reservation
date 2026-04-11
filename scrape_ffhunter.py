"""
Naver Smart Store product scraper
Target: https://smartstore.naver.com/ffhunter
Mode: top 50 by popularity (sortType=POPULAR)
Output: popular_products.json
"""

import asyncio
import json
import random
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

# -- Config -------------------------------------------------------------------
STORE_URL    = "https://smartstore.naver.com/ffhunter"
POPULAR_URL  = f"{STORE_URL}/category/ALL?sortType=POPULAR"
OUTPUT_JSON  = "popular_products.json"
IMAGE_DIR    = Path("images")
IMAGE_DIR.mkdir(exist_ok=True)
TOP_N        = 50

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
}


# -- Utils --------------------------------------------------------------------
def download_image(url: str, filepath: Path) -> bool:
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code == 200:
            filepath.write_bytes(r.content)
            return True
    except Exception as e:
        print(f"  [warn] image download failed: {e}")
    return False


# -- Scraper ------------------------------------------------------------------
async def scrape_popular(page) -> list[dict]:
    """Extract top N products from popularity-sorted category page"""
    print(f"[fetch] {POPULAR_URL}")
    await page.goto(POPULAR_URL, wait_until="networkidle", timeout=30000)
    await asyncio.sleep(2)

    # Scroll to ensure all cards load
    for _ in range(5):
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(0.8)

    html = await page.content()
    soup = BeautifulSoup(html, "html.parser")

    # Find product cards with shp data (filter to actual products, not category nav)
    cards = [
        c for c in soup.find_all(attrs={"data-shp-contents-dtl": True})
        if "chnl_prod_nm" in c.get("data-shp-contents-dtl", "")
    ]
    print(f"[OK] {len(cards)} product cards found, taking top {TOP_N}")

    products = []
    seen_ids = set()

    for card in cards:
        if len(products) >= TOP_N:
            break

        product_id = card.get("data-shp-contents-id", "")
        if not product_id or product_id in seen_ids:
            continue
        seen_ids.add(product_id)

        # Parse JSON attribute
        try:
            dtl = json.loads(card.get("data-shp-contents-dtl", "[]"))
            dtl_map = {item["key"]: item["value"] for item in dtl}
        except Exception:
            dtl_map = {}

        name = dtl_map.get("chnl_prod_nm", "")
        price_str = dtl_map.get("price", "0")
        price = int(price_str) if price_str.isdigit() else 0

        if not name or price == 0:
            continue

        # Image
        img = card.find("img")
        image_url = ""
        if img:
            image_url = img.get("src") or img.get("data-src") or ""

        # Product URL
        link = card.find("a", href=re.compile(r"/products/\d+"))
        if link:
            href = link.get("href", "")
            source_url = href if href.startswith("http") else f"https://smartstore.naver.com{href}"
        else:
            source_url = f"{STORE_URL}/products/{product_id}"

        products.append({
            "rank":       len(products) + 1,
            "product_id": product_id,
            "name":       name,
            "price":      price,
            "image_url":  image_url,
            "source_url": source_url,
        })

    return products


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        context = await browser.new_context(
            user_agent=HEADERS["User-Agent"],
            locale="ko-KR",
            viewport={"width": 1280, "height": 900},
            extra_http_headers={"Accept-Language": "ko-KR,ko;q=0.9"},
        )
        await context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )
        page = await context.new_page()

        # Collect top 50
        products = await scrape_popular(page)
        await browser.close()

    # Download images
    print(f"\n[img] downloading {len(products)} images...")
    for prod in products:
        if prod["image_url"]:
            ext = "jpg"
            if ".png" in prod["image_url"]:
                ext = "png"
            elif ".webp" in prod["image_url"]:
                ext = "webp"
            filename = IMAGE_DIR / f"{prod['rank']:03d}.{ext}"
            if download_image(prod["image_url"], filename):
                prod["image_file"] = str(filename)
            else:
                prod["image_file"] = ""
        else:
            prod["image_file"] = ""
        prod["unit"] = "ea"

    # Print results
    print()
    for prod in products:
        print(f"  [{prod['rank']:02d}] {prod['name'][:40]} | {prod['price']:,}won | img:{bool(prod['image_file'])}")

    # Save JSON
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"\n[done] {len(products)} products saved -> {OUTPUT_JSON}")


if __name__ == "__main__":
    asyncio.run(main())
