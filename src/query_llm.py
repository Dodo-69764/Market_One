"""
LLM wrapper – Meta‑Llama‑3‑8B‑Instruct via Hugging Face Inference‑API
====================================================================
Exports:
    analyse(query: str) -> dict

Returned JSON (keys only, ALWAYS present):
    brand           : str   (dominant brand or "" if unknown)
    core_term       : str   (clean searchable phrase)
    positive_keywords : list[str]  (0‑5 terms)
    negative_keywords : list[str]  (0‑15 terms)
    categories        : list[str]  (1‑3 broad retail categories)
"""
from __future__ import annotations
import json, os
from typing import Dict
from huggingface_hub import InferenceClient

_TOKEN    = os.getenv("HF_TOKEN")
_MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct"

_SYSTEM = (
    "You are an e‑commerce search expert. "
    "For the USER query, respond ONLY with compact JSON containing:\n"
    'brand              : dominant brand word (string, "" if none)\n'
    "core_term          : concise phrase to search (string)\n"
    "positive_keywords  : up to 5 helpful modifiers (list of strings)\n"
    "negative_keywords  : up to 15 misleading words to exclude\n"
    "categories         : 1‑3 broad retail categories (list of strings)\n"
    "Return VALID JSON, no markdown."
)

_client = InferenceClient(token=_TOKEN, model=_MODEL_ID, timeout=60)

def analyse(query: str) -> Dict:
    prompt = (
        f"<|begin_of_text|><|start_header|>system<|end_header|>\n{_SYSTEM}"
        f"<|eot|><|start_header|>user<|end_header|>\n{query}"
        f"<|eot|><|start_header|>assistant<|end_header|>\n"
    )
    try:
        rsp = _client.chat_completion(
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user",   "content": query},
            ],
            max_tokens=256,
            temperature=0.2,
        )
        text = rsp.choices[0].message.content.strip()
        return json.loads(text)
    except Exception as e:
        # fallback – minimal fields so pipeline continues
        return {
            "brand": "",
            "core_term": query,
            "positive_keywords": [],
            "negative_keywords": [],
            "categories": [],
            "debug": f"hf_api_error:{e}",
        }
