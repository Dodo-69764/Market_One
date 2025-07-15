from __future__ import annotations
import os, json, time
from typing import Dict
from huggingface_hub import InferenceClient
from requests.exceptions import ReadTimeout

# ─────────────── Configuration ───────────────
_TOKEN = os.getenv("HF_TOKEN")
_MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct"

if not _TOKEN:
    raise EnvironmentError("HF_TOKEN missing from environment.")

_client = InferenceClient(token=_TOKEN, model=_MODEL_ID)

# ─────────────── Internal Retry Wrapper ───────────────
def _retry_llm_call(messages, max_tokens=512, temperature=0.5, attempts=3) -> str:
    for attempt in range(attempts):
        try:
            response = _client.chat_completion(
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content.strip()
        except (ReadTimeout, Exception) as e:
            time.sleep(1.5)
            if attempt == attempts - 1:
                raise e

# ─────────────── Raw Prompt Call (Debug/Dev) ───────────────
def call_llm(prompt: str) -> str:
    messages = [{"role": "user", "content": prompt}]
    return _retry_llm_call(messages)

# ─────────────── System Prompt for Semantic Query Analysis ───────────────
_SYSTEM_ANALYSE = (
    "You are an e-commerce search expert. "
    "Given a user product search query, respond ONLY with COMPACT VALID JSON in this format:\n\n"
    'brand              : dominant brand word (string, "" if none)\n'
    "core_term          : concise phrase to search (string)\n"
    "positive_keywords  : up to 5 helpful modifiers (list of strings)\n"
    "negative_keywords  : up to 15 misleading words to exclude\n"
    "categories         : 1–3 broad retail categories (list of strings)\n\n"
    "Only return the raw JSON. No markdown, no explanation, no notes."
)

# ─────────────── LLM-powered Query Analyzer ───────────────
def analyse(query: str) -> Dict:
    messages = [
        {"role": "system", "content": _SYSTEM_ANALYSE},
        {"role": "user", "content": query},
    ]

    for attempt in range(3):
        try:
            response = _retry_llm_call(messages, max_tokens=256, temperature=0.2)
            return json.loads(response)
        except Exception as e:
            time.sleep(1.5)
            if attempt == 2:
                return {
                    "brand": "",
                    "core_term": query,
                    "positive_keywords": [],
                    "negative_keywords": [],
                    "categories": [],
                    "debug": f"hf_api_error: {repr(e)}"
                }

# ─────────────── LLM-powered Product Comparison ───────────────
def compare_products_llm(prod1: dict, prod2: dict) -> dict:
    """
    Compares two product descriptions and prices using LLaMA-3 and returns:
        - summary        : bullet list of differences
        - recommendation : single-line recommendation
    """
    prompt = (
        "Compare the following two products and summarize their key differences. "
        "Then recommend the better option with a one-line justification.\n\n"
        f"Product 1:\nName: {prod1.get('name', '')}\nPrice: Rs.{prod1.get('price', '')}\n"
        f"Description: {prod1.get('description', '')}\n\n"
        f"Product 2:\nName: {prod2.get('name', '')}\nPrice: Rs.{prod2.get('price', '')}\n"
        f"Description: {prod2.get('description', '')}\n\n"
        "Return a valid JSON object with:\n"
        "- summary: concise bullet point differences (as a string)\n"
        "- recommendation: one-line buying suggestion (as a string)"
    )

    messages = [
        {"role": "system", "content": "You are a product comparison assistant."},
        {"role": "user", "content": prompt},
    ]

    for attempt in range(3):
        try:
            response = _retry_llm_call(messages, max_tokens=512, temperature=0.5)
            return json.loads(response)
        except Exception as e:
            time.sleep(1.5)
            if attempt == 2:
                return {
                    "summary": "Comparison failed due to LLM error.",
                    "recommendation": f"Error: {repr(e)}",
                }
