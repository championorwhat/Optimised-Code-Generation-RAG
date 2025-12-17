from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

from pipeline.rag_pipeline import RAGPipeline

app = FastAPI(
    title="RAG-Based Code Generation API",
    description="Retrieval-Augmented Code Generation using LLMs",
    version="1.0.0"
)

# Initialize pipeline once (important for performance)
rag_pipeline = RAGPipeline()


# -----------------------------
# Request Schema
# -----------------------------
class GenerateRequest(BaseModel):
    task: str
    language: Optional[str] = "Python"
    use_rag: Optional[bool] = True


# -----------------------------
# Response Schema
# -----------------------------
class GenerateResponse(BaseModel):
    code: str
    explanation: str
    use_rag: bool
    intent: str


# -----------------------------
# Health Check
# -----------------------------
@app.get("/health")
def health_check():
    return {"status": "ok"}


# -----------------------------
# Code Generation Endpoint
# -----------------------------
@app.post("/generate", response_model=GenerateResponse)
def generate_code(request: GenerateRequest):
    output = rag_pipeline.run(
        user_task=request.task,
        language=request.language,
        use_rag=request.use_rag
    )

    return GenerateResponse(
        code=output["code"],
        explanation=output["explanation"],
        use_rag=output["use_rag"],
        intent=output["intent"]
    )
@app.get("/")
def root():
    return {
        "message": "RAG-Based Code Generation API",
        "docs": "/docs",
        "health": "/health"
    }
