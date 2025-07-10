from transformers import BertTokenizer, BertModel
import torch
import logging
from typing import Tuple
from src.utils import load_config

logger = logging.getLogger(__name__)

class QueryProcessor:
    """Process and vectorize search queries optimized for Pakistan."""
    
    def __init__(self):
        """Initialize BERT tokenizer and model."""
        config = load_config()
        model_name = config.get("query_processor", {}).get("bert_model", "bert-base-uncased")
        self.tokenizer = BertTokenizer.from_pretrained(model_name)
        self.model = BertModel.from_pretrained(model_name)
        self.location = config.get("query_processor", {}).get("location", "Pakistan")
    
    def optimize_query(self, query: str) -> str:
        """Optimize query by appending location-specific terms.

        Args:
            query: Original user query.

        Returns:
            Optimized query string.
        """
        optimized = f"{query} in {self.location}"
        logger.info(f"Optimized query: {query} -> {optimized}")
        return optimized
    
    def vectorize_query(self, query: str) -> Tuple[torch.Tensor, dict]:
        """Tokenize and generate BERT embeddings for the query.

        Args:
            query: Input query string.

        Returns:
            Tuple of (embeddings, tokenized_output).
        """
        optimized_query = self.optimize_query(query)
        inputs = self.tokenizer(
            optimized_query,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=128
        )
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            embeddings = outputs.last_hidden_state[:, 0, :]  # CLS token embedding
        
        logger.info(f"Vectorized query: {optimized_query}")
        return embeddings, inputs
