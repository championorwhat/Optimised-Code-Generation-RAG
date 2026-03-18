"""
Tests for Orchestrator.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.core.orchestrator import EGRROrchestrator
from src.domain.entities import (
    CodeExample,
    DecisionResult,
    ExecutionResult,
    GeneratedCode,
    Review,
    ReviewAspect,
    ReviewStatus,
    TestRunMetrics,
)
from src.domain.value_objects import DecisionType, ExecutionStatus


@pytest.fixture
def mock_phases():
    with patch("src.core.orchestrator.RetrievalPhase") as MockRetrieval, \
         patch("src.core.orchestrator.GenerationPhase") as MockGeneration, \
         patch("src.core.orchestrator.ExecutionPhase") as MockExecution, \
         patch("src.core.orchestrator.ReviewPhase") as MockReview, \
         patch("src.core.orchestrator.DecisionPhase") as MockDecision:
        
        retrieval = MockRetrieval.return_value
        generation = MockGeneration.return_value
        execution = MockExecution.return_value
        review = MockReview.return_value
        decision = MockDecision.return_value
        
        # Make all phase methods async
        retrieval.execute_intent_based = AsyncMock()
        retrieval.execute_execution_grounded = AsyncMock()
        generation.execute = AsyncMock()
        generation.execute_repair = AsyncMock()
        execution.execute = AsyncMock()
        review.execute = AsyncMock()
        decision.execute = AsyncMock()
        
        yield (retrieval, generation, execution, review, decision)


@pytest.mark.asyncio
async def test_orchestrator_success_first_try(mock_phases):
    retrieval, generation, execution, review, decision = mock_phases
    
    # Setup Mocks
    retrieval.execute_intent_based.return_value = ([], [CodeExample(id="1", code="", language="", explanation="", tags=[])])
    generation.execute.return_value = GeneratedCode(code="pass", explanation="ok", confidence=1.0)
    execution.execute.return_value = ExecutionResult(
        status=ExecutionStatus.SUCCESS, stdout="", stderr="", exit_code=0, 
        test_results=TestRunMetrics(passed=1, failed=0), coverage=None
    )
    review.execute.return_value = Review(
        correctness=ReviewAspect(status=ReviewStatus.PASS),
        security=ReviewAspect(status=ReviewStatus.PASS),
        robustness=ReviewAspect(status=ReviewStatus.PASS),
        performance=ReviewAspect(status=ReviewStatus.PASS),
        overall_quality_score=1.0, 
        critical_issues=[]
    )
    decision.execute.return_value = DecisionResult(
        decision=DecisionType.TERMINATE_SUCCESS, rationale="ok"
    )
    
    orchestrator = EGRROrchestrator()
    response = await orchestrator.run("simple task")
    
    assert response.status == "success"
    assert response.iterations == 1
    assert response.code == "pass"


@pytest.mark.asyncio
async def test_orchestrator_loop_to_max(mock_phases):
    retrieval, generation, execution, review, decision = mock_phases
    
    # Setup Mocks to always continue until max
    decision.execute.side_effect = [
        DecisionResult(decision=DecisionType.CONTINUE, rationale="fail 1"),
        DecisionResult(decision=DecisionType.CONTINUE, rationale="fail 2"),
        DecisionResult(decision=DecisionType.TERMINATE_MAX_ITERATIONS, rationale="max")
    ]
    
    # Mock retrieval return values (tuple unpacking)
    retrieval.execute_intent_based.return_value = ([], [])
    retrieval.execute_execution_grounded.return_value = ([], [])

    # Mock generation
    generation.execute.return_value = GeneratedCode(code="v1", explanation="", confidence=0.5)
    generation.execute_repair.return_value = GeneratedCode(code="v2", explanation="", confidence=0.6)
    
    # Mock execution
    execution.execute.return_value = ExecutionResult(
        status=ExecutionStatus.ERROR, stdout="", stderr="fail", exit_code=1,
        test_results=TestRunMetrics(passed=0, failed=1), coverage=None
    )
    
    # Mock review
    review.execute.return_value = Review(
        correctness=ReviewAspect(status=ReviewStatus.FAIL),
        security=ReviewAspect(status=ReviewStatus.PASS),
        robustness=ReviewAspect(status=ReviewStatus.PASS),
        performance=ReviewAspect(status=ReviewStatus.PASS),
        overall_quality_score=0.5,
        critical_issues=["Error"]
    )
    
    orchestrator = EGRROrchestrator()
    response = await orchestrator.run("hard task", max_iterations=3)
    
    assert response.status == "partial"
    assert response.iterations == 3
    
    # Check calls
    assert retrieval.execute_intent_based.call_count == 1
    assert retrieval.execute_execution_grounded.call_count == 2
    assert generation.execute.call_count == 1
    assert generation.execute_repair.call_count == 2

