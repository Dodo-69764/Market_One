# src/ocr_utils.py
from __future__ import annotations
from typing import List, Dict
import re, pathlib, easyocr, numpy as np

# lazily load the OCR engine once
_reader: easyocr.Reader | None = None
def _get_reader() -> easyocr.Reader:
    global _reader
    if _reader is None:
        # 'en' only keeps the download small; add 'ar', 'ur' … if you need them
        _reader = easyocr.Reader(['en'], gpu=False)
    return _reader

SIZE_RE  = re.compile(r"\b\d+\s?(ml|g|kg|l|oz|pcs?|pack|mm)\b", re.I)
BRACKET  = re.compile(r"[\[\]{}()]+")
WHITES   = re.compile(r"\s+")

def extract_text_info(img_path: str) -> Dict:
    """
    Returns {'words': [...], 'sizes': [...]} – all lowercase / deduped.
    """
    result = _get_reader().readtext(str(pathlib.Path(img_path)), detail=0)
    words  = [BRACKET.sub("", w).strip().lower() for w in result]
    words  = [WHITES.sub(" ", w) for w in words if w]          # normalise spaces
    sizes  = [m.group(0).lower() for w in words for m in SIZE_RE.finditer(w)]
    # quick & dirty “brand” guess – longest UPPER‑case-ish token
    brand  = max((w for w in words if w.isascii() and w.isalpha()), key=len, default="")
    return {"words": sorted(set(words)), "sizes": sizes, "brand_hint": brand}
