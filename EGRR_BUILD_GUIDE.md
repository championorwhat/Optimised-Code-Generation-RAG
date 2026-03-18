# EGRR Pipeline - Complete Build Guide

## Executive Summary
Build an **Execution-Grounded Retrieval Refinement (EGRR)** system: an iterative RAG pipeline that uses code execution feedback to refine retrieval queries and improve generated code.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         EGRR Pipeline                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │  Phase 1 │───▶│  Phase 2 │───▶│  Phase 3 │                  │
│  │ RETRIEVE │    │ GENERATE │    │ EXECUTE  │                  │
│  └──────────┘    └──────────┘    └────┬─────┘                  │
│       ▲                               │                         │
│       │                               ▼                         │
│  ┌────┴─────┐    ┌──────────┐    ┌──────────┐                  │
│  │  Phase 4 │◀───│  Phase 6 │◀───│  Phase 5 │                  │
│  │RE-RETRIEVE│   │ DECISION │    │  REVIEW  │                  │
│  └──────────┘    └──────────┘    └──────────┘                  │
│                       │                                         │
│                       ▼                                         │
│              [TERMINATE or CONTINUE]                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Language | Python 3.11+ |
| Framework | FastAPI |
| Package Manager | Poetry |
| LLM | HuggingFace Inference API |
| Vector DB | FAISS + sentence-transformers |
| Sandbox | subprocess + coverage.py + pytest |
| Validation | Pydantic v2 |
| Linting | Ruff, Black, MyPy |
| Testing | Pytest, pytest-asyncio |

---

# DETAILED BUILD STEPS

---

## PHASE 1: PROJECT FOUNDATION

### Step 1: Project Structure & Architecture Design

**Goal:** Create the folder structure and Poetry configuration.

**Actions:**
1. Create `egrr-pipeline/` directory
2. Initialize Poetry project with `pyproject.toml`
3. Create all subdirectories:
   - `src/api/routes/`, `src/api/schemas/`, `src/api/middleware/`
   - `src/core/phases/`
   - `src/domain/`
   - `src/infrastructure/llm/prompts/`, `src/infrastructure/vectordb/`, `src/infrastructure/sandbox/`
   - `src/config/`
   - `tests/unit/`, `tests/integration/`
   - `corpus/security/`, `corpus/error_handling/`, `corpus/validation/`, `corpus/algorithms/`, `corpus/testing_patterns/`
4. Create `__init__.py` in all Python packages
5. Create `.env.example` with template variables
6. Create `.gitignore` for Python projects
7. Move old code to `legacy/` folder

**Files Created:**
- `pyproject.toml` - Dependencies and project config
- `src/main.py` - FastAPI app skeleton
- `src/config/settings.py` - Pydantic settings loader
- `.env.example` - Environment template

---

### Step 2: Development Environment & Tooling Setup

**Goal:** Configure linting, formatting, and testing tools.

**Actions:**
1. Add dev dependencies to `pyproject.toml`:
   - `ruff` - Fast linter
   - `black` - Code formatter
   - `mypy` - Type checker
   - `pytest`, `pytest-asyncio`, `pytest-cov`
2. Create `ruff.toml` configuration
3. Create `mypy.ini` configuration
4. Create `.pre-commit-config.yaml` for git hooks
5. Run `poetry install` to set up environment

**Verification:**
```bash
poetry run ruff check src/
poetry run black --check src/
poetry run mypy src/
```

---

### Step 3: Core Domain Models & Data Structures

**Goal:** Define all Pydantic models matching the EGRR JSON schemas.

**Actions:**
1. Create `src/domain/entities.py`:
   - `PipelineState` - Tracks iteration state
   - `RetrievalQuery` - Query with rationale
   - `GeneratedCode` - Code with metadata
   - `ExecutionResult` - stdout, stderr, coverage, tests
   - `ReviewFinding` - Evidence-cited finding
   - `DecisionResult` - Continue/terminate decision

2. Create `src/api/schemas/requests.py`:
   - `GenerateRequest` - User input model
   - `AnalyzeRequest` - Code review input

3. Create `src/api/schemas/responses.py`:
   - `GenerateResponse` - Final output
   - `PhaseUpdate` - Streaming update

**Key Models (from your spec):**
```python
class ExecutionResult(BaseModel):
    status: Literal["success", "error", "warning"]
    stdout: str
    stderr: str
    exit_code: int
    coverage: CoverageResult
    test_results: TestResults

class ReviewFinding(BaseModel):
    status: Literal["pass", "warn", "fail"]
    evidence: list[str]
    findings: list[str]
```

---

## PHASE 2: INFRASTRUCTURE LAYER

### Step 4: VectorDB & Persistence Layer

**Goal:** Set up FAISS for storing and searching code patterns.

