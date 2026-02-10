"""
Secure Code Execution Sandbox.
"""

import sys

import subprocess
import tempfile
from pathlib import Path

from src.config.settings import get_settings

settings = get_settings()
from src.domain.entities import ExecutionResult, CoverageResult, TestRunMetrics
from src.domain.value_objects import ExecutionStatus

class SandboxRunner:
    """Handles secure execution of Python code."""

    def execute(self, code: str, timeout: int | None = None) -> ExecutionResult:
        # ...
        timeout = timeout or settings.execution_timeout
        
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as tmp:
            tmp.write(code)
            tmp_path = tmp.name

        try:
            # Run the code
            process = subprocess.run(
                [sys.executable, tmp_path],
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False
            )
            stdout = process.stdout
            stderr = process.stderr
            exit_code = process.returncode
            status = ExecutionStatus.SUCCESS if exit_code == 0 else ExecutionStatus.ERROR

            return ExecutionResult(
                status=status,
                stdout=stdout,
                stderr=stderr,
                exit_code=exit_code,
                test_results=None,
                coverage=None
            )

        except subprocess.TimeoutExpired:
            return ExecutionResult(
                status=ExecutionStatus.ERROR,
                stdout="",
                stderr=f"Execution timed out after {timeout} seconds",
                exit_code=124, 
                test_results=None,
                coverage=None
            )
        except Exception as e:
            return ExecutionResult(
                status=ExecutionStatus.ERROR,
                stdout="",
                stderr=str(e),
                exit_code=1,
                test_results=None,
                coverage=None
            )
        finally:
            Path(tmp_path).unlink(missing_ok=True)


    def run_tests(self, code: str, tests: str) -> ExecutionResult:
        """
        Run code with provided tests using Pytest and Coverage.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            dir_path = Path(temp_dir)
            code_file = dir_path / "solution.py"
            code_file.write_text(code, encoding="utf-8")
            
            if "from solution import" not in tests and "import solution" not in tests:
                tests = "from solution import *\n" + tests
            test_file = dir_path / "test_solution.py"
            test_file.write_text(tests, encoding="utf-8")
            
            try:
                # Run pytest with coverage
                cmd = [
                    sys.executable, "-m", "coverage", "run", "--source=solution", "-m", 
                    "pytest", str(test_file), "-q", "--tb=short"
                ]
                
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    cwd=str(dir_path),
                    timeout=settings.execution_timeout
                )
                
                stdout = result.stdout
                stderr = result.stderr
                exit_code = result.returncode
                
                # Parse test results
                test_results = self._parse_pytest_output(stdout, stderr)
                
                # Capture coverage report
                coverage_result = None
                if exit_code == 0 or test_results.failed > 0:
                    cov_proc = subprocess.run(
                        [sys.executable, "-m", "coverage", "json", "-o", "coverage.json"],
                        capture_output=True, text=True, cwd=str(dir_path)
                    )
                    
                    cov_path = dir_path / "coverage.json"
                    if cov_path.exists():
                        import json
                        with open(cov_path) as f:
                            cov_data = json.load(f)
                            # coverage.json format: {"totals": {"percent_covered": 100.0, ...}, "files": {"solution.py": {...}}}
                            totals = cov_data.get("totals", {})
                            file_cov = cov_data.get("files", {}).get(str(code_file.resolve()), {}) # resolving might be tricky with temp paths
                            # Fallback if specific file not found (since we run source=solution)
                            if not file_cov and cov_data.get("files"):
                                # Just take the first file's coverage (should be solution.py)
                                values = list(cov_data["files"].values())
                                file_cov = values[0] if values else {}

                            line_coverage = float(totals.get("percent_covered", 0.0)) / 100.0
                            missing_lines = file_cov.get("missing_lines", [])
                            
                            coverage_result = CoverageResult(
                                line_coverage=line_coverage,
                                branch_coverage=0.0, # coverage.py needs --branch for this
                                uncovered_lines=missing_lines
                            )

                status = ExecutionStatus.SUCCESS
                if exit_code != 0:
                     status = ExecutionStatus.ERROR if test_results.failed > 0 else ExecutionStatus.WARNING

                return ExecutionResult(
                    status=status,
                    stdout=stdout,
                    stderr=stderr,
                    exit_code=exit_code,
                    test_results=test_results,
                    coverage=coverage_result
                )
                
            except subprocess.TimeoutExpired:
                 return ExecutionResult(
                    status=ExecutionStatus.ERROR,
                    stdout="",
                    stderr="Test execution timed out",
                    exit_code=124,
                    test_results=None,
                    coverage=None
                )

    def _parse_pytest_output(self, stdout: str, stderr: str) -> TestRunMetrics:
        """Parse pytest stdout to extract pass/fail counts."""
        passed = 0
        failed = 0
        failures = []
        
        # Simple string parsing logic - can be robustified
        lines = stdout.splitlines()
        summary_line = lines[-1] if lines else ""
        
        # Try to parse summary line like "2 failed, 1 passed in 0.1s"
        parts = summary_line.split(", ")
        for part in parts:
            if "passed" in part:
                try:
                    passed = int(part.split()[0])
                except ValueError: pass
            if "failed" in part:
                try:
                    failed = int(part.split()[0])
                except ValueError: pass
                
        # Extract failures from output
        # Look for "FAILED test_file.py::test_name - AssertionError..."
        for line in lines:
            if "FAILED" in line:
                failures.append(line.strip())
                
        # If pytest crashed (stderr has content but no stdout summary), consider it 1 failure
        if not stdout and stderr:
             failed = 1
             failures.append("Pytest execution failed (syntax error?)")
             
        return TestRunMetrics(passed=passed, failed=failed, failures=failures)
