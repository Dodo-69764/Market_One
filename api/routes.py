from fastapi import APIRouter, UploadFile, File, HTTPException, JSONResponse
from fastapi.responses import JSONResponse
import shutil
import uuid
from pathlib import Path
from typing import List, Dict

from src.image_search import search_by_image
from src.query_llm import analyse, compare_products_llm
from src.daraz_scraper import scrape_daraz
from src.generic_scraper import scrape_generic
from .schemas import TextSearchRequest, ImageSearchResponse

router = APIRouter()

@router.post("/search-text", response_model=ImageSearchResponse)
def search_by_text(payload: TextSearchRequest):
    try:
        meta = analyse(payload.query)
        meta.setdefault("core_term", payload.query)
        meta.setdefault("positive_keywords", [])
        meta.setdefault("negative_keywords", [])
        meta.setdefault("categories", [])

        core_term = meta["core_term"]
        items = list(scrape_daraz(core_term, meta, payload.max_results)) + list(
            scrape_generic(core_term, 10)
        )
        return {"items": items, "meta": meta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search-image", response_model=ImageSearchResponse)
def search_by_uploaded_image(file: UploadFile = File(...)):
    try:
        ext = Path(file.filename).suffix
        temp_path = f"temp_uploads/{uuid.uuid4().hex}{ext}"
        Path("temp_uploads").mkdir(exist_ok=True)

        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        items, meta = search_by_image(temp_path, 30)
        Path(temp_path).unlink(missing_ok=True)

        return {"items": items, "meta": meta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare-products")
def compare_products(prod1: Dict[str, str], prod2: Dict[str, str]):
    try:
        comparison = compare_products_llm(prod1, prod2)
        
        # Ensure product1_advantages and product2_advantages are arrays
        comparison.setdefault("product1_advantages", [])
        comparison.setdefault("product2_advantages", [])
        
        # Parse summary into advantages if not already structured
        if "summary" in comparison and isinstance(comparison["summary"], str):
            summary_lines = [line.strip() for line in comparison["summary"].split("\n") if line.strip()]
            if summary_lines:
                # Distribute advantages between products (simplified logic)
                mid_point = len(summary_lines) // 2
                comparison["product1_advantages"] = summary_lines[:mid_point]
                comparison["product2_advantages"] = summary_lines[mid_point:]
            else:
                comparison["product1_advantages"] = []
                comparison["product2_advantages"] = []

        # Ensure required fields are present
        result = {
            "summary": comparison.get("summary", "No summary available."),
            "product1_advantages": comparison.get("product1_advantages", []),
            "product2_advantages": comparison.get("product2_advantages", []),
            "winner": "tie",  # Default to tie if not determined by LLM
            "priceComparison": f"{prod1.get('name', 'Product 1')} is Rs.{prod1.get('price', 'N/A')} vs {prod2.get('name', 'Product 2')} is Rs.{prod2.get('price', 'N/A')}",
            "recommendation": comparison.get("recommendation", "No recommendation available.")
        }
        
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))