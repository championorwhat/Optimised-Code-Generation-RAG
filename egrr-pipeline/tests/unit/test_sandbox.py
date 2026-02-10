"""
Tests for Sandbox Runner.
"""

import pytest

from src.infrastructure.sandbox.runner import SandboxRunner
from src.domain.entities import ExecutionStatus


def test_sandbox_execute_success():
    """Test simple code execution."""
    runner = SandboxRunner()
    result = runner.execute("print('hello world')")
    
    assert result.status == ExecutionStatus.SUCCESS
    assert "hello world" in result.stdout
    assert result.exit_code == 0


def test_sandbox_execute_error():
    """Test execution with syntax error."""
    runner = SandboxRunner()
    result = runner.execute("print('incomplete")
    
    assert result.status == ExecutionStatus.ERROR
    assert result.exit_code != 0
    assert "SyntaxError" in result.stderr


def test_sandbox_run_tests_success():
    """Test running passing tests with coverage."""
    code = """
def add(a, b):
    return a + b
"""
    tests = """
def test_add():
    assert add(1, 2) == 3
"""
    runner = SandboxRunner()
    result = runner.run_tests(code, tests)
    
    assert result.status == ExecutionStatus.SUCCESS
    assert result.test_results.passed == 1
    assert result.coverage is not None
    assert result.coverage.line_coverage == 1.0


def test_sandbox_run_tests_failure():
    """Test running failing tests."""
    code = """
def add(a, b):
    return a - b  # Bug
"""
    tests = """
def test_add():
    assert add(1, 2) == 3
"""
    runner = SandboxRunner()
    result = runner.run_tests(code, tests)
    
    assert result.status == ExecutionStatus.ERROR
    assert result.test_results.failed == 1
    assert "FAILED" in result.stdout
