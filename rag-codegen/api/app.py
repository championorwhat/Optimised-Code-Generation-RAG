from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, Dict, Any

from pipeline.rag_pipeline import RAGPipeline

from reviewer.testcases import get_test_cases
from reviewer.ai_testgen import AITestGenerator
from reviewer.executor import CodeExecutor
from reviewer.validator import CodeValidator
from reviewer.utils import extract_function_name
from reviewer.sanitizer import sanitize_python_code, CodeSanitizationError
from reviewer.oracles.registry import get_oracle

app = FastAPI(
    title="RAG-Based Code Generation & Review API",
    description="Retrieval-Augmented Code Generation with Automated Code Review",
    version="2.0.0"
)

# -----------------------------
# Initialize Core Components
# -----------------------------
rag_pipeline = RAGPipeline()
executor = CodeExecutor()
validator = CodeValidator()
ai_testgen = AITestGenerator()

# -----------------------------
# Request Schemas
# -----------------------------
class GenerateRequest(BaseModel):
    task: str
    language: Optional[str] = "Python"
    use_rag: Optional[bool] = True


class GenerateAndReviewRequest(BaseModel):
    task: str
    language: Optional[str] = "Python"
    use_rag: Optional[bool] = True


# -----------------------------
# Response Schemas
# -----------------------------
class GenerateResponse(BaseModel):
    code: str
    explanation: str
    use_rag: bool
    intent: str


class GenerateAndReviewResponse(BaseModel):
    code: str
    explanation: str
    intent: str
    review: Dict[str, Any]


# -----------------------------
# Health Check
# -----------------------------
@app.get("/health")
def health_check():
    return {"status": "ok"}


# -----------------------------
# Root
# -----------------------------
@app.get("/")
def root():
    return {
        "message": "RAG-Based Code Generation & Review API",
        "docs": "/docs",
        "health": "/health"
    }


# -----------------------------
# Code Generation Only
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


# -----------------------------
# Code Generation + Review
# -----------------------------
@app.post("/generate-and-review", response_model=GenerateAndReviewResponse)
def generate_and_review(request: GenerateAndReviewRequest):

    # 1. Generate code
    output = rag_pipeline.run(
        user_task=request.task,
        language=request.language,
        use_rag=request.use_rag
    )

    raw_code = output["code"]

    try:
        code = sanitize_python_code(raw_code)
    except CodeSanitizationError as e:
        return GenerateAndReviewResponse(
            code=raw_code,
            explanation=output["explanation"],
            intent=output["intent"],
            review={
                "status": "FAIL",
                "reason": str(e),
                "results": [],
            },
        )

    intent = output["intent"]
    explanation = output["explanation"]

    function_name = output.get("function_name") or extract_function_name(code)

    # 2. Canonical tests
    canonical_tests = get_test_cases(intent)

    if not canonical_tests:
        return GenerateAndReviewResponse(
            code=code,
            explanation=explanation,
            intent=intent,
            review={
                "status": "NO_CANONICAL_TESTS",
                "message": f"No oracle available for intent '{intent}'",
                "confidence": {
                    "confidence_score": 60,
                    "confidence_level": "LOW",
                    "reasons": ["No canonical tests for this intent"]
                },
                "results": []
            }
        )



    # 3. Apply oracle (THIS TIME IT WILL STICK)
    oracle = get_oracle(intent)
    if oracle:
        for tc in canonical_tests:
            tc["expected"] = oracle.expected(**tc.get("input", {}))

    # 4. Execute ONLY canonical tests
    canonical_results = executor.run_tests(
        code=code,
        function_name=function_name,
        test_cases=canonical_tests
    )

    # 5. Validate ONLY canonical results
    review_report = validator.validate(
        execution_results=canonical_results,
        test_cases=canonical_tests
    )

    return GenerateAndReviewResponse(
        code=code,
        explanation=explanation,
        intent=intent,
        review=review_report
    )
