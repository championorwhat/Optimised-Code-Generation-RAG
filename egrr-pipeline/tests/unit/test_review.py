"""
Tests for Review Phase.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.core.phases.review import ReviewPhase
from src.domain.entities import ExecutionResult, ExecutionStatus, TestRunMetrics, ReviewStatus


@pytest.fixture
def mock_dependencies():
    with patch("src.core.phases.review.HuggingFaceLLM") as MockLLM:
        mock_llm = MockLLM.return_value
        mock_llm.generate_json = AsyncMock()
        yield mock_llm


@pytest.mark.asyncio
async def test_review_success(mock_dependencies):
    mock_llm = mock_dependencies
    
    # Mock LLM JSON response
    mock_llm.generate_json.return_value = """
    {
        "correctness": {"status": "pass", "evidence": ["Tests passed"], "findings": ["Good"]},
        "security": {"status": "pass", "evidence": [], "findings": ["No vulns"]},
        "robustness": {"status": "warn", "evidence": ["Coverage 50%"], "findings": ["Low coverage"]},
        "performance": {"status": "pass", "evidence": [], "findings": ["O(n)"]},
        "overall_quality_score": 0.8,
        "critical_issues": [],
        "improvement_opportunities": ["Add tests"]
    }
    """
    
    # Mock execution result
    exec_result = ExecutionResult(
        status=ExecutionStatus.SUCCESS,
        stdout="", stderr="", exit_code=0,
        test_results=TestRunMetrics(passed=5, failed=0),
        coverage=None
    )
    
    phase = ReviewPhase()
    review = await phase.execute("print('ok')", exec_result)
    
    assert review.correctness.status == ReviewStatus.PASS
    assert review.overall_quality_score == 0.8
    assert len(review.improvement_opportunities) == 1


@pytest.mark.asyncio
async def test_review_parse_error(mock_dependencies):
    mock_llm = mock_dependencies
    mock_llm.generate_json.return_value = "Not JSON"
    
    exec_result = ExecutionResult(
        status=ExecutionStatus.ERROR,
        stdout="", stderr="Error", exit_code=1,
        test_results=None, coverage=None
    )
    
    phase = ReviewPhase()
    review = await phase.execute("print('ok')", exec_result)
    
    # Implementation should fallback to conservative fail
    assert review.correctness.status == ReviewStatus.FAIL
    assert "Parse error" in review.correctness.findings[0]

