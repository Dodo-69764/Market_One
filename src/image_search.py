# src/image_search.py
from __future__ import annotations
from pathlib import Path
from typing import List, Dict, Tuple
import itertools, json, logging, re, time, requests, io, base64
import numpy as np
from PIL import Image
from wordfreq import zipf_frequency

from src.remote_vision  import caption_image, embed_image, clip_probe
from src.ocr_utils       import extract_text_info
from src.query_llm       import analyse
from src.daraz_scraper   import scrape_daraz
from src.generic_scraper import scrape_generic
from src.vectorizer import vectorize_products

log = logging.getLogger(__name__)

_BRANDS = {"nike","adidas","apple","dell","hp","samsung","lenovo",
           "xiaomi","philips","anker","sony","stanley","kleenex",
           "rose","whiskas","purina"}
_WORD   = re.compile(r"[a-z]{3,}", re.I)

def _zipf_ok(w: str) -> bool:
    return zipf_frequency(w.lower(), "en") >= 2.5

def _clean(words: list[str]) -> list[str]:
    out = []
    for w in words:
        lw = w.lower()
        if lw in _BRANDS or (_WORD.fullmatch(lw) and _zipf_ok(lw)):
            out.append(w)
    return out[:20]

def _cos(a, b) -> float:
    a = np.array(a)
    b = np.array(b)
    return float(a.dot(b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))

def _safe_meta(raw, fallback: str) -> Dict:
    try:
        if isinstance(raw, str): raw = json.loads(raw)
    except Exception: raw = {}
    if not isinstance(raw, dict): raw = {}
    raw.setdefault("core_term", fallback)
    raw.setdefault("alt_queries", [])
    raw.setdefault("brand", "")
    return raw

def get_image_vector(img_url: str) -> np.ndarray:
    """Get image vector from URL or local path"""
    try:
        # Handle local paths
        if img_url.startswith("/data/images/"):
            # Construct absolute path
            root_dir = Path(__file__).resolve().parent.parent
            img_path = root_dir / img_url.lstrip("/")
            with open(img_path, "rb") as f:
                return np.asarray(embed_image(f.read()), dtype=np.float32)
        
        # Handle base64 images
        if img_url.startswith("data:image"):
            header, data = img_url.split(",", 1)
            img_data = base64.b64decode(data)
            return np.asarray(embed_image(img_data), dtype=np.float32)
        
        # Handle remote URLs
        response = requests.get(img_url, timeout=10)
        response.raise_for_status()
        return np.asarray(embed_image(response.content), dtype=np.float32)
    
    except Exception as e:
        log.error(f"Failed to get image vector for {img_url}: {e}")
        return np.zeros(512, dtype=np.float32)  # Return zero vector on failure

# Main Function
def search_by_image(path: str, max_per_site: int = 30) -> Tuple[List[Dict], Dict]:
    log.info(f"Starting image search for: {path}")
    start_time = time.time()
    
    # Process image
    caption = caption_image(path) or "product"
    log.info(f"Caption generated: {caption}")
    
    ocr = extract_text_info(path)
    log.info(f"OCR results: {ocr}")
    
    clip_tag = clip_probe(Path(path), list(_BRANDS))[:1]
    brand = clip_tag[0] if clip_tag else ocr.get("brand_hint", "")
    log.info(f"Brand identified: {brand}")
    
    # Generate query
    prompt = (
        f"Caption: '{caption}'. "
        f"OCR words: {', '.join(_clean(ocr['words'])) or 'none'}. "
        f"Sizes: {', '.join(ocr['sizes'][:5]) or 'none'}. "
        f'Brand guess: "{brand or "unknown"}". '
        "Generate a product search query and alternatives."
    )
    meta = _safe_meta(analyse(prompt), caption)
    
    # Add brand to meta
    if brand and not meta.get("brand"):
        meta["brand"] = brand
    
    # Prepare queries
    queries = [meta["core_term"]]
    if meta["brand"]:
        queries.append(f"{meta['brand']} {meta['core_term']}")
    queries.extend(meta.get("alt_queries", [])[:2])
    
    # Deduplicate queries
    unique_queries = []
    seen = set()
    for q in queries:
        q_lower = q.lower()
        if q_lower not in seen and q_lower.strip():
            seen.add(q_lower)
            unique_queries.append(q)
    
    log.info(f"Search queries: {', '.join(unique_queries)}")
    
    # Scrape results
    items = []
    for q in unique_queries:
        log.info(f"Searching Daraz for: {q}")
        daraz_items = scrape_daraz(q, meta, max_per_site)
        log.info(f"Found {len(daraz_items)} Daraz items")
        items.extend(daraz_items)
        
        log.info(f"Searching web for: {q}")
        web_items = scrape_generic(q, max_items=5)
        log.info(f"Found {len(web_items)} web items")
        items.extend(web_items)
    
    log.info(f"Total items found: {len(items)}")
    
    # Get CLIP embedding for query image
    try:
        with open(path, "rb") as f:
            q_vec = np.asarray(embed_image(f.read()), dtype=np.float32)
    except Exception as e:
        log.error(f"Failed to embed query image: {e}")
        q_vec = np.zeros(512, dtype=np.float32)
    
    # Calculate CLIP-based similarity
    for item in items:
        try:
            img_url = item.get("image") or item["url"]
            img_vec = get_image_vector(img_url)
            item["clip_similarity"] = _cos(q_vec, img_vec)
        except Exception as e:
            log.error(f"Vectorization failed for {item['url']}: {e}")
            item["clip_similarity"] = 0.0
    
    # Calculate text-based similarity using core term
    if meta["core_term"]:
        items, _, _ = vectorize_products(
            items,
            query=meta["core_term"],
            similarity_key="text_similarity"
        )
    else:
        # Initialize text similarity if missing
        for item in items:
            item["text_similarity"] = 0.0
    
    # Combine scores using weighted average
    for item in items:
        clip_score = item.get("clip_similarity", 0)
        text_score = item.get("text_similarity", 0)
        # Weighted average favoring visual similarity
        item["similarity"] = 0.7 * clip_score + 0.3 * text_score
    
    # Sort and return top results
    items.sort(key=lambda x: x["similarity"], reverse=True)
    top_items = items[:max_per_site]
    
    duration = time.time() - start_time
    log.info(f"Image search completed in {duration:.1f}s. Found {len(top_items)} products.")
    return top_items, meta