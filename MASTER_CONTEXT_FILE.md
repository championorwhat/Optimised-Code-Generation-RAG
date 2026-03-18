# MASTER CONTEXT FILE

## Project: Optimised Code Generation via Retrieval-Augmented Generation with Execution-Grounded Iterative Refinement

> **Purpose of This Document:** This file serves as a self-contained, authoritative reference describing the complete architecture, methodology, terminology, novelty, experimental design, and research positioning of the proposed system. It is intended for direct use as context input for any AI research assistant (Perplexity, Claude, ChatGPT, etc.) to enable precise, unambiguous, and technically grounded responses when generating IEEE-format research papers, thesis chapters, or presentation material. No follow-up clarification should be required.

---

## 1. Project Overview

This project presents a two-stage hybrid framework for automated, high-quality source code synthesis from natural language task descriptions. The system addresses a fundamental limitation of contemporary Large Language Model (LLM)-based code generation: single-pass synthesis produces code that frequently contains functional defects, security vulnerabilities, performance inefficiencies, and stylistic inconsistencies, with no mechanism for post-generation detection or correction.

The proposed framework decomposes the code generation problem into two sequentially composed, specialised pipelines:

1. **Stage 1 — RAG-CodeGen Pipeline:** A Retrieval-Augmented Generation pipeline that transforms a natural language task description into an initial code solution by grounding LLM inference in semantically retrieved code patterns from a curated corpus. This stage performs intent normalisation, constraint inference, semantic retrieval via FAISS and Sentence-BERT embeddings, structured prompt construction, and LLM-based code synthesis.

2. **Stage 2 — EGRR Pipeline (Execution-Grounded Retrieval Refinement):** A closed-loop, multi-phase iterative optimisation pipeline that takes the code produced by Stage 1 and refines it through repeated cycles of sandbox execution, evidence-based review, and targeted re-retrieval. From iteration 2 onward, the pipeline introduces novel mechanisms including static analysis (Pylint, Radon, Bandit), dynamic profiling (cProfile, memory_profiler), adversarial testing (Hypothesis), analysis-augmented prompt construction, and progressive multi-objective optimisation.

The full project title is:

> **"Optimised Code Generation via Retrieval-Augmented Generation with Execution-Grounded Iterative Refinement"**

The system accepts a natural language task description as input and produces optimised, tested, production-quality code as output, accompanied by test results, coverage reports, quality scores, and a complete iteration history.

---

## 2. Problem Definition

### 2.1 Core Problem

Large Language Models (LLMs) such as GPT-4, Codex, and Llama have demonstrated competent code generation capabilities. However, their output suffers from several well-documented deficiencies:

- **Functional Defects:** Generated code frequently fails edge cases, mishandles error conditions, or produces incorrect results for boundary inputs.
- **Security Vulnerabilities:** LLM-generated code may contain injection risks, path traversal vulnerabilities, unsafe deserialisation, or hardcoded credentials.
- **Performance Inefficiencies:** Generated solutions often employ suboptimal algorithms, unnecessary memory allocations, or redundant computations.
- **Stylistic Inconsistencies:** Output may violate naming conventions, exhibit high cyclomatic complexity, or lack proper documentation and type annotations.
- **No Post-Generation Correction:** Single-pass generation provides no mechanism for detecting these deficiencies after initial synthesis or iterating toward improvement.

### 2.2 Formal Problem Statement

Given a natural language task description *q* and a target programming language *l*, the objective is to produce a code artefact *c** that simultaneously satisfies the following multi-objective criteria:

- **Functional correctness:** *c** passes a comprehensive test suite *T* including adversarial edge cases.
- **Security compliance:** *c** contains zero known vulnerabilities as assessed by static security scanning.
- **Performance efficiency:** *c** executes within acceptable time and memory bounds as measured by dynamic profiling.
- **Maintainability:** *c** exhibits low cyclomatic complexity, high lint scores, and acceptable maintainability indices.

The system must achieve *c** through an automated, iterative process that requires no human intervention beyond the initial query *q*.

---

## 3. Limitations of Existing Systems

### 3.1 Vanilla LLM Code Generation (GPT-4, Codex, StarCoder)

- Single-pass synthesis with no execution feedback.
- No mechanism to verify functional correctness post-generation.
- No ability to leverage domain-specific code patterns beyond training data.
- Prone to hallucination, especially for less common algorithms or libraries.

### 3.2 Retrieval-Augmented Code Generation (RACE, ReACC, DocPrompting)

- Augment LLMs with retrieved code examples or documentation.
- Improve correctness for pattern-matching tasks.
- **Limitation:** Retrieved context is used only once during initial generation; no mechanism for re-retrieval based on execution feedback. Retrieval is text-driven, not execution-grounded.

### 3.3 Execution-Guided Refinement (Self-Debug, Reflexion, CodeRL)

- Use execution feedback (pass/fail, error messages) to guide iterative repair.
- **Limitation:** Feedback is typically limited to binary pass/fail signals or textual error messages. No integration of static analysis, dynamic profiling, or quantitative quality metrics. Prompts for repair remain generic (e.g., "fix the code"), leading to iteration stagnation where the LLM repeats the same errors.

### 3.4 Automated Program Repair (APR)

- Patch-based systems that localise and repair specific faults.
- **Limitation:** Designed for single-fault repair, not multi-objective optimisation. Cannot improve performance, security, or maintainability of functionally correct code.

### 3.5 Gap Addressed by This Work

No existing system combines all of the following:
1. Retrieval-augmented initial generation with intent-aware constraint injection.
2. Execution-grounded iterative refinement using actual runtime evidence.
3. Multi-tool static and dynamic analysis integrated as real-time LLM guidance within the iteration loop.
4. Targeted re-retrieval driven by execution errors, profiling hotspots, and security findings.
5. Progressive multi-objective optimisation with hierarchical priority ordering.
6. Adversarial property-based testing as an integrated robustness oracle.

---

## 4. Proposed Solution (High-Level)

The proposed system is a **two-stage, sequential pipeline architecture** consisting of:

**Stage 1 — RAG-CodeGen:** Accepts a natural language query, normalises the intent, retrieves semantically relevant code patterns from a curated FAISS-indexed corpus using Sentence-BERT embeddings, constructs a structured prompt merging the query with retrieved context and inferred constraints, invokes an LLM (Llama-3.1-8B-Instruct via HuggingFace Inference API) for code synthesis, and extracts structured output (code and explanation) from the LLM response.

