"""
Decision Phase (Phase 6).
"""

import json

from src.domain.entities import DecisionResult, Review, RepairStrategy
from src.domain.value_objects import DecisionType
from src.infrastructure.llm.client import HuggingFaceLLM
from src.infrastructure.llm.prompt_builder import PromptBuilder


class DecisionPhase:
    """Handles pipeline termination decisions and repair planning."""

    def __init__(self) -> None:
        """Initialize dependencies."""
        self.llm = HuggingFaceLLM()
        self.prompt_builder = PromptBuilder()

    async def execute(self, review: Review, iteration: int, max_iterations: int) -> DecisionResult:
        """
        Decide whether to continue or terminate based on review and iteration count asynchronously.
        
        NEW BEHAVIOR: Continue iterating for optimization even when correctness passes.
        Only terminate at max_iterations or when optimization is converged.
        """
        # 1. Check for Termination Conditions
        
        # Condition A: Max iterations reached - always terminate
        if iteration >= max_iterations:
            if not review.critical_issues:
                return DecisionResult(
                    decision=DecisionType.TERMINATE_SUCCESS,
                    rationale=f"Completed {max_iterations} iterations. Code is correct and optimized.",
                    repair_strategy=None
                )
            else:
                return DecisionResult(
                    decision=DecisionType.TERMINATE_MAX_ITERATIONS,
                    rationale=f"Reached maximum iterations ({max_iterations}). Some issues remain.",
                    repair_strategy=None
                )
        
        # Condition B: Code is correct (no critical issues) but can still optimize
        if not review.critical_issues:
            # Continue for optimization if there are optimization gaps
            optimization_gaps = review.optimization_gaps or review.improvement_opportunities
            if optimization_gaps and review.optimization_score < 0.95:
                return DecisionResult(
                    decision=DecisionType.CONTINUE,
                    rationale=f"Code is correct. Continuing to optimize: {', '.join(optimization_gaps[:2])}",
                    next_iteration_focus="Optimization: " + (optimization_gaps[0] if optimization_gaps else "General refinement"),
                    repair_strategy=None
                )
            # Even without explicit gaps, continue if not at max iterations (for iterative refinement)
            return DecisionResult(
                decision=DecisionType.CONTINUE,
                rationale="Code is correct. Continuing for further refinement.",
                next_iteration_focus="Improve readability, type safety, and performance",
                repair_strategy=None
            )
            
        # 2. If there are critical issues, generate repair strategy
        repair_strategy = await self._generate_repair_strategy(review)
        
        return DecisionResult(
            decision=DecisionType.CONTINUE,
            rationale=f"Found {len(review.critical_issues)} critical issues. Need repair.",
            next_iteration_focus="Repair critical issues",
            repair_strategy=repair_strategy
        )


    async def _generate_repair_strategy(self, review: Review) -> RepairStrategy | None:
        """Generate a repair plan using LLM asynchronously."""
        try:
            prompt = self.prompt_builder.build_repair_strategy_prompt(review)
            response_text = await self.llm.generate_json(prompt)
            
            # Handle if already a dict
            if isinstance(response_text, dict):
                data = response_text
            else:
                cleaned_text = response_text.strip()
                if cleaned_text.startswith("```json"):
                    cleaned_text = cleaned_text.replace("```json", "").replace("```", "")
                data = json.loads(cleaned_text)
                
            return RepairStrategy(**data)

            
        except Exception as e:
            print(f"Error generating repair strategy: {e}")
            # Return dummy strategy to keep pipeline moving
            return RepairStrategy(
                lines_to_modify=[],
                patterns_to_apply=["General Fix"],
                validation_criteria=["Fix critical issues"]
            )
