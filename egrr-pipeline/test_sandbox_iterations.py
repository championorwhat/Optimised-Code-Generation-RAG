"""
Challenging Sandbox Iteration Test.

This script tests the full sandbox iteration loop with a complex problem
that will likely require multiple refinement cycles.

Run with: poetry run python test_sandbox_iterations.py
"""

import asyncio
import time
from src.core.orchestrator import EGRROrchestrator
from src.core.phases.execution import ExecutionPhase
from src.core.phases.generation import GenerationPhase
from src.core.phases.review import ReviewPhase
from src.infrastructure.sandbox.runner import SandboxRunner


def print_section(title: str):
    print(f"\n{'='*70}")
    print(f" {title}")
    print(f"{'='*70}")


def print_subsection(title: str):
    print(f"\n{'-'*50}")
    print(f" {title}")
    print(f"{'-'*50}")


async def test_sandbox_direct():
    """Directly test the sandbox runner with various code scenarios."""
    
    print_section("PART 1: DIRECT SANDBOX EXECUTION TESTS")
    
    runner = SandboxRunner()
    
    # Test 1: Simple working code
    print_subsection("Test 1: Simple Working Code")
    code = '''
def add(a, b):
    return a + b

print(add(2, 3))
'''
    result = runner.execute(code)
    print(f"Status: {result.status}")
    print(f"Exit Code: {result.exit_code}")
    print(f"Stdout: {result.stdout.strip()}")
    print(f"Stderr: {result.stderr.strip()}")
    
    # Test 2: Code with syntax error
    print_subsection("Test 2: Code with Syntax Error")
    bad_code = '''
def broken(x)  # Missing colon
    return x
'''
    result = runner.execute(bad_code)
    print(f"Status: {result.status}")
    print(f"Exit Code: {result.exit_code}")
    print(f"Stderr (first 200 chars): {result.stderr[:200].strip()}")
    
    # Test 3: Code with runtime error
    print_subsection("Test 3: Code with Runtime Error")
    runtime_error_code = '''
def divide(a, b):
    return a / b

print(divide(10, 0))  # ZeroDivisionError
'''
    result = runner.execute(runtime_error_code)
    print(f"Status: {result.status}")
    print(f"Exit Code: {result.exit_code}")
    print(f"Stderr: {result.stderr.strip()}")
    
    # Test 4: Run with pytest and coverage
    print_subsection("Test 4: Code with Generated Tests (Pytest + Coverage)")
    
    code = '''
def factorial(n):
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return 1
    return n * factorial(n - 1)
'''
    
    tests = '''
import pytest
from solution import factorial

def test_factorial_zero():
    assert factorial(0) == 1

def test_factorial_one():
    assert factorial(1) == 1

def test_factorial_five():
    assert factorial(5) == 120

def test_factorial_negative():
    with pytest.raises(ValueError):
        factorial(-1)

def test_factorial_large():
    assert factorial(10) == 3628800
'''
    
    result = runner.run_tests(code, tests)
    print(f"Status: {result.status}")
    print(f"Exit Code: {result.exit_code}")
    print(f"Tests Passed: {result.test_results.passed if result.test_results else 'N/A'}")
    print(f"Tests Failed: {result.test_results.failed if result.test_results else 'N/A'}")
    print(f"Coverage: {result.coverage.line_coverage:.1%}" if result.coverage else "Coverage: N/A")
    print(f"Stdout:\n{result.stdout}")
    if result.stderr:
        print(f"Stderr:\n{result.stderr}")
    
    # Test 5: Failing tests that need iteration
    print_subsection("Test 5: Code with FAILING Tests (Simulates need for iteration)")
    
    buggy_code = '''
def is_prime(n):
    # BUG: Doesn't handle edge cases properly
    if n < 2:
        return False
    for i in range(2, n):
        if n % i == 0:
            return False
    return True
'''
    
    strict_tests = '''
import pytest
from solution import is_prime

def test_prime_2():
    assert is_prime(2) == True

def test_prime_3():
    assert is_prime(3) == True

def test_not_prime_4():
    assert is_prime(4) == False

def test_prime_large():
    assert is_prime(97) == True

def test_zero():
    assert is_prime(0) == False

def test_one():
    assert is_prime(1) == False

def test_negative():
    assert is_prime(-5) == False

# This will likely fail if performance optimization not done
def test_large_prime():
    assert is_prime(104729) == True  # 10000th prime
'''
    
    result = runner.run_tests(buggy_code, strict_tests)
    print(f"Status: {result.status}")
    print(f"Tests Passed: {result.test_results.passed if result.test_results else 'N/A'}")
    print(f"Tests Failed: {result.test_results.failed if result.test_results else 'N/A'}")
    if result.test_results and result.test_results.failures:
        print(f"Failures: {result.test_results.failures}")
    print(f"Coverage: {result.coverage.line_coverage:.1%}" if result.coverage else "Coverage: N/A")


