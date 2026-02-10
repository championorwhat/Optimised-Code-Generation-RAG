"""
Live Pipeline Test Script.

This script tests the full EGRR pipeline with sandbox execution iterations.
Run with: poetry run python test_pipeline_live.py
"""

import asyncio
import json
import time
from src.core.orchestrator import EGRROrchestrator


async def test_pipeline():
    """Test the full EGRR pipeline with real queries."""
    
    print("=" * 60)
    print("EGRR PIPELINE - LIVE SANDBOX TESTING")
    print("=" * 60)
    
    orchestrator = EGRROrchestrator()
    
    # Test queries that will exercise the sandbox iterations
    test_cases = [
        {
            "name": "Fibonacci with Memoization",
            "query": "Write a Python function called fibonacci that takes an integer n and returns the nth Fibonacci number using memoization for efficiency. Include proper edge case handling for negative numbers.",
            "max_iterations": 3
        },
        {
            "name": "Binary Search",
            "query": "Write a Python function called binary_search that takes a sorted list and a target value, returns the index if found or -1 if not found.",
            "max_iterations": 3
        },
        {
            "name": "Palindrome Checker",
            "query": "Write a Python function called is_palindrome that checks if a given string is a palindrome, ignoring spaces and case.",
            "max_iterations": 2
        }
    ]
    
    results = []
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{'='*60}")
        print(f"TEST {i}/{len(test_cases)}: {test['name']}")
        print(f"{'='*60}")
        print(f"Query: {test['query'][:80]}...")
        print(f"Max Iterations: {test['max_iterations']}")
        print("-" * 60)
        
        start_time = time.time()
        
        try:
            response = await orchestrator.run(
                user_query=test['query'],
                max_iterations=test['max_iterations']
            )
            
            elapsed = time.time() - start_time
            
            print(f"\n✅ RESULT:")
            print(f"   Status: {response.status}")
            print(f"   Iterations: {response.iterations}")
            print(f"   Tests Passed: {response.tests_passed}")
            print(f"   Tests Failed: {response.tests_failed}")
            print(f"   Coverage: {response.coverage:.1%}")
            print(f"   Time: {elapsed:.2f}s")
            print(f"\n📝 GENERATED CODE:")
            print("-" * 40)
            print(response.code)
            print("-" * 40)
            print(f"\n💡 EXPLANATION: {response.explanation}")
            
            results.append({
                "name": test['name'],
                "status": response.status,
                "iterations": response.iterations,
                "tests_passed": response.tests_passed,
                "tests_failed": response.tests_failed,
                "coverage": response.coverage,
                "time": elapsed,
                "success": response.status == "success"
            })
            
        except Exception as e:
            elapsed = time.time() - start_time
            print(f"\n❌ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            results.append({
                "name": test['name'],
                "status": "error",
                "error": str(e),
                "time": elapsed,
                "success": False
            })
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for r in results if r.get('success', False))
    total = len(results)
    
    for r in results:
        icon = "✅" if r.get('success') else "❌"
        print(f"{icon} {r['name']}: {r['status']} ({r['time']:.2f}s)")
        if r.get('iterations'):
            print(f"   Iterations: {r['iterations']}, Tests: {r.get('tests_passed', 0)}/{r.get('tests_passed', 0) + r.get('tests_failed', 0)}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("=" * 60)
    
    return results


if __name__ == "__main__":
    asyncio.run(test_pipeline())