**Stage 2 — EGRR:** Receives the initial code from Stage 1 and subjects it to a closed-loop iterative refinement process consisting of six phases per iteration: (1) Retrieval, (2) Generation, (3) Execution, (4) Re-Retrieval, (5) Review, and (6) Decision. In iteration 1, the pipeline operates as a baseline system (intent-based retrieval, initial generation, sandbox execution, review, and decision). From iteration 2 onward, novel mechanisms are introduced: static analysis, dynamic profiling, adversarial testing, analysis-augmented prompt construction, and execution-grounded re-retrieval. The loop terminates when either all quality thresholds are met (TERMINATE_SUCCESS) or a maximum iteration count is reached (TERMINATE_MAX_ITER).

The output is optimised, tested, production-ready code accompanied by test results, coverage reports, quality scores, and a complete iteration history.

---

## 5. Detailed Architecture Description

### 5.1 Component-Wise Breakdown

The system is organised into five architectural layers:

#### Layer 1: Presentation Layer
- **Frontend:** Next.js 16 with TypeScript and React 19.
- **Components:** Dashboard, EGRR Page with SSE streaming (LivePhaseTracker), Pipeline Visualisation (Timeline), Code Editor (Monaco Editor).
- **State Management:** Zustand.
- **Communication:** Axios for HTTP, native fetch ReadableStream for Server-Sent Events.

#### Layer 2: API Layer
- **Framework:** FastAPI with Uvicorn ASGI server.
- **Endpoints:** `POST /api/generate` (synchronous), `POST /api/generate/stream` (SSE streaming), `GET /health`.
- **Validation:** Pydantic v2 request/response schemas.
- **Streaming:** SSE via sse-starlette for real-time iteration progress.

#### Layer 3: Orchestration Layer
- **EGRROrchestrator:** Central controller managing pipeline state (`PipelineState`), controlling the iteration loop (configurable `max_iterations`), delegating to RAG-CodeGen (iteration 1) and EGRR phases, invoking novelty mechanisms (iteration 2+), and instrumenting timing per phase.

#### Layer 4: Core Logic Layer
- **Stage 1 — RAG-CodeGen Components:** `normalizer.py` (intent classification), `embedder.py` (Sentence-BERT encoding), `retriever.py` (FAISS search), `templates.py` (prompt construction), `llm_client.py` (HuggingFace API wrapper), `cleaner.py` (output parsing).
- **Stage 2 — EGRR Phase Components:** `retrieval.py` (intent-based and execution-grounded retrieval), `generation.py` (initial synthesis, targeted repair, scope-validated optimisation), `execution.py` (sandbox execution, test generation, coverage measurement), `review.py` (4-axis evidence-based evaluation), `decision.py` (termination logic and repair strategy generation).
- **Novelty Layer (Iteration 2+):** `static_analyser.py` (Pylint, Radon, Bandit integration), `dynamic_profiler.py` (cProfile, memory_profiler integration), `adversarial_tester.py` (Hypothesis property-based testing), `analysis_prompt_builder.py` (targeted prompt construction from analysis findings), `progressive_objectives.py` (hierarchical optimisation priority management).

#### Layer 5: Infrastructure Layer
- **LLM Client (Stage 1):** HuggingFace Inference API wrapper for Llama-3.1-8B-Instruct.
- **LLM Client (Stage 2):** Ollama wrapper (via httpx) for deepseek-coder:6.7b with retry logic and JSON extraction.
- **Vector Database:** FAISS (faiss-cpu) with Sentence-BERT (all-MiniLM-L6-v2) embeddings for both stages.
- **Code Sandbox:** subprocess-based execution with pytest and coverage.py integration.
- **Static Analysis Tools:** Pylint (lint scoring), Radon (cyclomatic complexity, maintainability index), Bandit (security vulnerability detection with CWE identifiers).
- **Dynamic Profiling Tools:** cProfile (per-function execution time), memory_profiler (per-line memory usage), coverage.py (line coverage).
- **Adversarial Testing:** Hypothesis library for property-based edge-case generation.

#### Domain Layer
- **Entities:** 15+ Pydantic v2 models including `PipelineState`, `GeneratedCode`, `ExecutionResult`, `Review`, `DecisionResult`, `RepairStrategy`, `StaticAnalysisReport`, `DynamicProfileReport`, `AdversarialTestResult`.
- **Value Objects:** 5 enumerations including `PipelinePhase`, `ExecutionStatus`, `DecisionType`, `RepairMode`, `OptimisationObjective`.

### 5.2 Data Flow Explanation

The end-to-end data flow proceeds as follows:

1. **User Query** → API Layer (FastAPI receives `POST /api/generate` with `GenerateRequest` schema).
2. **API Layer** → Orchestrator (EGRROrchestrator initialises `PipelineState` with run_id, user query, and configuration).
3. **Orchestrator** → RAG-CodeGen:
   - Query → `normalizer.py` → `{intent, constraints}`
   - Query → `embedder.py` → `query_vector` → `retriever.py` (FAISS) → `CodeExample[]`
   - Query + constraints + CodeExample[] → `templates.py` → `LLM_prompt`
   - LLM_prompt → `llm_client.py` (Llama-3.1-8B) → `raw_output` → `cleaner.py` → `{code, explanation}`
4. **Orchestrator** → EGRR Iteration Loop:
   - **Iteration 1 (Baseline):**
     - user_query → retrieval (intent-based) → queries[] + context_docs[]
     - user_query + context_docs → generation (initial) → `GeneratedCode`
     - GeneratedCode → execution (sandbox + pytest + coverage.py) → `ExecutionResult`
     - code + ExecutionResult → review (4-axis) → `Review`
     - Review + iteration_count → decision → `DecisionResult`
   - **Iteration 2+ (Enhanced, if CONTINUE):**
     - code → static_analysis → `StaticAnalysisReport`
     - code + tests → dynamic_profiler → `DynamicProfileReport`
     - code + signatures → adversarial_tester → `AdversarialTestResult`
     - All reports → analysis_prompt_builder → `targeted_prompt`
     - errors + reports → re-retrieval (execution-grounded) → new context_docs[]
     - targeted_prompt + new context → generation (repair/optimise) → improved code
     - improved code → execution → new `ExecutionResult`
     - Re-review → Re-decision → TERMINATE or LOOP
