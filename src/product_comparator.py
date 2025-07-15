# src/product_comparator.py
from typing import Dict, List
import numpy as np
from src.query_llm import call_llm  # Adjust to match your llama3 wrapper

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    a, b = np.array(vec1), np.array(vec2)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def compare_products(
    p1: Dict, p2: Dict,
    p1_vec: List[float], p2_vec: List[float],
    query_vec: List[float]
) -> Dict:
    sim1 = cosine_similarity(p1_vec, query_vec)
    sim2 = cosine_similarity(p2_vec, query_vec)

    prompt = f"""
You are a helpful shopping assistant.

A user searched for something. Here are two matching products:

🔹 Product A:
Name: {p1['name']}
Price: {p1['price']}
Description: {p1.get('description', 'N/A')}
Similarity to query: {sim1:.3f}

🔹 Product B:
Name: {p2['name']}
Price: {p2['price']}
Description: {p2.get('description', 'N/A')}
Similarity to query: {sim2:.3f}

Please explain the differences between them and recommend one.
"""

    summary = call_llm(prompt)  # llama3 inference
    return {
        "recommendation": summary,
        "similarity_scores": {"product_1": sim1, "product_2": sim2}
    }
