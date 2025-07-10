# src/image_search.py
from __future__ import annotations
from pathlib import Path
from typing import List, Dict, Tuple
import itertools, json, logging, re

import numpy as np
from PIL import Image
from wordfreq import zipf_frequency

from src.remote_vision  import caption_image, embed_image, clip_probe
from src.ocr_utils       import extract_text_info
from src.query_llm       import analyse
from src.daraz_scraper   import scrape_daraz
from src.generic_scraper import scrape_generic

log = logging.getLogger(__name__)

_BRANDS = {"nike","adidas","apple","dell","hp","samsung","lenovo",
           "xiaomi","philips","anker","sony","stanley","kleenex",
           "rose","whiskas","purina"}
_WORD   = re.compile(r"[a-z]{3,}", re.I)

def _zipf_ok(w: str) -> bool:
    from wordfreq import zipf_frequency
    return zipf_frequency(w.lower(), "en") >= 2.5

def _clean(words: list[str]) -> list[str]:
    out = []
    for w in words:
        lw = w.lower()
        if lw in _BRANDS or (_WORD.fullmatch(lw) and _zipf_ok(lw)):
            out.append(w)
    return out[:20]

def _cos(a, b) -> float:
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

# ───────── main ──────────────────────────────────────────────────
def search_by_image(path: str, max_per_site: int = 30
) -> Tuple[List[Dict], Dict]:
    caption   = caption_image(path)
    clip_tag  = clip_probe(Path(path), list(_BRANDS))[:1]
    ocr       = extract_text_info(path)

    brand = clip_tag[0] if clip_tag else ocr.get("brand_hint","")

    prompt = (
        f"Caption: '{caption}'. "
        f"OCR words: {', '.join(_clean(ocr['words'])) or 'none'}. "
        f"Sizes: {', '.join(ocr['sizes'][:5]) or 'none'}. "
        f'Brand guess: "{brand or "unknown"}". '
        "Give JSON {core_term, alt_queries (≤2)}"
    )
    meta = _safe_meta(analyse(prompt), caption)
    if brand and not meta["brand"]:
        meta["brand"] = brand

    # 🔧 Patch missing fields to avoid KeyError
    meta.setdefault("positive_keywords", [])
    meta.setdefault("negative_keywords", [])
    meta.setdefault("categories", [])

    print("Caption :", caption)
    print("OCR     :", ", ".join(_clean(ocr["words"])) or "–")
    q_preview = [meta["core_term"], *meta["alt_queries"]]
    print("Queries :", " | ".join(filter(None, q_preview)))

    queries = [meta["core_term"]] if meta["core_term"] else []
    if meta["brand"]:
        queries.append(f"{meta['brand']} {meta['core_term']}")
    queries.extend(meta["alt_queries"][:2])
    for sz in ocr["sizes"]:
        queries.append(f"{meta['core_term']} {sz}")

    seen_q, items, seen_urls = set(), [], set()
    for q in [x for x in queries if x and not (x.lower() in seen_q or seen_q.add(x.lower()))]:
        for it in itertools.chain(
            scrape_daraz(q, meta, max_per_site),
            scrape_generic(q,               5),
        ):
            if it["url"] in seen_urls: continue
            seen_urls.add(it["url"]); items.append(it)

    if not items: return [], meta

    q_vec = np.asarray(embed_image(path), dtype=np.float32)
    hits  = []
    for it in items:
        img = it.get("image") or it["url"]
        try:
            vec = np.asarray(embed_image(img), dtype=np.float32)
            hits.append(it | {"similarity": _cos(q_vec, vec)})
        except Exception: pass

    hits.sort(key=lambda d: d["similarity"], reverse=True)
    return hits, meta
