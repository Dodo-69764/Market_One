from __future__ import annotations
import os, json, time, logging
from typing import Dict, List
from huggingface_hub import InferenceClient
from requests.exceptions import ReadTimeout
from dotenv import load_dotenv

# ─────────────── Setup ───────────────
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
log = logging.getLogger(__name__)

_TOKEN = os.getenv("HF_TOKEN")
_MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct"

if not _TOKEN:
    raise EnvironmentError("HF_TOKEN missing from environment.")

_client = InferenceClient(token=_TOKEN, model=_MODEL_ID, timeout=60)

# ─────────────── Retry Wrapper ───────────────
def _retry_llm_call(messages: List[Dict], max_tokens: int = 512, temperature: float = 0.5, attempts: int = 3) -> str:
    for attempt in range(attempts):
        try:
            log.info(f"Calling LLM (Attempt {attempt + 1})...")
            response = _client.chat_completion(
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content.strip()
        except (ReadTimeout, Exception) as e:
            log.warning(f"LLM call attempt {attempt + 1} failed: {e}")
            time.sleep(1.5)
            if attempt == attempts - 1:
                raise e

# ─────────────── Raw Prompt Debugger ───────────────
def call_llm(prompt: str) -> str:
    messages = [{"role": "user", "content": prompt}]
    return _retry_llm_call(messages)

# ─────────────── System Prompt for Query Analysis ───────────────
_SYSTEM_ANALYSE = (
    "You are an e-commerce search expert. "
    "For the USER query, respond ONLY with compact JSON containing:\n"
    'brand              : dominant brand word (string, "" if none)\n'
    "core_term          : concise phrase to search (string)\n"
    "positive_keywords  : up to 5 helpful modifiers (list of strings)\n"
    "negative_keywords  : up to 15 misleading words to exclude\n"
    "categories         : 1-3 broad retail categories (list of strings)\n"
    "Return VALID JSON, no markdown."
)

# ─────────────── Query Analyzer ───────────────
def analyse(query: str) -> Dict:
    messages = [
        {"role": "system", "content": _SYSTEM_ANALYSE},
        {"role": "user", "content": query},
    ]
    for attempt in range(3):
        try:
            response = _retry_llm_call(messages, max_tokens=256, temperature=0.2)
            parsed = json.loads(response)
            for key in ["brand", "core_term", "positive_keywords", "negative_keywords", "categories"]:
                parsed.setdefault(key, "" if key in ["brand", "core_term"] else [])
            return parsed
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

# ─────────────── Product Comparator ───────────────
def compare_products_llm(prod1: Dict[str, str], prod2: Dict[str, str]) -> Dict:
    """
    Compares two product descriptions and prices using LLaMA-3 and returns:
        - summary        : bullet list of differences
        - product1_advantages: list of advantages for product 1
        - product2_advantages: list of advantages for product 2
        - recommendation : single-line recommendation
    """
    log.info("Preparing prompt for LLM product comparison...")
    log.info(f"Product 1: {json.dumps(prod1, indent=2)}")
    log.info(f"Product 2: {json.dumps(prod2, indent=2)}")

    def format_price(p) -> str:
        try:
            p = float(p)
            return "Price not available" if p == 0 else f"Rs.{int(p)}"
        except:
            return "Price not available"

    price1 = format_price(prod1.get("price", ""))
    price2 = format_price(prod2.get("price", ""))

    prompt = (
        "Compare the following two products and provide a detailed analysis.\n"
        "Return ONLY a valid JSON object with:\n"
        "- summary: bullet point differences (string)\n"
        "- product1_advantages: list of up to 5 unique advantages (array of strings)\n"
        "- product2_advantages: list of up to 5 unique advantages (array of strings)\n"
        "- recommendation: one-line buying suggestion (string)\n\n"
        f"Product 1:\nName: {prod1.get('name', '')}\nPrice: {price1}\n"
        f"Description: {prod1.get('description', 'No description available')}\n\n"
        f"Product 2:\nName: {prod2.get('name', '')}\nPrice: {price2}\n"
        f"Description: {prod2.get('description', 'No description available')}\n\n"
        "If the price says 'Price not available', it means it could not be fetched — do not assume it is free.\n"
        "Output only valid JSON. No markdown. No explanations."
    )

    messages = [
        {"role": "system", "content": "You are a helpful e-commerce assistant who strictly returns JSON."},
        {"role": "user", "content": prompt},
    ]

    for attempt in range(3):
        try:
            log.info("Sending comparison request to LLM...")
            response = _retry_llm_call(messages, max_tokens=512, temperature=0.5)
            log.info("Received response from LLM:")
            log.info(response)

            parsed = json.loads(response)
            result = {
                "summary": parsed.get("summary", "No summary available."),
                "product1_advantages": parsed.get("product1_advantages", []),
                "product2_advantages": parsed.get("product2_advantages", []),
                "recommendation": parsed.get("recommendation", "No recommendation available.")
            }
            log.info("Parsed comparison result: %s", json.dumps(result, indent=2))
            return result

        except json.JSONDecodeError as e:
            log.error("JSONDecodeError during product comparison: %s", e)
            log.error("Raw response: %s", response)
            if attempt == 2:
                return {
                    "summary": "Comparison failed due to LLM error.",
                    "product1_advantages": [],
                    "product2_advantages": [],
                    "recommendation": "Error: JSON decode failure."
                }

        except Exception as e:
            log.exception("Unexpected error during product comparison.")
            if attempt == 2:
                return {
                    "summary": "Comparison failed due to LLM error.",
                    "product1_advantages": [],
                    "product2_advantages": [],
                    "recommendation": f"Error: {repr(e)}"
                }
            time.sleep(1.5)
