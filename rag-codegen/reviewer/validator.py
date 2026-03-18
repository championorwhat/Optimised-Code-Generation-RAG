from typing import List, Dict, Any
from reviewer.confidence import ConfidenceScorer

class CodeValidator:
    """
    Validates execution results against test cases
    and produces a structured review report.
    """

    def validate(
        self,
        execution_results: List[Dict[str, Any]],
        test_cases: List[Dict[str, Any]],
    ) -> Dict[str, Any]:

        expected_map = {
            tc["name"]: tc.get("expected")
            for tc in test_cases
        }

        results = []
        passed = 0
        failed = 0
        unknown = 0

        for exec_result in execution_results:
            name = exec_result["name"]
            actual = exec_result["output"]
            error = exec_result["error"]
            expected = expected_map.get(name)

            # ---- Status determination ----
            if error is not None:
                # Non-numeric or invalid input → UNKNOWN, not FAIL
                if "Non-numeric input" in error:
                    test_status = "UNKNOWN"
                    unknown += 1
                else:
                    test_status = "FAIL"
                    failed += 1

            elif expected is None:
                test_status = "UNKNOWN"
                unknown += 1

            elif actual == expected:
                test_status = "PASS"
                passed += 1

            else:
                test_status = "FAIL"
                failed += 1

            results.append({
                "name": name,
                "expected": expected,
                "actual": actual,
                "error": error,
                "status": test_status,
            })

        # ---- Overall verdict logic ----
        if failed > 0:
            overall_status = "FAIL"
        elif passed > 0 and unknown > 0:
            overall_status = "PARTIAL"
        elif passed > 0:
            overall_status = "PASS"
        elif unknown > 0:
            overall_status = "PASS_WITHOUT_ORACLE"
        else:
            overall_status = "FAIL"

        scorer = ConfidenceScorer()
        confidence = scorer.score(
            execution_results=execution_results,
            review_summary={
                "total_tests": len(results),
                "passed": passed,
                "failed": failed,
                "unknown": unknown,
            },
        )

        return {
            "total_tests": len(results),
            "passed": passed,
            "failed": failed,
            "unknown": unknown,
            "status": overall_status,
            "confidence": confidence,
            "results": results,
        }