**Actions:**
1. Create `src/infrastructure/vectordb/indexer.py`:
   - `CodeCorpusIndexer` class
   - Method: `build_index(corpus_path: str)` - Scan corpus, embed, store
   - Method: `add_document(doc: CodeExample)` - Add single doc
   - Save index to `corpus/faiss_index.bin`

2. Create `src/infrastructure/vectordb/retriever.py`:
   - `CodeRetriever` class
   - Method: `search(query: str, top_k: int = 5) -> list[CodeExample]`
   - Load index on startup

3. Create `src/infrastructure/vectordb/embedder.py`:
   - Use `sentence-transformers/all-MiniLM-L6-v2`
   - Method: `embed(text: str) -> np.ndarray`

**Dependencies:**
```toml
faiss-cpu = "^1.7"
sentence-transformers = "^2.2"
```

---

### Step 5: LLM Client (HuggingFace)

**Goal:** Create wrapper for HuggingFace Inference API.

**Actions:**
1. Create `src/infrastructure/llm/client.py`:
   - `HuggingFaceLLM` class
   - Method: `generate(prompt: str, max_tokens: int = 2000) -> str`
   - Include retry logic, timeout handling
   - Support for `meta-llama/Llama-3.1-8B-Instruct`

2. Create `src/infrastructure/llm/prompts/system_prompt.md`:
   - Store your full EGRR system prompt
   - Load dynamically

3. Create `src/infrastructure/llm/prompt_builder.py`:
   - Method: `build_retrieval_prompt(user_query, iteration)` - Phase 1
   - Method: `build_generation_prompt(query, context)` - Phase 2
   - Method: `build_reretrieval_prompt(execution_result)` - Phase 4
   - Method: `build_review_prompt(code, execution)` - Phase 5

**Dependencies:**
```toml
huggingface-hub = "^0.20"
```

---

### Step 6: Code Execution Sandbox

**Goal:** Secure Python code execution with metrics capture.

**Actions:**
1. Create `src/infrastructure/sandbox/runner.py`:
   - `SandboxRunner` class
   - Method: `execute(code: str, timeout: int = 30) -> ExecutionResult`
   - Use `subprocess.run()` with timeout
   - Capture stdout, stderr, exit_code

2. Create `src/infrastructure/sandbox/coverage_runner.py`:
   - Wrap code execution with `coverage.py`
   - Parse coverage report to get line/branch coverage
   - Return `CoverageResult` model

3. Create `src/infrastructure/sandbox/test_runner.py`:
   - Generate test file from code
   - Run with `pytest --tb=short -q`
   - Parse results to get passed/failed counts

**Security Measures:**
- Timeout enforcement (30s default)
- Memory limit via resource module
- No network access (future: Docker isolation)

---

## PHASE 3: CORE BUSINESS LOGIC

### Step 7: Retrieval Engine (Phase 1 & 4)

**Goal:** Implement intent-based and execution-grounded retrieval.

**Actions:**
1. Create `src/core/phases/retrieval.py`:
   - `RetrievalPhase` class
   - Method: `execute_intent_based(user_query: str) -> list[RetrievalQuery]`
     - Parse user intent
     - Generate 3-5 search queries
   - Method: `execute_execution_grounded(execution_result: ExecutionResult) -> list[RetrievalQuery]`
     - Extract error patterns
     - Generate targeted fix queries

2. Query formulation strategies:
   - Error-driven: `{error_type} handling patterns python`
   - Coverage-driven: `edge case handling {uncovered_scenario}`
   - Test-failure-driven: `{test_name} fix patterns`

---

### Step 8: Code Generation Engine (Phase 2)

**Goal:** Generate code using LLM with retrieved context.

**Actions:**
1. Create `src/core/phases/generation.py`:
   - `GenerationPhase` class
   - Method: `execute(query: str, context: list[CodeExample], iteration: int) -> GeneratedCode`
     - Build prompt with user query + retrieved patterns
     - Call LLM
     - Parse response to extract code block
     - Return `GeneratedCode` with metadata

2. For repair (iteration 2+):
   - Method: `execute_repair(previous_code: str, review: Review, new_context: list[CodeExample]) -> GeneratedCode`
     - Include previous code + issues
     - Apply targeted fixes

---

### Step 9: Execution Engine (Phase 3)

**Goal:** Execute code and capture comprehensive feedback.

**Actions:**
1. Create `src/core/phases/execution.py`:
   - `ExecutionPhase` class
   - Method: `execute(code: str) -> ExecutionResult`
     - Save code to temp file
     - Run in sandbox
     - Run tests
     - Collect coverage
     - Return structured result

2. Result structure matches your spec:
```python
{
    "status": "error",
    "stdout": "",
    "stderr": "FileNotFoundError: ...",
    "exit_code": 1,
    "coverage": {"line_coverage": 0.0, ...},
    "test_results": {"passed": 0, "failed": 1, ...}
}
```

