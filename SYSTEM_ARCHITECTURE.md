# Optimised Code Generation Using Retrieval-Augmented Generation with Execution-Grounded Iterative Refinement

> **Complete System Architecture & Research Documentation**
> Two-Stage Pipeline: RAG-CodeGen (Generation) + EGRR (Optimization)
> Enhanced with Static/Dynamic Analysis, Execution-Guided Feedback, and Progressive Optimisation

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [End-to-End Workflow](#2-end-to-end-workflow)
3. [System Architecture](#3-system-architecture)
4. [Stage 1 — RAG-CodeGen Pipeline](#4-stage-1--rag-codegen-pipeline)
5. [Stage 2 — EGRR Pipeline](#5-stage-2--egrr-pipeline)
6. [Iteration Lifecycle & Novelty Introduction](#6-iteration-lifecycle--novelty-introduction)
7. [Enhanced EGRR — Novelty Mechanisms (Iteration 2+)](#7-enhanced-egrr--novelty-mechanisms-iteration-2)
8. [Component Roles & Responsibilities](#8-component-roles--responsibilities)
9. [Data Flow & Control Flow](#9-data-flow--control-flow)
10. [Optimisation Factors by Stage](#10-optimisation-factors-by-stage)
11. [Experimental Comparison Design](#11-experimental-comparison-design)
12. [Research Positioning & Contributions](#12-research-positioning--contributions)
13. [Technology Stack](#13-technology-stack)

---

## 1. System Overview

### 1.1 Problem Statement

Large Language Models (LLMs) demonstrate competent code generation capabilities; however, their output frequently exhibits functional defects, security vulnerabilities, performance inefficiencies, and stylistic inconsistencies. Single-pass generation provides no mechanism for detecting or correcting these deficiencies after initial synthesis.

### 1.2 Proposed Solution

This work presents a **two-stage hybrid framework** for automated, high-quality source code synthesis that integrates two sequentially composed pipelines:

| Stage | Pipeline | Role | Mechanism |
|-------|----------|------|-----------|
| **Stage 1** | **RAG-CodeGen** | Initial Code Generation | Retrieval-Augmented Generation using semantic search over a curated code corpus, intent normalisation, and LLM-based synthesis |
| **Stage 2** | **EGRR** | Iterative Optimisation | Execution-Grounded Retrieval Refinement — a closed-loop, multi-phase pipeline that executes code in a sandbox, reviews output with execution evidence, and iteratively refines through targeted re-retrieval and repair/optimisation |

### 1.3 Key Design Constraint

> **Iteration 1 uses the original two-stage pipeline (RAG-CodeGen → EGRR baseline) without modification.** From **Iteration 2 onward**, novelty mechanisms are introduced: static analysis (Pylint, Radon, Bandit), dynamic profiling (cProfile, memory_profiler, coverage.py), behaviour-based retrieval, adversarial test generation, and progressive optimisation objectives.

This design enables direct ablation between the baseline system and the enhanced system within a single experimental framework.

### 1.4 System at a Glance

```
User Query (Natural Language)
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│                    STAGE 1: RAG-CodeGen Pipeline                  │
│                                                                   │
│  Step 1          Step 2           Step 3          Step 4    Step 5│
│ ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────┐ ┌─────┐│
│ │ Intent   │→│ Semantic     │→│ Prompt   │→│ LLM    │→│Clean││
│ │Normalise │  │ Retrieval    │  │ Builder  │  │Generate│ │ Up  ││
│ │          │  │(FAISS+SBERT) │  │          │  │        │ │     ││
│ └──────────┘  └──────────────┘  └──────────┘  └────────┘ └─────┘│
└──────────────────────────────────┬────────────────────────────────┘
                                   │ Initial Generated Code
                                   ▼
┌───────────────────────────────────────────────────────────────────┐
│                    STAGE 2: EGRR Pipeline                          │
│                                                                   │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Retrieval  │→│Generation│→│Execution │ ← Iteration 1:        │
│  │(Intent)    │  │(Initial) │  │(Sandbox) │   Baseline only       │
│  └────────────┘  └──────────┘  └────┬─────┘                      │
│       ▲                             │                             │
│       │                             ▼                             │
│  ┌────┴───────┐  ┌──────────┐  ┌──────────┐                      │
│  │Re-Retrieval│←│Decision  │←│ Review   │ ← Iteration 2+:       │
│  │(Exec-based)│  │          │  │          │   + Static Analysis   │
│  └────────────┘  └────┬─────┘  └──────────┘   + Dynamic Profiling│
│                       │                        + Adversarial Tests│
│                TERMINATE / LOOP                + Targeted Prompts │
└───────────────────────┬───────────────────────────────────────────┘
                        │
                        ▼
        Optimised, Tested, Production-Ready Code
        + Test Results + Coverage Report
        + Quality Scores + Iteration History
```

---

## 2. End-to-End Workflow

### Step-by-Step Execution (User Query → Optimised Code)

```
STEP  COMPONENT                ACTION                                OUTPUT
────  ─────────────────────    ─────────────────────────────────     ──────────────────────
 1    User                     Submits natural language query         "Write a function to
                               via frontend or API                    validate email addresses"

 2    API Layer (FastAPI)      Receives POST /api/generate            GenerateRequest object
                               Validates request schema

 3    RAG-CodeGen / Stage 1    Intent Normalisation                   Intent class, constraints
      (normalizer.py)          Classifies task type, infers
                               algorithmic constraints

 4    RAG-CodeGen / Stage 1    Semantic Retrieval                     Top-k CodeExample[]
      (embedder + retriever)   Embeds query via sentence-BERT
                               FAISS nearest-neighbour search
                               Filters by target language

 5    RAG-CodeGen / Stage 1    Prompt Construction                    Structured LLM prompt
      (templates.py)           Merges query + retrieved context
                               + inferred constraints

 6    RAG-CodeGen / Stage 1    LLM Generation                        Raw LLM output text
      (llm_client.py)          Calls HuggingFace Inference API
                               (Llama-3.1-8B-Instruct)

 7    RAG-CodeGen / Stage 1    Post-Processing                       {code, explanation}
      (cleaner.py)             Extracts <CODE> and <EXPLANATION>
                               tags from LLM output

 8    EGRR Orchestrator        Receives initial code from Stage 1    PipelineState initialised
                               Begins iterative refinement loop

────── ITERATION 1 (Baseline) ──────────────────────────────────────────────────────────────

 9    Phase 1: Retrieval       LLM generates 3-5 search queries      RetrievalQuery[]
      (retrieval.py)           from user intent; parallel FAISS
                               vector search; deduplication

 10   Phase 2: Generation      Builds prompt with user query +       GeneratedCode
      (generation.py)          retrieved patterns; LLM synthesises
                               code; validates syntax; sanitises

 11   Phase 3: Execution       Syntax check via standalone exec;     ExecutionResult
      (execution.py)           LLM generates pytest test suite;       (status, stdout, stderr,
                               Sandbox runs pytest + coverage.py      tests, coverage)

 12   Phase 5: Review          LLM evaluates across 4 axes:          Review
      (review.py)              correctness, security, robustness,     (scores, critical_issues,
                               performance; cites execution evidence  optimization_gaps)

 13   Phase 6: Decision        Evaluates review; determines           DecisionResult
      (decision.py)            TERMINATE_SUCCESS, CONTINUE (repair),  (decision, rationale,
                               or CONTINUE (optimize)                 repair_strategy)

────── ITERATION 2+ (Enhanced — Novelty Introduced) ────────────────────────────────────────

 14   Static Analysis          Runs Pylint (lint score, warnings),    StaticAnalysisReport
      [NOVEL]                  Radon (cyclomatic complexity),          (complexity, lint_score,
                               Bandit (security vulnerabilities)       security_flags, warnings)

 15   Dynamic Profiling        Runs cProfile (execution time per      DynamicProfileReport
      [NOVEL]                  function), memory_profiler (memory      (hotspots, memory_peaks,
                               peaks), coverage.py (line coverage)     coverage_gaps)

 16   Adversarial Testing      Uses Hypothesis library to generate    AdversarialTestResult
      [NOVEL]                  property-based adversarial inputs       (edge_cases_found,
                               that stress worst-case behaviour        failures, slow_inputs)

 17   Analysis-Augmented       Constructs targeted prompts:           Enhanced LLM prompt
      Prompt Construction      "Reduce cyclomatic complexity from
      [NOVEL]                  12 to <6" or "Eliminate Bandit
                               security warning B301"

 18   Execution-Grounded       Error patterns + profiling hotspots    New CodeExample[]
      Re-Retrieval             + security flags drive targeted
      (retrieval.py)           retrieval queries

 19   Phase 2: Repair /        LLM generates improved code using     GeneratedCode (v2+)
      Optimise                 analysis feedback + new context;
      (generation.py)          Scope validation prevents drift

 20   Phase 3: Re-Execution    Tests updated code; captures new      ExecutionResult (v2+)
                               profiling data for comparison

 21   Phase 5: Re-Review       Compares current vs previous metrics  Review (v2+)

 22   Phase 6: Decision        Convergence check across all axes     TERMINATE or LOOP

────── OUTPUT ──────────────────────────────────────────────────────────────────────────────

 23   API Response              Returns GenerateResponse               Final optimised code
                                with full iteration history             + explanation + metrics
```

---

## 3. System Architecture

### 3.1 Layered Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  Frontend (Next.js 16 + TypeScript)               │   │
│  │  Dashboard │ EGRR Page (SSE Stream) │ Pipeline Viz │ Code Editor │   │
│  │            │ (LivePhaseTracker)      │ (Timeline)   │ (Monaco)   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │ Axios + SSE                              │
│                              ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  API Layer (FastAPI + Uvicorn)                    │   │
│  │  POST /api/generate  │  POST /api/generate/stream  │  GET /health│   │
│  │  Request/Response Schemas (Pydantic v2)                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       ORCHESTRATION LAYER                               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    EGRROrchestrator                               │   │
│  │  • Manages pipeline state (PipelineState)                        │   │
│  │  • Controls iteration loop (max_iterations)                      │   │
│  │  • Delegates to RAG-CodeGen (iter 1) then EGRR phases            │   │
│  │  • Invokes novelty mechanisms (iter 2+)                          │   │
│  │  • Timing instrumentation per phase                              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CORE LOGIC LAYER                                │
│                                                                         │
│  ┌─── Stage 1: RAG-CodeGen ──────────────────────────────────────────┐  │
│  │  normalizer.py → embedder.py → retriever.py → templates.py       │  │
│  │  → llm_client.py → cleaner.py                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── Stage 2: EGRR Phases ─────────────────────────────────────────┐  │
│  │  retrieval.py │ generation.py │ execution.py │ review.py │        │  │
│  │  decision.py                                                      │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── Novelty Layer (Iteration 2+) ─────────────────────────────────┐  │
│  │  static_analyser.py │ dynamic_profiler.py │ adversarial_tester.py│  │
│  │  analysis_prompt_builder.py │ progressive_objectives.py          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                                      │
│                                                                         │
│  entities.py (15+ Pydantic v2 models)                                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────────┐ │
│  │ Pipeline   │ │ Generated  │ │ Execution  │ │ Review, Decision,    │ │
│  │ State      │ │ Code       │ │ Result     │ │ RepairStrategy       │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────────────┘ │
│  value_objects.py (5 enums: PipelinePhase, ExecutionStatus, etc.)       │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE LAYER                                │
│                                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │
│  │   LLM Client  │  │  Vector DB    │  │   Code Sandbox            │   │
│  │ (Ollama via   │  │ (FAISS +      │  │ (subprocess + pytest      │   │
│  │  httpx)       │  │  Sentence-    │  │  + coverage.py)           │   │
│  │               │  │  Transformers)│  │                           │   │
│  └───────────────┘  └───────────────┘  └───────────────────────────┘   │
│                                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │
│  │  Static Tools │  │Dynamic Tools  │  │  Adversarial Testing      │   │
│  │ Pylint, Radon │  │ cProfile,     │  │  Hypothesis library       │   │
│  │ Bandit        │  │ memory_profiler│ │                           │   │
│  └───────────────┘  └───────────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Interaction Diagram

```
                    ┌──────────┐
                    │  User    │
                    │  Query   │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ FastAPI  │
                    │ Router   │
                    └────┬─────┘
                         │
              ┌──────────▼──────────┐
              │  EGRROrchestrator   │
              │  ┌────────────────┐ │
              │  │ PipelineState  │ │
              │  │ (run_id, iter, │ │
              │  │  history, ctx) │ │
              │  └────────────────┘ │
              └────────┬────────────┘
                       │
         ┌─────────────┼─────────────────────────┐
         │             │                         │
  ┌──────▼──────┐ ┌────▼──────┐          ┌───────▼───────┐
  │ RAG-CodeGen │ │   EGRR    │          │   Novelty     │
  │ (Stage 1)   │ │ (Stage 2) │          │   Layer       │
  │             │ │           │          │  (Iter 2+)    │
  │ normalizer  │ │ retrieval │          │               │
  │ embedder    │ │ generation│          │ Pylint+Radon  │
  │ retriever   │ │ execution │          │ cProfile      │
  │ templates   │ │ review    │          │ Hypothesis    │
  │ llm_client  │ │ decision  │          │ AnalysisPrompt│
  │ cleaner     │ │           │          │               │
  └──────┬──────┘ └────┬──────┘          └───────┬───────┘
         │             │                         │
         └─────────────┼─────────────────────────┘
                       │
         ┌─────────────┼─────────────────────────┐
         │             │                         │
  ┌──────▼──────┐ ┌────▼──────┐          ┌───────▼───────┐
  │ LLM Client  │ │ FAISS +   │          │  SandboxRunner│
  │ (Ollama)    │ │ SBERT     │          │  (subprocess) │
  └─────────────┘ └───────────┘          └───────────────┘
```

---

## 4. Stage 1 — RAG-CodeGen Pipeline

### 4.1 Purpose

RAG-CodeGen is the **initial code generation** stage. It transforms a natural language task description into a first-iteration code solution by grounding LLM inference in semantically retrieved code patterns from a curated corpus.

### 4.2 Pipeline Steps

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       RAG-CodeGen Pipeline (Stage 1)                     │
│                                                                          │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐                 │
│  │  STEP 1     │───▶│   STEP 2     │───▶│  STEP 3     │                 │
│  │ Normalise   │    │  Retrieve    │    │ Build       │                 │
│  │ Intent      │    │  Context     │    │ Prompt      │                 │
│  │             │    │              │    │             │                 │
│  │ • Classify  │    │ • Embed query│    │ • Merge     │                 │
│  │   task type │    │   (SBERT)    │    │   query +   │                 │
│  │ • Infer     │    │ • FAISS top-k│    │   context + │                 │
│  │   constraints    │ • Filter by  │    │   constraints                 │
│  │   (algo hints)│  │   language   │    │             │                 │
│  └─────────────┘    └──────────────┘    └──────┬──────┘                 │
│                                                │                         │
│  ┌─────────────┐                       ┌───────▼──────┐                 │
│  │  STEP 5     │◀──────────────────────│  STEP 4      │                 │
│  │ Post-Process│                       │ LLM Generate │                 │
│  │             │                       │              │                 │
│  │ • Extract   │                       │ • HuggingFace│                 │
│  │   <CODE>    │                       │   Inference  │                 │
│  │ • Extract   │                       │   API        │                 │
│  │   <EXPLAIN> │                       │ • Llama-3.1  │                 │
│  └─────────────┘                       └──────────────┘                 │
│                                                                          │
│  Output: { code, explanation, retrieved_context, intent }                │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Component Details

#### Step 1 — Intent Normalisation (`normalizer.py`)

The normaliser classifies the user's task and infers algorithmic constraints:

- **Input:** Raw user task string (e.g., "find the sum of first N natural numbers")
- **Process:** Keyword-based classification with constraint inference
- **Output:** `{ intent: "mathematical_computation", constraints: ["prefer formula over loop for sum of N"] }`

This intent-aware constraint injection goes beyond simple retrieval — it provides algorithmic guidance to the LLM.

#### Step 2 — Semantic Retrieval (`embedder.py` + `retriever.py`)

- **Embedder:** Uses `sentence-transformers` to encode the user query into a 384-dimensional vector
- **Retriever:** Performs FAISS L2 nearest-neighbour search on a pre-built index of code patterns
- **Filtering:** Results are filtered by target programming language
- **Output:** Top-k `CodeExample` objects with similarity scores

#### Step 3 — Prompt Construction (`templates.py`)

Constructs a structured prompt merging:
1. User's original task description
2. Retrieved code examples as context
3. Inferred constraints from the normaliser
4. Target programming language

#### Step 4 — LLM Generation (`llm_client.py`)

- **Model:** `meta-llama/Llama-3.1-8B-Instruct` via HuggingFace Inference API
- **Configuration:** Temperature, max tokens, stop sequences
- **Output:** Raw text containing generated code and explanation

#### Step 5 — Post-Processing (`cleaner.py`)

Parses the LLM output to extract structured components:
- Extracts code from `<CODE>...</CODE>` tags
- Extracts explanation from `<EXPLANATION>...</EXPLANATION>` tags
- Returns clean `{ code, explanation }` dictionary

### 4.4 RAG vs Non-RAG Mode

The pipeline supports a `use_rag` flag:

| Mode | Retrieval | Context | Use Case |
|------|-----------|---------|----------|
| **RAG (default)** | Yes — FAISS semantic search | Retrieved code patterns + constraints | Production use |
| **Non-RAG** | Skipped | Inferred constraints only | Experimental baseline |

This built-in toggle enables direct **ablation experiments** comparing RAG-augmented vs. raw LLM generation.

---

## 5. Stage 2 — EGRR Pipeline

### 5.1 Purpose

The EGRR (Execution-Grounded Retrieval Refinement) pipeline is the **iterative optimisation** stage. It takes the code generated by RAG-CodeGen and refines it through a closed-loop of execution feedback, evidence-based review, and targeted re-retrieval.

### 5.2 Six-Phase Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    EGRR Iterative Refinement Loop                         │
│                                                                          │
│  Phase 1 ──────▶ Phase 2 ──────▶ Phase 3                                │
│  RETRIEVAL       GENERATION       EXECUTION                              │
│  (Intent-based    (Code synthesis   (Sandbox + pytest                    │
│   or Exec-based)   / repair /        + coverage.py)                      │
│                    optimise)                                              │
│        ▲                               │                                 │
│        │                               ▼                                 │
│  Phase 4 ◄──── Phase 6 ◄────── Phase 5                                  │
│  RE-RETRIEVAL    DECISION         REVIEW                                 │
│  (Error-driven    (Continue /       (Correctness,                        │
│   queries)        Terminate)        Security,                            │
│                                     Robustness,                          │
│                                     Performance)                         │
│                      │                                                   │
│               TERMINATE / LOOP                                           │
└──────────────────────┼───────────────────────────────────────────────────┘
                       ▼
              Final Optimised Code
```

### 5.3 Phase Details

#### Phase 1: Retrieval (`retrieval.py`)

Two modes of operation:

| Mode | Trigger | Process | Output |
|------|---------|---------|--------|
| **Intent-Based** (Iter 1) | First iteration | LLM generates 3-5 search queries from user intent → parallel async FAISS search → deduplication | `RetrievalQuery[]` + `CodeExample[]` |
| **Execution-Grounded** (Iter 2+) | After execution feedback | Extracts error patterns, coverage gaps, test failures → generates targeted fix queries | New `CodeExample[]` |

#### Phase 2: Generation (`generation.py`)

Three operational modes:

| Mode | Trigger | Behaviour |
|------|---------|-----------|
| **Initial Generation** | Iteration 1 | Full code synthesis from user query + retrieved context |
| **Targeted Repair** | Critical issues found | Fixes specific error only; strict intent preservation |
| **Optimisation** | Code correct but quality < threshold | Improves readability, type safety, performance; scope validation prevents drift |

Key safety mechanisms:
- `validate_python_syntax(code)` — AST-based syntax check
- `sanitize_solution_code(code)` — Removes test contamination
- `validate_optimization_scope(original, optimized)` — Preserves function signatures
- `fix_indentation_issues(code)` — Corrects LLM indentation errors

#### Phase 3: Execution (`execution.py`)

Three-step execution strategy:

1. **Syntax validation** — Standalone execution to catch syntax/import errors
2. **Test generation** — LLM generates a comprehensive pytest test suite (with fallback to smoke tests)
3. **Sandbox execution** — Runs `coverage run --source=solution -m pytest` capturing:
   - Pass/fail counts
   - Failure messages
   - Line coverage percentage
   - Uncovered line numbers

#### Phase 5: Review (`review.py`)

Multi-dimensional evidence-based evaluation:

| Dimension | Evaluation Criteria |
|-----------|-------------------|
| **Correctness** | Test pass rate, runtime errors, exception handling |
| **Security** | Path traversal, injection, hardcoded credentials, unsafe deserialization |
| **Robustness** | Edge case handling, input validation, coverage completeness |
| **Performance** | Algorithmic complexity, resource usage, unnecessary computation |

Produces: `overall_quality_score` (0–1), `critical_issues[]`, `optimization_score` (0–1), `optimization_gaps[]`

#### Phase 6: Decision (`decision.py`)

Decision logic tree:

```
                    ┌─────────────────────┐
                    │ Max iterations      │
                    │ reached?            │
                    └──────┬──────────────┘
                           │
                    YES    │    NO
                    ┌──────┴──────┐
                    │             │
           ┌────────▼───┐  ┌─────▼──────────┐
           │ Critical   │  │ Critical       │
           │ issues?    │  │ issues?        │
           └──┬─────┬───┘  └──┬─────┬───────┘
            YES   NO        YES    NO
              │     │         │      │
              ▼     ▼         ▼      │
         TERMINATE  TERMINATE  CONTINUE  ┌───────────────┐
         _MAX_ITER  _SUCCESS   (repair)  │ Optimisation  │
                                         │ score < 0.95? │
                                         └──┬─────┬──────┘
                                          YES    NO
                                            │      │
                                            ▼      ▼
                                        CONTINUE   TERMINATE
                                        (optimize) _SUCCESS
```

---

## 6. Iteration Lifecycle & Novelty Introduction

### 6.1 Iteration 1 — Baseline (Unchanged)

The first iteration runs the **original two-stage pipeline exactly as designed**, establishing a baseline output:

```
Iteration 1 Flow:
  RAG-CodeGen (Stage 1) → Phase 1 (Intent Retrieval) → Phase 2 (Initial Generation)
  → Phase 3 (Execution + Tests + Coverage) → Phase 5 (Review) → Phase 6 (Decision)
```

| Component | Iteration 1 Behaviour |
|-----------|----------------------|
| Retrieval | Intent-based (user query → search queries) |
| Generation | Full initial synthesis |
| Execution | Sandbox + auto-generated pytest + coverage |
| Review | 4-axis evaluation with execution evidence |
| Decision | Standard continue/terminate logic |
| **Static Analysis** | **Not applied** |
| **Dynamic Profiling** | **Not applied** |
| **Adversarial Testing** | **Not applied** |

### 6.2 Iteration 2+ — Enhanced (Novelty Introduced)

From iteration 2 onward, novel mechanisms augment the existing pipeline:

```
Iteration 2+ Flow:
  ┌─────────────────────────────────────────────────────────────────┐
  │  NOVEL: Static Analysis  →  Pylint + Radon + Bandit reports    │
  │  NOVEL: Dynamic Profiling →  cProfile + memory + coverage      │
  │  NOVEL: Adversarial Tests →  Hypothesis edge cases             │
  ├─────────────────────────────────────────────────────────────────┤
  │  Analysis findings → Targeted Prompt Construction               │
  │  → Execution-Grounded Re-Retrieval                             │
  │  → Phase 2 (Repair / Optimise with analysis feedback)          │
  │  → Phase 3 (Re-Execution with extended tests)                  │
  │  → Phase 5 (Re-Review — compare against previous iteration)   │
  │  → Phase 6 (Convergence check)                                 │
  └─────────────────────────────────────────────────────────────────┘
```

### 6.3 Comparative View

| Aspect | Iteration 1 | Iteration 2+ |
|--------|-------------|--------------|
| **Retrieval source** | User intent | Execution errors + analysis findings |
| **Generation mode** | Initial synthesis | Targeted repair / optimisation |
| **Quality signals** | Tests + coverage only | Tests + coverage + Pylint + Radon + Bandit + cProfile + memory |
| **Test generation** | LLM-generated pytest | LLM tests + Hypothesis property-based tests |
| **Prompt strategy** | Generic code generation | "Reduce complexity from 12 to <6", "Fix Bandit B301" |
| **Convergence criteria** | Pass rate + coverage | Multi-objective: correctness + performance + security + maintainability |

---

## 7. Enhanced EGRR — Novelty Mechanisms (Iteration 2+)

### 7.1 Static Analysis Integration

**Tools:** Pylint (code quality), Radon (complexity metrics), Bandit (security scanning)

```
Code from previous iteration
         │
         ├──────────▶ Pylint ──────▶ Lint score, warnings, conventions
         │
         ├──────────▶ Radon  ──────▶ Cyclomatic complexity per function
         │                          Maintainability index
         │
         └──────────▶ Bandit ──────▶ Security vulnerability flags
                                    CWE identifiers
         │
         ▼
  StaticAnalysisReport {
    lint_score: float,           // e.g., 6.5/10
    complexity_per_function: {},  // e.g., {"validate_email": 12}
    security_issues: [],          // e.g., ["B301: pickle usage"]
    warnings: [],                 // e.g., ["C0301: line too long"]
    maintainability_index: float  // e.g., 45.2
  }
```

**How it drives optimisation:**
- High cyclomatic complexity → prompt: "Refactor function X to reduce complexity"
- Low lint score → prompt: "Address Pylint warnings: unused imports, naming conventions"
- Bandit flag → prompt: "Replace pickle with json for untrusted data (B301)"

### 7.2 Dynamic Profiling Integration

**Tools:** cProfile (execution time), memory_profiler (memory usage), coverage.py (line coverage)

```
Code + test suite
         │
         ├──────────▶ cProfile ─────▶ Per-function execution time
         │                            Cumulative call times
         │                            Call count per function
         │
         ├──────────▶ memory_profiler ▶ Memory usage per line
         │                              Peak memory allocation
         │                              Memory growth patterns
         │
         └──────────▶ coverage.py ──▶ Line-by-line coverage
                                      Uncovered branches
         │
         ▼
  DynamicProfileReport {
    hotspot_functions: [],        // Slowest functions ranked
    memory_peaks: [],             // Lines with high allocation
    coverage_gaps: [],            // Untested code paths
    total_execution_time: float,  // e.g., 0.45s
    peak_memory_mb: float         // e.g., 12.3 MB
  }
```

**How it drives optimisation:**
- Hotspot function → prompt: "Optimise function X which takes 80% of execution time"
- Memory spike → prompt: "Reduce memory usage in line range Y-Z; consider generators"
- Uncovered lines → generate additional targeted tests

### 7.3 Adversarial Test Generation

**Tool:** Hypothesis (property-based testing library)

```
Generated code + function signatures
         │
         ▼
  Hypothesis generates:
    • Edge-case inputs (empty strings, None, max int, unicode)
    • Stress inputs (very large lists, deeply nested structures)
    • Boundary inputs (0, -1, MAX_INT, empty collections)
    • Type-variant inputs (int where string expected, etc.)
         │
         ▼
  AdversarialTestResult {
    edge_cases_found: int,       // Number of failing edge cases
    failures: [],                 // Input → expected → actual
    slow_inputs: [],              // Inputs causing >1s execution
    property_violations: []       // Invariant violations
  }
```

**How it drives optimisation:**
- Failing edge case → prompt: "Handle empty input gracefully — currently raises IndexError"
- Slow input → prompt: "Input of size 10000 takes 5s; optimise algorithmic complexity"
- Property violation → prompt: "Function is not idempotent — f(f(x)) ≠ f(x) for input Y"

### 7.4 Progressive Optimisation Objectives

Each iteration focuses on a hierarchy of objectives, pursued in order:

```
Priority 1 (Iter 2):   CORRECTNESS   ← Fix all test failures
Priority 2 (Iter 3):   PERFORMANCE   ← Eliminate hotspots, reduce complexity
Priority 3 (Iter 4):   SECURITY      ← Resolve Bandit flags, input validation
Priority 4 (Iter 5):   MAINTAINABILITY ← Reduce cyclomatic complexity, improve style
```

This progressive approach ensures that correctness is never sacrificed for secondary objectives.

### 7.5 Analysis-Augmented Prompt Construction

Traditional prompts: "Fix the code" (vague — leads to stagnation)

Enhanced prompts (using analysis feedback):

```
Example Prompt — Performance Optimisation:
──────────────────────────────────────────
The following code has a performance bottleneck identified by profiling:

[CODE]
{current_code}
[/CODE]

PROFILING RESULTS:
- Function `process_data()` takes 82% of total execution time (0.37s / 0.45s)
- The inner loop at line 15 iterates 10,000 times per call
- Memory peaks at 45MB on line 22 (list comprehension)

STATIC ANALYSIS:
- Cyclomatic complexity of `process_data()`: 14 (target: <6)
- Pylint score: 5.2/10

TASK: Rewrite `process_data()` to:
1. Reduce time complexity (consider vectorisation or algorithmic improvement)
2. Reduce memory usage (consider generators or in-place operations)
3. Maintain identical input/output behaviour
4. Reduce cyclomatic complexity to <6

RETRIEVED PATTERN (for reference):
{retrieved_optimisation_pattern}
```

This specificity gives the LLM **concrete, measurable targets** — eliminating the stagnation problem.

---

## 8. Component Roles & Responsibilities

### 8.1 Stage 1 Components

| Component | File | Responsibility |
|-----------|------|----------------|
| **Intent Normaliser** | `normalizer.py` | Classifies user task, infers algorithmic constraints |
| **Embedder** | `embedder.py` | Converts text to 384-dim vectors (sentence-BERT) |
| **Retriever** | `retriever.py` | FAISS L2 search, language filtering, top-k selection |
| **Prompt Template** | `templates.py` | Merges query + context + constraints into LLM prompt |
| **LLM Client** | `llm_client.py` | HuggingFace Inference API wrapper (Llama-3.1-8B) |
| **Output Cleaner** | `cleaner.py` | Parses `<CODE>` / `<EXPLANATION>` tags from LLM output |

### 8.2 Stage 2 Components

| Component | File | Responsibility |
|-----------|------|----------------|
| **Orchestrator** | `orchestrator.py` | Controls iteration loop, delegates to phases, manages state |
| **Retrieval Phase** | `retrieval.py` | Intent-based (iter 1) and execution-grounded (iter 2+) retrieval |
| **Generation Phase** | `generation.py` | Initial synthesis, targeted repair, scope-validated optimisation |
| **Execution Phase** | `execution.py` | Sandbox code execution, test generation, coverage measurement |
| **Review Phase** | `review.py` | 4-axis evidence-based evaluation, quality scoring |
| **Decision Phase** | `decision.py` | Termination logic, repair strategy generation |

### 8.3 Infrastructure Components

| Component | File | Responsibility |
|-----------|------|----------------|
| **LLM Client (EGRR)** | `client.py` | Ollama wrapper with retry logic, JSON extraction |
| **Prompt Builder** | `prompt_builder.py` | Phase-specific prompt construction |
| **Corpus Indexer** | `indexer.py` | Loads corpus JSONs, builds FAISS index |
| **Code Retriever** | `retriever.py` | Async semantic search with similarity scoring |
| **Sandbox Runner** | `runner.py` | subprocess execution, pytest + coverage.py integration |

### 8.4 Novelty Components (Iteration 2+)

| Component | Tool / Library | Responsibility |
|-----------|----------------|----------------|
| **Static Analyser** | Pylint, Radon, Bandit | Code quality, complexity, security scanning |
| **Dynamic Profiler** | cProfile, memory_profiler | Runtime hotspots, memory peaks |
| **Adversarial Tester** | Hypothesis | Property-based edge-case generation |
| **Analysis Prompt Builder** | Custom | Constructs targeted prompts from analysis findings |
| **Progressive Objectives** | Custom | Prioritises optimisation axes per iteration |

---

## 9. Data Flow & Control Flow

### 9.1 Data Flow Diagram

```
User Query ─────────────────────────────────────────────────────────────────
     │
     ▼
┌─ RAG-CodeGen ─────────────────────────────────────────────────────────────
│  query ──▶ normaliser ──▶ {intent, constraints}
│                                  │
│  query ──▶ embedder ──▶ query_vector ──▶ FAISS ──▶ CodeExample[]
│                                                          │
│  query + constraints + CodeExample[] ──▶ prompt_template ──▶ LLM_prompt
│                                                                   │
│  LLM_prompt ──▶ LLM (Llama-3.1) ──▶ raw_output ──▶ cleaner ──▶ {code, explanation}
└───────────────────────────────────────────────────────────────────────────
     │ {code, explanation}
     ▼
┌─ EGRR Pipeline ───────────────────────────────────────────────────────────
│
│  ITERATION 1:
│  user_query ──▶ retrieval (intent) ──▶ queries[] + context_docs[]
│  user_query + context_docs ──▶ generation (initial) ──▶ GeneratedCode
│  GeneratedCode ──▶ execution (sandbox) ──▶ ExecutionResult
│  code + ExecutionResult ──▶ review ──▶ Review
│  Review + iteration_count ──▶ decision ──▶ DecisionResult
│
│  ITERATION 2+ (if CONTINUE):
│  ExecutionResult ──────────────────────┐
│  code ──▶ static_analysis ──▶ report ─┤
│  code ──▶ dynamic_profiler ──▶ report ┤  [NOVEL]
│  code ──▶ adversarial_tester ──▶ report┘
│                    │
│                    ▼
│  All reports ──▶ analysis_prompt_builder ──▶ targeted_prompt
│  errors + reports ──▶ re-retrieval ──▶ new_context_docs[]
│  targeted_prompt + new_context ──▶ generation (repair/optimise) ──▶ improved_code
│  improved_code ──▶ execution ──▶ new_ExecutionResult
│  ... (review → decision → loop or terminate)
│
└───────────────────────────────────────────────────────────────────────────
     │ GenerateResponse
     ▼
  Final Output: {code, explanation, iterations, status, coverage, tests,
                 iteration_details[], total_duration_ms, retrieved_patterns[]}
```

### 9.2 Control Flow

```
START
  │
  ├─ Initialise PipelineState (run_id, user_query)
  │
  ├─ Call RAG-CodeGen.run(user_query, language)
  │   └─ Returns {code, explanation, context}
  │
  ├─ FOR iteration = 1 TO max_iterations:
  │    │
  │    ├─ IF iteration == 1:
  │    │    ├─ Phase 1: intent_based_retrieval(user_query)
  │    │    └─ Phase 2: initial_generation(query, context)
  │    │
  │    ├─ ELSE (iteration >= 2):
  │    │    ├─ [NOVEL] Run static analysis on current code
  │    │    ├─ [NOVEL] Run dynamic profiling on current code
  │    │    ├─ [NOVEL] Run adversarial tests on current code
  │    │    ├─ [NOVEL] Build targeted prompt from analysis
  │    │    ├─ Phase 4: execution_grounded_retrieval(exec_result, analysis)
  │    │    └─ Phase 2: repair OR optimise (with analysis-augmented prompt)
  │    │
  │    ├─ Phase 3: execute(code) → ExecutionResult
  │    ├─ Phase 5: review(code, exec_result) → Review
  │    ├─ Phase 6: decide(review, iteration) → DecisionResult
  │    │
  │    ├─ IF decision == TERMINATE_*:
  │    │    └─ BREAK
  │    └─ ELSE: CONTINUE loop
  │
  ├─ Build GenerateResponse from final state
  └─ RETURN response
END
```

---

## 10. Optimisation Factors by Stage

### 10.1 What Each Stage Optimises

| Factor | Stage 1 (RAG-CodeGen) | Stage 2 Iter 1 (EGRR Baseline) | Stage 2 Iter 2+ (Enhanced EGRR) |
|--------|----------------------|-------------------------------|--------------------------------|
| **Functional Correctness** | Initial attempt via RAG context | Test-driven validation | Adversarial edge-case coverage |
| **Code Quality** | — | Basic LLM review | Pylint score optimisation |
| **Complexity** | — | — | Radon cyclomatic complexity reduction |
| **Security** | — | LLM security review | Bandit vulnerability scanning |
| **Performance** | Constraint-guided (e.g., "use formula") | — | cProfile hotspot elimination |
| **Memory Efficiency** | — | — | memory_profiler peak reduction |
| **Test Coverage** | — | coverage.py measurement | Targeted test generation for gaps |
| **Maintainability** | — | — | Style improvement, complexity reduction |

### 10.2 Metrics Tracked Per Iteration

| Metric | Source | Iteration 1 | Iteration 2+ |
|--------|--------|-------------|--------------|
| Test pass rate (%) | pytest | ✓ | ✓ |
| Line coverage (%) | coverage.py | ✓ | ✓ |
| Cyclomatic complexity | Radon | — | ✓ [NOVEL] |
| Lint score (/10) | Pylint | — | ✓ [NOVEL] |
| Security issues (count) | Bandit | — | ✓ [NOVEL] |
| Execution time (ms) | cProfile | — | ✓ [NOVEL] |
| Peak memory (MB) | memory_profiler | — | ✓ [NOVEL] |
| Edge cases handled | Hypothesis | — | ✓ [NOVEL] |
| Optimisation score (0-1) | Review phase | ✓ | ✓ |
| Overall quality (0-1) | Review phase | ✓ | ✓ |
| Iteration duration (ms) | Orchestrator | ✓ | ✓ |

---

## 11. Experimental Comparison Design

### 11.1 Experimental Configurations

| Config | Stage 1 | Stage 2 | Novelty (Iter 2+) | Purpose |
|--------|---------|---------|-------------------|---------|
| **C1: LLM Only** | Non-RAG (use_rag=False) | Disabled | None | Baseline: raw LLM |
| **C2: RAG Only** | RAG-CodeGen | Disabled | None | Isolate RAG contribution |
| **C3: RAG + EGRR Baseline** | RAG-CodeGen | EGRR (all iters baseline) | None | Current system without novelty |
| **C4: RAG + Enhanced EGRR** | RAG-CodeGen | EGRR (iter 1 baseline, iter 2+ enhanced) | All mechanisms | Full proposed system |
| **C5: Non-RAG + Enhanced EGRR** | Non-RAG | EGRR enhanced | All mechanisms | Isolate RAG vs enhancement |

### 11.2 Comparison Matrix

```
                    ┌──────────┬──────────┬──────────┬──────────┬──────────┐
                    │ C1: LLM  │ C2: RAG  │ C3: RAG+ │ C4: RAG+ │ C5: No-  │
                    │ Only     │ Only     │ EGRR     │ Enhanced │ RAG+Enh  │
                    │          │          │ Baseline │ EGRR     │ EGRR     │
  ──────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
  RAG Retrieval     │    ✗     │    ✓     │    ✓     │    ✓     │    ✗     │
  Intent Normalise  │    ✗     │    ✓     │    ✓     │    ✓     │    ✗     │
  EGRR Loop         │    ✗     │    ✗     │    ✓     │    ✓     │    ✓     │
  Static Analysis   │    ✗     │    ✗     │    ✗     │    ✓     │    ✓     │
  Dynamic Profiling │    ✗     │    ✗     │    ✗     │    ✓     │    ✓     │
  Adversarial Tests │    ✗     │    ✗     │    ✗     │    ✓     │    ✓     │
  Progressive Obj.  │    ✗     │    ✗     │    ✗     │    ✓     │    ✓     │
  └──────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

### 11.3 Metrics for Comparison

| Category | Metric | How Measured |
|----------|--------|-------------|
| **Correctness** | Pass@1 (test pass rate) | Auto-generated pytest suite |
| **Correctness** | Edge-case robustness | Hypothesis property tests |
| **Performance** | Execution time (ms) | cProfile total time |
| **Performance** | Speedup factor | T(original) / T(optimised) |
| **Memory** | Peak memory (MB) | memory_profiler |
| **Memory** | Memory reduction (%) | M(original) / M(optimised) |
| **Security** | Vulnerability count | Bandit flag count |
| **Quality** | Cyclomatic complexity | Radon average per function |
| **Quality** | Pylint score | Pylint /10 scale |
| **Quality** | Maintainability index | Radon MI score |
| **Efficiency** | Iterations to convergence | Pipeline iteration count |
| **Coverage** | Line coverage (%) | coverage.py |

### 11.4 Expected Hypotheses

- **H1:** RAG-augmented generation (C2) produces higher pass@1 than raw LLM (C1)
- **H2:** EGRR iteration (C3) improves code quality metrics over single-pass RAG (C2)
- **H3:** Enhanced EGRR (C4) achieves lower complexity and fewer security issues than baseline EGRR (C3)
- **H4:** Static/dynamic analysis provides measurable targets that prevent iteration stagnation (C4 vs C3 convergence behaviour)
- **H5:** The full system (C4) outperforms all other configurations across all quality dimensions

---

## 12. Research Positioning & Contributions

### 12.1 Related Work Positioning

```
                           Uses Execution Feedback?
                           NO                    YES
                     ┌─────────────────┬──────────────────────┐
  Uses               │                 │                      │
  Retrieval    NO    │  Vanilla LLMs   │  Self-Debug,         │
  Augmentation?      │  (GPT-4, Codex) │  Reflexion, CodeRL   │
                     │                 │                      │
               YES   │  RAG-Code       │  THIS WORK           │
                     │  (RACE, ReACC,  │  (RAG + EGRR +       │
                     │   DocPrompting) │   Static/Dynamic     │
                     │                 │   Analysis)          │
                     └─────────────────┴──────────────────────┘
```

### 12.2 Research Contributions

1. **Two-stage architecture separating generation from optimisation** — RAG-CodeGen handles context-aware initial synthesis; EGRR handles execution-driven iterative refinement. Each stage is specialised for its core competency.

2. **Execution-grounded retrieval refinement** — A novel iterative mechanism where runtime feedback (test failures, coverage gaps, profiling hotspots) directly drives targeted re-retrieval from a specialised code corpus.

3. **Multi-tool analysis integration for LLM guidance** — Systematic integration of static analysis (Pylint, Radon, Bandit) and dynamic profiling (cProfile, memory_profiler) to provide **quantitative, actionable targets** for LLM optimisation, eliminating the stagnation problem.

4. **Progressive multi-objective optimisation** — Hierarchical optimisation (correctness → performance → security → maintainability) that ensures secondary objectives never compromise primary correctness.

5. **Adversarial test generation for robustness** — Property-based testing via Hypothesis to expose worst-case behaviour that standard test suites miss.

6. **Built-in ablation framework** — The `use_rag` flag and iteration-gated novelty enable rigorous controlled experiments within a single system.

### 12.3 Novelty Summary

| Innovation | What Exists | What This Work Adds |
|------------|------------|---------------------|
| RAG for code | RACE, ReACC — text-based retrieval | Intent-aware constraint injection + execution-grounded re-retrieval |
| Iterative refinement | Self-Refine, Reflexion — verbal reflection | Analysis-driven, quantitative target setting (not just verbal critique) |
| Code execution feedback | CodeT, CodeRL — pass/fail signal | Rich execution profile: timing, memory, coverage, complexity, security |
| Static analysis | Pylint, SonarQube — standalone tools | Integrated as real-time LLM guidance within iterative loop |
| Property-based testing | Hypothesis — standalone library | Integrated as adversarial oracle within optimisation loop |

---

## 13. Technology Stack

### 13.1 Complete Stack

| Layer | Component | Technology |
|-------|-----------|------------|
| **Frontend** | UI Framework | Next.js 16 + TypeScript + React 19 |
| | Styling | Tailwind CSS v4 |
| | Code Editor | Monaco Editor |
| | State | Zustand |
| | HTTP/SSE | Axios + native fetch ReadableStream |
| **API** | Framework | FastAPI + Uvicorn |
| | Validation | Pydantic v2 |
| | Streaming | SSE (sse-starlette) |
| **Stage 1 — RAG-CodeGen** | LLM | Llama-3.1-8B via HuggingFace Inference API |
| | Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| | Vector DB | FAISS (faiss-cpu) |
| | Pipeline | Custom Python CLI |
| **Stage 2 — EGRR** | LLM | deepseek-coder:6.7b via Ollama (local) |
| | Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| | Vector DB | FAISS |
| | Execution | subprocess + pytest + coverage.py |
| **Novelty Layer** | Static Analysis | Pylint, Radon, Bandit |
| | Dynamic Profiling | cProfile, memory_profiler |
| | Adversarial Testing | Hypothesis |
| **Quality** | Linting | Ruff |
| | Formatting | Black |
| | Type Checking | MyPy |
| | Testing | Pytest + pytest-asyncio + pytest-cov |
| | Package Mgmt | Poetry (Python), npm (Frontend) |

### 13.2 Corpus

29 hand-curated code pattern examples in 5 categories:

| Category | Count | Examples |
|----------|-------|---------|
| Algorithms | 8 | List boundary, dict key checks, binary search |
| Error Handling | 5 | File ops, network, parsing, cleanup |
| Security | 5 | Path traversal, SQL injection, XSS, input validation |
| Testing Patterns | 5 | Edge cases, exception tests, mock patterns |
| Validation | 6 | Email, URL, file type, schema validation |

---

## Appendix A: Reusability Notes

### For Research Paper

| Section | Maps to This Document Section |
|---------|-------------------------------|
| Abstract | §1.2 + §12.2 — problem, solution, contributions |
| Introduction | §1.1 + §1.3 + §12.1 — motivation, architecture overview, positioning |
| Related Work | §12.1 + §12.3 — positioning matrix and novelty comparison |
| Methodology | §4 + §5 + §7 — Stage 1, Stage 2, Enhanced mechanisms |
| System Architecture | §3 — layered diagrams, component interaction |
| Experimental Design | §11 — configurations, metrics, hypotheses |
| Results & Discussion | §10.2 metrics framework for reporting |

### For Thesis Material

All sections are directly reusable. The architecture diagrams (§3), iteration lifecycle (§6), and data flow (§9) provide chapter-length content.

### For System Documentation

§4, §5, §8, and §13 provide complete technical reference.

### For Presentation Material

- §1.4 (system-at-a-glance diagram) — title slide
- §6.3 (comparative table) — novelty slide
- §11.2 (comparison matrix) — experimental design slide
- §12.1 (positioning matrix) — related work slide

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **RAG** | Retrieval-Augmented Generation — enhancing LLM output with retrieved context |
| **EGRR** | Execution-Grounded Retrieval Refinement — the iterative optimisation methodology |
| **RAG-CodeGen** | Stage 1 pipeline for initial code generation using RAG |
| **FAISS** | Facebook AI Similarity Search — vector database for semantic retrieval |
| **SBERT** | Sentence-BERT — transformer model for text embedding |
| **Corpus** | Curated knowledge base of code patterns used for retrieval |
| **Iteration** | One full cycle through the pipeline phases |
| **Phase** | An individual step within an iteration |
| **Execution-Grounded** | Using actual code execution results as evidence for decisions |
| **Repair** | Targeted fix of specific issues identified in review |
| **Optimisation** | Improvement of correct code for quality, performance, security |
| **Re-Retrieval** | Phase 4 — retrieving new patterns based on execution errors |
| **SSE** | Server-Sent Events — protocol for streaming pipeline updates |
| **Static Analysis** | Code examination without execution (Pylint, Radon, Bandit) |
| **Dynamic Analysis** | Code examination during execution (cProfile, memory_profiler) |
| **Adversarial Testing** | Property-based testing to find worst-case inputs (Hypothesis) |
| **Progressive Objectives** | Hierarchical optimisation priorities per iteration |
