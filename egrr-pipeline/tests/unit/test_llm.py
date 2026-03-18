"""
Tests for LLM Client and Prompt Builder.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.infrastructure.llm.prompt_builder import PromptBuilder


def test_prompt_builder():
    """Test generating prompts for different phases."""
    builder = PromptBuilder()
    
    # Phase 1 - Retrieval
    p1 = builder.build_retrieval_prompt("test query", 1)
    assert isinstance(p1, list)
    assert len(p1) == 2
    assert p1[0]["role"] == "system"
    assert p1[1]["role"] == "user"
    # The prompt content should mention retrieval
    p1_content = " ".join([m["content"] for m in p1])
    assert "retrieval" in p1_content.lower() or "query" in p1_content.lower()
    
    # Phase 2 - Generation (empty context)
    p2 = builder.build_generation_prompt("test query", [])
    assert isinstance(p2, list)
    # The prompt content should mention generation or code
    p2_content = " ".join([m["content"] for m in p2])
    assert "code" in p2_content.lower() or "generate" in p2_content.lower()


@pytest.mark.asyncio
async def test_llm_client_generate():
    """Test LLM generation with mock httpx."""
    with patch("src.infrastructure.llm.client.httpx.AsyncClient") as MockClient:
        # Setup mock response
        mock_response = MagicMock()
        mock_response.json.return_value = {"response": "generated text"}
        mock_response.raise_for_status = MagicMock()
        
        mock_client_instance = AsyncMock()
        mock_client_instance.post.return_value = mock_response
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.__aexit__.return_value = None
        MockClient.return_value = mock_client_instance
        
        from src.infrastructure.llm.client import HuggingFaceLLM
        
        client = HuggingFaceLLM()
        response = await client.generate("hello")
        
        assert response == "generated text"
        mock_client_instance.post.assert_called_once()
