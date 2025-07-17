# daraz_scraper.py

from __future__ import annotations
import logging, os, random, re, time, urllib.parse, uuid, base64
from pathlib import Path
from typing import Dict, List
import io

import requests
import undetected_chromedriver as uc
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from PIL import Image

log = logging.getLogger(__name__)
_UA = UserAgent()

def _ua() -> str:
    return _UA.random

def _driver() -> uc.Chrome:
    opt = uc.ChromeOptions()
    opt.add_argument("--headless=new")
    opt.add_argument(f"--user-agent={_ua()}")
    opt.add_argument("--disable-blink-features=AutomationControlled")
    opt.add_argument("--no-sandbox")
    opt.add_argument("--ignore-certificate-errors")
    return uc.Chrome(options=opt, version_main=137)

_RS_RE = re.compile(r"(?:Rs\.?|PKR)\s?(\d[\d,.]*)")

def _clean(p: str) -> str:
    return p.replace(",", "").strip()

# Price and ETA helpers
def _price_from_card(card: BeautifulSoup) -> str:
    span = (
        card.select_one("span.currency-format")
        or card.select_one("span.currency-value")
        or card.select_one('[data-qa-locator="product-price"]')
    )
    if span and (_m := _RS_RE.search(span.text)):
        return _clean(_m.group(1))
    if tag := card.select_one("[data-price]"):
        return _clean(tag["data-price"])
    if _m := _RS_RE.search(card.get_text(" ", strip=True)):
        return _clean(_m.group(1))
    return "0"

def _price_from_page(url: str) -> str:
    try:
        html = requests.get(url, headers={"User-Agent": _ua()}, timeout=8).text
        if _m := _RS_RE.search(html):
            return _clean(_m.group(1))
    except Exception:
        pass
    return "0"

def _eta(url: str) -> str:
    try:
        html = requests.get(url, headers={"User-Agent": _ua()}, timeout=8).text
        s = BeautifulSoup(html, "html.parser")
        e = s.select_one("div.delivery-option-item__time")
        return e.get_text(strip=True) if e else "N/A"
    except Exception:
        return "N/A"

# Relevance
def _relevant(title: str, meta: Dict) -> bool:
    low = title.lower()
    if any(nk.lower() in low for nk in meta.get("negative_keywords", [])):
        return False
    core_ok = all(tok.lower() in low for tok in meta.get("core_term", "").split())
    brand_ok = meta.get("brand") and meta["brand"].lower() in low
    return core_ok or brand_ok

# Image saving
ROOT_DIR = Path(__file__).resolve().parent.parent
IMG_BACKEND = ROOT_DIR / "data" / "images" / "daraz"
IMG_FRONTEND = ROOT_DIR / "next-ui" / "public" / "data" / "images" / "daraz"
IMG_BACKEND.mkdir(parents=True, exist_ok=True)
IMG_FRONTEND.mkdir(parents=True, exist_ok=True)

def _thumb_url(card: BeautifulSoup) -> str:
    img = card.select_one("img[alt]")
    if not img:
        return ""
    for attr in ("data-src", "data-lazy", "srcset", "src"):
        if attr in img.attrs and img[attr]:
            raw = img[attr].split()[0]
            return "https:" + raw if raw.startswith("//") else raw
    return ""

def _fallback_image(detail_url: str) -> str:
    try:
        html = requests.get(detail_url, headers={"User-Agent": _ua()}, timeout=10).text
        big = BeautifulSoup(html, "html.parser").select_one("img.pdp-mod-common-image")
        return big["src"] if big and big.get("src") else ""
    except Exception:
        return ""

def _save_image(img_url: str, product_url: str) -> str:
    try:
        # Handle base64 images
        if img_url.startswith("data:image"):
            try:
                header, data = img_url.split(",", 1)
                filename = f"{uuid.uuid4().hex}.jpg"
                backend_path = IMG_BACKEND / filename
                frontend_path = IMG_FRONTEND / filename
                img_data = base64.b64decode(data)
                with Image.open(io.BytesIO(img_data)) as img:
                    img.convert("RGB").save(backend_path, "JPEG", quality=90)
                    img.convert("RGB").save(frontend_path, "JPEG", quality=90)
                return f"/data/images/daraz/{filename}"
            except Exception as e:
                log.warning("Base64 image save failed: %s", e)
                return ""
        
        # Handle remote images
        response = requests.get(img_url, headers={"User-Agent": _ua()}, timeout=12)
        response.raise_for_status()
        
        # Generate filename
        filename = f"{uuid.uuid4().hex}.jpg"
        
        # Define paths
        backend_path = IMG_BACKEND / filename
        frontend_path = IMG_FRONTEND / filename
        
        # Save image
        with Image.open(io.BytesIO(response.content)) as img:
            img.convert("RGB").save(backend_path, "JPEG", quality=90)
            img.convert("RGB").save(frontend_path, "JPEG", quality=90)
        
        return f"/data/images/daraz/{filename}"

    except Exception as e:
        log.warning("Image save failed for %s: %s", img_url, e)
        return ""

# Scraper
def scrape_daraz(term: str, meta: Dict, max_items: int = 30) -> List[Dict]:
    url = f"https://www.daraz.pk/catalog/?q={term.replace(' ', '+')}"
    drv = _driver()
    wait = WebDriverWait(drv, 20)
    try:
        drv.get(url)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[data-qa-locator="product-item"]')))
    except Exception:
        log.warning("Daraz listing timed-out")
        drv.quit()
        return []

    for _ in range(4):
        drv.execute_script("window.scrollBy(0, document.body.scrollHeight)")
        time.sleep(random.uniform(0.8, 1.2))

    soup = BeautifulSoup(drv.page_source, "html.parser")
    cards = soup.select('[data-qa-locator="product-item"]')
    out, saved = [], 0

    for card in cards:
        img_tag = card.select_one("img[alt]")
        name = img_tag["alt"].strip() if img_tag else "Unknown"
        if not _relevant(name, meta):
            continue

        a_tag = card.select_one("a[href]")
        href = a_tag["href"] if a_tag else ""
        if href.startswith("//"):
            href = "https:" + href
        if href.startswith("/"):
            href = "https://www.daraz.pk" + href

        thumb = _thumb_url(card) or _fallback_image(href)
        img_loc = _save_image(thumb, href) if thumb else ""
        if img_loc and not img_loc.startswith("http"):
            saved += 1

        price = _price_from_card(card)
        if price == "0" and href:
            price = _price_from_page(href)

        out.append(dict(
            name=name,
            price=price,
            eta=_eta(href) if href else "N/A",
            url=href,
            image=img_loc,
            source="daraz.pk"
        ))
        if len(out) >= max_items:
            break

    Path("data/raw").mkdir(parents=True, exist_ok=True)
    Path("data/raw/daraz_list.html").write_text(drv.page_source, encoding="utf-8")
    drv.quit()
    log.info("Daraz images saved: %d/%d", saved, len(out))
    return out