5. **Orchestrator** → API Layer → `GenerateResponse` (final code, explanation, iterations, status, coverage, tests, iteration_details[], total_duration_ms, retrieved_patterns[]).

### 5.3 Interaction Between RAG-CodeGen and EGRR

The two stages interact through a **sequential handoff**:

- RAG-CodeGen produces an initial code artefact grounded in retrieved patterns. This code is functionally plausible but unverified.
- EGRR receives this code as its starting input and treats it as the "iteration 0" artefact.
- EGRR iteration 1 performs independent retrieval (intent-based), generates a potentially improved version, then executes and reviews it with actual runtime evidence.
- If the decision phase determines further refinement is needed, iterations 2+ introduce the full novelty layer (static analysis, dynamic profiling, adversarial testing) and drive targeted re-retrieval from the same FAISS-indexed corpus.
- Both stages share the same embedding model (all-MiniLM-L6-v2) and the same corpus, ensuring retrieval consistency.

---

## 6. Stage 1: RAG-CodeGen Pipeline — Detailed Description

### 6.1 Intent Normalisation (`normalizer.py`)

**Purpose:** Classify the user's task type and infer algorithmic constraints that guide code generation.

**Mechanism:**
- Input: Raw natural language task string (e.g., "find the sum of first N natural numbers").
- Process: Keyword-based classification using predefined pattern matching against known task categories (mathematical computation, string manipulation, data structure operations, sorting/searching, file I/O, etc.).
- Constraint inference: For recognised patterns, the normaliser injects algorithmic guidance (e.g., "prefer closed-form formula over loop for sum of N natural numbers").
- Output: `{ intent: "mathematical_computation", constraints: ["prefer formula over loop for sum of N"] }`.

**Significance:** This is not a trivial classification step. The inferred constraints provide *algorithmic direction* to the LLM, steering it toward efficient solutions that a generic prompt would miss. This distinguishes RAG-CodeGen from simple retrieval-then-generate pipelines.

### 6.2 Semantic Retrieval (FAISS + Sentence-BERT Embeddings)

**Embedding:**
- Model: `all-MiniLM-L6-v2` from the sentence-transformers library.
- Output: 384-dimensional dense vector representation of the query.

**Indexing:**
- Corpus: 29 hand-curated code pattern examples across 5 categories (Algorithms: 8, Error Handling: 5, Security: 5, Testing Patterns: 5, Validation: 6).
- Each example is a JSON object containing: task description, code implementation, explanation, language, and category tags.
- Corpus is embedded and indexed in a FAISS L2 (Euclidean distance) index at system initialisation.

**Retrieval:**
- The user query is embedded using the same model.
- FAISS performs nearest-neighbour search returning top-k (configurable, default k=3) closest code examples.
- Results are filtered by target programming language.
- Each retrieved example includes a similarity score.
- Output: `CodeExample[]` with similarity scores.

### 6.3 Prompt Engineering (`templates.py`)

The prompt construction phase merges four components into a structured LLM prompt:

1. **User's original task description** — presented verbatim.
2. **Retrieved code examples** — presented as reference patterns with their explanations.
3. **Inferred constraints** — from the intent normaliser (e.g., "prefer formula over loop").
4. **Target programming language** — explicit language specification.

The prompt uses explicit XML-style tags (`<CODE>`, `<EXPLANATION>`) to structure the expected LLM output format, enabling reliable post-processing.

### 6.4 LLM Inference (`llm_client.py`)

- **Model:** `meta-llama/Llama-3.1-8B-Instruct` via HuggingFace Inference API.
- **Configuration:** Configurable temperature, max_tokens, and stop sequences.
- **Output:** Raw text containing generated code within `<CODE>` tags and explanation within `<EXPLANATION>` tags.

### 6.5 Structured Output Extraction (`cleaner.py`)

- Parses the raw LLM output to extract:
  - Code block from `<CODE>...</CODE>` tags.
  - Explanation from `<EXPLANATION>...</EXPLANATION>` tags.
- Handles malformed output gracefully (e.g., missing tags, partial output).
- Returns structured dictionary: `{ code: str, explanation: str }`.

### 6.6 RAG vs. Non-RAG Mode

The pipeline supports a `use_rag` boolean flag:

| Mode | Retrieval | Context Provided to LLM | Use Case |
|------|-----------|-------------------------|----------|
| **RAG (default)** | FAISS semantic search executed | Retrieved code patterns + inferred constraints | Production use |
| **Non-RAG** | Retrieval skipped entirely | Inferred constraints only (no retrieved examples) | Experimental baseline for ablation |

This built-in toggle enables direct ablation experiments comparing RAG-augmented generation vs. raw LLM generation within the same system.

---

## 7. Stage 2: EGRR Optimisation Pipeline — Detailed Description

### 7.1 Iterative Loop — Algorithmic Description

