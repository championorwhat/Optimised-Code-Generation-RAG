"""
Response schemas for API endpoints.
"""

from typing import Literal

from pydantic import BaseModel, Field


from src.domain.entities import GenerateResponse


class PhaseUpdate(BaseModel):
    """Streaming update for pipeline phases."""

    phase: str = Field(..., description="Current phase name")
    iteration: int = Field(..., description="Current iteration number")
    message: str = Field(..., description="Status message")
    progress: float = Field(default=0.0, ge=0.0, le=1.0, description="Progress 0-1")
