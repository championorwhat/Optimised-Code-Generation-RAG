from types import MappingProxyType
from typing import Dict, Any, Callable


class SandboxExecutionError(Exception):
    """Raised when sandboxed code execution fails."""
    pass


class CodeSandbox:
    """
    A restricted execution environment for running AI-generated Python code.
    """

    def __init__(self):
        self._allowed_builtins = self._build_safe_builtins()

    def _build_safe_builtins(self) -> Dict[str, Any]:
        """
        Whitelist safe built-in functions.
        """
        safe_names = [
            "abs", "all", "any", "bool",
            "dict", "float", "int", "len",
            "list", "max", "min", "range",
            "set", "sum", "tuple", "enumerate",
            "zip"
        ]

        return MappingProxyType(
            {name: __builtins__[name] for name in safe_names}
        )

    def load_code(self, code: str) -> Dict[str, Any]:
        """
        Executes code inside a restricted global namespace.

        Returns the sandbox namespace containing defined objects.
        """
        sandbox_globals = {
            "__builtins__": self._allowed_builtins
        }

        sandbox_locals: Dict[str, Any] = {}

        try:
            exec(code, sandbox_globals, sandbox_locals)
        except Exception as e:
            raise SandboxExecutionError(f"Code execution failed: {e}")

        return sandbox_locals

    def extract_function(
        self,
        namespace: Dict[str, Any],
        function_name: str
    ) -> Callable:
        """
        Extracts a function from the sandbox namespace.
        """
        fn = namespace.get(function_name)

        if not callable(fn):
            raise SandboxExecutionError(
                f"Function '{function_name}' not found or not callable"
            )

        return fn