```
Algorithm: EGRR Iterative Refinement
─────────────────────────────────────

Input:  q (user query), c_0 (initial code from RAG-CodeGen), l (language),
        max_iter (maximum iterations), thresholds (quality, optimisation)
Output: c* (optimised code), R (iteration history)

1.  Initialise PipelineState S with run_id, q, c_0, l
2.  R ← empty list  // iteration history

3.  FOR i = 1 TO max_iter DO:
4.      IF i == 1 THEN:
5.          // Baseline iteration — no novelty mechanisms
6.          queries ← LLM_generate_search_queries(q)  // 3-5 queries from intent
7.          context ← parallel_FAISS_search(queries)    // async retrieval
8.          context ← deduplicate(context)
9.          c_i ← LLM_generate(q, context)              // initial synthesis
10.         validate_syntax(c_i)                         // AST check
11.         sanitize(c_i)                                // remove test contamination
12.
13.     ELSE:  // i >= 2 — Enhanced iteration with novelty
14.         // Novel mechanisms
15.         SA ← static_analysis(c_{i-1})               // Pylint + Radon + Bandit
16.         DP ← dynamic_profile(c_{i-1}, T_{i-1})      // cProfile + memory_profiler
17.         AT ← adversarial_test(c_{i-1})               // Hypothesis edge cases
18.
19.         // Analysis-augmented prompt construction
20.         prompt ← build_targeted_prompt(c_{i-1}, SA, DP, AT, objective_i)
21.         // Example: "Reduce cyclomatic complexity from 12 to <6"
22.         // Example: "Eliminate Bandit security warning B301"
23.
24.         // Execution-grounded re-retrieval
25.         error_queries ← extract_error_patterns(E_{i-1}, SA, DP)
26.         new_context ← FAISS_search(error_queries)
27.
28.         // Repair or optimise
29.         IF critical_issues(R_{i-1}) THEN:
30.             c_i ← LLM_repair(c_{i-1}, prompt, new_context)  // targeted fix
31.         ELSE:
32.             c_i ← LLM_optimise(c_{i-1}, prompt, new_context)  // quality improvement
33.         END IF
34.         validate_scope(c_{i-1}, c_i)                  // preserve function signatures
35.
36.     END IF
37.
38.     // Common to all iterations: Execution, Review, Decision
39.     T_i ← LLM_generate_tests(c_i, q)                 // pytest test suite
40.     E_i ← sandbox_execute(c_i, T_i)                   // subprocess + pytest + coverage
41.     R_i ← LLM_review(c_i, E_i, axes=[correctness, security, robustness, performance])
42.     D_i ← decide(R_i, i, max_iter, thresholds)
43.
44.     Append {c_i, E_i, R_i, D_i, SA, DP, AT} to R
45.
46.     IF D_i.type ∈ {TERMINATE_SUCCESS, TERMINATE_MAX_ITER} THEN:
47.         BREAK
48.     END IF
49.
50. END FOR
51.
52. c* ← c_i   // final optimised code
53. RETURN (c*, R)
```

### 7.2 Execution Engine (`execution.py`)

The execution phase employs a three-step strategy:

**Step 1 — Syntax Validation:**
- Executes the generated code in a standalone subprocess to catch syntax errors, import errors, and top-level runtime exceptions.
- Uses Python's `ast.parse()` as a preliminary check.

**Step 2 — Test Generation:**
- The LLM generates a comprehensive pytest test suite based on the user query and generated function signatures.
- A fallback mechanism generates basic smoke tests if the LLM-generated tests are malformed.

**Step 3 — Sandbox Execution:**
- Runs `coverage run --source=solution -m pytest` in a subprocess.
- Captures: pass count, fail count, failure messages, line coverage percentage, uncovered line numbers.
- Output: `ExecutionResult` containing `status` (ExecutionStatus enum), `stdout`, `stderr`, `test_results`, `coverage_percentage`, `uncovered_lines`.

### 7.3 Static Analysis Integration (Iteration 2+ Only)

Three static analysis tools are integrated:

**Pylint:**
- Produces a lint score (0-10 scale), identifies convention violations, unused imports, naming issues, and code smells.
- Output drives prompts like: "Address Pylint warnings: unused imports, naming conventions."

**Radon:**
- Computes cyclomatic complexity per function and maintainability index per module.
- Output drives prompts like: "Refactor function X to reduce cyclomatic complexity from 12 to <6."

**Bandit:**
- Scans for known security vulnerabilities with CWE identifiers.
- Detects: pickle usage (B301), hardcoded passwords (B105), SQL injection (B608), etc.
- Output drives prompts like: "Replace pickle with json for untrusted data (B301)."

Combined output: `StaticAnalysisReport { lint_score, complexity_per_function, security_issues, warnings, maintainability_index }`.

### 7.4 Dynamic Profiling (Iteration 2+ Only)

Three dynamic analysis tools are integrated:

**cProfile:**
- Records per-function execution time, cumulative call times, and call counts.
- Identifies hotspot functions consuming disproportionate execution time.

**memory_profiler:**
- Measures per-line memory allocation, peak memory usage, and memory growth patterns.

**coverage.py:**
- Provides line-by-line coverage analysis, identifying untested code paths and uncovered branches.

Combined output: `DynamicProfileReport { hotspot_functions, memory_peaks, coverage_gaps, total_execution_time, peak_memory_mb }`.

### 7.5 Error-Grounded Re-Retrieval

In iteration 2+, re-retrieval is driven by concrete execution evidence rather than the original user intent:

- **Error pattern extraction:** Test failures, exception types, and error messages are parsed to generate targeted search queries.
- **Profiling-driven queries:** Hotspot functions and memory-heavy operations generate queries for optimised algorithmic patterns.
- **Security-driven queries:** Bandit findings generate queries for secure coding patterns (e.g., "secure file handling without path traversal").
- **FAISS search:** Generated queries are used to retrieve new, relevant code patterns from the corpus.
- **Deduplication:** Previously retrieved patterns are excluded to ensure fresh context.

This mechanism ensures that retrieval becomes progressively more targeted with each iteration, directly addressing the specific deficiencies identified by execution and analysis.

### 7.6 Optimisation Decision Engine (`decision.py`)

The decision engine evaluates the review output and determines the next action:

```
Decision Logic:
IF max_iterations reached:
    IF critical_issues present:
        → TERMINATE_MAX_ITER (with critical issues flagged)
    ELSE:
        → TERMINATE_SUCCESS
ELSE IF critical_issues present:
    → CONTINUE with repair strategy (targeted fix)
ELSE IF optimisation_score < 0.95:
    → CONTINUE with optimisation strategy (quality improvement)
ELSE:
    → TERMINATE_SUCCESS
```

Output: `DecisionResult { decision: DecisionType, rationale: str, repair_strategy: RepairStrategy | None }`.

The `RepairStrategy` specifies the repair mode (targeted repair or optimisation), the specific issues to address, and the suggested approach.

---

## 8. Integration Logic

### 8.1 Why Sequential Architecture?

The two stages are composed sequentially (not in parallel or interleaved) for the following reasons:

1. **Separation of concerns:** Code generation and code optimisation are fundamentally different tasks requiring different retrieval strategies, prompt structures, and evaluation criteria. Conflating them in a single pass produces neither excellent generation nor effective optimisation.

2. **Baseline establishment:** Stage 1 produces a functionally plausible starting point that Stage 2 can concretely evaluate against execution evidence. Without a concrete initial artefact, the EGRR loop has no code to execute, test, or analyse.

3. **Ablation support:** Sequential composition allows each stage to be independently evaluated, disabled, or replaced. This is essential for rigorous experimental evaluation.

4. **Specialised LLM selection:** Stage 1 uses Llama-3.1-8B-Instruct (via HuggingFace cloud API), optimised for instruction following and initial generation. Stage 2 uses deepseek-coder:6.7b (via local Ollama), specialised for code understanding and repair.

