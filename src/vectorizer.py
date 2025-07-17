# vectorizer.py
from typing import List, Dict, Tuple, Optional, Union
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def vectorize_products(
    products: List[Dict],
    query: Optional[Union[str, np.ndarray]] = None,
    similarity_key: str = "similarity"
) -> Tuple[List[Dict], Optional[List[List[float]]], Optional[np.ndarray]]:
    """
    Vectorize product text and calculate similarity scores.
    
    Args:
        products: List of product dictionaries
        query: Optional query (text string or vector) for similarity calculation
        similarity_key: Dictionary key to store similarity scores
    
    Returns:
        Tuple of (products, product_vectors, query_vector)
    """
    # Extract product descriptions
    texts = [p.get("description", p["name"]) for p in products]
    
    # Handle empty input
    if not texts:
        return products, None, None
    
    # Fit TF-IDF vectorizer
    vectorizer = TfidfVectorizer(max_features=256)
    product_vecs = vectorizer.fit_transform(texts).toarray()
    
    query_vec = None
    similarity_scores = None
    
    # Calculate similarity if query is provided
    if query is not None:
        if isinstance(query, str):
            # Text query - transform to vector
            query_vec = vectorizer.transform([query]).toarray()[0]
        elif isinstance(query, np.ndarray):
            # Already vectorized query
            query_vec = query
        
        if query_vec is not None:
            # Ensure proper shape for cosine similarity
            if query_vec.ndim == 1:
                query_2d = query_vec.reshape(1, -1)
            else:
                query_2d = query_vec
                
            # Calculate similarity scores
            similarity_scores = cosine_similarity(query_2d, product_vecs)[0]
            for i, score in enumerate(similarity_scores):
                products[i][similarity_key] = float(score)
    
    # Attach vectors to products for comparison
    for i, product in enumerate(products):
        product["vector"] = product_vecs[i].tolist()
        if query_vec is not None:
            # Store as 1D array for consistency
            product["query_vector"] = query_vec.flatten().tolist()
    
    return products, product_vecs, query_vec
