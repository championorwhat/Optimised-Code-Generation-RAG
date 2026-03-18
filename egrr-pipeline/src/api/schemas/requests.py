"""
Request schemas for API endpoints.
"""

from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    """Request model for code generation."""

    query: str = Field(..., description="The coding task/problem to solve")
    language: str = Field(default="python", description="Target programming language")
    max_iterations: int = Field(default=5, ge=1, le=10, description="Maximum iterations")
    use_rag: bool = Field(default=True, description="Whether to use retrieval augmentation")


class AnalyzeRequest(BaseModel):
    """Request model for code analysis/review."""

    code: str = Field(..., description="Code to analyze")
    language: str = Field(default="python", description="Programming language of the code")
