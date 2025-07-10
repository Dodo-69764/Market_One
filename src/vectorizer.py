"""
Simple TF‑IDF helper.

Returns a 2‑tuple (vectorizer, matrix) or (None, None) if the
input list is empty.  Never more – so the call‑site can unpack safely.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from typing import List, Tuple, Optional, Dict

def vectorize_products(products: List[Dict]) -> Tuple[Optional[TfidfVectorizer], Optional[object]]:
    if not products:
        return None, None

    corpus = [p["name"] for p in products]
    vec = TfidfVectorizer(stop_words="english")
    mat = vec.fit_transform(corpus)
    return vec, mat
