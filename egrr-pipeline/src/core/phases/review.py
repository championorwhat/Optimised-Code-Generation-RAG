"""
Review Phase (Phase 5).
"""

import json

from src.domain.entities import ExecutionResult, Review, ReviewAspect, ReviewStatus
from src.infrastructure.llm.client import HuggingFaceLLM
from src.infrastructure.llm.prompt_builder import PromptBuilder


class ReviewPhase:
    """Handles evidence-based code review."""

    def __init__(self) -> None:
        """Initialize dependencies."""
        self.llm = HuggingFaceLLM()
        self.prompt_builder = PromptBuilder()

    async def execute(self, code: str, execution_result: ExecutionResult) -> Review:
        """
        Evaluate code quality using LLM and execution evidence asynchronously.
        """
        prompt = self.prompt_builder.build_review_prompt(code, execution_result)
        response_text = await self.llm.generate_json(prompt)
        
        review = self._parse_review(response_text)
        
        # CRITICAL: Add execution-based critical issues that LLM might miss
        review = self._add_execution_based_issues(review, execution_result)
        
        return review

    def _add_execution_based_issues(self, review: Review, exec_result: ExecutionResult) -> Review:
        """Add critical issues based on actual execution results."""
        additional_issues = []
        
        # Failed tests are ALWAYS critical
        if exec_result.test_results and exec_result.test_results.failed > 0:
            additional_issues.append(
                f"TEST_FAILURE: {exec_result.test_results.failed} test(s) failed. "
                f"Failures: {exec_result.test_results.failures[:3]}"
            )
            # Also update correctness status
            review.correctness.status = ReviewStatus.FAIL
            review.correctness.findings.extend(exec_result.test_results.failures[:3])
        
        # No tests ran at all - also critical (indicates syntax error or import issues)
        if exec_result.test_results and exec_result.test_results.passed == 0 and exec_result.test_results.failed == 0:
            if exec_result.exit_code != 0:
                additional_issues.append(
                    f"NO_TESTS_RAN: Tests could not be executed (exit code {exec_result.exit_code}). "
                    f"Possible syntax error or import issue. Stderr: {exec_result.stderr[:150]}"
                )
        
        # Execution errors are critical
        if exec_result.exit_code != 0 and exec_result.stderr:
            if "Error" in exec_result.stderr or "Exception" in exec_result.stderr:
                additional_issues.append(
                    f"EXECUTION_ERROR: Code execution failed. Error: {exec_result.stderr[:200]}"
                )
        
        # Low coverage is a warning (not critical but noted)
        if exec_result.coverage and exec_result.coverage.line_coverage < 0.6:
            review.improvement_opportunities.append(
                f"LOW_COVERAGE: Only {exec_result.coverage.line_coverage:.1%} line coverage"
            )
        
        # Merge issues
        if additional_issues:
            review.critical_issues = list(set(review.critical_issues + additional_issues))
            # Adjust quality score
            review.overall_quality_score = max(0.0, review.overall_quality_score - 0.2 * len(additional_issues))
        
        return review

    def _parse_review(self, json_text: str | dict) -> Review:
        """Parse LLM JSON response into Review object with aggressive normalization."""
        try:
            if isinstance(json_text, dict):
                data = json_text
            else:
                cleaned_text = json_text.strip()
                if cleaned_text.startswith("```json"):
                    cleaned_text = cleaned_text.replace("```json", "").replace("```", "")
                data = json.loads(cleaned_text)
            
            # Robustness A: Handle nesting under 'review' key
            if "review" in data and isinstance(data["review"], dict):
                if "correctness" not in data:
                    data = data["review"]

            # Robustness B: Status Mapping & Type Enforcement
            status_map = {
                "pass": ReviewStatus.PASS, "success": ReviewStatus.PASS, "correct": ReviewStatus.PASS, "ok": ReviewStatus.PASS,
                "fail": ReviewStatus.FAIL, "error": ReviewStatus.FAIL, "failure": ReviewStatus.FAIL, "broken": ReviewStatus.FAIL,
                "warn": ReviewStatus.WARN, "warning": ReviewStatus.WARN, "unknown": ReviewStatus.WARN, "caution": ReviewStatus.WARN
            }

            for aspect in ["correctness", "security", "robustness", "performance"]:
                if aspect in data and isinstance(data[aspect], dict):
                    # 1. Normalize Status
                    raw_status = str(data[aspect].get("status", "warn")).lower()
                    data[aspect]["status"] = status_map.get(raw_status, ReviewStatus.WARN)
                    
                    # 2. Enforce List[str] for evidence/findings
                    for field in ["evidence", "findings"]:
                        val = data[aspect].get(field, [])
                        if isinstance(val, str):
                            data[aspect][field] = [val]
                        elif isinstance(val, list):
                            # Stringify elements to avoid Pydantic dict errors
                            data[aspect][field] = [str(x) for x in val]
                        else:
                            data[aspect][field] = []
                else:
                    # Provide default aspect if missing
                    data[aspect] = {"status": ReviewStatus.WARN, "evidence": ["Missing analytics"], "findings": ["LLM skipped this aspect"]}


            # Robustness C: Overall Score & List Defaults
            if "overall_quality_score" not in data:
                data["overall_quality_score"] = 0.5 # Neutral fallback
            
            for field in ["critical_issues", "improvement_opportunities"]:
                if field not in data:
                    data[field] = []
                elif isinstance(data[field], str):
                    data[field] = [data[field]]
                elif isinstance(data[field], list):
                    data[field] = [str(x) for x in data[field]]

            # Robustness D: Optimization fields (for iterative optimization)
            if "optimization_score" not in data:
                # Infer optimization score from quality score and improvement opportunities
                base_score = data.get("overall_quality_score", 0.5)
                improvements = len(data.get("improvement_opportunities", []))
                data["optimization_score"] = max(0.1, base_score - 0.1 * improvements)
            
            if "optimization_gaps" not in data:
                # Use improvement opportunities as optimization gaps, or generate defaults
                data["optimization_gaps"] = data.get("improvement_opportunities", []) or [
                    "Add comprehensive type hints",
                    "Add input validation",
                    "Add docstrings",
                    "Optimize performance"
                ]
            elif isinstance(data["optimization_gaps"], str):
                data["optimization_gaps"] = [data["optimization_gaps"]]
            elif isinstance(data["optimization_gaps"], list):
                data["optimization_gaps"] = [str(x) for x in data["optimization_gaps"]]

            return Review(**data)




            
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error parsing review: {e}\nResponse: {json_text}")
            # Fallback: Conservative fail
            return Review(
                correctness=ReviewAspect(status=ReviewStatus.FAIL, findings=["Parse error"]),
                security=ReviewAspect(status=ReviewStatus.WARN, findings=["Could not assess"]),
                robustness=ReviewAspect(status=ReviewStatus.WARN, findings=["Could not assess"]),
                performance=ReviewAspect(status=ReviewStatus.WARN, findings=["Could not assess"]),
                overall_quality_score=0.0,
                critical_issues=["Failed to parse review response"]
            )
