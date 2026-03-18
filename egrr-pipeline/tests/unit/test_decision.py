"""
Tests for Decision Phase.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.core.phases.decision import DecisionPhase
from src.domain.entities import Review, ReviewAspect, ReviewStatus, DecisionResult
from src.domain.value_objects import DecisionType


@pytest.fixture
def mock_dependencies():
    with patch("src.core.phases.decision.HuggingFaceLLM") as MockLLM:
        mock_llm = MockLLM.return_value
        mock_llm.generate_json = AsyncMock()
        yield mock_llm


@pytest.mark.asyncio
async def test_continue_for_optimization_no_issues(mock_dependencies):
    """When code is correct but iteration < max, continue for optimization."""
    phase = DecisionPhase()
    review = Review(
        correctness=ReviewAspect(status=ReviewStatus.PASS),
        security=ReviewAspect(status=ReviewStatus.PASS),
        robustness=ReviewAspect(status=ReviewStatus.PASS),
        performance=ReviewAspect(status=ReviewStatus.PASS),
        overall_quality_score=1.0,
        critical_issues=[],
        optimization_gaps=["Add type hints"]
    )
    
    result = await phase.execute(review, iteration=1, max_iterations=5)
    
    # New behavior: continue for optimization
    assert result.decision == DecisionType.CONTINUE
    assert "optimize" in result.rationale.lower() or "optimization" in result.rationale.lower() or "continuing" in result.rationale.lower()


@pytest.mark.asyncio
async def test_terminate_success_at_max_iterations(mock_dependencies):
    """When no issues and at max_iterations, terminate with success."""
    phase = DecisionPhase()
    review = Review(
        correctness=ReviewAspect(status=ReviewStatus.PASS),
        security=ReviewAspect(status=ReviewStatus.PASS),
        robustness=ReviewAspect(status=ReviewStatus.PASS),
        performance=ReviewAspect(status=ReviewStatus.PASS),
        overall_quality_score=1.0,
        critical_issues=[]
    )
    
    result = await phase.execute(review, iteration=5, max_iterations=5)
    
    assert result.decision == DecisionType.TERMINATE_SUCCESS


@pytest.mark.asyncio
async def test_terminate_max_iterations_with_issues(mock_dependencies):
    """When issues remain at max_iterations, terminate with max_iterations."""
    phase = DecisionPhase()
    review = Review(
        correctness=ReviewAspect(status=ReviewStatus.FAIL),
        security=ReviewAspect(status=ReviewStatus.PASS),
        robustness=ReviewAspect(status=ReviewStatus.PASS),
        performance=ReviewAspect(status=ReviewStatus.PASS),
        overall_quality_score=0.5,
        critical_issues=["Test failed"]
    )
    
    # iteration 5 >= max 5 -> terminate
    result = await phase.execute(review, iteration=5, max_iterations=5)
    
    assert result.decision == DecisionType.TERMINATE_MAX_ITERATIONS


@pytest.mark.asyncio
async def test_continue_with_repair(mock_dependencies):
    mock_llm = mock_dependencies
    
    # Mock repair strategy JSON
    mock_llm.generate_json.return_value = """
    {
        "lines_to_modify": [10, 11],
        "patterns_to_apply": ["bounds check"],
        "validation_criteria": ["run tests"]
    }
    """
    
    phase = DecisionPhase()
    review = Review(
        correctness=ReviewAspect(status=ReviewStatus.FAIL),
        security=ReviewAspect(status=ReviewStatus.PASS),
        robustness=ReviewAspect(status=ReviewStatus.PASS),
        performance=ReviewAspect(status=ReviewStatus.PASS),
        overall_quality_score=0.5,
        critical_issues=["IndexError"]
    )
    
    result = await phase.execute(review, iteration=1, max_iterations=5)
    
    assert result.decision == DecisionType.CONTINUE
    assert result.repair_strategy is not None
    assert result.repair_strategy.lines_to_modify == [10, 11]

