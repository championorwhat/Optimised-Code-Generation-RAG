# Optimised Code Generation with RAG — Full Project Documentation

> **Project:** Execution-Grounded Retrieval Refinement (EGRR) Pipeline  
> **Version:** 0.1.0  
> **Last Updated:** February 19, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Repository Structure](#4-repository-structure)
5. [Backend — EGRR Pipeline](#5-backend--egrr-pipeline)
   - [5.1 Configuration & Settings](#51-configuration--settings)
   - [5.2 Domain Layer](#52-domain-layer)
   - [5.3 Core Pipeline Phases](#53-core-pipeline-phases)
   - [5.4 Infrastructure Layer](#54-infrastructure-layer)
   - [5.5 API Layer](#55-api-layer)
   - [5.6 Corpus & Knowledge Base](#56-corpus--knowledge-base)
6. [Frontend — Code Generation Platform](#6-frontend--code-generation-platform)
   - [6.1 Application Structure](#61-application-structure)
   - [6.2 UI Components](#62-ui-components)
   - [6.3 Services & State Management](#63-services--state-management)
7. [API Reference](#7-api-reference)
8. [Data Models & Schemas](#8-data-models--schemas)
9. [Pipeline Execution Flow](#9-pipeline-execution-flow)
10. [Testing](#10-testing)
11. [Setup & Installation](#11-setup--installation)
12. [Environment Variables](#12-environment-variables)
13. [Legacy Code](#13-legacy-code)

---

## 1. Project Overview

The **Optimised Code Generation with RAG** project implements an **Execution-Grounded Retrieval Refinement (EGRR)** system — an iterative, multi-phase pipeline that combines **Retrieval-Augmented Generation (RAG)** with **automated code execution feedback** to produce high-quality, tested, and optimized Python code.

### Key Innovation

Unlike traditional single-pass code generation, EGRR uses a closed-loop pipeline:

1. **Retrieves** relevant code patterns from a curated vector database
2. **Generates** code using an LLM with retrieved context
3. **Executes** the generated code in a sandboxed environment
4. **Reviews** the code based on execution evidence (test results, coverage, errors)
5. **Decides** whether to iterate (fix/optimize) or terminate
6. **Repeats** if needed — using execution errors to guide targeted re-retrieval

This execution-grounded approach means the system doesn't just *generate* code — it *validates and iteratively improves* it until quality thresholds are met.

### Success Metrics

| Metric | Target |
|--------|--------|
| Code passes all generated tests | ✓ |
| Line coverage > 85% | ✓ |
| No critical security issues | ✓ |
| Converges in ≤ 3 iterations (average) | ✓ |

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          EGRR Pipeline                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐             │
│  │   Phase 1    │──▶│   Phase 2    │──▶│   Phase 3    │             │
│  │  RETRIEVAL   │   │  GENERATION  │   │  EXECUTION   │             │
│  └──────────────┘   └──────────────┘   └──────┬───────┘             │
│        ▲                                      │                      │
│        │                                      ▼                      │
│  ┌─────┴────────┐   ┌──────────────┐   ┌──────────────┐             │
│  │   Phase 4    │◀──│   Phase 6    │◀──│   Phase 5    │             │
│  │ RE-RETRIEVAL │   │   DECISION   │   │   REVIEW     │             │
│  └──────────────┘   └──────┬───────┘   └──────────────┘             │
│                            │                                         │
│                            ▼                                         │
│                 [TERMINATE or CONTINUE]                               │
└──────────────────────────────────────────────────────────────────────┘
          ▲                                          │
          │         REST API (FastAPI)               │
          │                                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│               Frontend (Next.js) — CodeGen Platform                  │
│  ┌────────────┐ ┌──────────────┐ ┌───────────────┐ ┌────────────┐  │
│  │ Dashboard  │ │ EGRR Page    │ │ Pipeline Viz  │ │ Code Editor│  │
│  │            │ │ (SSE Stream) │ │ (Timeline)    │ │ (Monaco)   │  │
│  └────────────┘ └──────────────┘ └───────────────┘ └────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Architecture (Layered)

```
┌─────────────────────────────────────────┐
│            API Layer (FastAPI)           │  ← Routes, Schemas, Middleware
├─────────────────────────────────────────┤
│         Core Business Logic             │  ← Orchestrator, Phases
├─────────────────────────────────────────┤
│           Domain Layer                  │  ← Entities, Value Objects
├─────────────────────────────────────────┤
│        Infrastructure Layer             │  ← LLM Client, VectorDB, Sandbox
└─────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Backend (`egrr-pipeline`)

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Python | 3.10+ |
| Web Framework | FastAPI | ^0.115.0 |
| ASGI Server | Uvicorn | ^0.34.0 |
| Package Manager | Poetry | — |
| Data Validation | Pydantic v2 | ^2.10.0 |
| Settings Management | pydantic-settings | ^2.7.0 |
| HTTP Client | httpx | ^0.28.0 |
| LLM Runtime | Ollama (local) | — |
| LLM Model | deepseek-coder:6.7b-instruct | — |
| Vector Database | FAISS (faiss-cpu) | ^1.9.0 |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) | ^2.2.0 |
| Numerical | NumPy | ^1.26.0 |
| Environment | python-dotenv | ^1.0.0 |
| SSE Streaming | sse-starlette | — |
| Sandbox | subprocess + coverage.py + pytest | — |
| Linting | Ruff | ^0.9.0 |
| Formatting | Black | ^24.0.0 |
| Type Checking | MyPy | ^1.14.0 |
| Testing | Pytest + pytest-asyncio + pytest-cov | — |

### Frontend (`code-generation-platform`)

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 16.0.8 |
| Language | TypeScript | ^5 |
| UI Library | React | 19.2.1 |
| Styling | Tailwind CSS | ^4 |
| Code Editor | Monaco Editor (@monaco-editor/react) | ^4.7.0 |
| HTTP Client | Axios | ^1.13.2 |
| State Management | Zustand | ^5.0.9 |
| Icons | Lucide React | ^0.560.0 |
| Date Formatting | date-fns | ^4.1.0 |
| Utility | clsx | ^2.1.1 |
| Linting | ESLint (eslint-config-next) | ^9 |

---

## 4. Repository Structure

```
Optimised-Code-Generation-RAG/
├── egrr-pipeline/                 # Backend — Python/FastAPI
│   ├── src/
│   │   ├── api/                   # API Layer
│   │   │   ├── routes/            # Endpoint handlers
│   │   │   │   ├── generate.py    # POST /api/generate
│   │   │   │   ├── health.py      # GET /api/health, /api/ready
│   │   │   │   └── stream.py      # POST /api/generate/stream (SSE)
│   │   │   ├── schemas/           # Request/Response models
│   │   │   │   ├── requests.py    # GenerateRequest, AnalyzeRequest
│   │   │   │   └── responses.py   # GenerateResponse, PhaseUpdate
│   │   │   └── middleware/        # (Reserved for future middleware)
│   │   ├── core/                  # Business Logic
│   │   │   ├── orchestrator.py    # EGRROrchestrator — main pipeline loop
│   │   │   └── phases/            # Individual pipeline phases
│   │   │       ├── retrieval.py   # Phase 1 & 4: Query + vector search
│   │   │       ├── generation.py  # Phase 2: LLM code synthesis
│   │   │       ├── execution.py   # Phase 3: Sandbox execution
│   │   │       ├── review.py      # Phase 5: Evidence-based review
│   │   │       └── decision.py    # Phase 6: Continue/terminate logic
│   │   ├── domain/                # Domain Models
│   │   │   ├── entities.py        # Pydantic models (15+ models)
│   │   │   └── value_objects.py   # Enumerations (5 enums)
│   │   ├── infrastructure/        # External Services
│   │   │   ├── llm/
│   │   │   │   ├── client.py      # HuggingFaceLLM (Ollama wrapper)
│   │   │   │   ├── prompt_builder.py  # Context-aware prompt templates
│   │   │   │   └── prompts/       # System prompt files
│   │   │   ├── vectordb/
│   │   │   │   ├── indexer.py     # CodeCorpusIndexer (FAISS)
│   │   │   │   ├── retriever.py   # CodeRetriever (semantic search)
│   │   │   │   └── embedder.py    # Sentence-transformer embeddings
│   │   │   └── sandbox/
│   │   │       └── runner.py      # SandboxRunner (code execution)
│   │   ├── config/
│   │   │   └── settings.py        # Pydantic Settings (env-based)
│   │   ├── utils/
│   │   │   └── logger.py          # Structured logging
│   │   └── main.py                # FastAPI app entry point
│   ├── corpus/                    # Knowledge Base
│   │   ├── algorithms/            # Algorithm patterns (8 files)
│   │   ├── error_handling/        # Error handling patterns (5 files)
│   │   ├── security/              # Security patterns (5 files)
│   │   ├── testing_patterns/      # Testing patterns (5 files)
│   │   ├── validation/            # Validation patterns (6 files)
│   │   ├── faiss_index.bin        # Pre-built FAISS index
│   │   └── metadata.pkl           # Serialized document metadata
│   ├── tests/
│   │   ├── unit/                  # 10 unit test files
│   │   │   ├── test_api.py
│   │   │   ├── test_decision.py
│   │   │   ├── test_execution.py
│   │   │   ├── test_generation.py
│   │   │   ├── test_llm.py
│   │   │   ├── test_orchestrator.py
│   │   │   ├── test_retrieval.py
│   │   │   ├── test_review.py
│   │   │   ├── test_sandbox.py
│   │   │   └── test_vectordb.py
│   │   └── integration/           # Integration tests
│   ├── pyproject.toml             # Poetry project config
│   ├── poetry.lock                # Locked dependencies
│   ├── ruff.toml                  # Ruff linter configuration
│   ├── benchmark.py               # Performance benchmarking
│   └── .pre-commit-config.yaml    # Git hooks
│
├── code-generation-platform/      # Frontend — Next.js/TypeScript
│   ├── src/
│   │   ├── app/                   # Next.js App Router pages
│   │   │   ├── page.tsx           # Root (redirects to /dashboard)
│   │   │   ├── layout.tsx         # Root layout + metadata
│   │   │   ├── dashboard/         # Dashboard page
│   │   │   ├── egrr/              # EGRR pipeline page
│   │   │   ├── runs/              # Pipeline run history
│   │   │   ├── error.tsx          # Error boundary
│   │   │   ├── not-found.tsx      # 404 page
│   │   │   └── globals.css        # Global styles
│   │   ├── components/
│   │   │   ├── common/            # Reusable UI components
│   │   │   │   ├── Alert.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   ├── Skeleton.tsx
│   │   │   │   └── Tabs.tsx
│   │   │   ├── pipeline/          # Pipeline-specific components
│   │   │   │   ├── IterationCodeViewer.tsx    # Per-iteration code display
│   │   │   │   ├── IterationTimeline.tsx      # Visual iteration timeline
│   │   │   │   ├── LivePhaseTracker.tsx       # Real-time phase tracking
│   │   │   │   └── PipelineResult.tsx         # Final result display
│   │   │   ├── models/            # Model-related components
│   │   │   ├── shared/            # Shared components
│   │   │   └── testing/           # Testing components
│   │   ├── services/              # API integration layer
│   │   │   ├── api.ts             # Base API client
│   │   │   ├── egrr.ts            # EGRR pipeline API service
│   │   │   ├── dashboard.ts       # Dashboard data service
│   │   │   ├── models.ts          # Model management service
│   │   │   ├── runs.ts            # Run history service
│   │   │   └── tests.ts           # Test result service
│   │   ├── store/                 # Zustand state stores
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── styles/                # Additional styles
│   │   └── types/                 # TypeScript type definitions
│   ├── package.json               # NPM dependencies
│   └── tsconfig.json              # TypeScript config
│
├── legacy/                        # Archived old implementations
│   ├── code-generation-platform(Model)/  # Old model-centric frontend
│   └── rag-codegen/               # Original RAG codegen backend
│
├── DOCUMENTATION.md               # ← This file
├── EGRR_BUILD_GUIDE.md            # Step-by-step build instructions
├── research_analysis.md           # Research methodology & analysis
├── advanced_research_analysis.md  # Extended research findings
├── novelty.docx                   # Novelty statement document
└── LICENSE                        # MIT License
```

---

## 5. Backend — EGRR Pipeline

The backend is a Python FastAPI application organized using **Clean Architecture** principles with four distinct layers: API, Core, Domain, and Infrastructure.

### 5.1 Configuration & Settings

**File:** `src/config/settings.py`

Configuration is managed through Pydantic Settings, which loads values from environment variables and `.env` files with type validation.

| Setting | Default | Description |
|---------|---------|-------------|
| `ollama_base_url` | `http://localhost:11434` | Ollama server URL |
| `llm_model_id` | `deepseek-coder:6.7b-instruct` | LLM model identifier |
| `llm_max_tokens` | `1000` | Maximum generation tokens |
| `llm_temperature` | `0.1` | Low temperature for deterministic output |
| `llm_seed` | `42` | Seed for reproducibility |
| `max_iterations` | `5` | Maximum pipeline iterations |
| `execution_timeout` | `30` | Code execution timeout (seconds) |
| `embedding_model` | `sentence-transformers/all-MiniLM-L6-v2` | Embedding model |
| `host` | `0.0.0.0` | Server host |
| `port` | `8000` | Server port |

Settings are cached using `@lru_cache` for performance and can be cleared via `clear_settings_cache()`.

---

### 5.2 Domain Layer

The domain layer defines all business entities and enumerations used throughout the pipeline.

#### Value Objects (`src/domain/value_objects.py`)

Five enumeration types define the valid states in the system:

| Enum | Values | Purpose |
|------|--------|---------|
| `PipelinePhase` | `retrieval`, `generation`, `execution`, `re-retrieval`, `review`, `decision` | Tracks which phase is active |
| `ExecutionStatus` | `success`, `error`, `warning` | Sandbox execution result status |
| `ReviewStatus` | `pass`, `warn`, `fail` | Review aspect evaluation status |
| `DecisionType` | `continue`, `terminate_success`, `terminate_max_iterations` | Pipeline continuation decision |
| `ChangeType` | `fix`, `enhancement`, `security` | Classification of code repair changes |

#### Core Entities (`src/domain/entities.py`)

15+ Pydantic v2 models organized by pipeline phase:

**Retrieval Phase (1 & 4):**
- **`RetrievalQuery`** — Search query with `query`, `rationale`, `expected_content`, `evidence` (for Phase 4), and `priority` (high/medium/low)
- **`CodeExample`** — Retrieved code pattern with `id`, `code`, `language`, `explanation`, `tags`, and `similarity_score`

**Generation Phase (2):**
- **`GeneratedCode`** — Output with `code`, `explanation`, `assumptions`, `retrieved_patterns_used`, and `confidence` score (0–1)

**Execution Phase (3):**
- **`CoverageResult`** — Metrics: `line_coverage`, `branch_coverage`, `uncovered_lines`
- **`TestRunMetrics`** — Test stats: `passed`, `failed`, `failures` list, with computed `total` property
- **`ExecutionResult`** — Full result: `status`, `stdout`, `stderr`, `exit_code`, `runtime_trace`, `coverage`, `test_results`

**Review Phase (5):**
- **`ReviewAspect`** — Single dimension evaluation: `status`, `evidence` citations, `findings`
- **`Review`** — Multi-dimensional review: `correctness`, `security`, `robustness`, `performance`, `overall_quality_score`, `critical_issues`, `improvement_opportunities`, `optimization_score`, `optimization_gaps`

**Decision Phase (6):**
- **`RepairStrategy`** — Repair plan: `lines_to_modify`, `patterns_to_apply`, `validation_criteria`
- **`DecisionResult`** — Decision: `decision` type, `rationale`, `next_iteration_focus`, `repair_strategy`
- **`RepairChange`** — Change documentation: `line_range`, `change_type`, `description`, `retrieved_pattern_applied`, `addresses_evidence`

**Pipeline State:**
- **`PipelineState`** — Tracks full state: `run_id`, `user_query`, iteration counters, full history (`history_retrieval`, `history_code`, `history_execution`, `history_review`), and current context docs
- **`IterationDetail`** — Per-iteration metrics: `phase_results`, `retrieval_count`, `code_generated`, `execution_status`, `tests_passed/failed`, `coverage`, `critical_issues`, `decision`, `duration_ms`
- **`GenerateResponse`** — Final API response: `code`, `explanation`, `iterations`, `status`, coverage/test metrics, `iteration_details`, `total_duration_ms`, `retrieved_patterns`

---

### 5.3 Core Pipeline Phases

The core business logic is implemented as six distinct phase classes, all located in `src/core/phases/`.

#### Phase 1 — Retrieval (`retrieval.py`)

**Class:** `RetrievalPhase`

Handles retrieval of code patterns from the vector database knowledge base.

- **`execute_intent_based(user_query, iteration)`** — *Phase 1*: Generates 3–5 search queries based on user intent via LLM, then performs parallel vector search. Used on the first iteration.
- **`execute_execution_grounded(execution_result)`** — *Phase 4*: Generates targeted queries based on execution feedback (errors, coverage gaps). Uses error patterns, coverage gaps, and test failures to formulate specific fix queries.
- **`_parse_queries(json_text)`** — Robust JSON parser with markdown cleanup, handles both string and dict inputs.
- **`_retrieve_for_queries(queries)`** — Parallel async vector search across all queries with deduplication.

#### Phase 2 — Generation (`generation.py`)

**Class:** `GenerationPhase`

Handles code synthesis using LLM with retrieved context patterns. The largest and most complex phase.

- **`execute(user_query, context, iteration)`** — Initial code generation combining user query with retrieved patterns.
- **`execute_repair(user_query, previous_code, review, context)`** — Targeted fix generation with **strict intent preservation** — only fixes the specific error, does not add unrelated code.
- **`execute_optimization(previous_code, review, context)`** — Optimizes correct code for readability, type safety, validation, and performance. Includes **scope validation** to prevent task drift.
- **`_parse_generated_code(json_text)`** — Extremely robust JSON parser with multiple fallback strategies.

**Key helper functions (module-level):**
- `validate_python_syntax(code)` — AST-based syntax validation
- `sanitize_solution_code(code)` — Removes test imports, test functions, and pytest contamination from solution code
- `validate_optimization_scope(original, optimized)` — Ensures optimized code preserves function signatures and doesn't explode in size
- `fix_indentation_issues(code)` — Fixes common LLM indentation errors
- `clean_generated_code(code)` — Removes prompt/context leakage and validates syntax

#### Phase 3 — Execution (`execution.py`)

**Class:** `ExecutionPhase`

Executes generated code in a sandboxed environment with automated test generation.

- **`execute(generated_code)`** — Three-step strategy:
  1. Syntax check via standalone execution
  2. LLM-generated test suite creation
  3. Full sandbox execution with pytest + coverage
- **`_generate_tests(code)`** — Generates comprehensive pytest tests via LLM, with fallback to a default smoke-test template
- **`_clean_test_output(tests)`** — Strips markdown formatting from LLM test output
- **`_is_valid_test(tests)`** — Validates pytest structure (has `def test_*`, has `import`)

The default test template includes: module import test, function/class existence test, and basic invocation test.

#### Phase 5 — Review (`review.py`)

**Class:** `ReviewPhase`

Performs evidence-based code evaluation across four dimensions.

- **`execute(code, execution_result)`** — Evaluates code using LLM and execution evidence asynchronously
- **`_add_execution_based_issues(review, exec_result)`** — Adds critical issues based on actual execution results (test failures, runtime errors, low coverage)
- **`_parse_review(json_text)`** — Robust JSON parser with aggressive normalization for inconsistent LLM output

**Review dimensions:**
1. **Correctness** — Do tests pass? Are there runtime errors?
2. **Security** — Vulnerability detection (path traversal, injection, etc.)
3. **Robustness** — Edge case handling, coverage completeness
4. **Performance** — Algorithmic efficiency, resource usage

#### Phase 6 — Decision (`decision.py`)

**Class:** `DecisionPhase`

Decides whether to continue iterating or terminate the pipeline.

**Decision logic:**
1. **`TERMINATE_SUCCESS`** — Max iterations reached AND no critical issues
2. **`TERMINATE_MAX_ITERATIONS`** — Max iterations reached WITH remaining issues
3. **`CONTINUE` (repair)** — Critical issues found → generate repair strategy
4. **`CONTINUE` (optimize)** — No critical issues BUT optimization score < 0.95 → continue for refinement

Key behavior: The decision phase continues iterating for optimization even when correctness passes, only terminating at max iterations or when optimization converges.

- **`_generate_repair_strategy(review)`** — Uses LLM to generate a structured `RepairStrategy` with specific lines to modify, patterns to apply, and validation criteria.

---

#### Pipeline Orchestrator (`src/core/orchestrator.py`)

**Class:** `EGRROrchestrator`

The central coordinator that wires all six phases into the iterative pipeline loop.

- **`__init__()`** — Instantiates all phase classes: `RetrievalPhase`, `GenerationPhase`, `ExecutionPhase`, `ReviewPhase`, `DecisionPhase`
- **`run(user_query, max_iterations=5)`** — Runs the full EGRR loop with timing instrumentation:

```python
for iteration in range(1, max_iterations + 1):
    # Phase 1/4: Retrieval (intent-based if iter==1, else execution-grounded)
    # Phase 2: Generation (initial if iter==1, repair/optimize if iter > 1)
    # Phase 3: Execution (sandbox + tests + coverage)
    # Phase 5: Review (evidence-based evaluation)
    # Phase 6: Decision → break if TERMINATE_*
```

Returns a `GenerateResponse` with the final code, explanation, iteration count, status, detailed metrics, and full iteration history.

---

### 5.4 Infrastructure Layer

External service integrations, isolated from business logic.

#### LLM Client (`src/infrastructure/llm/client.py`)

**Class:** `HuggingFaceLLM`

> Named `HuggingFaceLLM` for backward compatibility; actually uses **Ollama** for local LLM inference.

- **`__init__()`** — Configures Ollama connection (`/api/generate` endpoint), verifies model availability
- **`_verify_connection()`** — Synchronous check that Ollama is running and the target model is available
- **`generate(prompt, max_tokens)`** — Async text generation via Ollama's `/api/generate` endpoint with:
  - Retry logic (3 attempts with exponential backoff)
  - 5-minute timeout for long generations
  - Reproducible output via seed parameter
  - Temperature control for deterministic results
- **`generate_json(prompt_or_messages, max_tokens)`** — JSON extraction with multi-strategy robustness:
  1. Extract from ` ```json ... ``` ` blocks
  2. Extract from generic ` ``` ... ``` ` blocks
  3. Find outermost `{ ... }` braces
  4. Fall back to raw response

#### Prompt Builder (`src/infrastructure/llm/prompt_builder.py`)

**Class:** `PromptBuilder`

Constructs context-aware prompts for each pipeline phase:
- `build_retrieval_prompt(user_query, iteration)` — Phase 1 retrieval queries
- `build_generation_prompt(query, context)` — Phase 2 initial code generation
- `build_reretrieval_prompt(execution_result)` — Phase 4 error-targeted queries
- `build_review_prompt(code, execution)` — Phase 5 code review
- `build_repair_strategy_prompt(review)` — Phase 6 repair planning
- `build_test_gen_prompt(code)` — Test generation for execution phase
- `build_optimization_prompt(code, review, context)` — Optimization generation

#### Vector Database

**Embedder** (`src/infrastructure/vectordb/embedder.py`):
- Uses `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional embeddings)
- Methods: `embed(text)` → single vector, `embed_batch(texts)` → batch vectors

**Indexer** (`src/infrastructure/vectordb/indexer.py`) — `CodeCorpusIndexer`:
- `load_corpus(corpus_root)` — Loads JSON files from `corpus/` subdirectories into `CodeExample` objects
- `build_index()` — Generates embeddings for all documents (explanation + code + tags), creates IndexFlatL2 FAISS index
- `save_index()` / `load_index()` — Persistence via `faiss_index.bin` (FAISS) + `metadata.pkl` (pickle for CodeExample objects)

**Retriever** (`src/infrastructure/vectordb/retriever.py`) — `CodeRetriever`:
- `search(query, top_k=5)` — Async semantic search with thread pool offloading for CPU-bound operations
- `_search_sync(query, top_k)` — Core search: embed query → FAISS L2 search → convert distances to similarity scores (0–1 via `1/(1+distance)`)

#### Code Sandbox (`src/infrastructure/sandbox/runner.py`)

**Class:** `SandboxRunner`

Secure Python code execution environment:

- **`execute(code, timeout)`** — Runs code in subprocess with:
  - Configurable timeout (default from settings)
  - Stdout/stderr capture
  - Temp file cleanup
  - Timeout expiration handling
  
- **`run_tests(code, tests)`** — Full test execution:
  1. Creates temp directory with `solution.py` and `test_solution.py`
  2. Runs `coverage run --source=solution -m pytest test_solution.py -q --tb=short`
  3. Generates coverage report via `coverage json`
  4. Parses pytest output for pass/fail counts
  5. Parses coverage JSON for line coverage and uncovered lines
  6. Returns structured `ExecutionResult`

- **`_parse_pytest_output(stdout, stderr)`** — Extracts test metrics from pytest summary line (e.g., "2 failed, 3 passed in 0.1s")

---

### 5.5 API Layer

#### Entry Point (`src/main.py`)

FastAPI application with:
- CORS middleware (all origins allowed for development)
- Three router groups: Health (`/api`), Generation (`/api`), Streaming (`/api`)
- Root `/` redirects to Swagger docs (`/docs`)
- Startup/shutdown lifecycle events

#### Routes

**Health Check** (`src/api/routes/health.py`):
- `GET /api/health` — Liveness probe
- `GET /api/ready` — Readiness probe

**Code Generation** (`src/api/routes/generate.py`):
- `POST /api/generate` — Synchronous code generation. Accepts `GenerateRequest`, returns `GenerateResponse`. Internally runs `EGRROrchestrator.run()`.

**Streaming** (`src/api/routes/stream.py`):
- `POST /api/generate/stream` — Server-Sent Events endpoint for real-time pipeline updates. Yields events:
  - `pipeline_start` — Pipeline initialization info
  - `phase_start` — Phase beginning notification
  - `phase_complete` — Phase results with timing
  - `iteration_complete` — Full iteration summary with decision
  - `pipeline_complete` — Final results with code and metrics

#### Request/Response Schemas

**Requests** (`src/api/schemas/requests.py`):

| Model | Field | Type | Default | Description |
|-------|-------|------|---------|-------------|
| `GenerateRequest` | `query` | `str` | *required* | Coding task description |
| | `language` | `str` | `"python"` | Target language |
| | `max_iterations` | `int` | `5` (1–10) | Max iterations |
| | `use_rag` | `bool` | `True` | Enable retrieval augmentation |
| `AnalyzeRequest` | `code` | `str` | *required* | Code to analyze |
| | `language` | `str` | `"python"` | Language of the code |

**Responses** (`src/api/schemas/responses.py`):

- `GenerateResponse` — Re-exported from domain entities (same model)
- `PhaseUpdate` — Streaming update: `phase`, `iteration`, `message`, `progress` (0–1)

---

### 5.6 Corpus & Knowledge Base

The corpus contains hand-curated code pattern examples organized by category:

```
corpus/
├── algorithms/         # 8 JSON files — list boundary checks, dict key checks, etc.
├── error_handling/     # 5 JSON files — file ops, network, parsing, cleanup
├── security/           # 5 JSON files — path traversal, SQL injection, XSS, input validation
├── testing_patterns/   # 5 JSON files — edge cases, exception tests, mock patterns
├── validation/         # 6 JSON files — email, URL, file type, schema validation
├── faiss_index.bin     # Pre-built FAISS vector index
└── metadata.pkl        # Serialized CodeExample objects
```

**Corpus file format** (JSON):
```json
{
  "id": "security_001",
  "code": "safe_path = base_dir / Path(user_path).name",
  "language": "python",
  "explanation": "Use pathlib to prevent directory escape and path traversal",
  "tags": ["security", "file", "path"]
}
```

**Index rebuilding:**
```bash
cd egrr-pipeline
poetry run python reindex.py
```

---

## 6. Frontend — Code Generation Platform

A modern Next.js 16 application providing a visual interface for the EGRR pipeline.

### 6.1 Application Structure

| Route | Page | Description |
|-------|------|-------------|
| `/` | `page.tsx` | Redirects to `/dashboard` |
| `/dashboard` | `dashboard/page.tsx` | Overview and statistics |
| `/egrr` | `egrr/page.tsx` | Main EGRR pipeline interface |
| `/runs` | `runs/page.tsx` | Pipeline execution history |

**Root Layout** (`layout.tsx`):
- Dark theme (`bg-neutral-900`, `text-neutral-50`)
- SEO metadata: "CodeGen Platform - Multi-Model Code Generation"
- Responsive viewport configuration
- Mobile-optimized meta tags

### 6.2 UI Components

**Common Components** (`components/common/`):

| Component | Description |
|-----------|-------------|
| `Alert.tsx` | Alert banners with variants |
| `Badge.tsx` | Status badges (success/warning/danger/primary/neutral) |
| `Button.tsx` | Styled buttons with variants |
| `Card.tsx` | Container cards |
| `Input.tsx` | Form input fields |
| `ProgressBar.tsx` | Progress indicators |
| `Skeleton.tsx` | Loading skeletons |
| `Tabs.tsx` | Tab navigation |

**Pipeline Components** (`components/pipeline/`):

| Component | Description |
|-----------|-------------|
| `LivePhaseTracker.tsx` | Real-time phase progress visualization during SSE streaming |
| `IterationTimeline.tsx` | Visual timeline of pipeline iterations with status indicators |
| `IterationCodeViewer.tsx` | Per-iteration code display with Monaco editor integration |
| `PipelineResult.tsx` | Final result display with code, metrics, and test results |

### 6.3 Services & State Management

**API Services** (`services/`):

| Service | Description |
|---------|-------------|
| `api.ts` | Base API client configuration |
| `egrr.ts` | EGRR pipeline API — `generate()`, `generateStream()`, `healthCheck()`, `getCorpusStats()` |
| `dashboard.ts` | Dashboard data endpoints |
| `models.ts` | Model management API |
| `runs.ts` | Run history CRUD |
| `tests.ts` | Test result endpoints |

**EGRR Service** (`services/egrr.ts`) — Key features:
- Axios instance with 5-minute timeout for long pipeline runs
- Request/response interceptors for logging
- **SSE (Server-Sent Events) streaming** via native `fetch` + `ReadableStream` for real-time updates
- `AbortController` support for stream cancellation
- Helper utilities: `formatDuration()`, `getPhaseDisplayName()`, `getStatusColor()`, `getStatusBadgeVariant()`

**State Management**: Zustand stores in `store/` directory for client-side state

**TypeScript Types**: Shared types in `types/` including `EGRRGenerateRequest` and `EGRRGenerateResponse`

---

## 7. API Reference

### `POST /api/generate`

Generate Python code using the full EGRR pipeline.

**Request Body:**
```json
{
  "query": "Create a function to validate email addresses",
  "language": "python",
  "max_iterations": 5,
  "use_rag": true
}
```

**Response (200 OK):**
```json
{
  "code": "import re\ndef validate_email(email: str) -> bool:\n    ...",
  "explanation": "Uses regex pattern matching with RFC 5322 compliance...",
  "iterations": 3,
  "status": "success",
  "coverage": 0.92,
  "tests_passed": 8,
  "tests_failed": 0,
  "tests_total": 8,
  "iteration_details": [
    {
      "iteration_number": 1,
      "retrieval_count": 5,
      "code_generated": true,
      "execution_status": "error",
      "tests_passed": 5,
      "tests_failed": 3,
      "coverage": 0.65,
      "critical_issues": ["3 test failures"],
      "decision": "CONTINUE",
      "duration_ms": 12000
    }
  ],
  "total_duration_ms": 35000,
  "retrieved_patterns": ["validation_001", "validation_003"]
}
```

### `POST /api/generate/stream`

Stream pipeline execution via Server-Sent Events.

**Request Body:** Same as `/api/generate`

**SSE Event Types:**

| Event | Data | Description |
|-------|------|-------------|
| `pipeline_start` | `{ run_id, query, max_iterations }` | Pipeline initialized |
| `phase_start` | `{ iteration, phase, phase_display, description }` | Phase beginning |
| `phase_complete` | `{ iteration, phase, result, duration_ms }` | Phase finished with results |
| `iteration_complete` | `{ iteration, decision, will_continue, duration_ms }` | Iteration summary |
| `pipeline_complete` | `{ run_id, status, code, explanation, iterations, coverage, ... }` | Final results |

### `GET /api/health`

Health check endpoint. Returns `{ "status": "healthy" }`.

### `GET /api/ready`

Readiness probe. Returns `{ "ready": true }`.

---

## 8. Data Models & Schemas

### Entity Relationship Diagram

```
PipelineState
├── user_query: str
├── current_iteration: int
├── current_phase: PipelinePhase
├── history_retrieval: list[list[RetrievalQuery]]
│   └── RetrievalQuery { query, rationale, evidence, priority }
├── history_code: list[GeneratedCode]
│   └── GeneratedCode { code, explanation, assumptions, confidence }
├── history_execution: list[ExecutionResult]
│   └── ExecutionResult
│       ├── status: ExecutionStatus
│       ├── stdout, stderr, exit_code
│       ├── coverage: CoverageResult { line_coverage, branch_coverage }
│       └── test_results: TestRunMetrics { passed, failed, failures }
├── history_review: list[Review]
│   └── Review
│       ├── correctness: ReviewAspect { status, evidence, findings }
│       ├── security: ReviewAspect
│       ├── robustness: ReviewAspect
│       ├── performance: ReviewAspect
│       ├── overall_quality_score: float
│       ├── critical_issues: list[str]
│       └── optimization_score: float
└── current_context_docs: list[CodeExample]
    └── CodeExample { id, code, language, explanation, tags, similarity_score }

DecisionResult
├── decision: DecisionType (continue | terminate_success | terminate_max_iterations)
├── rationale: str
├── next_iteration_focus: str
└── repair_strategy: RepairStrategy
    └── RepairStrategy { lines_to_modify, patterns_to_apply, validation_criteria }

GenerateResponse (final API output)
├── code, explanation, iterations, status
├── coverage, tests_passed, tests_failed, tests_total
├── iteration_details: list[IterationDetail]
├── total_duration_ms
└── retrieved_patterns: list[str]
```

---

## 9. Pipeline Execution Flow

### Detailed Flow Diagram

```
User Query: "Create a function to validate email addresses"
                    │
                    ▼
            ┌───────────────┐
            │ Orchestrator   │
            │ run(query, 5)  │
            └───────┬───────┘
                    │
    ════════════════╪═══════════════  ITERATION 1
                    │
        ┌───────────▼───────────┐
        │ Phase 1: RETRIEVAL    │
        │ • LLM generates 3-5  │
        │   search queries      │
        │ • Parallel FAISS      │
        │   vector search       │
        │ • Dedup results       │
        └───────────┬───────────┘
                    │ queries + context_docs
                    ▼
        ┌───────────────────────┐
        │ Phase 2: GENERATION   │
        │ • Build prompt with   │
        │   query + patterns    │
        │ • LLM generates code  │
        │ • Parse + validate    │
        │ • Clean + sanitize    │
        └───────────┬───────────┘
                    │ GeneratedCode
                    ▼
        ┌───────────────────────┐
        │ Phase 3: EXECUTION    │
        │ • Syntax check        │
        │ • LLM generates tests │
        │ • Sandbox: pytest     │
        │   + coverage.py       │
        │ • Parse results       │
        └───────────┬───────────┘
                    │ ExecutionResult
                    ▼
        ┌───────────────────────┐
        │ Phase 5: REVIEW       │
        │ • LLM evaluates:      │
        │   correctness,        │
        │   security,           │
        │   robustness,         │
        │   performance         │
        │ • Add execution-based │
        │   issues              │
        └───────────┬───────────┘
                    │ Review
                    ▼
        ┌───────────────────────┐
        │ Phase 6: DECISION     │
        │ • Max iterations?     │◄── YES → TERMINATE
        │ • Critical issues?    │◄── YES → CONTINUE (repair)
        │ • Optimization gaps?  │◄── YES → CONTINUE (optimize)
        │ • All converged?      │◄── YES → TERMINATE_SUCCESS
        └───────────┬───────────┘
                    │ CONTINUE
    ════════════════╪═══════════════  ITERATION 2+
                    │
        ┌───────────▼───────────┐
        │ Phase 4: RE-RETRIEVAL │
        │ • Error-driven queries│
        │ • Coverage-driven     │
        │ • Test-failure-driven │
        └───────────┬───────────┘
                    │ new context_docs
                    ▼
        ┌───────────────────────┐
        │ Phase 2: REPAIR /     │
        │         OPTIMIZE      │
        │ • Fix specific errors │
        │ • OR optimize correct │
        │   code                │
        └───────────┬───────────┘
                    │
                    ▼
            [Continue loop...]
                    │
                    ▼
        ┌───────────────────────┐
        │ GenerateResponse      │
        │ • Final code          │
        │ • Explanation         │
        │ • Metrics + history   │
        └───────────────────────┘
```

### Iteration Behavior

| Iteration | Retrieval | Generation | Focus |
|-----------|-----------|------------|-------|
| 1 | Intent-based (user query) | Initial synthesis | Get working code |
| 2+ (errors) | Execution-grounded (errors) | Targeted repair | Fix specific issues |
| 2+ (correct) | Execution-grounded (coverage) | Optimization | Improve quality |
| Max | — | — | Terminate |

---

## 10. Testing

### Test Suite Structure

Located in `egrr-pipeline/tests/`:

| Test File | Coverage Area |
|-----------|--------------|
| `test_api.py` | API route handlers and HTTP contracts |
| `test_decision.py` | Decision phase logic and termination conditions |
| `test_execution.py` | Sandbox execution and test result parsing |
| `test_generation.py` | Code generation and repair logic |
| `test_llm.py` | LLM client, retry logic, JSON extraction |
| `test_orchestrator.py` | Full pipeline orchestration flow |
| `test_retrieval.py` | Retrieval query generation and parsing |
| `test_review.py` | Code review evaluation logic |
| `test_sandbox.py` | Sandbox security and timeout handling |
| `test_vectordb.py` | FAISS indexing and retrieval accuracy |

### Running Tests

```bash
cd egrr-pipeline

# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=src --cov-report=html

# Run specific test file
poetry run pytest tests/unit/test_decision.py

# Run with verbose output
poetry run pytest -v

# Run async tests
poetry run pytest --asyncio-mode=auto
```

### Additional Test Files

- `test_pipeline_live.py` — Live integration test against running backend
- `test_sandbox_iterations.py` — Stress tests for sandbox iteration behavior
- `benchmark.py` — Performance benchmarking suite

### Linting & Type Checking

```bash
# Ruff (fast linting)
poetry run ruff check src/

# Black (formatting)
poetry run black --check src/

# MyPy (type checking)
poetry run mypy src/
```

---

## 11. Setup & Installation

### Prerequisites

- **Python 3.10+** (3.11 recommended)
- **Node.js 18+** with npm
- **Ollama** — for local LLM inference
- **Poetry** — Python package manager
- **Git**

### Backend Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd Optimised-Code-Generation-RAG

# 2. Install backend dependencies
cd egrr-pipeline
poetry install

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings (see Section 12)

# 4. Install and start Ollama
# Download from https://ollama.com
ollama serve  # Start Ollama server (in separate terminal)
ollama pull deepseek-coder:6.7b-instruct  # Download the model

# 5. Build the corpus index
poetry run python reindex.py

# 6. Start the backend server
poetry run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

### Frontend Setup

```bash
# 1. Navigate to frontend
cd code-generation-platform

# 2. Install dependencies
npm install

# 3. Configure environment (optional)
# Create .env.local with:
# NEXT_PUBLIC_EGRR_API_URL=http://localhost:8000/api

# 4. Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Quick Test

```bash
# Test the pipeline via curl
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"query": "Create a function to validate email addresses"}'
```

---

## 12. Environment Variables

### Backend (`egrr-pipeline/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` |
| `LLM_MODEL_ID` | LLM model identifier | `deepseek-coder:6.7b-instruct` |
| `LLM_MAX_TOKENS` | Max generation tokens | `1000` |
| `LLM_TEMPERATURE` | Generation temperature | `0.1` |
| `LLM_SEED` | Reproducibility seed | `42` |
| `MAX_ITERATIONS` | Pipeline max iterations | `5` |
| `EXECUTION_TIMEOUT` | Sandbox timeout (seconds) | `30` |
| `EMBEDDING_MODEL` | Sentence transformer model | `sentence-transformers/all-MiniLM-L6-v2` |
| `HOST` | Server bind address | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `DEBUG` | Debug mode | `True` |

### Frontend (`code-generation-platform/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_EGRR_API_URL` | Backend API URL | `http://localhost:8000/api` |

---

## 13. Legacy Code

The `legacy/` directory contains archived previous implementations:

### `legacy/code-generation-platform(Model)/`
The original model-centric frontend that focused on comparing outputs from multiple AI models (GPT-4, Claude, Gemini, Llama) rather than the iterative EGRR pipeline approach.

### `legacy/rag-codegen/`
The original RAG-based code generation backend. This was a simpler, single-pass system that evolved into the current multi-phase EGRR pipeline with execution feedback loops.

These directories are preserved for reference and are **not** part of the active codebase.

---

## Appendix A: Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Ollama over HuggingFace API** | Enables fully local, offline inference without API costs |
| **FAISS over Pinecone/Weaviate** | Lightweight, no external service dependency, fast L2 search |
| **Iterative pipeline (not single-pass)** | Execution feedback dramatically improves code quality |
| **SSE over WebSockets** | Simpler protocol, sufficient for unidirectional streaming |
| **Pydantic v2 for all models** | Strong typing, automatic validation, JSON serialization |
| **Clean Architecture layers** | Testability, loose coupling between business logic and infrastructure |
| **LLM-generated tests** | Adapts test suite to each generated function's specifics |
| **Subprocess sandbox** | Simple and effective; Docker isolation planned as future enhancement |
| **Coverage.py integration** | Provides quantitative feedback for the review phase |
| **Optimization iterations** | Continues beyond correctness to improve readability and performance |

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **EGRR** | Execution-Grounded Retrieval Refinement — the core pipeline methodology |
| **RAG** | Retrieval-Augmented Generation — enhancing LLM output with retrieved context |
| **Corpus** | The curated knowledge base of code patterns used for retrieval |
| **Iteration** | One full cycle through the pipeline phases |
| **Phase** | An individual step within an iteration (retrieval, generation, etc.) |
| **Execution-Grounded** | Using actual code execution results as evidence for decisions |
| **Repair** | Targeted fix of specific issues identified in review |
| **Optimization** | Improvement of correct code for quality, readability, and performance |
| **Re-Retrieval** | Phase 4 — retrieving new patterns based on execution errors |
| **SSE** | Server-Sent Events — protocol for streaming pipeline updates |
