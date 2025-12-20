import re


def extract_function_name(code: str) -> str:
    """
    Extracts the first Python function name from generated code.
    """
    match = re.search(r"def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(", code)
    if not match:
        raise ValueError("No function definition found in generated code.")
    return match.group(1)
