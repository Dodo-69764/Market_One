# generic_scraper.py

from __future__ import annotations
import json, logging, os, re, time, urllib.parse, uuid, base64
from pathlib import Path
from typing import List
import io

import cloudscraper
import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from PIL import Image
from dotenv import load_dotenv
# Setup
load_dotenv()
log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
_UA = UserAgent()
_scr = cloudscraper.create_scraper()
_RS_RE = re.compile(r"(?:Rs\.?|PKR)\s?(\d[\d,.]*)")
SERPER_ENDPOINT = "https://google.serper.dev/search"
SERPER_KEY = os.getenv("SERPER_API_KEY", "").strip()

if not SERPER_KEY:
    log.warning("SERPER_API_KEY missing – generic scraper will return no results")

ROOT_DIR = Path(__file__).resolve().parent.parent
IMG_BACKEND = ROOT_DIR / "data" / "images" / "web"
IMG_FRONTEND = ROOT_DIR / "next-ui" / "public" / "data" / "images" / "web"
IMG_BACKEND.mkdir(parents=True, exist_ok=True)
IMG_FRONTEND.mkdir(parents=True, exist_ok=True)

SKIP_DOMAINS = {"daraz.pk"}
PROXY_URL = os.getenv("PROXY", "").strip()
PROXY = {"http": PROXY_URL, "https": PROXY_URL} if PROXY_URL else None

# Utilities
def _ua() -> str:
    return _UA.random

def _proxy_for(url: str):
    host = urllib.parse.urlparse(url).hostname or url
    return None if host in {"localhost", "127.0.0.1"} else PROXY

def _clean_price(p: str) -> str:
    return p.replace(",", "").strip()

def _looks_relevant(title: str, tokens: list[str]) -> bool:
    low = title.lower()
    return any(tok.lower() in low for tok in tokens)

# Image & Price Helpers
def _first_image(html: str, page_url: str) -> str:
    try:
        soup = BeautifulSoup(html, "html.parser")
        img = soup.find("img", src=True)
        if not img:
            return ""

        src = urllib.parse.urljoin(page_url, img["src"])
        
        # Handle base64 images
        if src.startswith("data:image"):
            try:
                header, data = src.split(",", 1)
                filename = f"{uuid.uuid4().hex}.jpg"
                backend_path = IMG_BACKEND / filename
                frontend_path = IMG_FRONTEND / filename
                img_data = base64.b64decode(data)
                with Image.open(io.BytesIO(img_data)) as img:
                    img.convert("RGB").save(backend_path, "JPEG", quality=90)
                    img.convert("RGB").save(frontend_path, "JPEG", quality=90)
                return f"/data/images/web/{filename}"
            except Exception as e:
                log.warning("Base64 image save failed: %s", e)
                return ""
        
        # Handle remote images
        r = _scr.get(src, timeout=8, headers={"User-Agent": _ua()}, proxies=_proxy_for(src))
        r.raise_for_status()
        
        # Generate filename
        filename = f"{uuid.uuid4().hex}.jpg"
        
        # Define paths
        backend_path = IMG_BACKEND / filename
        frontend_path = IMG_FRONTEND / filename
        
        # Save image
        with Image.open(io.BytesIO(r.content)) as img:
            img.convert("RGB").save(backend_path, "JPEG", quality=90)
            img.convert("RGB").save(frontend_path, "JPEG", quality=90)
        
        return f"/data/images/web/{filename}"

    except Exception as e:
        log.warning("Image download failed: %s", e)
        return ""

def _price_from_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.text)
            if isinstance(data, list):
                data = data[0]
            price = (
                data.get("offers", {}).get("price") or
                data.get("price") or
                data.get("offers", {}).get("priceSpecification", {}).get("price")
            )
            if price:
                return _clean_price(str(price))
        except Exception:
            continue

    if match := _RS_RE.search(html):
        return _clean_price(match.group(1))

    return "0"

# Main Logic
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
        resp = requests.post(SERPER_ENDPOINT, headers=headers, data=payload, timeout=10, proxies=_proxy_for(SERPER_ENDPOINT))
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
        if any(skip in dom for skip in SKIP_DOMAINS):
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
            "image": image,
            "source": dom,
        })
        log.debug("✓ added %-24s | Rs.%s", dom, price)

    log.info("generic_scraper: returned %d products", len(out))
    return out
