"""
Tests for Generation Phase.
"""

from unittest.mock import AsyncMock, patch

import pytest

from src.core.phases.generation import GenerationPhase


@pytest.fixture
def mock_dependencies():
    with patch("src.core.phases.generation.HuggingFaceLLM") as MockLLM:
        mock_instance = MockLLM.return_value
        mock_instance.generate_json = AsyncMock()
        yield mock_instance


@pytest.mark.asyncio
async def test_generation_success(mock_dependencies):
    mock_llm = mock_dependencies
    
    # Mock successful JSON response
    mock_llm.generate_json.return_value = """
    {
        "code": "print('hello')",
        "explanation": "Simple print",
        "confidence": 0.95
    }
    """
    
    phase = GenerationPhase()
    result = await phase.execute("say hello", [])
    
    assert result.code == "print('hello')"
    assert result.confidence == 0.95


@pytest.mark.asyncio
async def test_generation_with_inner_markdown(mock_dependencies):
    """Test when 'code' field contains markdown blocks."""
    mock_llm = mock_dependencies
    
    mock_llm.generate_json.return_value = """
    {
        "code": "```python\\nprint('hello')\\n```",
        "explanation": "Markdown included",
        "confidence": 0.9
    }
    """
    
    phase = GenerationPhase()
    result = await phase.execute("say hello", [])
    
    assert result.code.strip() == "print('hello')"


@pytest.mark.asyncio
async def test_generation_fallback(mock_dependencies):
    """Test fallback when JSON is broken but code block exists."""
    mock_llm = mock_dependencies
    
    mock_llm.generate_json.return_value = """
    Here is the code:
    ```python
    def add(a, b):
        return a + b
    ```
    """
    
    phase = GenerationPhase()
    result = await phase.execute("add function", [])
    
    assert "def add" in result.code
    # Fallback returns confidence based on extraction method
    assert result.confidence <= 0.5

