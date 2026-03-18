"""
Embedding service using SentenceTransformers.
"""


import functools
from typing import cast


import numpy as np
from sentence_transformers import SentenceTransformer

from src.config.settings import get_settings

settings = get_settings()


class Embedder:
    """Wrapper for sentence-transformers embedding model."""

    def __init__(self) -> None:
        """Initialize the embedding model."""
        self.model = SentenceTransformer(settings.embedding_model)

    @functools.lru_cache(maxsize=1024)
    def embed(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single string.
        
        Returns:
            np.ndarray: 1D array of shape (embedding_dim,)
        """
        embedding = self.model.encode(text, convert_to_numpy=True)
        return cast(np.ndarray, embedding)

    def embed_batch(self, texts: list[str]) -> np.ndarray:
        """
        Generate embeddings for a list of strings.
        
        Returns:
            np.ndarray: 2D array of shape (num_texts, embedding_dim)
        """
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return cast(np.ndarray, embeddings)
