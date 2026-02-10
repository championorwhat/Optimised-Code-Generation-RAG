"""
EGRR Pipeline - FastAPI Application Entry Point.

This module initializes the FastAPI application with all routes and middleware.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import RedirectResponse
from src.api.routes import generate, health, stream
from src.config.settings import get_settings

settings = get_settings()

app = FastAPI(
    title="EGRR Pipeline",
    description="Execution-Grounded Retrieval Refinement for Code Generation",
    version="0.1.0",
)


@app.get("/", include_in_schema=False)
async def root():
    """Redirect to API documentation."""
    return RedirectResponse(url="/docs")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(generate.router, prefix="/api", tags=["Generation"])
app.include_router(stream.router, prefix="/api", tags=["Streaming"])


@app.on_event("startup")
async def startup_event() -> None:
    """Initialize services on startup."""
    # TODO: Initialize vector DB, LLM client, etc.
    pass


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Cleanup on shutdown."""
    pass