### 8.2 Why Separation of Generation and Optimisation?

1. **Cognitive load reduction for the LLM:** Asking an LLM to simultaneously generate correct, secure, performant, and maintainable code in a single pass imposes excessive cognitive load, leading to suboptimal trade-offs. Separating generation (produce something correct) from optimisation (improve specific quality axes) reduces this burden.

2. **Evidence-grounded feedback:** Optimisation requires concrete evidence (test results, profiling data, static analysis reports) that can only be obtained *after* code exists. The generation stage provides the artefact; the optimisation stage provides the evidence-based refinement.

3. **Progressive refinement is more effective than single-shot perfection:** Research in iterative refinement (Self-Refine, Reflexion) demonstrates that multi-step improvement with feedback consistently outperforms single-pass generation across code quality metrics.

4. **Debugging vs. creating:** The skills required for initial code creation (understanding requirements, selecting algorithms, structuring solutions) differ from those required for debugging and optimisation (reading error messages, interpreting profiling data, applying targeted fixes). Separating these tasks allows each stage to employ optimised prompting strategies.

---

## 9. Novel Contributions

### 9.1 Two-Stage Separation of Generation and Optimisation

**What exists:** Existing systems either generate code in a single pass (Codex, GPT-4) or apply iterative refinement directly to the generation process (Self-Refine, Reflexion). No system explicitly separates initial RAG-augmented generation from execution-grounded iterative optimisation as distinct pipeline stages.

**What this work contributes:** A principled architectural decomposition where Stage 1 (RAG-CodeGen) is specialised for context-aware initial synthesis and Stage 2 (EGRR) is specialised for execution-driven, analysis-guided iterative refinement. This separation enables independent evaluation, ablation, and optimisation of each stage.

### 9.2 Execution-Grounded Retrieval Refinement

**What exists:** RAG systems (RACE, ReACC, DocPrompting) perform retrieval based on the input query. Retrieval is text-driven and occurs only once during generation. Iterative systems (Self-Debug, Reflexion) use execution feedback but do not use it to drive new retrieval.

**What this work contributes:** A novel mechanism where runtime feedback — test failures, error messages, coverage gaps, profiling hotspots, and security findings — directly drives targeted re-retrieval from a specialised code corpus. This creates a feedback loop between execution evidence and knowledge retrieval that progressively narrows the gap between current and desired code quality.

### 9.3 Static + Dynamic Analysis Inside the Iteration Loop

**What exists:** Static analysis tools (Pylint, SonarQube) and dynamic profiling tools (cProfile, Valgrind) are used as standalone, post-hoc quality assessment tools. They are not integrated into LLM-based code generation workflows.

**What this work contributes:** Systematic integration of static analysis (Pylint, Radon, Bandit) and dynamic profiling (cProfile, memory_profiler) *within* the iterative refinement loop, where their quantitative outputs are translated into specific, measurable LLM prompt targets. For example, "Reduce cyclomatic complexity from 12 to <6" or "Optimise function X which consumes 82% of execution time." This provides the LLM with concrete, actionable improvement directives rather than vague instructions like "fix the code," directly addressing the stagnation problem observed in existing iterative systems.

### 9.4 Multi-Objective Progressive Optimisation

**What exists:** Existing iterative refinement systems typically focus on a single objective (usually correctness) or apply all objectives simultaneously without prioritisation.

**What this work contributes:** A hierarchical optimisation strategy where objectives are pursued in priority order across iterations:
- **Priority 1 (Iteration 2):** Correctness — fix all test failures.
- **Priority 2 (Iteration 3):** Performance — eliminate profiling hotspots, reduce complexity.
- **Priority 3 (Iteration 4):** Security — resolve Bandit findings, add input validation.
- **Priority 4 (Iteration 5):** Maintainability — improve lint scores, reduce cyclomatic complexity, enhance style.

This progressive approach ensures that correctness is never sacrificed for secondary objectives, and each iteration has a clearly defined focus.

### 9.5 Adversarial Property-Based Testing as Integrated Oracle

**What exists:** Property-based testing (Hypothesis, QuickCheck) is used as a standalone testing methodology. It is not integrated into LLM-based code generation workflows.

**What this work contributes:** Integration of Hypothesis property-based testing as an adversarial robustness oracle within the optimisation loop. The adversarial tester generates edge-case inputs (empty strings, None, maximum integers, Unicode, very large collections, boundary values) and stress inputs that expose worst-case behaviour missed by standard LLM-generated test suites. Findings are fed back as concrete repair directives.

### 9.6 Built-In Ablation Framework

**What exists:** Most research systems require significant code modification to conduct ablation experiments.

**What this work contributes:** The system's architecture includes built-in experimental controls:
- `use_rag` flag: Enables/disables RAG retrieval in Stage 1.
- Iteration-gated novelty: The `iteration >= 2` gate enables/disables all novelty mechanisms.
- Configurable `max_iterations`: Controls the depth of iterative refinement.
- Five pre-defined experimental configurations (C1–C5) enabling systematic comparison.

---

## 10. Experimental Setup

### 10.1 Benchmarks

| Benchmark | Description | Scale | Use |
|-----------|-------------|-------|-----|
| **HumanEval** | 164 hand-crafted Python programming problems by OpenAI | 164 tasks | Standard code generation benchmark; measures functional correctness |
| **MBPP** | Mostly Basic Python Programming — 974 crowd-sourced Python tasks | 974 tasks (sanitised subset: 427) | Broader coverage of basic programming tasks |
| **Custom Benchmark** | Project-specific tasks covering security-sensitive operations, performance-critical algorithms, and multi-constraint problems | TBD | Evaluates system-specific novelty (security optimisation, profiling-driven improvement) |

### 10.2 Metrics

