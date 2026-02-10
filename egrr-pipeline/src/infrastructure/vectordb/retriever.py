"""
Code Retriever Service.
"""

import math
import asyncio

import numpy as np

from src.domain.entities import CodeExample
from src.infrastructure.vectordb.indexer import CodeCorpusIndexer


class CodeRetriever:
    """Handles semantic search for code examples."""

    def __init__(self) -> None:
        """Initialize retriever and load index."""
        self.indexer = CodeCorpusIndexer()
        try:
            self.indexer.load_index()
            print(f"Loaded index with {len(self.indexer.documents)} documents.")
        except FileNotFoundError:
            print("Warning: Index not found. Retrieval will return empty results until index is built.")

    async def search(self, query: str, top_k: int = 5) -> list[CodeExample]:
        """
        Search the corpus for relevant code examples asynchronously.
        Runs blocking CPU interactions (embedding + FAISS) in a thread pool.
        
        Args:
            query: The search query string.
            top_k: Number of results to return.
            
        Returns:
            List of CodeExample objects with similarity_score set.
        """
        if self.indexer.index.ntotal == 0:
            return []

        # Run embedding and search in thread pool to avoid blocking event loop
        return await asyncio.to_thread(self._search_sync, query, top_k)

    def _search_sync(self, query: str, top_k: int) -> list[CodeExample]:
        """Internal synchronous search logic."""
        # Embed query (with simple caching if implemented in embedder, or we assume fast enough)
        # Actually, let's cache the embedding here since we might see repeated queries across iterations
        
        query_vector = self.indexer.embedder.embed(query)
        query_vector = np.array([query_vector]).astype("float32")

        # Search FAISS
        distances, indices = self.indexer.index.search(query_vector, top_k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx == -1:
                continue
            
            doc = self.indexer.documents[idx]
            
            # Convert L2 distance to similarity score (0-1)
            # L2 is squared Euclidean distance. 
            # Simple conversion: 1 / (1 + distance)
            l2_distance = distances[0][i]
            similarity = 1 / (1 + l2_distance)
            
            # Create a copy with score
            # (Pydantic models are mutable by default unless frozen, but copy is safer)
            result_doc = doc.model_copy()
            result_doc.similarity_score = float(similarity)
            results.append(result_doc)

        return results
