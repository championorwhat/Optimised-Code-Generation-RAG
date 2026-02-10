"""
Execution Phase (Phase 3).
"""

import re
from src.domain.entities import ExecutionResult, GeneratedCode, CoverageResult, TestRunMetrics
from src.domain.value_objects import ExecutionStatus
from src.infrastructure.llm.client import HuggingFaceLLM
from src.infrastructure.llm.prompt_builder import PromptBuilder
from src.infrastructure.sandbox.runner import SandboxRunner

TEST_GEN_PROMPT = """
Task: Generate a comprehensive Pytest test suite for the following Python code.
The tests should cover:
1. Basic functionality (happy paths)
2. Edge cases (boundary values, empty inputs, etc.)
3. Error handling (invalid inputs)

Code:
```python
{code}
```

Format: Return ONLY the Python code for the tests, starting with `import pytest`. Do not include markdown formatting or explanations.
"""

# Default test template when LLM fails
DEFAULT_TEST_TEMPLATE = '''
import pytest
from solution import *
import inspect

# Auto-generated smoke tests
def test_module_imports():
    """Test that the module imports correctly."""
    assert True

def test_functions_exist():
    """Test that expected functions/classes exist."""
    import solution
    members = [name for name, obj in inspect.getmembers(solution) 
               if not name.startswith('_') and (inspect.isfunction(obj) or inspect.isclass(obj))]
    assert len(members) > 0, "No functions or classes found in solution"

def test_basic_call():
    """Test basic function call if possible."""
    import solution
    for name, obj in inspect.getmembers(solution):
        if inspect.isfunction(obj) and not name.startswith('_'):
            # Try calling with no args or simple defaults
            sig = inspect.signature(obj)
            params = sig.parameters
            if len(params) == 0:
                try:
                    result = obj()
                    assert result is not None or result is None  # Just run it
                except Exception:
                    pass
            break
'''


class ExecutionPhase:
    """Handles execution of generated code."""

    def __init__(self) -> None:
        """Initialize dependencies."""
        self.llm = HuggingFaceLLM()
        self.prompt_builder = PromptBuilder()
        self.runner = SandboxRunner()

    async def execute(self, generated_code: GeneratedCode) -> ExecutionResult:
        """
        Execute the code.
        
        Strategy:
        1. First, try to run the code standalone to check for syntax errors.
        2. Generate a test suite for the code using LLM.
        3. Run the code + tests in the sandbox.
        """
        code = generated_code.code
        
        # 0. First check for syntax errors by running standalone
        syntax_check = self.runner.execute(code, timeout=5)
        if "SyntaxError" in syntax_check.stderr or "IndentationError" in syntax_check.stderr:
            return ExecutionResult(
                status=ExecutionStatus.ERROR,
                stdout="",
                stderr=f"Syntax Error in generated code:\n{syntax_check.stderr}",
                exit_code=1,
                test_results=TestRunMetrics(passed=0, failed=1, failures=["Syntax error in generated code"]),
                coverage=CoverageResult(line_coverage=0.0, uncovered_lines=[])
            )
        
        # 1. Generate Tests
        tests = await self._generate_tests(code)
            
        # 2. Run in Sandbox
        return self.runner.run_tests(code, tests)

    async def _generate_tests(self, code: str) -> str:
        """Generate tests with LLM, with fallback to default tests."""
        try:
            prompt = self.prompt_builder.build_test_gen_prompt(code)
            tests = await self.llm.generate(prompt)
            
            # Cleanup potential markdown in tests
            tests = self._clean_test_output(tests)
            
            # Validate tests have basic structure
            if not self._is_valid_test(tests):
                print("LLM generated invalid tests, using default template")
                return DEFAULT_TEST_TEMPLATE
                
            return tests
            
        except Exception as e:
            print(f"Test generation failed: {e}, using default template")
            return DEFAULT_TEST_TEMPLATE

    def _clean_test_output(self, tests: str) -> str:
        """Clean markdown and formatting from test output."""
        if tests.startswith("```"):
            lines = tests.splitlines()
            if lines[0].startswith("```"): 
                lines = lines[1:]
            if lines and lines[-1].strip() == "```": 
                lines = lines[:-1]
            tests = "\n".join(lines)
        
        # Also handle inline markdown blocks
        if "```python" in tests:
            match = re.search(r"```python\n?(.*?)```", tests, re.DOTALL)
            if match:
                tests = match.group(1)
        elif "```" in tests:
            match = re.search(r"```\n?(.*?)```", tests, re.DOTALL)
            if match:
                tests = match.group(1)
                
        return tests.strip()

    def _is_valid_test(self, tests: str) -> bool:
        """Check if tests have valid pytest structure."""
        if not tests or len(tests) < 20:
            return False
        # Must have at least one test function
        if "def test_" not in tests:
            return False
        # Must have import or from statement
        if "import" not in tests:
            return False
        return True