---

### Step 10: Review Engine (Phase 5)

**Goal:** Evidence-based code evaluation.

**Actions:**
1. Create `src/core/phases/review.py`:
   - `ReviewPhase` class
   - Method: `execute(code: str, execution: ExecutionResult) -> Review`
     - Evaluate correctness (tests passed?)
     - Evaluate security (vulnerabilities?)
     - Evaluate robustness (coverage?)
     - Cite evidence for each finding

2. Evidence citation format:
```
Finding: Path traversal vulnerability
Evidence: execution_results.test_results.failures[0]: "test_path_traversal: FAILED"
Impact: Security risk
```

---

### Step 11: Decision Engine (Phase 6)

**Goal:** Decide whether to continue or terminate.

**Actions:**
1. Create `src/core/phases/decision.py`:
   - `DecisionPhase` class
   - Method: `execute(review: Review, iteration: int, max_iterations: int) -> DecisionResult`
     - Check for critical issues
     - Check iteration count
     - Return `continue`, `terminate_success`, or `terminate_max_iterations`

2. Decision rules:
   - CONTINUE if: critical issues AND iterations < max
   - TERMINATE_SUCCESS if: no critical issues AND coverage > 85%
   - TERMINATE_MAX_ITERATIONS if: iterations >= max

---

## PHASE 4: PIPELINE ORCHESTRATION

### Step 12: Main Pipeline Coordinator

**Goal:** Wire all phases into the iterative loop.

**Actions:**
1. Create `src/core/orchestrator.py`:
   - `EGRROrchestrator` class
   - Method: `run(user_query: str, max_iterations: int = 5) -> GenerateResponse`
   - Implement the loop:
     ```
     for iteration in range(1, max_iterations + 1):
         1. Retrieval (intent-based if iter==1, else execution-grounded)
         2. Generation (or repair if iter > 1)
         3. Execution
         4. Re-Retrieval (if errors)
         5. Review
         6. Decision → break if terminate
     ```

2. Create `src/core/state.py`:
   - `PipelineState` class
   - Track: iteration, phase, previous_code, execution_history, retrieval_history

---

## PHASE 5: API LAYER

### Step 14: FastAPI Application

**Goal:** Create REST API endpoints.

**Actions:**
1. Update `src/main.py`:
   - Initialize FastAPI app
   - Add CORS middleware
   - Add logging middleware
   - Mount routers

2. Create `src/api/routes/generate.py`:
   - `POST /generate` - Main code generation endpoint
   - Accept `GenerateRequest`
   - Return `GenerateResponse`

3. Create `src/api/routes/health.py`:
   - `GET /health` - Liveness check
   - `GET /ready` - Readiness check

4. Create `src/api/routes/analyze.py`:
   - `POST /analyze` - Code review without generation

---

## PHASE 6: CORPUS

### Step 24: 100 Hand-Curated Code Examples

**Goal:** Create initial knowledge base.

**Categories (20 each):**

1. **Security (20 examples)**
   - Path traversal prevention (5)
   - SQL injection prevention (5)
   - XSS prevention (3)
   - Input validation (7)

2. **Error Handling (20 examples)**
   - File operations (5)
   - Network requests (5)
   - Data parsing (5)
   - Resource cleanup (5)

3. **Validation (20 examples)**
   - Email validation (3)
   - URL validation (3)
   - File type validation (5)
   - Schema validation (9)

4. **Algorithms (20 examples)**
   - List boundary checks (5)
   - Dictionary key checks (5)
   - String null handling (5)
   - Number overflow/division (5)

5. **Testing Patterns (20 examples)**
   - Edge case tests (5)
   - Exception tests (5)
   - Mock patterns (5)
   - Integration tests (5)

**Corpus file format:**
```json
{
  "id": "security_001",
  "pattern_type": "security",
  "vulnerability": "Path Traversal",
  "broken_code": "open(user_path)",
  "error_signature": "FileNotFoundError|path traversal",
  "fixed_code": "safe_path = base_dir / Path(user_path).name",
  "explanation": "Use pathlib to prevent directory escape",
  "tags": ["security", "file", "path"],
  "language": "python"
}
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Code passes all tests | ✓ |
| Coverage > 85% | ✓ |
| No critical security issues | ✓ |
| Converges in ≤ 3 iterations (average) | ✓ |

---

## Getting Started (After Build)

```bash
# Install dependencies
cd egrr-pipeline
poetry install

# Set environment variables
cp .env.example .env
# Edit .env with your HF_API_KEY

# Build corpus index
poetry run python -m src.infrastructure.vectordb.indexer

# Run the server
poetry run uvicorn src.main:app --reload

# Test the pipeline
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"query": "Create a function to validate email addresses"}'
```
