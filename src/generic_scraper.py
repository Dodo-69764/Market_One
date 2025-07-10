"""
generic_scraper.py  (Serper edition)
====================================
1. Calls the Serper ( google.serper.dev ) API to get fresh Google results
   for “<query> price in Pakistan”.
2. Visits the first N product‑like URLs.
3. Extracts:  title · price · url · first image  (Daraz‑compatible dict).

→ scrape_generic(query:str, max_items:int=5) → list[dict]

Design principles
-----------------
* One mirror only (Serper) → fewer moving parts
* Proxy support (via PROXY=… in .env)
* Lots of DEBUG logs – run your CLI with
      logging.basicConfig(level=logging.DEBUG, …)
  to see every step.
* Never raises – returns [] on any fatal issue, so the CLI keeps running.
"""

from __future__ import annotations
import hashlib, io, json, logging, os, re, time, urllib.parse
from pathlib import Path
from typing import List

import cloudscraper
import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger(__name__)

# ────────────────────────── constants ────────────────────────────
_UA  = UserAgent()
_scr = cloudscraper.create_scraper()           # Cloudflare‑aware fetcher
_RS_RE   = re.compile(r"(?:Rs\.?|PKR)\s?(\d[\d,.]*)")
_AVIF_CT = {"image/avif", "image/avif-sequence"}

SERPER_ENDPOINT = "https://google.serper.dev/search"
SERPER_KEY      = os.getenv("SERPER_API_KEY", "").strip()
if not SERPER_KEY:
    log.warning("SERPER_API_KEY missing – generic scraper will return no results")

SKIP_DOMAINS = {"daraz.pk", "temu.com", "amazon.", "ebay."}

IMG_DIR = Path("data/images/web"); IMG_DIR.mkdir(parents=True, exist_ok=True)

# optional proxy
PROXY_URL = os.getenv("PROXY", "").strip()
PROXY     = {"http": PROXY_URL, "https": PROXY_URL} if PROXY_URL else None


# ────────────────────────── helpers ──────────────────────────────
def _ua() -> str:
    return _UA.random

def _proxy_for(url_or_host: str):
    host = urllib.parse.urlparse(url_or_host).hostname or url_or_host
    return None if host in {"localhost", "127.0.0.1"} else PROXY

def _clean_price(p: str) -> str:
    return p.replace(",", "").strip()

def _slug(url: str) -> str:
    host = urllib.parse.urlparse(url).netloc
    return f"{host}_{hashlib.md5(url.encode()).hexdigest()[:10]}"

def _ext(content_type: str, url: str) -> str:
    if content_type in _AVIF_CT:         return ".avif"
    if content_type == "image/webp":     return ".webp"
    if content_type == "image/png":      return ".png"
    if content_type == "image/jpeg":     return ".jpg"
    return os.path.splitext(url.split("?")[0])[1][:5] or ".jpg"

# ----------------------- image download --------------------------
def _first_image(html: str, page_url: str) -> str:
    img = BeautifulSoup(html, "html.parser").find("img")
    if not img or not img.get("src"):
        return ""
    src = urllib.parse.urljoin(page_url, img["src"])
    try:
        r = _scr.get(src, timeout=10, headers={"User-Agent": _ua()},
                     proxies=_proxy_for(src))
        r.raise_for_status()
        ext = _ext(r.headers.get("Content-Type", ""), src)
        fp  = IMG_DIR / (_slug(page_url) + ext)
        if fp.exists():
            return str(fp)
        if ext in {".avif", ".webp"}:
            from PIL import Image              # heavy import only if needed
            Image.open(io.BytesIO(r.content)).convert("RGB") \
                 .save(fp.with_suffix(".jpg"), "JPEG", quality=88)
            return str(fp.with_suffix(".jpg"))
        fp.write_bytes(r.content)
        return str(fp)
    except Exception as e:
        log.debug("img‑dl fail %s → %s", src, e)
        return ""

# ----------------------- price sniffing --------------------------
def _price_from_html(html: str) -> str:
    # JSON‑LD
    for m in re.finditer(r'<script[^>]+ld\+json[^>]*>(.*?)</script>',
                         html, re.S | re.I):
        try:
            data = json.loads(m.group(1).strip())
            if isinstance(data, list):
                data = data[0]
            price = (
                data.get("offers", {}).get("price")
                or data.get("price")
                or data.get("offers", {}).get("priceSpecification", {}).get("price")
            )
            if price:
                return _clean_price(str(price))
        except Exception:
            pass
    # regex fallback
    if m := _RS_RE.search(html):
        return _clean_price(m.group(1))
    return "0"

def _looks_relevant(title: str, tokens: list[str]) -> bool:
    low = title.lower()
    return any(tok.lower() in low for tok in tokens)


# ─────────────────── main public function ────────────────────────
def scrape_generic(query: str, max_items: int = 5) -> List[dict]:
    """
    Ask Serper for “<query> price in Pakistan”, then scrape the top results.
    Returns Daraz‑compatible product dictionaries.
    """
    if not SERPER_KEY:
        return []

    tokens = query.split()
    headers = {
        "X-API-KEY"   : SERPER_KEY,
        "Content-Type": "application/json",
        "User-Agent"  : _ua(),
    }
    payload = json.dumps({"q": f"{query} price in pakistan"})

    log.debug("generic_scraper: proxy=%s", PROXY_URL or "None")

    try:
        resp = requests.post(
            SERPER_ENDPOINT,
            headers=headers,
            data=payload,
            timeout=12,
            proxies=_proxy_for(SERPER_ENDPOINT),
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        log.warning("Serper API error – %s", e)
        return []

    # Serper response keys: 'shopping' (if any), else 'organic'
    candidates: list[dict] = []
    if "shopping" in data and data["shopping"]:
        candidates.extend(data["shopping"])
    if not candidates:
        candidates.extend(data.get("organic", []))

    if not candidates:
        log.info("generic_scraper: Serper returned 0 usable items")
        return []

    out, visited = [], set()

    for res in candidates:
        if len(out) >= max_items:
            break

        url = res.get("link") or res.get("url") or ""
        if not url:
            continue
        dom = urllib.parse.urlparse(url).netloc.lower()
        if any(bad in dom for bad in SKIP_DOMAINS) or url in visited:
            continue
        visited.add(url)

        try:
            html = _scr.get(url, timeout=12, headers={"User-Agent": _ua()},
                            proxies=_proxy_for(url)).text
        except Exception as e:
            log.debug("fetch‑fail %s – %s", url, e)
            continue

        title = (res.get("title")
                 or BeautifulSoup(html, "html.parser").title.string
                 or "").strip()
        if not title or not _looks_relevant(title, tokens):
            continue

        price = _price_from_html(html)
        img   = _first_image(html, url)

        out.append({
            "name"  : title,
            "price" : price,
            "eta"   : "N/A",
            "url"   : url,
            "image" : img,
            "source": dom,
        })
        log.debug("✓ added %-24s | Rs.%s", dom, price)

    log.info("generic_scraper: returned %d products", len(out))
    return out