async def test_full_iteration_loop():
    """Test the full pipeline with a challenging problem that requires iterations."""
    
    print_section("PART 2: FULL PIPELINE ITERATION TEST")
    print("Testing with a CHALLENGING problem to force multiple sandbox iterations...")
    
    orchestrator = EGRROrchestrator()
    
    # Challenging problems that typically require refinement
    challenging_queries = [
        {
            "name": "LRU Cache Implementation",
            "query": """Write a Python class called LRUCache that implements a Least Recently Used cache with:
- __init__(self, capacity: int) - Initialize with positive capacity
- get(self, key: int) -> int - Return value if key exists, else -1. Mark as recently used.
- put(self, key: int, value: int) -> None - Update or insert value. Evict least recently used if at capacity.
Both operations must be O(1) time complexity. Use OrderedDict or implement with dict + doubly linked list.""",
            "max_iterations": 5
        },
        {
            "name": "Balanced Parentheses with Types",
            "query": """Write a Python function called is_balanced that checks if a string has balanced parentheses.
It must handle: (), [], {}
Return True if balanced, False otherwise.
Edge cases: empty string returns True, single bracket returns False, nested brackets like ({[]}) should work.
Also handle: "([)]" should return False (interleaved).""",
            "max_iterations": 4
        }
    ]
    
    for query_info in challenging_queries:
        print_subsection(f"Challenge: {query_info['name']}")
        print(f"Query: {query_info['query'][:100]}...")
        print(f"Max Iterations: {query_info['max_iterations']}")
        
        start_time = time.time()
        
        try:
            # Create detailed logging by wrapping orchestrator
            response = await run_with_iteration_logging(
                orchestrator, 
                query_info['query'], 
                query_info['max_iterations']
            )
            
            elapsed = time.time() - start_time
            
            print(f"\n{'*'*50}")
            print(f"FINAL RESULT")
            print(f"{'*'*50}")
            print(f"Status: {response.status}")
            print(f"Total Iterations: {response.iterations}")
            print(f"Tests Passed: {response.tests_passed}")
            print(f"Tests Failed: {response.tests_failed}")
            print(f"Coverage: {response.coverage:.1%}")
            print(f"Total Time: {elapsed:.2f}s")
            print(f"\nFINAL CODE:\n{'-'*40}")
            print(response.code)
            print(f"{'-'*40}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()


async def run_with_iteration_logging(orchestrator, query: str, max_iterations: int):
    """
    Custom run that logs each iteration's sandbox execution details.
    """
    import uuid
    from src.domain.entities import PipelineState, PipelinePhase
    from src.domain.value_objects import DecisionType
    
    state = PipelineState(
        run_id=str(uuid.uuid4()),
        user_query=query,
        language="python",
        max_iterations=max_iterations
    )
    
    for iteration in range(1, max_iterations + 1):
        print(f"\n>>> ITERATION {iteration}/{max_iterations}")
        state.current_iteration = iteration
        
        # --- Retrieval Phase ---
        print("  📚 Phase 1: Retrieval...")
        if iteration == 1:
            queries, docs = orchestrator.retrieval_phase.execute_intent_based(query)
            print(f"     Retrieved {len(docs)} documents based on intent")
        else:
            last_exec = state.last_execution
            if last_exec:
                queries, docs = orchestrator.retrieval_phase.execute_execution_grounded(last_exec)
                print(f"     Re-retrieved {len(docs)} documents based on execution errors")
            else:
                queries, docs = [], []
        
        state.history_retrieval.append(queries)
        state.current_context_docs = docs
        
        # --- Generation Phase ---
        print("  🔧 Phase 2: Generation...")
        if iteration == 1 or not state.last_code:
            generated_code = orchestrator.generation_phase.execute(query, docs, iteration)
            print("     Generated initial code")
        else:
            last_review = state.history_review[-1] if state.history_review else None
            if last_review:
                generated_code = orchestrator.generation_phase.execute_repair(
                    state.last_code, last_review, docs
                )
                print(f"     Generated REPAIR code (fixing {len(last_review.critical_issues)} issues)")
            else:
                generated_code = orchestrator.generation_phase.execute(query, docs, iteration)
        
        state.history_code.append(generated_code)
        print(f"     Code length: {len(generated_code.code)} chars")
        
        # --- Execution Phase (SANDBOX) ---
        print("  🧪 Phase 3: SANDBOX EXECUTION...")
        exec_result = orchestrator.execution_phase.execute(generated_code)
        state.history_execution.append(exec_result)
        
        print(f"     Status: {exec_result.status}")
        print(f"     Exit Code: {exec_result.exit_code}")
        if exec_result.test_results:
            print(f"     Tests: {exec_result.test_results.passed} passed, {exec_result.test_results.failed} failed")
            if exec_result.test_results.failures:
                print(f"     Failures: {exec_result.test_results.failures[:2]}...")  # Show first 2
        if exec_result.coverage:
            print(f"     Coverage: {exec_result.coverage.line_coverage:.1%}")
        if exec_result.stderr and len(exec_result.stderr) > 0:
            error_preview = exec_result.stderr[:200].replace('\n', ' ')
            print(f"     Stderr preview: {error_preview}...")
        
        # --- Review Phase ---
        print("  🔍 Phase 5: Review...")
        review = orchestrator.review_phase.execute(generated_code.code, exec_result)
        state.history_review.append(review)
        
        print(f"     Quality Score: {review.overall_quality_score:.2f}")
        print(f"     Critical Issues: {len(review.critical_issues)}")
        if review.critical_issues:
            for issue in review.critical_issues[:3]:
                print(f"       - {issue[:80]}...")
        
        # --- Decision Phase ---
        print("  ⚖️ Phase 6: Decision...")
        decision = orchestrator.decision_phase.execute(review, iteration, max_iterations)
        print(f"     Decision: {decision.decision}")
        print(f"     Rationale: {decision.rationale}")
        
        if decision.decision in (DecisionType.TERMINATE_SUCCESS, DecisionType.TERMINATE_MAX_ITERATIONS):
            print(f"\n  🏁 Pipeline TERMINATED at iteration {iteration}")
            break
        else:
            print(f"\n  🔄 CONTINUING to next iteration...")
    
    # Build response
    from src.domain.entities import GenerateResponse
    
    final_code = state.last_code or ""
    final_exec = state.last_execution
    final_status = "success" if decision.decision == DecisionType.TERMINATE_SUCCESS else "failed"
    if decision.decision == DecisionType.TERMINATE_MAX_ITERATIONS:
        final_status = "partial"
    
    return GenerateResponse(
        code=final_code,
        explanation=state.history_code[-1].explanation if state.history_code else "No code generated",
        iterations=iteration,
        status=final_status,
        coverage=final_exec.coverage.line_coverage if final_exec and final_exec.coverage else 0.0,
        tests_passed=final_exec.test_results.passed if final_exec and final_exec.test_results else 0,
        tests_failed=final_exec.test_results.failed if final_exec and final_exec.test_results else 0
    )


async def main():
    print("\n" + "="*70)
    print(" EGRR PIPELINE - SANDBOX ITERATION STRESS TEST")
    print(" Testing the full sandbox environment with iterative refinement")
    print("="*70)
    
    # Part 1: Direct sandbox tests
    await test_sandbox_direct()
    
    # Part 2: Full pipeline with iteration logging
    await test_full_iteration_loop()
    
    print("\n" + "="*70)
    print(" TEST COMPLETE")
    print("="*70)


if __name__ == "__main__":
    asyncio.run(main())
