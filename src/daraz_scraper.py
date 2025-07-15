from __future__ import annotations
import hashlib, io, logging, os, random, re, time, urllib.parse
from pathlib import Path
from typing import Dict, List

import requests, undetected_chromedriver as uc
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

try:
    from PIL import Image  # Pillow for AVIF/WebP → JPG
    HAVE_PIL = True
except ImportError:
    HAVE_PIL = False

# ─────── Logger Setup ────────────────
log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
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

# ─────── Price/ETA ────────────────
def _price_from_card(card: BeautifulSoup) -> str:
    span = card.select_one("span.currency-format") or \
           card.select_one("span.currency-value") or \
           card.select_one('[data-qa-locator="product-price"]')
    if span and (_m := _RS_RE.search(span.text)):
        return _clean(_m.group(1))
    if tag := card.select_one("[data-price]"):
        return _clean(tag["data-price"])
    if (_m := _RS_RE.search(card.get_text(" ", strip=True))):
        return _clean(_m.group(1))
    return "0"

def _price_from_page(url: str) -> str:
    try:
        html = requests.get(url, headers={"User-Agent": _ua()}, timeout=8).text
        if (_m := _RS_RE.search(html)):
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

# ─────── Relevance ────────────────
def _relevant(title: str, meta: Dict) -> bool:
    low = title.lower()
    if any(nk.lower() in low for nk in meta["negative_keywords"]):
        return False
    core_ok = all(tok.lower() in low for tok in meta["core_term"].split())
    brand_ok = meta["brand"] and meta["brand"].lower() in low
    return core_ok or brand_ok

# ─────── Directories – Bulletproof ────────────────
ROOT_DIR = Path(__file__).resolve().parents[2]  # Change to [1] if one level up is enough
NEXT_UI_IMG_DIR = ROOT_DIR / "next-ui" / "public" / "data" / "images" / "daraz"
NEXT_UI_IMG_DIR.mkdir(parents=True, exist_ok=True)

IMG_DIR = ROOT_DIR / "data" / "images" / "daraz"
IMG_DIR.mkdir(parents=True, exist_ok=True)

_AVIF_CT = {"image/avif", "image/avif-sequence"}

# ─────── Helpers ────────────────
def _slug_from_url(url: str) -> str:
    slug = urllib.parse.urlparse(url).path.split("/")[-1][:60]
    slug = re.sub(r"[^a-z0-9]+", "-", slug.lower()).strip("-")
    return slug or hashlib.md5(url.encode()).hexdigest()

def _choose_ext(ct: str, url: str) -> str:
    if ct in _AVIF_CT: return ".avif"
    if ct == "image/webp": return ".webp"
    if ct == "image/png": return ".png"
    if ct == "image/jpeg": return ".jpg"
    return os.path.splitext(url.split("?")[0])[1][:5] or ".jpg"

def _save_image(img_url: str, product_url: str) -> str:
    try:
        r = requests.get(img_url, headers={"User-Agent": _ua()}, timeout=12)
        r.raise_for_status()
        ext = _choose_ext(r.headers.get("Content-Type", ""), img_url)
        name = _slug_from_url(product_url) + ext

        main_path = IMG_DIR / name
        nextui_path = NEXT_UI_IMG_DIR / name

        if main_path.exists() and nextui_path.exists():
            log.info(f"✔️ Already exists: {name}")
            return f"/data/images/daraz/{name}"

        if HAVE_PIL and ext in {".avif", ".webp"}:
            img = Image.open(io.BytesIO(r.content)).convert("RGB")
            name = _slug_from_url(product_url) + ".jpg"
            main_path = IMG_DIR / name
            nextui_path = NEXT_UI_IMG_DIR / name
            img.save(main_path, "JPEG", quality=90)
            img.save(nextui_path, "JPEG", quality=90)
            log.info(f"🖼 Converted & saved: {name}")
            return f"/data/images/daraz/{name}"

        # Save raw image
        main_path.write_bytes(r.content)
        nextui_path.write_bytes(r.content)
        log.info(f"📥 Saved image to: {main_path} & {nextui_path}")
        return f"/data/images/daraz/{name}"

    except Exception as e:
        log.warning(f"❌ Failed to save image {img_url}: {e}")
        return img_url

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

# ─────── Main Scraper ────────────────
def scrape_daraz(term: str, meta: Dict, max_items: int = 30) -> List[Dict]:
    url = f"https://www.daraz.pk/catalog/?q={term.replace(' ', '+')}"
    drv = _driver()
    wait = WebDriverWait(drv, 20)

    try:
        drv.get(url)
        wait.until(EC.presence_of_element_located(
            (By.CSS_SELECTOR, '[data-qa-locator="product-item"]')))
    except Exception:
        log.warning("Daraz listing timed‑out")
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
        if href.startswith("//"): href = "https:" + href
        if href.startswith("/"):  href = "https://www.daraz.pk" + href

        thumb = _thumb_url(card) or _fallback_image(href)
        img_path = _save_image(thumb, href) if thumb else ""

        if img_path.startswith("/data/images/daraz/"):
            saved += 1

        price = _price_from_card(card)
        if price == "0" and href:
            price = _price_from_page(href)

        out.append(dict(
            name=name,
            price=price,
            eta=_eta(href) if href else "N/A",
            url=href,
            image=img_path,
            source="daraz.pk",
        ))

        if len(out) >= max_items:
            break

    Path(ROOT_DIR / "data/raw").mkdir(parents=True, exist_ok=True)
    Path(ROOT_DIR / "data/raw/daraz_list.html").write_text(drv.page_source, "utf-8")

    drv.quit()
    log.info("Daraz images saved: %d/%d", saved, len(out))
    return out
