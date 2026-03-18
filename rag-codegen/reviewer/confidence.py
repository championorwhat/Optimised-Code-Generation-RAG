from typing import List, Dict, Any


class ConfidenceScorer:
    """
    Computes confidence score (0–100) for AI-generated code
    based on execution behavior.
    """

    def score(
        self,
        execution_results: List[Dict[str, Any]],
        review_summary: Dict[str, Any],
    ) -> Dict[str, Any]:

        score = 100
        reasons = []

        failed = review_summary.get("failed", 0)
        unknown = review_summary.get("unknown", 0)
        total = review_summary.get("total_tests", 0)

        # 1. Hard failures
        if failed > 0:
            score -= 40
            reasons.append("One or more tests failed")

        # 2. Runtime errors
        runtime_errors = [
            r for r in execution_results if r.get("error") is not None
        ]
        if runtime_errors:
            score -= 30
            reasons.append("Runtime errors detected")

        # 3. Output type consistency
        outputs = [
            r["output"] for r in execution_results if r["output"] is not None
        ]
        if outputs:
            types = {type(o) for o in outputs}
            if len(types) > 1:
                score -= 20
                reasons.append("Inconsistent output types")

        # 4. No oracle situation
        if unknown == total:
            score -= 10
            reasons.append("No oracle available (all tests unknown)")

        # 5. Suspicious edge-case behavior
        empty_outputs = sum(1 for o in outputs if o in ([], None))
        if empty_outputs == len(outputs) and outputs:
            score -= 10
            reasons.append("All outputs empty (possible underfitting)")

        score = max(0, min(100, score))

        return {
            "confidence_score": score,
            "confidence_level": self._label(score),
            "reasons": reasons,
        }

    def _label(self, score: int) -> str:
        if score >= 85:
            return "HIGH"
        elif score >= 60:
            return "MEDIUM"
        elif score >= 40:
            return "LOW"
        else:
            return "VERY_LOW"
