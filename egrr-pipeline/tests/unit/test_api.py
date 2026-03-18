"""
Tests for API Endpoints.
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.domain.entities import GenerateResponse

client = TestClient(app)


@patch("src.api.routes.generate.orchestrator")
def test_generate_endpoint_success(mock_orchestrator):
    # Mock return value
    mock_response = GenerateResponse(
        code="print('success')",
        explanation="test explanation",
        iterations=2,
        status="success",
        coverage=1.0,
        tests_passed=1,
        tests_failed=0
    )
    mock_orchestrator.run = AsyncMock(return_value=mock_response)
    
    response = client.post("/api/generate", json={"query": "test query"})
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["code"] == "print('success')"
    assert data["iterations"] == 2


@patch("src.api.routes.generate.orchestrator")
def test_generate_endpoint_error(mock_orchestrator):
    # Mock failure
    mock_orchestrator.run = AsyncMock(side_effect=Exception("Pipeline crash"))
    
    response = client.post("/api/generate", json={"query": "crash"})
    
    assert response.status_code == 500
    assert "Pipeline crash" in response.json()["detail"]
