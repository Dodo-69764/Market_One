from __future__ import annotations
import hashlib, io, json, logging, os, re, urllib.parse
from pathlib import Path
from typing import List

import cloudscraper
import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from dotenv import load_dotenv

# ─────── Setup ───────────────────────────────────────────────────
load_dotenv()
log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

_UA = UserAgent()
_scr = cloudscraper.create_scraper()
_RS_RE = re.compile(r"(?:Rs\.?|PKR)\s?(\d[\d,.]*)")
_AVIF_CT = {"image/avif", "image/avif-sequence"}

SERPER_ENDPOINT = "https://google.serper.dev/search"
SERPER_KEY = os.getenv("SERPER_API_KEY", "").strip()
if not SERPER_KEY:
    log.warning("SERPER_API_KEY missing – generic scraper will return no results")

# Paths for saving images
IMG_DIR = Path("data/images/web")
IMG_DIR.mkdir(parents=True, exist_ok=True)

NEXT_UI_IMG_DIR = Path("C:/Projects/ProductAggregator/next-ui/public/data/images/daraz")
NEXT_UI_IMG_DIR.mkdir(parents=True, exist_ok=True)

SKIP_DOMAINS = {"daraz.pk", "temu.com", "amazon.", "ebay."}
PROXY_URL = os.getenv("PROXY", "").strip()
PROXY = {"http": PROXY_URL, "https": PROXY_URL} if PROXY_URL else None

# ─────── Utilities ───────────────────────────────────────────────
def _ua() -> str:
    return _UA.random

def _proxy_for(url: str):
    host = urllib.parse.urlparse(url).hostname or url
    return None if host in {"localhost", "127.0.0.1"} else PROXY

def _clean_price(p: str) -> str:
    return p.replace(",", "").strip()

def _slug(url: str) -> str:
    host = urllib.parse.urlparse(url).netloc
    return f"{host}_{hashlib.md5(url.encode()).hexdigest()[:10]}"

def _ext(content_type: str, url: str) -> str:
    if content_type in _AVIF_CT: return ".avif"
    if content_type == "image/webp": return ".webp"
    if content_type == "image/png": return ".png"
    if content_type == "image/jpeg": return ".jpg"
    return os.path.splitext(url.split("?")[0])[1][:5] or ".jpg"

# ─────── Image & Price Extraction ────────────────────────────────
def _first_image(html: str, page_url: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    img = soup.find("img", src=True)
    if not img:
        return ""

    src = urllib.parse.urljoin(page_url, img["src"])

    try:
        r = _scr.get(src, timeout=8, headers={"User-Agent": _ua()}, proxies=_proxy_for(src))
        r.raise_for_status()

        ext = _ext(r.headers.get("Content-Type", ""), src)
        name = _slug(page_url) + ext
        fp_main = IMG_DIR / name
        fp_next = NEXT_UI_IMG_DIR / name
        web_path = f"/data/images/daraz/{name}"

        if fp_main.exists() and fp_next.exists():
            return web_path

        if ext in {".avif", ".webp"}:
            try:
                from PIL import Image
                img = Image.open(io.BytesIO(r.content)).convert("RGB")
                jpg_name = _slug(page_url) + ".jpg"
                fp_main = IMG_DIR / jpg_name
                fp_next = NEXT_UI_IMG_DIR / jpg_name
                img.save(fp_main, "JPEG", quality=90)
                img.save(fp_next, "JPEG", quality=90)
                log.info("Converted and saved JPG: %s", jpg_name)
                return f"/data/images/daraz/{jpg_name}"
            except Exception as e:
                log.warning("Image conversion failed (%s): %s", src, e)

        fp_main.write_bytes(r.content)
        fp_next.write_bytes(r.content)
        log.info("Saved image: %s", name)
        return web_path

    except Exception as e:
        log.warning("Image download failed for %s: %s", src, e)
        return ""

def _price_from_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.text)
            if isinstance(data, list): data = data[0]
            price = (
                data.get("offers", {}).get("price") or
                data.get("price") or
                data.get("offers", {}).get("priceSpecification", {}).get("price")
            )
            if price: return _clean_price(str(price))
        except Exception:
            continue

    if match := _RS_RE.search(html):
        return _clean_price(match.group(1))

    return "0"

def _looks_relevant(title: str, tokens: list[str]) -> bool:
    low = title.lower()
    return any(tok.lower() in low for tok in tokens)

# ─────── Main Scraper Logic ──────────────────────────────────────
def scrape_generic(query: str, max_items: int = 5) -> List[dict]:
    if not SERPER_KEY:
        return []

    tokens = query.split()
    headers = {
        "X-API-KEY": SERPER_KEY,
        "Content-Type": "application/json",
        "User-Agent": _ua(),
    }
    payload = json.dumps({"q": f"{query} price in pakistan"})

    try:
        resp = requests.post(
            SERPER_ENDPOINT, headers=headers, data=payload,
            timeout=10, proxies=_proxy_for(SERPER_ENDPOINT)
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        log.warning("Serper API error: %s", e)
        return []

    results = data.get("shopping") or data.get("organic") or []
    if not results:
        log.info("No usable Serper results.")
        return []

    out, visited = [], set()
    for res in results:
        if len(out) >= max_items:
            break

        url = res.get("link") or res.get("url") or ""
        if not url or url in visited:
            continue
        dom = urllib.parse.urlparse(url).netloc.lower()
        if any(bad in dom for bad in SKIP_DOMAINS):
            continue

        visited.add(url)

        try:
            html = _scr.get(url, timeout=10, headers={"User-Agent": _ua()}, proxies=_proxy_for(url)).text
        except Exception as e:
            log.debug("Fetch failed: %s – %s", url, e)
            continue

        title = (res.get("title") or BeautifulSoup(html, "html.parser").title.string or "").strip()
        if not title or not _looks_relevant(title, tokens):
            continue

        price = _price_from_html(html)
        image = _first_image(html, url)

        out.append({
            "name": title,
            "price": price,
            "eta": "N/A",
            "url": url,
            "image": image,         # ✅ Now a web path like /data/images/daraz/abc.jpg
            "source": dom,
        })
        log.debug("✓ added %-24s | Rs.%s", dom, price)

    log.info("generic_scraper: returned %d products", len(out))
    return out
