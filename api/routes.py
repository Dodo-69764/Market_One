from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import shutil
import uuid
from pathlib import Path

from src.image_search import search_by_image
from src.query_llm import analyse
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