| Category | Metric | Definition | Measurement Tool |
|----------|--------|------------|-----------------|
| **Correctness** | Pass@1 | Fraction of problems where the first generated solution passes all tests | Auto-generated pytest suite |
| **Correctness** | Pass@k | Fraction of problems solved in k attempts (k=1, 5, 10) | Multiple generation runs |
| **Correctness** | Edge-case robustness | Fraction of Hypothesis-generated edge cases handled correctly | Hypothesis property-based tests |
| **Coverage** | Line coverage (%) | Percentage of code lines executed by the test suite | coverage.py |
| **Performance** | Execution time (ms) | Total execution time of generated solution on benchmark inputs | cProfile |
| **Performance** | Speedup factor | Ratio of original to optimised execution time | T(iter 1) / T(iter N) |
| **Memory** | Peak memory (MB) | Maximum memory allocation during execution | memory_profiler |
| **Security** | Vulnerability count | Number of Bandit security findings in generated code | Bandit |
| **Quality** | Cyclomatic complexity | Average cyclomatic complexity per function | Radon |
| **Quality** | Lint score (/10) | Pylint code quality score | Pylint |
| **Quality** | Maintainability index | Radon maintainability index (0-100 scale) | Radon |
| **Efficiency** | Iterations to convergence | Number of EGRR iterations before TERMINATE_SUCCESS | Pipeline counter |

### 10.3 Baselines and Experimental Configurations

| Configuration | Stage 1 | Stage 2 | Novelty (Iter 2+) | Purpose |
|---------------|---------|---------|-------------------|---------|
| **C1: LLM Only** | Non-RAG (`use_rag=False`) | Disabled | None | Baseline: raw LLM generation without retrieval or refinement |
| **C2: RAG Only** | RAG-CodeGen | Disabled | None | Isolate contribution of retrieval augmentation |
| **C3: RAG + EGRR Baseline** | RAG-CodeGen | EGRR (all iterations run as baseline) | None | Current system without novelty mechanisms |
| **C4: RAG + Enhanced EGRR (Full System)** | RAG-CodeGen | EGRR (iter 1 baseline, iter 2+ enhanced) | All mechanisms enabled | **Full proposed system** |
| **C5: Non-RAG + Enhanced EGRR** | Non-RAG | EGRR enhanced | All mechanisms enabled | Isolate RAG contribution vs. EGRR enhancement contribution |

### 10.4 Ablation Study Design

The following ablation possibilities are supported by the system architecture:

| Ablation | Mechanism | Hypothesis Tested |
|----------|-----------|-------------------|
| Remove RAG retrieval (C1 vs C2) | `use_rag=False` | RAG improves initial code quality |
| Remove EGRR loop (C2 vs C3) | Disable Stage 2 | Iterative refinement improves code beyond single-pass RAG |
| Remove novelty mechanisms (C3 vs C4) | All iterations use baseline logic | Static/dynamic analysis and adversarial testing provide measurable improvement |
| Remove static analysis only | Disable Pylint/Radon/Bandit in iter 2+ | Static analysis contributes to quality improvement |
| Remove dynamic profiling only | Disable cProfile/memory_profiler in iter 2+ | Dynamic profiling contributes to performance improvement |
| Remove adversarial testing only | Disable Hypothesis in iter 2+ | Adversarial testing contributes to robustness improvement |
| Remove RAG from EGRR (C4 vs C5) | Non-RAG Stage 1 + Enhanced Stage 2 | RAG complements EGRR rather than being redundant |
| Vary max_iterations | Set max_iter = 1, 2, 3, 5, 10 | Convergence behaviour and diminishing returns analysis |

### 10.5 Expected Experimental Hypotheses

- **H1:** RAG-augmented generation (C2) produces significantly higher Pass@1 than raw LLM generation (C1).
- **H2:** EGRR iterative refinement (C3) improves code quality metrics (coverage, correctness) over single-pass RAG (C2).
- **H3:** Enhanced EGRR with novelty mechanisms (C4) achieves lower cyclomatic complexity and fewer security vulnerabilities than baseline EGRR (C3).
- **H4:** Analysis-driven prompting provides measurable, concrete targets that prevent iteration stagnation, as evidenced by improved convergence behaviour in C4 vs. C3.
- **H5:** The full system (C4) outperforms all other configurations across all quality dimensions simultaneously.
- **H6:** Progressive optimisation objectives ensure correctness is maintained or improved even while pursuing secondary objectives.

---

## 11. Cloud Architecture & Deployment Design

### 11.1 Microservices Architecture

The system is designed as a set of loosely coupled services:

| Service | Responsibility | Technology |
|---------|---------------|------------|
| **Frontend Service** | User interface, code editor, pipeline visualisation | Next.js 16, deployed as static/SSR |
| **API Gateway** | Request routing, rate limiting, authentication | FastAPI + Uvicorn |
| **RAG-CodeGen Service** | Stage 1 pipeline execution | Python, HuggingFace API |
| **EGRR Orchestration Service** | Stage 2 pipeline control, iteration management | Python, Ollama |
| **Execution Sandbox Service** | Isolated code execution environment | subprocess, Docker containers |
| **Vector Store Service** | FAISS index management, embedding computation | FAISS, sentence-transformers |
| **Analysis Service** | Static analysis and dynamic profiling | Pylint, Radon, Bandit, cProfile |

### 11.2 Asynchronous Execution

- **SSE Streaming:** The `POST /api/generate/stream` endpoint uses Server-Sent Events to stream iteration progress to the frontend in real time.
- **Async phases:** Retrieval queries are executed in parallel using Python's `asyncio` for concurrent FAISS searches.
- **Non-blocking execution:** Sandbox code execution runs in separate subprocesses, preventing blocking of the main API event loop.

### 11.3 Security Sandbox

- **Code isolation:** Generated code is executed in isolated subprocess environments with restricted file system access.
- **Timeout enforcement:** Each execution step has configurable timeouts to prevent infinite loops or resource exhaustion.
- **Output sanitisation:** Subprocess output is sanitised before being included in API responses.
- **Container-based isolation (production):** For production deployment, code execution is designed for Docker container isolation with resource limits (CPU, memory, disk, network).

### 11.4 Scalability Design

- **Horizontal scaling:** API and orchestration services are stateless and horizontally scalable behind a load balancer.
- **LLM serving:** Stage 1 uses cloud-hosted HuggingFace Inference API (scalable by provider). Stage 2 uses local Ollama, scalable by deploying multiple instances with GPU allocation.
- **Vector store:** FAISS indices are read-only after initialisation and can be replicated across instances.
- **Execution workers:** Sandbox execution can be distributed across multiple worker nodes for parallel task processing.

---

## 12. Research Positioning

### 12.1 Relation to RAG Systems

The proposed system extends the RAG (Retrieval-Augmented Generation) paradigm in two significant ways:

