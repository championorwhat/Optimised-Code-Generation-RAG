"""
Main Pipeline Orchestrator.
"""

import time
import uuid

from src.core.phases.decision import DecisionPhase
from src.core.phases.execution import ExecutionPhase
from src.core.phases.generation import GenerationPhase
from src.core.phases.retrieval import RetrievalPhase
from src.core.phases.review import ReviewPhase
from src.domain.entities import PipelineState, GenerateResponse, IterationDetail, PipelinePhase
from src.domain.value_objects import DecisionType, ExecutionStatus
from src.utils.logger import setup_logger, log_event


class EGRROrchestrator:
    """Coordinator for the Execution-Grounded Retrieval Refinement pipeline."""

    def __init__(self) -> None:
        """Initialize all phases."""
        self.logger = setup_logger("orchestrator")
        self.retrieval_phase = RetrievalPhase()
        self.generation_phase = GenerationPhase()
        self.execution_phase = ExecutionPhase()
        self.review_phase = ReviewPhase()
        self.decision_phase = DecisionPhase()

    async def run(self, user_query: str, max_iterations: int = 5) -> GenerateResponse:
        """
        Run the full EGRR pipeline loop with timing instrumentation.
        """
        run_id = str(uuid.uuid4())
        log_event(self.logger, "Pipeline Started", run_id=run_id, query=user_query)
        
        # Initialize State
        state = PipelineState(
            run_id=run_id,
            user_query=user_query,
            language="python",
            max_iterations=max_iterations
        )
        
        pipeline_start_time = time.time()
        iteration_details: list[IterationDetail] = []
        all_retrieved_patterns: list[str] = []
        decision = None
        
        for iteration in range(1, max_iterations + 1):
            iteration_start_time = time.time()
            state.current_iteration = iteration
            phase_results: dict[str, dict] = {}
            
            log_event(self.logger, "Iteration Started", run_id=run_id, iteration=iteration)
            
            # --- Phase 1 & 4: Retrieval ---
            state.current_phase = PipelinePhase.RETRIEVAL
            retrieval_start = time.time()
            if iteration == 1:
                # Intent-Based Retrieval
                queries, docs = await self.retrieval_phase.execute_intent_based(user_query)
            else:
                # Execution-Grounded Re-Retrieval
                last_exec = state.last_execution
                if last_exec:
                    queries, docs = await self.retrieval_phase.execute_execution_grounded(last_exec)
                else:
                    # Fallback (shouldn't happen)
                    queries, docs = [], []
            
            duration_retrieval = int((time.time() - retrieval_start) * 1000)
            log_event(self.logger, "Phase Complete", phase="retrieval", duration_ms=duration_retrieval, docs_count=len(docs))
            
            state.history_retrieval.append(queries)
            state.current_context_docs = docs
            
            # Record retrieved pattern IDs
            for doc in docs:
                if doc.id not in all_retrieved_patterns:
                    all_retrieved_patterns.append(doc.id)
            
            phase_results["retrieval"] = {
                "queries": [q.query for q in queries],
                "documents_retrieved": len(docs),
                "pattern_ids": [doc.id for doc in docs],
                "duration_ms": duration_retrieval
            }
            
            # --- Phase 2: Generation ---
            state.current_phase = PipelinePhase.GENERATION
            generation_start = time.time()
            if iteration == 1 or not state.last_code:
                # First iteration: standard generation
                generated_code = await self.generation_phase.execute(user_query, docs, iteration)
            else:
                # Subsequent iterations: check if we need repair or optimization
                last_review = state.history_review[-1] if state.history_review else None
                if last_review:
                    if last_review.critical_issues:
                        # Has critical issues -> repair
                        generated_code = await self.generation_phase.execute_repair(
                            user_query, state.last_code, last_review, docs
                        )
                    else:
                        # No critical issues -> optimization
                        generated_code = await self.generation_phase.execute_optimization(
                            state.last_code, last_review, docs
                        )
                else:
                    generated_code = await self.generation_phase.execute(user_query, docs, iteration)

            duration_gen = int((time.time() - generation_start) * 1000)
            log_event(self.logger, "Phase Complete", phase="generation", duration_ms=duration_gen, code_len=len(generated_code.code))

            state.history_code.append(generated_code)
            
            phase_results["generation"] = {
                "code_length": len(generated_code.code),
                "confidence": generated_code.confidence,
                "patterns_used": generated_code.retrieved_patterns_used,
                "duration_ms": duration_gen
            }
            
            # --- Phase 3: Execution ---
            state.current_phase = PipelinePhase.EXECUTION
            execution_start = time.time()
            exec_result = await self.execution_phase.execute(generated_code)
            state.history_execution.append(exec_result)
            
            duration_exec = int((time.time() - execution_start) * 1000)
            log_event(self.logger, "Phase Complete", phase="execution", duration_ms=duration_exec, status=exec_result.status.value)
            
            tests_passed = exec_result.test_results.passed if exec_result.test_results else 0
            tests_failed = exec_result.test_results.failed if exec_result.test_results else 0
            coverage = exec_result.coverage.line_coverage if exec_result.coverage else 0.0
            
            phase_results["execution"] = {
                "status": exec_result.status.value,
                "exit_code": exec_result.exit_code,
                "tests_passed": tests_passed,
                "tests_failed": tests_failed,
                "coverage": coverage,
                "stdout_preview": exec_result.stdout[:200] if exec_result.stdout else "",
                "stderr_preview": exec_result.stderr[:200] if exec_result.stderr else "",
                "duration_ms": duration_exec
            }
            
            # --- Phase 5: Review ---
            state.current_phase = PipelinePhase.REVIEW
            review_start = time.time()
            review = await self.review_phase.execute(generated_code.code, exec_result)
            state.history_review.append(review)
            
            duration_review = int((time.time() - review_start) * 1000)
            log_event(self.logger, "Phase Complete", phase="review", duration_ms=duration_review, quality=review.overall_quality_score)
            
            phase_results["review"] = {
                "quality_score": review.overall_quality_score,
                "correctness_status": review.correctness.status.value,
                "security_status": review.security.status.value,
                "robustness_status": review.robustness.status.value,
                "critical_issues_count": len(review.critical_issues),
                "critical_issues": review.critical_issues,
                "duration_ms": duration_review
            }
            
            # --- Phase 6: Decision ---
            state.current_phase = PipelinePhase.DECISION
            decision_start = time.time()
            decision = await self.decision_phase.execute(review, iteration, max_iterations)
            
            duration_decision = int((time.time() - decision_start) * 1000)
            log_event(self.logger, "Phase Complete", phase="decision", duration_ms=duration_decision, result=decision.decision.value)
            
            phase_results["decision"] = {
                "decision": decision.decision.value,
                "rationale": decision.rationale,
                "next_focus": decision.next_iteration_focus,
                "duration_ms": duration_decision
            }
            
            # Record iteration details
            iteration_duration = int((time.time() - iteration_start_time) * 1000)
            iteration_detail = IterationDetail(
                iteration_number=iteration,
                phase_results=phase_results,
                retrieval_count=len(docs),
                code_generated=True,
                execution_status=exec_result.status.value,
                tests_passed=tests_passed,
                tests_failed=tests_failed,
                coverage=coverage,
                critical_issues=review.critical_issues,
                decision=decision.decision.value,
                duration_ms=iteration_duration
            )
            iteration_details.append(iteration_detail)
            
            if decision.decision in (DecisionType.TERMINATE_SUCCESS, DecisionType.TERMINATE_MAX_ITERATIONS):
                break
                
            # If CONTINUE, loop proceeds to next iteration
        
        total_duration = int((time.time() - pipeline_start_time) * 1000)
        log_event(self.logger, "Pipeline Complete", run_id=run_id, total_duration_ms=total_duration, status=decision.decision.value)
            
        # Final Result Construction
        final_code = state.last_code or ""
        final_exec = state.last_execution
        final_status = "success" if decision and decision.decision == DecisionType.TERMINATE_SUCCESS else "failed"
        if decision and decision.decision == DecisionType.TERMINATE_MAX_ITERATIONS:
            final_status = "partial"
            
        return GenerateResponse(
            code=final_code,
            explanation=state.history_code[-1].explanation if state.history_code else "No code generated",
            iterations=iteration,
            status=final_status,
            coverage=final_exec.coverage.line_coverage if final_exec and final_exec.coverage else 0.0,
            tests_passed=final_exec.test_results.passed if final_exec and final_exec.test_results else 0,
            tests_failed=final_exec.test_results.failed if final_exec and final_exec.test_results else 0,
            tests_total=final_exec.test_results.total if final_exec and final_exec.test_results else 0, # Added this field
            iteration_details=iteration_details,
            total_duration_ms=total_duration,
            retrieved_patterns=all_retrieved_patterns
        )
