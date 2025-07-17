# main.py

from __future__ import annotations
import json, logging, os, sys, argparse, shutil, uuid, io, threading, requests, base64
from pathlib import Path
from typing import List, Dict, Optional
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

# FastAPI
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

# Load environment
load_dotenv(".env", override=False)

# Internal modules
from src.query_llm import analyse, compare_products_llm
from src.daraz_scraper import scrape_daraz
from src.generic_scraper import scrape_generic
from src.vectorizer import vectorize_products
from src.image_search import search_by_image
from src.product_comparator import Product, ProductComparisonRequest, compare_products

# Logger setup
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

# Image Save Setup
ROOT_DIR = Path(__file__).resolve().parent
IMG_DIR = ROOT_DIR / "data" / "images"
NEXT_UI_IMG_DIR = ROOT_DIR / "next-ui" / "public" / "data" / "images"
_save_lock = threading.Lock()

def save_image(img_url: str, domain: str = "misc") -> str:
    """Save image to both backend and frontend directories"""
    try:
        # Generate filename
        ext = Path(img_url).suffix or ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        
        # Define paths
        backend_path = IMG_DIR / domain / filename
        frontend_path = NEXT_UI_IMG_DIR / domain / filename
        
        # Create directories if needed
        backend_path.parent.mkdir(parents=True, exist_ok=True)
        frontend_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Handle base64 images
        if img_url.startswith("data:image"):
            header, encoded = img_url.split(",", 1)
            img_data = base64.b64decode(encoded)
            with Image.open(io.BytesIO(img_data)) as img:
                img.convert("RGB").save(backend_path, "JPEG", quality=90)
                img.convert("RGB").save(frontend_path, "JPEG", quality=90)
            return f"/data/images/{domain}/{filename}"
        
        # Download and save remote image
        response = requests.get(img_url, timeout=10)
        response.raise_for_status()
        
        with Image.open(io.BytesIO(response.content)) as img:
            img.convert("RGB").save(backend_path, "JPEG", quality=90)
            img.convert("RGB").save(frontend_path, "JPEG", quality=90)
        
        return f"/data/images/{domain}/{filename}"
    
    except Exception as e:
        log.error(f"Image save failed: {e}")
        return ""

# Request Models
class TextQueryRequest(BaseModel):
    query: str

# FastAPI App Setup
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
        
        # Vectorize products and calculate similarity
        items, _, _ = vectorize_products(items, query=core_term)
        
        return {"items": items, "meta": meta}
    except Exception as e:
        log.exception("Text search failed")
        return JSONResponse({"error": str(e)}, status_code=500)
    
@app.post("/search-image")
def api_search_image(file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        temp_path = Path("temp_uploads") / f"{uuid.uuid4().hex}{Path(file.filename).suffix}"
        temp_path.parent.mkdir(exist_ok=True)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Perform image search
        items, meta = search_by_image(str(temp_path), 30)
        
        # Clean up
        temp_path.unlink(missing_ok=True)
        return {"items": items, "meta": meta}
    except Exception as e:
        log.exception("Image search failed")
        return JSONResponse({"error": str(e)}, status_code=500)
    
@app.post("/compare-products")
def api_compare_products(payload: ProductComparisonRequest):
    try:
        p1 = payload.prod1
        p2 = payload.prod2
        p1_vec = p1.vector
        p2_vec = p2.vector
        query_vec = p1.query_vector or p2.query_vector
        if not all([p1_vec, p2_vec, query_vec]):
            return JSONResponse({"error": "Missing vectors for comparison."}, status_code=400)
        result = compare_products(p1, p2, p1_vec, p2_vec, query_vec)
        return result
    except Exception as e:
        log.exception("Product comparison failed")
        return JSONResponse({"error": str(e)}, status_code=500)

# CLI Mode
def text_flow(user_query: str) -> None:
    meta = analyse(user_query)
    print("\n🔍 Llama-3 JSON\n", json.dumps(meta, indent=2, ensure_ascii=False))
    core_term = meta.get("core_term") or user_query
    extras = " ".join(meta.get("positive_keywords", []) + meta.get("categories", []))
    serper_q = f"{core_term} {extras} buy online in pakistan".strip()
    log.debug("Serper query: %s", serper_q)
    log.debug("Daraz core: %s", core_term)
    daraz = scrape_daraz(core_term, meta, 30)
    web = scrape_generic(serper_q, 10)
    products = daraz[:5] + web + daraz[5:]
    if not products:
        print("❌ No products.")
        return
    
    # Save images and update paths
    for item in products:
        if item.get("image"):
            domain = "daraz" if "daraz" in item.get("source", "").lower() else "web"
            item["image"] = save_image(item["image"], domain)
    
    vec_items, mat, _ = vectorize_products(products, query=core_term, return_query_vector=True)
    if mat is not None:
        print(f"\n✅ TF-IDF matrix: {mat.shape}")
    for i, p in enumerate(vec_items[:15], 1):
        print(f"{i:>2}. {p['source']:<14} | {p['name'][:60]:60} | Rs.{p.get('price', '0'):<8} | {p['url']}")

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
    for i, p in enumerate(hits[:15], 1):
        print(f"{i:>2}. {p['source']:<14} | {p['name'][:60]:60} | Rs.{p.get('price', '0'):<8} | {p['url']}")

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
        elif mode.startswith("t"):
            q = input("Enter product keywords: ").strip()
            if q:
                text_flow(q)
        elif mode.startswith("i"):
            img = input("Enter image path: ").strip('" ')
            image_flow(img)
        else:
            print("Please type T, I, or Q.")

# Entrypoint
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", action="store_true", help="Run API server instead of CLI")
    args = parser.parse_args()
    if args.api:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    else:
        cli_loop()