import re

def compute_metrics(code: str, explanation: str) -> dict:
    lines_of_code = len([l for l in code.splitlines() if l.strip()])

    has_time_complexity = bool(
        re.search(r"O\(.+?\)", explanation, re.IGNORECASE)
    )

    uses_math_formula = any(
        token in code for token in ["n * (n + 1)", "// 2"]
    )

    uses_loop = any(
        token in code for token in ["for ", "while "]
    )

    return {
        "lines_of_code": lines_of_code,
        "mentions_time_complexity": has_time_complexity,
        "uses_mathematical_optimization": uses_math_formula,
        "uses_loop": uses_loop
    }
