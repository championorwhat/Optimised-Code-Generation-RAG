"""
Tests for Retrieval Phase.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.core.phases.retrieval import RetrievalPhase
from src.domain.entities import ExecutionResult, ExecutionStatus, TestRunMetrics


@pytest.fixture
def mock_dependencies():
    with patch("src.core.phases.retrieval.HuggingFaceLLM") as MockLLM, \
         patch("src.core.phases.retrieval.CodeRetriever") as MockRetriever:
        mock_llm = MockLLM.return_value
        mock_retriever = MockRetriever.return_value
        mock_llm.generate_json = AsyncMock()
        mock_retriever.search = AsyncMock()
        yield mock_llm, mock_retriever


@pytest.mark.asyncio
async def test_intent_based_retrieval(mock_dependencies):
    mock_llm, mock_retriever = mock_dependencies
    
    # Mock LLM JSON response
    mock_llm.generate_json.return_value = """
    {
        "retrieval_queries": [
            {
                "query": "read file python",
                "rationale": "Need file reading logic"
            }
        ]
    }
    """
    
    # Mock Retriever response
    mock_doc = MagicMock()
    mock_doc.id = "doc1"
    mock_retriever.search.return_value = [mock_doc]
    
    phase = RetrievalPhase()
    queries, docs = await phase.execute_intent_based("read file")
    
    assert len(queries) == 1
    assert queries[0].query == "read file python"
    assert len(docs) == 1
    assert docs[0].id == "doc1"


@pytest.mark.asyncio
async def test_execution_grounded_retrieval(mock_dependencies):
    mock_llm, mock_retriever = mock_dependencies
    
    # Mock LLM response for error fix
    mock_llm.generate_json.return_value = """
    {
        "retrieval_queries": [
            {
                "query": "fix file not found error",
                "rationale": "Execution result showed FileNotFoundError"
            }
        ]
    }
    """
    
    # Mock Retriever - empty response is ok for this test
    mock_retriever.search.return_value = []
    
    # Mock execution result
    exec_result = ExecutionResult(
        status=ExecutionStatus.ERROR,
        stdout="", 
        stderr="FileNotFoundError: foo.txt",
        exit_code=1,
        test_results=None,
        coverage=None
    )
    
    phase = RetrievalPhase()
    queries, docs = await phase.execute_execution_grounded(exec_result)
    
    assert len(queries) == 1
    assert queries[0].query == "fix file not found error"

