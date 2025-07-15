#!/usr/bin/env python
"""
Product-Aggregator – CLI + API
==============================
TEXT: user query -> Llama-3 meta -> scrape_daraz + scrape_generic
IMAGE: caption + OCR -> Llama-3 focus -> same scrapers -> CLIP rank
"""

from __future__ import annotations
import json
import logging
import os
import sys
import argparse
import shutil
import uuid
from pathlib import Path
from typing import List, Dict

from dotenv import load_dotenv

load_dotenv(".env", override=False)

# Internal modules
from src.query_llm import analyse
from src.daraz_scraper import scrape_daraz
from src.generic_scraper import scrape_generic
from src.vectorizer import vectorize_products
from src.image_search import search_by_image
from src.product_comparator import compare_products

from pydantic import BaseModel

# FastAPI
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Logging setup
Path("logs").mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("logs/main_scraper.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# Pydantic Models
class TextQueryRequest(BaseModel):
    query: str

class ProductComparisonRequest(BaseModel):
    product1: Dict
    product2: Dict

# Tiny Helpers
def save(obj: List[Dict], path: str) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding="utf-8")

def table(rows: List[Dict], *, show_sim: bool = False, limit: int = 15) -> None:
    if not rows:
        return
    for i, p in enumerate(rows[:limit], 1):
        similarity = f"{p.get('similarity', 0):.2f} | " if show_sim else ""
        price = f"Rs.{p.get('price', '0'):<8}"
        print(f"{i:>2}. {similarity}{p['source']:<14} | {p['name'][:58]:58} | {price} | {p['url']}")

# CLI Flows
def text_flow(user_query: str) -> None:
    meta = analyse(user_query)
    print("\n🔍 Llama-3 JSON\n", json.dumps(meta, indent=2, ensure_ascii=False))
    core_term = meta.get("core_term") or user_query
    extras = " ".join(meta.get("positive_keywords", []))
    extras += " " + " ".join(meta.get("categories", []))
    serper_q = f"{core_term} {extras} buy online in pakistan".strip()
    log.debug("Serper query: %s", serper_q)
    log.debug("Daraz core: %s", core_term)
    daraz = scrape_daraz(core_term, meta, 30)
    save(daraz, "data/raw/daraz.json")
    web = scrape_generic(serper_q, 10)
    save(web, "data/raw/web.json")
    products = daraz[:5] + web + daraz[5:]
    if not products:
        print("❌ No products.")
        return
    print("online 83")
    vec_items, mat, _ = vectorize_products(products, query=core_term, return_query_vector=True)
    if mat is not None:
        print(f"\n✅ TF-IDF matrix: {mat.shape}")
    table(vec_items)

def image_flow(img_path: str) -> None:
    path = Path(img_path)
    if not path.exists():
        print("❌ Image not found.")
        return
    hits, meta = search_by_image(str(path), 30)
    print("\n🔍 Llama-3 JSON (focused)")
    print(json.dumps(meta, indent=2, ensure_ascii=False))
    if not hits:
        print("❌ No products scraped.")
        return
    print(f"\n✅ {len(hits)} products ranked for {path.name}:")
    table(hits, show_sim=True)

# FastAPI App
app = FastAPI(title="Product Aggregator API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API running."}

@app.post("/search-text")
def api_search_text(payload: TextQueryRequest):
    try:
        query = payload.query
        if not query:
            return JSONResponse({"error": "Empty query."}, status_code=400)
        meta = analyse(query)
        meta.setdefault("core_term", query)
        meta.setdefault("positive_keywords", [])
        meta.setdefault("negative_keywords", [])
        meta.setdefault("categories", [])
        core_term = meta["core_term"]
        extras = " ".join(meta["positive_keywords"] + meta["categories"])
        serper_q = f"{core_term} {extras} buy online in pakistan".strip()
        items = scrape_daraz(core_term, meta, 30) + scrape_generic(serper_q, 10)
        print("online 138")
        vec_items, matrix, query_vec = vectorize_products(items, query=core_term, return_query_vector=True)
        if matrix is not None:
            for i, item in enumerate(vec_items):
                item["vector"] = matrix[i].tolist()
                item["query_vector"] = query_vec.tolist()
        return {"items": vec_items, "meta": meta}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/search-image")
def api_search_image(file: UploadFile = File(...)):
    try:
        temp_path = Path("temp_uploads") / f"{uuid.uuid4().hex}{Path(file.filename).suffix}"
        temp_path.parent.mkdir(exist_ok=True)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        items, meta = search_by_image(str(temp_path), 30)
        temp_path.unlink(missing_ok=True)
        return {"items": items, "meta": meta}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/compare-products")
def api_compare_products(payload: ProductComparisonRequest):
    try:
        p1 = payload.product1
        p2 = payload.product2
        p1_vec = p1.get("vector", [])
        p2_vec = p2.get("vector", [])
        query_vec = p1.get("query_vector", []) or p2.get("query_vector", [])
        if not all([p1_vec, p2_vec, query_vec]):
            return JSONResponse({"error": "Missing vectors in request."}, status_code=400)
        result = compare_products(p1, p2, p1_vec, p2_vec, query_vec)
        return result
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# Entrypoint
def cli_loop():
    if not os.getenv("HF_TOKEN"):
        log.warning("HF_TOKEN not set – remote LLM / CLIP calls may fail.")
    while True:
        try:
            mode = input("\nSearch by (T)ext / (I)mage / (Q)uit? ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print()
            return
        if mode.startswith("q"):
            return
        if mode.startswith("t"):
            q = input("Enter product keywords: ").strip()
            if q:
                text_flow(q)
            else:
                print("Empty query.")
        elif mode.startswith("i"):
            img = input("Enter image path: ").strip('" ')
            image_flow(img)
        else:
            print("Please type T, I, or Q.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", action="store_true", help="Run API server instead of CLI")
    args = parser.parse_args()
    if args.api:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    else:
        cli_loop()