1. **Intent-aware constraint injection:** Unlike standard RAG systems (RACE, ReACC) that perform text-similarity retrieval, RAG-CodeGen includes an intent normalisation step that infers algorithmic constraints and injects them into the prompt. This provides semantic-level guidance beyond lexical-level pattern matching.

2. **Execution-grounded re-retrieval:** Standard RAG performs retrieval once, based on the input query. This work introduces iterative re-retrieval where the retrieval queries are generated from execution feedback (test failures, profiling results, security findings), creating a closed loop between code execution and knowledge retrieval.

### 12.2 Relation to Execution-Guided Code Generation

The proposed system relates to but differs from existing execution-guided systems:

| System | Feedback Signal | Retrieval | Analysis |
|--------|----------------|-----------|----------|
| **Self-Debug** | Error messages (textual) | None | None |
| **Reflexion** | Verbal self-reflection | None | None |
| **CodeRL** | Reward from test outcomes | None | None |
| **CodeT** | Dual execution agreement | None | None |
| **This Work** | Test results + coverage + static analysis + dynamic profiling + adversarial testing | Execution-grounded re-retrieval | Pylint + Radon + Bandit + cProfile + memory_profiler |

The key differentiator is the richness of the feedback signal. Existing systems use at most pass/fail and error messages. This work integrates a comprehensive, multi-dimensional quality assessment that provides quantitative, actionable targets for LLM-guided optimisation.

### 12.3 Relation to Automated Program Repair (APR)

The EGRR pipeline shares conceptual similarities with APR but differs in scope and mechanism:

- **APR** focuses on localising and patching individual faults in existing, large codebases. It is fundamentally a single-fault, single-fix methodology.
- **EGRR** operates on LLM-generated code and pursues multi-objective optimisation (correctness, performance, security, maintainability) through iterative refinement. It is not limited to fault repair; it also optimises functionally correct code for non-functional quality attributes.

### 12.4 Research Positioning Matrix

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

This work uniquely occupies the intersection of retrieval augmentation AND execution-guided refinement, enhanced with multi-tool static and dynamic analysis.

---

## 13. Clear Summary Paragraph

This work presents a two-stage framework for automated, optimised code generation from natural language specifications. Stage 1 (RAG-CodeGen) transforms a user query into an initial code solution through intent normalisation, Sentence-BERT embedded semantic retrieval from a FAISS-indexed curated corpus of 29 code patterns, constraint-augmented prompt construction, and LLM-based synthesis using Llama-3.1-8B-Instruct. Stage 2 (EGRR — Execution-Grounded Retrieval Refinement) subjects the initial code to a closed-loop, multi-phase iterative refinement process. In iteration 1, the baseline pipeline performs independent retrieval, generation, sandbox execution with pytest and coverage.py, four-axis evidence-based review (correctness, security, robustness, performance), and a decision on whether to continue or terminate. From iteration 2 onward, five novel mechanisms are introduced: (a) static analysis via Pylint, Radon, and Bandit providing quantitative code quality, complexity, and security metrics; (b) dynamic profiling via cProfile and memory_profiler identifying execution hotspots and memory peaks; (c) adversarial property-based testing via Hypothesis exposing edge-case failures; (d) analysis-augmented prompt construction translating quantitative findings into specific, measurable LLM optimisation targets (e.g., "reduce cyclomatic complexity from 12 to <6"); and (e) execution-grounded re-retrieval where error patterns, profiling data, and security findings drive targeted queries against the code corpus for fresh context. A progressive multi-objective optimisation strategy ensures that correctness is prioritised above performance, security, and maintainability in subsequent iterations. The iteration-gated novelty introduction (baseline in iteration 1, enhanced in iteration 2+) enables direct ablation between the baseline and enhanced systems. Evaluation employs HumanEval and MBPP benchmarks with metrics including Pass@k, line coverage, execution time, peak memory, cyclomatic complexity, Pylint score, security vulnerability count, and iterations to convergence, compared across five experimental configurations ranging from raw LLM generation to the full proposed system.

---

## Appendix A: Terminology and Definitions

| Term | Full Form | Definition |
|------|-----------|------------|
| **RAG** | Retrieval-Augmented Generation | A paradigm where LLM generation is enhanced by injecting retrieved documents or code patterns as context. |
| **EGRR** | Execution-Grounded Retrieval Refinement | The novel iterative optimisation methodology proposed in this work, where execution evidence drives re-retrieval and targeted refinement. |
| **RAG-CodeGen** | RAG-Based Code Generation Pipeline | Stage 1 of the system: initial code generation using retrieval-augmented LLM inference. |
| **FAISS** | Facebook AI Similarity Search | An open-source library for efficient similarity search and clustering of dense vectors. |
| **SBERT** | Sentence-BERT | A modification of the BERT architecture producing semantically meaningful sentence embeddings, used here for code/text similarity. |
| **Corpus** | Code Pattern Corpus | A curated knowledge base of 29 code pattern examples across 5 categories (algorithms, error handling, security, testing, validation). |
| **PipelineState** | — | The central state object tracking run ID, current iteration, code history, execution results, and review history across the EGRR loop. |
| **Phase** | — | An individual step within an EGRR iteration (Retrieval, Generation, Execution, Re-Retrieval, Review, Decision). |
| **Iteration** | — | One complete cycle through all phases of the EGRR pipeline. |
| **Execution-Grounded** | — | Decisions, retrieval queries, or prompts that are derived from actual code execution results rather than textual analysis or heuristics. |
| **Repair** | — | Targeted modification of code to fix specific critical issues identified during review. |
| **Optimisation** | — | Improvement of functionally correct code along non-functional quality axes (performance, security, maintainability). |
| **Re-Retrieval** | — | A second or subsequent retrieval operation driven by execution feedback rather than the original user query. |
| **Static Analysis** | — | Code examination without execution, using tools such as Pylint (quality), Radon (complexity), and Bandit (security). |
| **Dynamic Analysis** | — | Code examination during execution, using tools such as cProfile (timing), memory_profiler (memory), and coverage.py (coverage). |
| **Adversarial Testing** | — | Property-based testing using Hypothesis to generate worst-case inputs that expose failures missed by standard test suites. |
| **Progressive Objectives** | — | Hierarchical optimisation strategy: correctness → performance → security → maintainability, ensuring primary objectives are never sacrificed for secondary ones. |
| **Stagnation Problem** | — | The phenomenon where iterative LLM refinement with generic prompts (e.g., "fix the code") produces no meaningful improvement because the LLM lacks concrete, actionable guidance. Addressed by analysis-augmented prompting. |
| **Scope Validation** | — | Verification that optimised code preserves the original function signatures and intended behaviour, preventing optimisation-induced drift. |
| **SSE** | Server-Sent Events | A protocol enabling the server to push real-time iteration progress to the frontend over HTTP. |
| **Pass@k** | — | The probability that at least one of k generated code samples passes all test cases. Standard metric in code generation research. |

