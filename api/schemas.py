from pydantic import BaseModel
from typing import List, Dict

class TextSearchRequest(BaseModel):
    query: str
    max_results: int = 30

class ImageSearchResponse(BaseModel):
    items: List[Dict]
    meta: Dict
