"""
Prompt Builder Service.
"""

from pathlib import Path

from src.domain.entities import CodeExample, ExecutionResult, Review


class PromptBuilder:
    """Constructs prompts for different pipeline phases."""

    def __init__(self) -> None:
        """Load system prompt."""
        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        """Read system prompt from file."""
        prompt_path = Path(__file__).parent / "prompts" / "system_prompt.md"
        try:
            return prompt_path.read_text(encoding="utf-8").strip()
        except FileNotFoundError:
            return "You are an AI coding assistant."

    def build_retrieval_prompt(self, user_query: str, iteration: int) -> list[dict[str, str]]:
        """Construct prompt for Phase 1: Retrieval."""
        content = (
            f"Query: {user_query}\n"
            "Task: Generate retrieval queries to find relevant code patterns.\n"
            "Format: JSON {{'retrieval_queries': ['query1', 'query2']}}"
        )
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": content}
        ]

    def build_generation_prompt(self, user_query: str, context: list[CodeExample]) -> list[dict[str, str]]:
        """Construct prompt for Phase 2: Generation with STRICT intent preservation."""
        # Filter context to only include relevant patterns (exclude test patterns)
        filtered_context = []
        for doc in context[:2]:
            code_snippet = doc.code[:200] if len(doc.code) > 200 else doc.code
            # Skip test-related patterns
            if 'pytest' in code_snippet.lower() or 'unittest' in code_snippet.lower():
                continue
            if 'test_' in doc.id.lower():
                continue
            filtered_context.append(code_snippet)
        
        context_str = "\n".join(f"Pattern: {c}" for c in filtered_context) if filtered_context else "No relevant patterns"
        
        content = (
            f"USER REQUEST: {user_query}\n\n"
            "TASK: Write a Python function that EXACTLY matches the user's request.\n\n"
            "CRITICAL RULES:\n"
            "1. Write ONLY what the user asked for - nothing more, nothing less\n"
            "2. Output EXACTLY ONE function that solves the task\n"
            "3. DO NOT add helper functions or utility code\n"
            "4. DO NOT import pytest, unittest, or any test libraries\n"
            "5. DO NOT add logging, file I/O, or unrelated functionality\n"
            "6. DO NOT include test code in the solution\n"
            "7. Ensure VALID Python syntax\n"
            "8. Code must be complete and runnable\n\n"
            f"Reference patterns (for style only):\n{context_str}\n\n"
            "OUTPUT FORMAT (JSON):\n"
            '{"code": "def function_name(...): ...your implementation...", '
            '"explanation": "brief description", "confidence": 0.9}\n\n'
            "IMPORTANT: Output ONLY the function code, no imports except standard library if needed.\n"
            "NO MARKDOWN. NO COMMENTS. VALID PYTHON ONLY."
        )
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": content}
        ]


    def build_reretrieval_prompt(self, execution_result: ExecutionResult) -> list[dict[str, str]]:
        """Construct prompt for Phase 4: Re-Retrieval."""
        content = (
            f"Error: {execution_result.stderr}\n"
            "Task: Generate retrieval queries to fix this error.\n"
            "Format: JSON {{'retrieval_queries': []}}"
        )
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": content}
        ]

    def build_review_prompt(self, code: str, execution_result: ExecutionResult) -> list[dict[str, str]]:
        """Construct prompt for Phase 5: Review."""
        content = (
            f"Code:\n{code[:500]}...\n\n" # Truncate code for review if too long
            f"Status: {execution_result.status.value}\n"
            f"Error: {execution_result.stderr}\n"
            "Task: Review code quality.\n"
            "Format: JSON {{'review': {{'correctness': {{'status': 'pass/fail', 'findings': []}}}}, 'overall_quality_score': 0.0, 'critical_issues': []}}"
        )
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": content}
        ]

    def build_test_gen_prompt(self, code: str) -> list[dict[str, str]]:
        """Construct prompt for Phase 3 internal test generation."""
        content = (
            f"Code:\n{code}\n\n"
            "Task: Write Pytest tests.\n"
            "Format: Python code only. Start with 'import pytest'."
        )
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": content}
        ]

    def build_repair_strategy_prompt(self, review: Review) -> list[dict[str, str]]:
        """Construct prompt for Phase 6: Repair Planning."""
        issues = "; ".join(review.critical_issues)
        content = (
            f"Issues: {issues}\n"
            "Task: Plan repair.\n"
            "Format: JSON {{'lines_to_modify': [], 'patterns_to_apply': [], 'validation_criteria': []}}"
        )
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": content}
        ]

    def build_repair_prompt(self, user_query: str, broken_code: str, error_msg: str, context: list[CodeExample]) -> list[dict[str, str]]:
        """
        Construct prompt for repairing broken code with STRICT intent preservation.
        Does NOT add new features - only fixes the specific error.
        """
        # Extract function name for preservation
        import re
        func_match = re.search(r'def\s+(\w+)\s*\(', broken_code)
        func_name = func_match.group(1) if func_match else "the function"
        
        content = (
            f"REPAIR TASK - FIX ERROR ONLY\n\n"
            f"ORIGINAL USER REQUEST: {user_query}\n\n"
            f"BROKEN CODE:\n```python\n{broken_code}\n```\n\n"
            f"ERROR MESSAGE:\n{error_msg[:500]}\n\n"
            "CRITICAL REPAIR RULES:\n"
            "1. FIX ONLY the specific error mentioned above\n"
            "2. DO NOT change the function name or purpose\n"
            "3. DO NOT add new functions or features\n"
            "4. DO NOT import pytest, unittest, or test libraries\n"
            "5. DO NOT add logging, file I/O, or unrelated code\n"
            "6. Keep the solution minimal and focused\n"
            "7. Preserve the original intent from the user request\n"
            f"8. The repaired function MUST still be called `{func_name}`\n\n"
            "OUTPUT FORMAT (JSON):\n"
            '{"code": "repaired function code", "explanation": "what was fixed", "confidence": 0.9}\n\n'
            "IMPORTANT: Output ONLY the repaired function, nothing else.\n"
            "NO MARKDOWN. VALID PYTHON ONLY."
        )
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": content}
        ]

    def build_optimization_prompt(self, code: str, review: Review, context: list[CodeExample]) -> list[dict[str, str]]:
        """Construct prompt for optimization iterations with strict task preservation."""
        # Extract function signature for preservation
        import re
        func_match = re.search(r'def\s+(\w+)\s*\([^)]*\)', code)
        func_name = func_match.group(1) if func_match else "the function"
        
        # Gather optimization suggestions (limited scope)
        optimization_goals = []
        for goal in (review.optimization_gaps or review.improvement_opportunities or []):
            # Filter out goals that might cause scope creep
            if not any(x in goal.lower() for x in ['file', 'json', 'parse', 'regex', 'utility', 'helper']):
                optimization_goals.append(goal)
        
        if not optimization_goals:
            optimization_goals = ["Add docstring", "Add type hints", "Add input validation"]
        
        goals_str = "\n".join(f"- {goal}" for goal in optimization_goals[:3])
        
        content = (
            f"OPTIMIZATION TASK - STRICT CONSTRAINTS\n\n"
            f"Current Code:\n```python\n{code}\n```\n\n"
            f"Function to optimize: `{func_name}`\n\n"
            f"Optimization Goals:\n{goals_str}\n\n"
            "CRITICAL RULES - YOU MUST FOLLOW:\n"
            "1. You must ONLY optimize the existing function\n"
            "2. Do NOT introduce new functions or classes\n"
            "3. Do NOT change the function name or signature\n"
            "4. Do NOT add unrelated functionality (no file I/O, JSON, regex, etc.)\n"
            "5. Keep the code MINIMAL - add only docstrings, type hints, and simple validation\n"
            "6. The output must be VALID Python syntax\n"
            "7. Preserve the EXACT same behavior\n\n"
            "ALLOWED OPTIMIZATIONS:\n"
            "- Add/improve docstring\n"
            "- Add type hints\n" 
            "- Add simple input validation (e.g., isinstance checks)\n"
            "- Add clear error messages with TypeError/ValueError\n"
            "- Improve variable names\n\n"
            "NOT ALLOWED:\n"
            "- New top-level functions\n"
            "- Import statements not already present\n"
            "- File operations\n"
            "- Complex utility functions\n\n"
            "Output JSON:\n"
            '{"code": "optimized function code only", "explanation": "what was improved", "confidence": 0.9}\n'
            "NO MARKDOWN. VALID PYTHON ONLY."
        )
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": content}
        ]

