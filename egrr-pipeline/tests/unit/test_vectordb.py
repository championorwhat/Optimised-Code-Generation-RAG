"""
Tests for VectorDB infrastructure.
"""

import json
import shutil
from pathlib import Path

import numpy as np
import pytest

from src.infrastructure.vectordb.embedder import Embedder
from src.infrastructure.vectordb.indexer import CodeCorpusIndexer
from src.infrastructure.vectordb.retriever import CodeRetriever


@pytest.fixture
def test_corpus_dir(tmp_path):
    """Create a temporary corpus directory."""
    corpus_dir = tmp_path / "corpus"
    corpus_dir.mkdir()
    
    # Create a dummy code example
    example = {
        "id": "test_001",
        "code": "def hello(): print('world')",
        "language": "python",
        "explanation": "Prints hello world",
        "tags": ["test", "printing"]
    }
    
    with open(corpus_dir / "test_example.json", "w") as f:
        json.dump(example, f)
        
    return corpus_dir


@pytest.fixture
def test_index_path(tmp_path):
    """Create temporary paths for index files."""
    return str(tmp_path / "index.bin"), str(tmp_path / "metadata.pkl")


def test_embedder():
    """Test functionality of the Embedder."""
    embedder = Embedder()
    embedding = embedder.embed("hello world")
    
    assert isinstance(embedding, np.ndarray)
    assert embedding.shape == (384,)  # all-MiniLM-L6-v2 dimension


@pytest.mark.asyncio
async def test_indexer_and_retriever(test_corpus_dir, test_index_path):
    """Test building index and retrieving from it."""
    index_path, metadata_path = test_index_path
    
    # 1. Build Index
    indexer = CodeCorpusIndexer(index_path=index_path, metadata_path=metadata_path)
    indexer.build_index(corpus_root=str(test_corpus_dir))
    
    assert indexer.index.ntotal == 1
    assert len(indexer.documents) == 1
    assert Path(index_path).exists()
    assert Path(metadata_path).exists()
    
    # 2. Retrieve
    # We need to monkeypatch the CodeCorpusIndexer inside CodeRetriever to use our temp paths
    # Or cleaner: Init retriever manually with the indexer instance if possible, 
    # but CodeRetriever inits its own Indexer. 
    # Let's subclass or just manually configure it for the test.
    
    class TestRetriever(CodeRetriever):
        def __init__(self):
            # Bypass super().__init__ to inject our custom indexer
            self.indexer = CodeCorpusIndexer(index_path=index_path, metadata_path=metadata_path)
            self.indexer.load_index()

    retriever = TestRetriever()
    results = await retriever.search("print hello", top_k=1)
    
    assert len(results) == 1
    assert results[0].id == "test_001"
    assert results[0].similarity_score > 0.0

