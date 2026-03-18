from typing import List, Dict, Any
import inspect

from reviewer.sandbox import CodeSandbox, SandboxExecutionError


class CodeExecutor:
    """
    Executes AI-generated code against test cases
    inside a restricted sandbox.
    """

    def __init__(self):
        self.sandbox = CodeSandbox()

    def run_tests(
        self,
        code: str,
        function_name: str,
        test_cases: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Runs the given function against provided test cases.

        Returns execution results for each test case.
        """

        # Load code into sandbox
        try:
            namespace = self.sandbox.load_code(code)
            fn = self.sandbox.extract_function(namespace, function_name)
            sig = inspect.signature(fn)
            param_names = list(sig.parameters)
        except SandboxExecutionError as e:
            # If code itself is invalid, mark all tests as failed
            return [
                {
                    "name": tc.get("name", "unknown"),
                    "input": tc.get("input", {}),
                    "output": None,
                    "error": str(e),
                }
                for tc in test_cases
            ]

        results = []

        for tc in test_cases:
            name = tc.get("name", "unknown")
            inputs = tc.get("input", {})

            try:
                # Case 1: Proper keyword arguments
                if inputs:
                    # Normalize single-argument string inputs
                    if len(param_names) == 1:
                        key = param_names[0]
                        value = inputs.get(key)

                        # Normalize None / string inputs for single-argument numeric functions
                        if value is None:
                            value = 0

                        elif isinstance(value, str):
                            value = value.strip()
                            if value == "":
                                value = 0
                            else:
                                try:
                                    value = int(value)
                                except ValueError:
                                    raise ValueError("Non-numeric input for numeric function")


                        output = fn(value)
                    else:
                        try:
                            output = fn(**inputs)
                        except TypeError:
                            output = fn(*inputs.values())

                else:
                    # Case 3: Empty input handling
                    if len(param_names) == 1:
                        # Treat empty input as default zero
                        output = fn(0)
                    else:
                        raise TypeError("No inputs provided for multi-argument function")

                results.append({
                    "name": name,
                    "input": inputs,
                    "output": output,
                    "error": None,
                })

            except Exception as e:
                results.append({
                    "name": name,
                    "input": inputs,
                    "output": None,
                    "error": str(e),
                })

        return results
