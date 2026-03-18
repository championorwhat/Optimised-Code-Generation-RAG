"""
Integration Tests for EGRR Pipeline.

These tests verify the interaction between components:
1. API -> Orchestrator -> Phases
2. Real Sandbox Execution (subprocess)
3. Real VectorDB (FAISS in temp dir)
4. Mocked LLM (Simulated responses to avoid API costs/auth issues)
"""

import numpy as np
import faiss
from unittest.mock import AsyncMock, patch, MagicMock
import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.domain.entities import GenerateResponse, GeneratedCode, ExecutionResult, ExecutionStatus, TestRunMetrics, Review, ReviewAspect, ReviewStatus, CodeExample
from src.infrastructure.vectordb.indexer import CodeCorpusIndexer
from src.infrastructure.vectordb.retriever import CodeRetriever

client = TestClient(app)

@pytest.fixture
def mock_llm_responses():
    """Provides mocked LLM responses for a full pipeline run."""
    with patch("src.infrastructure.llm.client.HuggingFaceLLM.generate_json", new_callable=AsyncMock) as mock_generate_json, \
         patch("src.infrastructure.llm.client.HuggingFaceLLM.generate", new_callable=AsyncMock) as mock_generate:
        
        # Use a counter to track call sequence
        call_count = {"json": 0}
        
        async def side_effect_json(messages, **kwargs):
            call_count["json"] += 1
            # First call: Retrieval
            if call_count["json"] == 1:
                return '{"retrieval_queries": [{"query": "python sort list", "rationale": "need sort"}]}'
            # Second call: Generation  
            elif call_count["json"] == 2:
                return '{"code": "def sort_list(items):\\n    return sorted(items)", "explanation": "Standard sort", "confidence": 1.0}'
            # Third call: Review
            elif call_count["json"] == 3:
                return """{
                    "correctness": {"status": "pass", "evidence": [], "findings": []},
                    "security": {"status": "pass", "evidence": [], "findings": []},
                    "robustness": {"status": "pass", "evidence": [], "findings": []},
                    "performance": {"status": "pass", "evidence": [], "findings": []},
                    "overall_quality_score": 1.0,
                    "critical_issues": [],
                    "improvement_opportunities": []
                }"""
            # Fourth+ call: Decision/Repair
            else:
                return '{"retrieval_queries": []}'

        mock_generate_json.side_effect = side_effect_json
        
        # For generate() (Test generation)
        async def side_effect_generate(prompt, **kwargs):
            return "import pytest\nfrom solution import *\ndef test_sort(): assert sort_list([3,1,2]) == [1,2,3]"
        
        mock_generate.side_effect = side_effect_generate
        
        yield mock_generate_json

@pytest.fixture
def temp_vectordb(tmp_path):
    """Sets up a real FAISS index in a temp directory."""
    
    index_path = tmp_path / "faiss_index.bin"
    metadata_path = tmp_path / "metadata.pkl"
    
    # Create the indexer with temp paths
    indexer = CodeCorpusIndexer(index_path=str(index_path), metadata_path=str(metadata_path))
    
    docs = [
        CodeExample(id="1", code="def bubble_sort(arr): pass", language="python", explanation="Bubble sort", tags=["sort"]),
        CodeExample(id="2", code="def quick_sort(arr): pass", language="python", explanation="Quick sort", tags=["sort"])
    ]
    indexer.documents = docs
    
    with patch.object(indexer, 'embedder') as mock_embedder:
        mock_embedder.embed_batch.return_value = np.random.rand(len(docs), 384).astype("float32")
        mock_embedder.embed.return_value = np.random.rand(384).astype("float32")
        
        indexer.index = faiss.IndexFlatL2(384)
        vectors = mock_embedder.embed_batch([])
        indexer.index.add(vectors)
        indexer.save_index()
        
    with patch("src.infrastructure.vectordb.retriever.CodeCorpusIndexer", return_value=indexer):
        yield indexer

def test_pipeline_happy_path(mock_llm_responses, temp_vectordb):
    """
    Full integration test.
    """
    payload = {
        "query": "Write a function to sort a list",
        "max_iterations": 1  # Single iteration for faster test
    }
    
    response = client.post("/api/generate", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    
    # Accept both success and partial status
    assert data["status"] in ("success", "partial"), f"Unexpected status: {data['status']}, code: {data.get('code', 'N/A')}"
    assert len(data["code"]) > 10, f"Code too short: {data['code']}"
    assert data["iterations"] >= 1


