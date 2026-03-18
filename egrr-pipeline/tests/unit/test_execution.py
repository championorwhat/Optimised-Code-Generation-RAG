"""
Tests for Execution Phase.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.core.phases.execution import ExecutionPhase
from src.domain.entities import ExecutionResult, ExecutionStatus, GeneratedCode, TestRunMetrics


@pytest.fixture
def mock_dependencies():
    with patch("src.core.phases.execution.HuggingFaceLLM") as MockLLM, \
         patch("src.core.phases.execution.SandboxRunner") as MockRunner:
        mock_llm = MockLLM.return_value
        mock_runner = MockRunner.return_value
        mock_llm.generate = AsyncMock()
        yield mock_llm, mock_runner


@pytest.mark.asyncio
async def test_execution_phase(mock_dependencies):
    mock_llm, mock_runner = mock_dependencies
    
    # Mock LLM generating tests
    mock_llm.generate.return_value = "def test_foo(): assert True"
    
    # Mock Runner syntax check (needs to pass)
    syntax_result = ExecutionResult(
        status=ExecutionStatus.SUCCESS,
        stdout="",
        stderr="",
        exit_code=0,
        test_results=None,
        coverage=None
    )
    
    # Mock Runner result for tests
    test_result = ExecutionResult(
        status=ExecutionStatus.SUCCESS,
        stdout="passed",
        stderr="",
        exit_code=0,
        test_results=TestRunMetrics(passed=1, failed=0),
        coverage=None
    )
    mock_runner.execute.return_value = syntax_result
    mock_runner.run_tests.return_value = test_result
    
    phase = ExecutionPhase()
    g_code = GeneratedCode(code="def foo(): pass", explanation="foo", confidence=1.0)
    
    result = await phase.execute(g_code)
    
    # Verify LLM was called to generate tests
    mock_llm.generate.assert_called_once()
    
    # Verify runner was called
    assert mock_runner.run_tests.called
    
    assert result.status == ExecutionStatus.SUCCESS

