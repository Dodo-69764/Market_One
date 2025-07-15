from typing import List, Dict, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def vectorize_products(
    products: List[Dict],
    query: str = "",
    return_query_vector: bool = False
) -> Tuple[List[Dict], List[List[float]], List[float] ]:

    # Extract product descriptions
    texts = [p.get("description", p["name"]) for p in products]

    if query:
        texts_with_query = [query] + texts
    else:
        texts_with_query = texts

    # Fit TF-IDF
    vectorizer = TfidfVectorizer(max_features=256)
    matrix = vectorizer.fit_transform(texts_with_query).toarray()

    # Separate query vector if needed
    if query and return_query_vector:
        query_vec = matrix[0]
        product_vecs = matrix[1:]
    else:
        query_vec = None
        product_vecs = matrix

    # Optionally attach similarity scores
    if query and return_query_vector:
        scores = cosine_similarity([query_vec], product_vecs)[0]
        for i, score in enumerate(scores):
            products[i]["similarity"] = float(score)

    return products, product_vecs, query_vec
