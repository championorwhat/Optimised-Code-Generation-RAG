"""
FAISS Indexer for Code Corpus.
"""

import json
import pickle
from pathlib import Path

import faiss
import numpy as np

from src.domain.entities import CodeExample
from src.infrastructure.vectordb.embedder import Embedder


class CodeCorpusIndexer:
    """Handles indexing of code examples into FAISS."""

    def __init__(self, index_path: str = "corpus/faiss_index.bin", metadata_path: str = "corpus/metadata.pkl"):
        """Initialize indexer."""
        self.index_path = Path(index_path)
        self.metadata_path = Path(metadata_path)
        self.embedder = Embedder()
        self.dimension = 384  # Dimension for all-MiniLM-L6-v2
        self.index = faiss.IndexFlatL2(self.dimension)
        self.documents: list[CodeExample] = []

    def load_corpus(self, corpus_root: str = "corpus") -> list[CodeExample]:
        """Load code examples from JSON files in the corpus directory."""
        examples = []
        root = Path(corpus_root)
        
        # Walk through all subdirectories
        for path in root.rglob("*.json"):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    example = CodeExample(**data)
                    examples.append(example)
            except Exception as e:
                print(f"Error loading {path}: {e}")
        
        return examples

    def build_index(self, corpus_root: str = "corpus") -> None:
        """Build and save the FAISS index from the corpus files."""
        print(f"Scanning corpus at {corpus_root}...")
        self.documents = self.load_corpus(corpus_root)
        
        if not self.documents:
            print("No documents found in corpus.")
            return

        print(f"Found {len(self.documents)} documents. Generating embeddings...")
        
        # Create text representation for embedding (combine explanation + code + tags)
        texts = [
            f"{doc.explanation}\n{doc.code}\nTags: {' '.join(doc.tags)}"
            for doc in self.documents
        ]
        
        embeddings = self.embedder.embed_batch(texts)
        
        # Reset and populate index
        self.index = faiss.IndexFlatL2(self.dimension)
        self.index.add(embeddings.astype("float32"))
        
        print(f"Index built with {self.index.ntotal} vectors. Saving...")
        self.save_index()
        print("Done.")

    def save_index(self) -> None:
        """Persist index and metadata to disk."""
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save FAISS index
        faiss.write_index(self.index, str(self.index_path))
        
        # Save metadata (the actual CodeExample objects)
        with open(self.metadata_path, "wb") as f:
            pickle.dump(self.documents, f)

    def load_index(self) -> None:
        """Load index and metadata from disk."""
        if not self.index_path.exists() or not self.metadata_path.exists():
            raise FileNotFoundError("Index not found. Run build_index() first.")

        self.index = faiss.read_index(str(self.index_path))
        with open(self.metadata_path, "rb") as f:
            self.documents = pickle.load(f)
