"""
Server-Sent Events (SSE) streaming endpoint for real-time pipeline updates.
"""

import json
import time
import uuid
import asyncio
from typing import AsyncGenerator

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from src.api.schemas.requests import GenerateRequest
from src.core.phases.decision import DecisionPhase
from src.core.phases.execution import ExecutionPhase
from src.core.phases.generation import GenerationPhase
from src.core.phases.retrieval import RetrievalPhase
from src.core.phases.review import ReviewPhase
from src.domain.entities import PipelineState, PipelinePhase
from src.domain.value_objects import DecisionType

router = APIRouter()


async def run_pipeline_streaming(
    user_query: str, 
    max_iterations: int = 5
) -> AsyncGenerator[dict, None]:
    """
    Generator that yields SSE events for each phase of the pipeline.
    """
    # Initialize phases
    retrieval_phase = RetrievalPhase()
    generation_phase = GenerationPhase()
    execution_phase = ExecutionPhase()
    review_phase = ReviewPhase()
    decision_phase = DecisionPhase()
    
    # Initialize State
    run_id = str(uuid.uuid4())
    state = PipelineState(
        run_id=run_id,
        user_query=user_query,
        language="python",
        max_iterations=max_iterations
    )
    
    pipeline_start_time = time.time()
    all_retrieved_patterns: list[str] = []
    decision = None
    
    # Send pipeline start event
    yield {
        "event": "pipeline_start",
        "data": {
            "run_id": run_id,
            "query": user_query,
            "max_iterations": max_iterations,
            "timestamp": time.time()
        }
    }
    await asyncio.sleep(0.01)  # Allow event to be sent
    
    for iteration in range(1, max_iterations + 1):
        iteration_start_time = time.time()
        state.current_iteration = iteration
        
        # Send iteration start event
        yield {
            "event": "iteration_start",
            "data": {
                "iteration": iteration,
                "max_iterations": max_iterations,
                "timestamp": time.time()
            }
        }
        await asyncio.sleep(0.01)
        
        # --- Phase 1 & 4: Retrieval ---
        state.current_phase = PipelinePhase.RETRIEVAL
        yield {
            "event": "phase_start",
            "data": {
                "iteration": iteration,
                "phase": "retrieval",
                "phase_display": "Retrieval",
                "description": "Searching knowledge base for relevant patterns...",
                "timestamp": time.time()
            }
        }
        await asyncio.sleep(0.01)
        
        retrieval_start = time.time()
        if iteration == 1:
            queries, docs = await retrieval_phase.execute_intent_based(user_query)
        else:
            last_exec = state.last_execution
            if last_exec:
                queries, docs = await retrieval_phase.execute_execution_grounded(last_exec)
            else:
                queries, docs = [], []
        
        state.history_retrieval.append(queries)
        state.current_context_docs = docs
        
        for doc in docs:
            if doc.id not in all_retrieved_patterns:
                all_retrieved_patterns.append(doc.id)
        
        yield {
            "event": "phase_complete",
            "data": {
                "iteration": iteration,
                "phase": "retrieval",
                "phase_display": "Retrieval",
                "result": {
                    "queries": [q.query for q in queries],
                    "documents_retrieved": len(docs),
                    "pattern_ids": [doc.id for doc in docs],
                },
                "duration_ms": int((time.time() - retrieval_start) * 1000),
                "timestamp": time.time()
            }
        }
        await asyncio.sleep(0.01)
        
        # --- Phase 2: Generation ---
        state.current_phase = PipelinePhase.GENERATION
        yield {
            "event": "phase_start",
            "data": {
                "iteration": iteration,
                "phase": "generation",
                "phase_display": "Generation",
                "description": "Generating code using LLM and retrieved patterns...",
                "timestamp": time.time()
            }
        }
        await asyncio.sleep(0.01)
        
        generation_start = time.time()
        if iteration == 1 or not state.last_code:
            generated_code = await generation_phase.execute(user_query, docs, iteration)
        else:
            last_review = state.history_review[-1] if state.history_review else None
            if last_review:
                generated_code = await generation_phase.execute_repair(
                    user_query, state.last_code, last_review, docs
                )
            else:
                generated_code = await generation_phase.execute(user_query, docs, iteration)

        state.history_code.append(generated_code)
        
        yield {
            "event": "phase_complete",
            "data": {
                "iteration": iteration,
                "phase": "generation",
                "phase_display": "Generation",
                "result": {
                    "code_length": len(generated_code.code),
                    "code_preview": generated_code.code[:300] + "..." if len(generated_code.code) > 300 else generated_code.code,
                    "confidence": generated_code.confidence,
                    "patterns_used": generated_code.retrieved_patterns_used,
                },
                "duration_ms": int((time.time() - generation_start) * 1000),
                "timestamp": time.time()
            }
        }
        await asyncio.sleep(0.01)
        
        # --- Phase 3: Execution ---
        state.current_phase = PipelinePhase.EXECUTION
        yield {
            "event": "phase_start",
            "data": {
                "iteration": iteration,
                "phase": "execution",
                "phase_display": "Execution",
                "description": "Running code in sandbox with tests...",
                "timestamp": time.time()
            }
        }
        await asyncio.sleep(0.01)
        
        execution_start = time.time()
        exec_result = await execution_phase.execute(generated_code)
        state.history_execution.append(exec_result)
        
        tests_passed = exec_result.test_results.passed if exec_result.test_results else 0
        tests_failed = exec_result.test_results.failed if exec_result.test_results else 0
        coverage = exec_result.coverage.line_coverage if exec_result.coverage else 0.0
        
        yield {
            "event": "phase_complete",
            "data": {
                "iteration": iteration,
                "phase": "execution",
                "phase_display": "Execution",
                "result": {
                    "status": exec_result.status.value,
                    "exit_code": exec_result.exit_code,
                    "tests_passed": tests_passed,
                    "tests_failed": tests_failed,
                    "coverage": coverage,
                    "has_errors": bool(exec_result.stderr),
                },
                "duration_ms": int((time.time() - execution_start) * 1000),
                "timestamp": time.time()
            }
        }
        await asyncio.sleep(0.01)
        
        # --- Phase 5: Review ---
        state.current_phase = PipelinePhase.REVIEW
        yield {
            "event": "phase_start",
            "data": {
                "iteration": iteration,
                "phase": "review",
                "phase_display": "Review",
                "description": "Analyzing code quality and test results...",
                "timestamp": time.time()
            }
        }
        await asyncio.sleep(0.01)
        
        review_start = time.time()
        review = await review_phase.execute(generated_code.code, exec_result)
        state.history_review.append(review)
        
        yield {
            "event": "phase_complete",
            "data": {
                "iteration": iteration,
                "phase": "review",
                "phase_display": "Review",
                "result": {
                    "quality_score": review.overall_quality_score,
                    "correctness_status": review.correctness.status.value,
                    "security_status": review.security.status.value,
                    "robustness_status": review.robustness.status.value,
                    "critical_issues_count": len(review.critical_issues),
                    "critical_issues": review.critical_issues[:3],  # Limit for streaming
                },
                "duration_ms": int((time.time() - review_start) * 1000),
                "timestamp": time.time()
            }
        }
        await asyncio.sleep(0.01)
        
        # --- Phase 6: Decision ---
        state.current_phase = PipelinePhase.DECISION
        yield {
            "event": "phase_start",
            "data": {
                "iteration": iteration,
                "phase": "decision",
                "phase_display": "Decision",
                "description": "Deciding next action...",
                "timestamp": time.time()
            }
        }
        await asyncio.sleep(0.01)
        
        decision_start = time.time()
        decision = await decision_phase.execute(review, iteration, max_iterations)
        
        yield {
            "event": "phase_complete",
            "data": {
                "iteration": iteration,
                "phase": "decision",
                "phase_display": "Decision",
                "result": {
                    "decision": decision.decision.value,
                    "rationale": decision.rationale,
                    "next_focus": decision.next_iteration_focus,
                },
                "duration_ms": int((time.time() - decision_start) * 1000),
                "timestamp": time.time()
            }
        }
        await asyncio.sleep(0.01)
        
        # Iteration complete
        iteration_duration = int((time.time() - iteration_start_time) * 1000)
        yield {
            "event": "iteration_complete",
            "data": {
                "iteration": iteration,
                "duration_ms": iteration_duration,
                "decision": decision.decision.value,
                "will_continue": decision.decision == DecisionType.CONTINUE,
                "timestamp": time.time()
            }
        }
        await asyncio.sleep(0.01)
        
        if decision.decision in (DecisionType.TERMINATE_SUCCESS, DecisionType.TERMINATE_MAX_ITERATIONS):
            break
    
    # Pipeline complete
    total_duration = int((time.time() - pipeline_start_time) * 1000)
    final_code = state.last_code or ""
    final_exec = state.last_execution
    final_status = "success" if decision and decision.decision == DecisionType.TERMINATE_SUCCESS else "failed"
    if decision and decision.decision == DecisionType.TERMINATE_MAX_ITERATIONS:
        final_status = "partial"
    
    yield {
        "event": "pipeline_complete",
        "data": {
            "run_id": run_id,
            "status": final_status,
            "code": final_code,
            "explanation": state.history_code[-1].explanation if state.history_code else "No code generated",
            "iterations": state.current_iteration,
            "coverage": final_exec.coverage.line_coverage if final_exec and final_exec.coverage else 0.0,
            "tests_passed": final_exec.test_results.passed if final_exec and final_exec.test_results else 0,
            "tests_failed": final_exec.test_results.failed if final_exec and final_exec.test_results else 0,
            "total_duration_ms": total_duration,
            "retrieved_patterns": all_retrieved_patterns,
            "decision_rationale": decision.rationale if decision else "",
            "timestamp": time.time()
        }
    }


@router.post("/generate/stream")
async def generate_code_stream(request: GenerateRequest):
    """
    Stream the EGRR pipeline execution via Server-Sent Events.
    
    Each event contains:
    - event: Event type (pipeline_start, phase_start, phase_complete, iteration_complete, pipeline_complete)
    - data: JSON payload with phase details
    """
    async def event_generator():
        async for event_data in run_pipeline_streaming(
            user_query=request.query,
            max_iterations=request.max_iterations
        ):
            yield {
                "event": event_data["event"],
                "data": json.dumps(event_data["data"])
            }
    
    return EventSourceResponse(event_generator())
