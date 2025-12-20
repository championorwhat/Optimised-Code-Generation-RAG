import ast


class CodeSanitizationError(Exception):
    pass


def sanitize_python_code(code: str) -> str:
    """
    Removes top-level executable statements (e.g. print, function calls)
    and keeps only imports and function/class definitions.
    """

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise CodeSanitizationError(f"Invalid Python code: {e}")

    allowed_nodes = (
        ast.FunctionDef,
        ast.AsyncFunctionDef,
        ast.ClassDef,
        ast.Import,
        ast.ImportFrom,
    )

    sanitized_body = [
        node for node in tree.body if isinstance(node, allowed_nodes)
    ]

    if not sanitized_body:
        raise CodeSanitizationError(
            "No valid function or class definitions found after sanitization."
        )

    tree.body = sanitized_body
    return ast.unparse(tree)