---

## Appendix B: Technology Stack Reference

| Layer | Component | Technology | Version / Model |
|-------|-----------|------------|-----------------|
| Frontend | UI Framework | Next.js + TypeScript + React | 16 / 19 |
| Frontend | Styling | Tailwind CSS | v4 |
| Frontend | Code Editor | Monaco Editor | — |
| Frontend | State Management | Zustand | — |
| Frontend | HTTP / Streaming | Axios + native fetch ReadableStream | — |
| API | Server Framework | FastAPI + Uvicorn | — |
| API | Validation | Pydantic v2 | — |
| API | Streaming | sse-starlette | — |
| Stage 1 | LLM | Llama-3.1-8B-Instruct | via HuggingFace Inference API |
| Stage 1 | Embeddings | sentence-transformers (all-MiniLM-L6-v2) | 384-dim |
| Stage 1 | Vector DB | FAISS (faiss-cpu) | L2 index |
| Stage 2 | LLM | deepseek-coder:6.7b | via Ollama (local) |
| Stage 2 | Embeddings | sentence-transformers (all-MiniLM-L6-v2) | 384-dim |
| Stage 2 | Vector DB | FAISS | L2 index |
| Stage 2 | Execution | subprocess + pytest + coverage.py | — |
| Novelty | Static Analysis | Pylint, Radon, Bandit | — |
| Novelty | Dynamic Profiling | cProfile, memory_profiler | — |
| Novelty | Adversarial Testing | Hypothesis | — |
| Quality | Linting | Ruff | — |
| Quality | Formatting | Black | — |
| Quality | Type Checking | MyPy | — |
| Quality | Testing | Pytest + pytest-asyncio + pytest-cov | — |
| Quality | Package Management | Poetry (Python), npm (Frontend) | — |

---

## Appendix C: File-to-Component Mapping

### Stage 1 — RAG-CodeGen (`legacy/rag-codegen/`)

| File | Component | Role |
|------|-----------|------|
| `pipeline/normalizer.py` | Intent Normaliser | Classifies task type, infers algorithmic constraints |
| `vectorstore/embedder.py` | Embedder | Sentence-BERT text-to-vector encoding |
| `vectorstore/retriever.py` | Retriever | FAISS nearest-neighbour search with language filtering |
| `prompt/templates.py` | Prompt Constructor | Merges query + context + constraints into structured prompt |
| `generation/llm_client.py` | LLM Client | HuggingFace Inference API wrapper |
| `postprocess/cleaner.py` | Output Cleaner | Extracts `<CODE>` and `<EXPLANATION>` from raw output |
| `api/app.py` | API Endpoint | FastAPI route for Stage 1 generation |

### Stage 2 — EGRR (`egrr-pipeline/src/`)

| File | Component | Role |
|------|-----------|------|
| `core/orchestrator.py` | EGRROrchestrator | Controls iteration loop, manages pipeline state |
| `core/phases/retrieval.py` | Retrieval Phase | Intent-based and execution-grounded retrieval |
| `core/phases/generation.py` | Generation Phase | Initial synthesis, targeted repair, scope-validated optimisation |
| `core/phases/execution.py` | Execution Phase | Sandbox execution, test generation, coverage measurement |
| `core/phases/review.py` | Review Phase | 4-axis evidence-based evaluation |
| `core/phases/decision.py` | Decision Phase | Termination logic, repair strategy generation |
| `infrastructure/llm/client.py` | LLM Client | Ollama wrapper with retry logic, JSON extraction |
| `infrastructure/llm/prompt_builder.py` | Prompt Builder | Phase-specific prompt construction |
| `infrastructure/retrieval/indexer.py` | Corpus Indexer | Loads corpus JSONs, builds FAISS index |
| `infrastructure/retrieval/retriever.py` | Code Retriever | Async semantic search with similarity scoring |
| `infrastructure/sandbox/runner.py` | Sandbox Runner | subprocess execution, pytest + coverage.py integration |
| `domain/entities.py` | Domain Entities | 15+ Pydantic v2 models |
| `domain/value_objects.py` | Value Objects | Enumerations for phases, statuses, decisions |
| `api/routes/generate.py` | API Endpoint | FastAPI routes for EGRR generation |
| `api/schemas/requests.py` | Request Schemas | Pydantic v2 request models |
| `api/schemas/responses.py` | Response Schemas | Pydantic v2 response models |

---

## Appendix D: Corpus Details

The retrieval corpus consists of 29 hand-curated code pattern examples stored as JSON files, organised into 5 categories:

| Category | Count | Example Patterns |
|----------|-------|-----------------|
| **Algorithms** | 8 | List boundary checking, dictionary key safety checks, binary search, sorting with comparators, recursive vs iterative approaches, mathematical formulae, graph traversal, string processing algorithms |
| **Error Handling** | 5 | File operation error handling, network request retry patterns, data parsing with graceful fallback, resource cleanup with context managers, exception chaining and logging |
| **Security** | 5 | Path traversal prevention, SQL injection prevention via parameterised queries, XSS prevention via output encoding, input validation and sanitisation, secure credential management |
| **Testing Patterns** | 5 | Edge case test design, exception assertion testing, mock and stub patterns, fixture-based test organisation, parametrised test generation |
| **Validation** | 6 | Email format validation, URL validation, file type verification, JSON schema validation, numeric range validation, composite validation pipelines |

Each JSON entry contains:
- `task`: Natural language description of the coding task.
- `code`: Reference implementation in Python.
- `explanation`: Technical explanation of the approach and design decisions.
- `language`: Target programming language (Python).
- `category`: Category classification tag.

---

*End of Master Context File. This document is self-contained and sufficient for generating an IEEE-format research paper, thesis chapter, or detailed technical presentation without requiring additional clarification.*
