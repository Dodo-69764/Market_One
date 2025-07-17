# product_comparator.py

from pydantic import BaseModel
from typing import List, Optional, Dict
import numpy as np
import logging
from src.query_llm import compare_products_llm

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Product(BaseModel):
    name: str
    price: Optional[float] = None
    description: Optional[str] = None
    vector: List[float]
    query_vector: List[float]
    image: Optional[str] = None
    source: Optional[str] = None
    similarity: Optional[float] = None
    url: Optional[str] = None

class ProductComparisonRequest(BaseModel):
    prod1: Product
    prod2: Product
    searchType: str  # Required by frontend

    class Config:
        extra = "ignore"  # Avoid 422 if additional fields are sent

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    try:
        a, b = np.array(vec1), np.array(vec2)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
    except Exception as e:
        logger.error(f"Error calculating cosine similarity: {e}")
        raise

def compare_products(
    p1: Product, p2: Product,
    p1_vec: List[float], p2_vec: List[float],
    query_vec: List[float]
) -> Dict:
    try:
        logger.info("Starting product comparison.")
        _ = cosine_similarity(p1_vec, query_vec)
        _ = cosine_similarity(p2_vec, query_vec)

        result = compare_products_llm(p1.dict(), p2.dict())
        return result
    except Exception as e:
        logger.error(f"Error comparing products: {e}")
        raise
