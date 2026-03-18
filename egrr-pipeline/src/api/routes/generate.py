"""
API Routes for Code Generation.
"""

from fastapi import APIRouter, HTTPException

from src.api.schemas.requests import GenerateRequest
from src.api.schemas.responses import GenerateResponse
from src.core.orchestrator import EGRROrchestrator

router = APIRouter()
orchestrator = EGRROrchestrator()


@router.post("/generate", response_model=GenerateResponse)
async def generate_code(request: GenerateRequest) -> GenerateResponse:
    """
    Generate Python code using the EGRR pipeline.
    """
    try:
        # Map request to orchestrator call
        response = await orchestrator.run(
            user_query=request.query,
            max_iterations=request.max_iterations
        )
        
        # Transform domain GenerateResponse to API GenerateResponse if needed
        # Currently they are identical or compatible Pydantic models (via import refactor)
        return response
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
