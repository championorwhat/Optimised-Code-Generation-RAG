"""
Health check endpoints.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Liveness check - is the service running?"""
    return {"status": "healthy"}


@router.get("/ready")
async def readiness_check() -> dict[str, str]:
    """Readiness check - is the service ready to accept requests?"""
    # TODO: Check VectorDB connection, LLM availability
    return {"status": "ready"}
