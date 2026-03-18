"""
Generation Phase (Phase 2).
"""

import ast
import json
import re
import textwrap

from src.domain.entities import CodeExample, GeneratedCode, Review
from src.infrastructure.llm.client import HuggingFaceLLM
from src.infrastructure.llm.prompt_builder import PromptBuilder


# Patterns that indicate context leakage from the prompt
CONTEXT_LEAKAGE_PATTERNS = [

    r'# Retrieved Context.*?(?=\n(?:import|from|def|class|"""|$))',
    r'# --- Pattern [\w-]+ ---.*',
    r'# PHASE \d+:.*',
    r'# Task: Generate complete.*',
    r'# Format: JSON with.*',
    r'# CRITICAL INSTRUCTIONS:.*',
    r'# Output Format:.*',
    r'# PHASE: \w+.*',
    r'# Analyze execution errors.*',
    r'# Evaluate code based.*',
    r'# Decide to continue.*',
    r'# Generate retrieval queries.*',
    r'# Run code in sandbox.*',
    r'# Output JSON:.*',
    r'# IMPORTANT:.*JSON.*',
]


def validate_python_syntax(code: str) -> tuple[bool, str]:
    """Validate Python syntax using AST. Returns (is_valid, error_message)."""
    try:
        ast.parse(code)
        return True, ""
    except SyntaxError as e:
        return False, str(e)


def sanitize_solution_code(code: str) -> str:
    """
    Remove test imports, test functions, and contamination from solution code.
    CRITICAL: Prevents pytest leakage into final output.
    """
    if not code:
        return code
    
    lines = code.split('\n')
    sanitized_lines = []
    skip_block = False
    skip_indent = 0
    
    for line in lines:
        stripped = line.strip()
        current_indent = len(line) - len(line.lstrip())
        
        # Exit skip block if we encounter a line with less indent
        if skip_block and stripped and current_indent <= skip_indent:
            skip_block = False
        
        if skip_block:
            continue
        
        # Skip pytest/unittest imports
        if re.match(r'^import\s+pytest', stripped) or re.match(r'^from\s+pytest', stripped):
            continue
        if re.match(r'^import\s+unittest', stripped) or re.match(r'^from\s+unittest', stripped):
            continue
        
        # Skip test functions and their body
        if re.match(r'^def\s+test_\w+\s*\(', stripped):
            skip_block = True
            skip_indent = current_indent
            continue
        
        # Skip test classes and their body
        if re.match(r'^class\s+Test\w+', stripped):
            skip_block = True
            skip_indent = current_indent
            continue
        
        # Skip @pytest decorators
        if stripped.startswith('@pytest'):
            continue
        
        sanitized_lines.append(line)
    
    return '\n'.join(sanitized_lines).strip()



def validate_optimization_scope(original_code: str, optimized_code: str) -> tuple[bool, str]:
    """
    Validate that optimized code preserves the original task scope.
    Returns (is_valid, error_message).
    
    Checks:
    1. Syntax is valid
    2. Same number of top-level function definitions (or fewer)
    3. Original function name is preserved
    4. Code length hasn't exploded
    """
    # Check syntax first
    is_valid, error = validate_python_syntax(optimized_code)
    if not is_valid:
        return False, f"Syntax error: {error}"
    
    try:
        original_tree = ast.parse(original_code)
        optimized_tree = ast.parse(optimized_code)
    except SyntaxError as e:
        return False, f"Parse error: {e}"
    
    # Extract function names from original
    original_funcs = [node.name for node in ast.walk(original_tree) if isinstance(node, ast.FunctionDef)]
    optimized_funcs = [node.name for node in ast.walk(optimized_tree) if isinstance(node, ast.FunctionDef)]
    
    # Check: primary function must be preserved
    if original_funcs and original_funcs[0] not in optimized_funcs:
        return False, f"Original function '{original_funcs[0]}' not found in optimized code"
    
    # Check: no explosion in number of functions (allow at most 1 helper)
    if len(optimized_funcs) > len(original_funcs) + 1:
        return False, f"Too many new functions: {optimized_funcs}"
    
    # Check: code length hasn't exploded (max 3x original)
    if len(optimized_code) > len(original_code) * 3:
        return False, f"Code size exploded from {len(original_code)} to {len(optimized_code)}"
    
    # Check for suspicious patterns that indicate scope creep
    suspicious_patterns = ['pathlib', 'json.load', 'open(', 'with open', 're.compile', 'datetime']
    for pattern in suspicious_patterns:
        if pattern in optimized_code and pattern not in original_code:
            return False, f"Detected scope creep: '{pattern}' introduced"
    
    return True, ""


def fix_indentation_issues(code: str) -> str:
    """Attempt to fix common indentation issues in generated code."""
    lines = code.split('\n')
    fixed_lines = []
    expected_indent = 0
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        if not stripped:
            fixed_lines.append('')
            continue
        
        # Calculate current indentation
        current_indent = len(line) - len(line.lstrip())
        
        # Determine expected indentation based on previous context
        if stripped.startswith(('def ', 'class ', 'if ', 'elif ', 'else:', 'for ', 'while ', 'try:', 'except', 'finally:', 'with ', 'async def ', 'async for ', 'async with ')):
            # This line should be at expected_indent
            fixed_line = ' ' * expected_indent + stripped
            fixed_lines.append(fixed_line)
            # Next line should be indented
            if stripped.endswith(':'):
                expected_indent += 4
        elif stripped in ('pass', 'return', 'break', 'continue', 'raise') or stripped.startswith(('return ', 'raise ')):
            # These are usually at the same level as their parent
            fixed_line = ' ' * expected_indent + stripped
            fixed_lines.append(fixed_line)
        elif stripped.startswith(('@',)):
            # Decorators should be at current expected indent (or one level up before def/class)
            fixed_line = ' ' * expected_indent + stripped
            fixed_lines.append(fixed_line)
        elif stripped.startswith(('import ', 'from ')):
            # Imports are usually at module level
            fixed_line = stripped
            fixed_lines.append(fixed_line)
            expected_indent = 0
        else:
            # Regular code - use current indentation if valid, else use expected
            if current_indent > 0 and current_indent % 4 == 0:
                fixed_lines.append(line)
            else:
                fixed_line = ' ' * expected_indent + stripped
                fixed_lines.append(fixed_line)
        
        # Decrease indent after pass/return at end of block
        if stripped in ('pass', 'return', 'break', 'continue') and expected_indent >= 4:
            expected_indent -= 4
    
    return '\n'.join(fixed_lines)


def clean_generated_code(code: str) -> str:
    """Remove any prompt/context leakage from generated code and validate syntax."""
    if not code:
        return code
    
    lines = code.split('\n')
    cleaned_lines = []
    skip_until_code = False
    
    for line in lines:
        stripped = line.strip()
        
        # Skip lines that are clearly prompt leakage
        if any(re.match(pattern, stripped) for pattern in CONTEXT_LEAKAGE_PATTERNS):
            continue
        
        # Skip lines that reference pattern IDs like "# --- Pattern err-parse-001 ---"
        if re.match(r'^#\s*---\s*Pattern\s+[\w-]+\s*---', stripped):
            continue
            
        # Skip lines that are JSON format instructions
        if re.match(r'^#.*\{.*"code".*\}', stripped):
            continue
            
        cleaned_lines.append(line)
    
    # Also fix common syntax issues
    result = '\n'.join(cleaned_lines).strip()
    
    # Fix mixed quote issues: f'{var}@{var2}" -> f'{var}@{var2}'
    result = re.sub(r"f'([^']*)'\"", r"f'\1'", result)
    result = re.sub(r'f"([^"]*)"\'', r'f"\1"', result)
    result = re.sub(r"f'([^']*)\"$", r"f'\1'", result, flags=re.MULTILINE)
    
    # Validate syntax
    is_valid, error = validate_python_syntax(result)
    
    if not is_valid:
        print(f"Syntax validation failed: {error}")
        # Attempt to fix indentation issues
        fixed_result = fix_indentation_issues(result)
        is_valid_fixed, _ = validate_python_syntax(fixed_result)
        
        if is_valid_fixed:
            print("Auto-fixed indentation issues successfully")
            return fixed_result
        
        # Try dedenting the entire code (common issue with LLMs)
        try:
            dedented = textwrap.dedent(result)
            is_valid_dedent, _ = validate_python_syntax(dedented)
            if is_valid_dedent:
                print("Fixed via dedent")
                return dedented
        except Exception:
            pass
        
        # If still invalid, log but return the cleaned code anyway
        print(f"Could not auto-fix syntax: {error}")
    
    return result


class GenerationPhase:
    """Handles code synthesis using LLM and retrieved context."""

    def __init__(self) -> None:
        """Initialize dependencies."""
        self.llm = HuggingFaceLLM()
        self.prompt_builder = PromptBuilder()

    async def execute(self, user_query: str, context: list[CodeExample], iteration: int = 1) -> GeneratedCode:
        """
        Synthesize code based on user query and retrieved patterns asynchronously.
        """
        prompt = self.prompt_builder.build_generation_prompt(user_query, context)
        response_text = await self.llm.generate_json(prompt)
        
        return self._parse_generated_code(response_text)

    async def execute_repair(self, user_query: str, previous_code: str, review: Review, context: list[CodeExample]) -> GeneratedCode:
        """
        Generate a fix for the code based on review findings with STRICT intent preservation.
        ONLY fixes the specific error - does NOT add unrelated code.
        """
        # Get the error message from review
        error_msg = "; ".join(review.critical_issues) if review.critical_issues else "Code has issues"
        
        # Use dedicated repair prompt that enforces intent preservation
        prompt = self.prompt_builder.build_repair_prompt(
            user_query=user_query,
            broken_code=previous_code,
            error_msg=error_msg,
            context=context
        )
        response_text = await self.llm.generate_json(prompt)
        
        result = self._parse_generated_code(response_text)
        
        # Validate that repair didn't drift from original intent
        is_valid, scope_error = validate_optimization_scope(previous_code, result.code)
        if not is_valid:
            print(f"Repair failed scope validation: {scope_error}")
            # Keep original code but report the failure
            return GeneratedCode(
                code=previous_code,
                explanation=f"Repair rejected - {scope_error}. Original code kept.",
                confidence=0.6
            )
        
        return result

    async def execute_optimization(self, previous_code: str, review: Review, context: list[CodeExample]) -> GeneratedCode:
        """
        Optimize correct code for readability, type safety, validation, and performance.
        Used when code is functionally correct but can be improved.
        
        Includes strict scope validation to prevent task drift.
        """
        prompt = self.prompt_builder.build_optimization_prompt(previous_code, review, context)
        response_text = await self.llm.generate_json(prompt)
        
        result = self._parse_generated_code(response_text)
        
        # GATE 1: Check if optimization produced valid code
        if len(result.code.strip()) < 10:
            print("Optimization produced empty/invalid code, keeping original")
            return GeneratedCode(
                code=previous_code,
                explanation="Optimization did not improve code - empty result",
                confidence=0.9
            )
        
        # GATE 2: Validate optimization scope (prevents task drift)
        is_valid, scope_error = validate_optimization_scope(previous_code, result.code)
        if not is_valid:
            print(f"Optimization failed scope validation: {scope_error}")
            print(f"Keeping original code instead of: {result.code[:200]}...")
            return GeneratedCode(
                code=previous_code,
                explanation=f"Optimization rejected - {scope_error}. Keeping original.",
                confidence=0.85
            )
        
        # GATE 3: Final syntax check
        is_syntax_valid, syntax_error = validate_python_syntax(result.code)
        if not is_syntax_valid:
            print(f"Optimized code has syntax error: {syntax_error}")
            return GeneratedCode(
                code=previous_code,
                explanation=f"Optimization had syntax error: {syntax_error}",
                confidence=0.8
            )
        
        return result


    def _parse_generated_code(self, json_text: str | dict) -> GeneratedCode:

        """Parse LLM JSON response into GeneratedCode object with extreme robustness."""
        try:
            if isinstance(json_text, dict):
                data = json_text
            else:
                cleaned_text = json_text.strip()
                if cleaned_text.startswith("```json"):
                    cleaned_text = cleaned_text.replace("```json", "").replace("```", "")
                
                # Use strict=False to handle control characters and newlines in strings
                data = json.loads(cleaned_text, strict=False)

            # Robustness A: Handle common nesting hallucinations
            if "generation" in data and isinstance(data["generation"], dict):
                if "code" not in data:
                    data = data["generation"]
            
            # Robustness B: Sanitize lists
            for field in ["assumptions", "retrieved_patterns_used"]:
                val = data.get(field, [])
                if isinstance(val, str): data[field] = [val]
                elif isinstance(val, list): data[field] = [str(item) for item in val]
                else: data[field] = []

            # Robustness C: Extract and clean code
            code_content = data.get("code", "")
            if isinstance(code_content, str) and "```" in code_content:
                # Try to pull inner block if model nested markdown inside JSON
                inner_match = re.search(r"```(?:python)?\n?(.*?)```", code_content, re.DOTALL)
                if inner_match:
                    code_content = inner_match.group(1)
            
            # CRITICAL: Clean any context leakage from the generated code
            code_content = clean_generated_code(str(code_content).strip())
            
            # CRITICAL: Remove test imports, test functions, and pytest contamination
            code_content = sanitize_solution_code(code_content)
            
            data["code"] = code_content
            
            # Final fix: Ensure explanation and confidence exist
            if "explanation" not in data: data["explanation"] = "Generated by EGRR Pipeline"
            if "confidence" not in data: data["confidence"] = 0.9
            
            return GeneratedCode(**data)
            
        except Exception as e:
            print(f"Fallback parsing for generation: {e}")
            # Ultra-Fallback: If JSON fails, try aggressive extraction
            raw_str = str(json_text)
            
            # 1. Try to find and extract the "code" field value manually
            # This handles cases where JSON is malformed but "code": "..." is present
            code_start_pattern = r'"code"\s*:\s*"'
            code_start_match = re.search(code_start_pattern, raw_str)
            if code_start_match:
                try:
                    start_idx = code_start_match.end()
                    # Find the end of the code string by tracking escape sequences
                    end_idx = start_idx
                    in_escape = False
                    while end_idx < len(raw_str):
                        char = raw_str[end_idx]
                        if in_escape:
                            in_escape = False
                        elif char == '\\':
                            in_escape = True
                        elif char == '"':
                            break
                        end_idx += 1
                    
                    if end_idx < len(raw_str):
                        code_content = raw_str[start_idx:end_idx]
                        # Decode the escaped string
                        code_content = code_content.replace('\\n', '\n')
                        code_content = code_content.replace('\\t', '\t')
                        code_content = code_content.replace('\\"', '"')
                        code_content = code_content.replace("\\'", "'")
                        code_content = code_content.replace('\\\\', '\\')
                        
                        # Clean context leakage
                        code_content = clean_generated_code(code_content.strip())
                        
                        # Extract explanation if present
                        explanation = "Extracted via regex"
                        exp_match = re.search(r'"explanation"\s*:\s*"([^"]*)"', raw_str)
                        if exp_match:
                            explanation = exp_match.group(1)
                        
                        # Extract confidence if present
                        confidence = 0.5
                        conf_match = re.search(r'"confidence"\s*:\s*([\d.]+)', raw_str)
                        if conf_match:
                            confidence = float(conf_match.group(1))
                        
                        print(f"Successfully extracted code via manual parsing ({len(code_content)} chars)")
                        return GeneratedCode(
                            code=code_content,
                            explanation=explanation,
                            confidence=confidence
                        )
                except Exception as inner_e:
                    print(f"Manual code extraction failed: {inner_e}")
            
            # 2. Try parsing as JSON with more aggressive cleaning
            try:
                # Sometimes the response is wrapped in extra text
                json_match = re.search(r'\{[^{}]*"code"[^{}]*\}', raw_str, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group(0), strict=False)
                    code_content = data.get("code", "")
                    # Clean nested markdown
                    if "```" in code_content:
                        inner_match = re.search(r"```(?:python)?\n?(.*?)```", code_content, re.DOTALL)
                        if inner_match:
                            code_content = inner_match.group(1)
                    # Clean context leakage
                    code_content = clean_generated_code(code_content.strip())
                    return GeneratedCode(
                        code=code_content,
                        explanation=data.get("explanation", "Extracted via regex"),
                        confidence=float(data.get("confidence", 0.7))
                    )
            except Exception:
                pass
            
            # 3. Look for any markdown code block
            code_match = re.search(r"```(?:python)?\n?(.*?)```", raw_str, re.DOTALL)
            if code_match:
                code_content = clean_generated_code(code_match.group(1).strip())
                return GeneratedCode(code=code_content, explanation="Extraction via regex fallback", confidence=0.5)
            
            # 4. Look for "def " or "import " to see if it's raw python
            if "def " in raw_str or "import " in raw_str or "class " in raw_str:
                # Try to extract just the Python code parts
                lines = raw_str.split('\n')
                code_lines = []
                in_code = False
                for line in lines:
                    stripped = line.strip()
                    if stripped.startswith(('def ', 'class ', 'import ', 'from ', '@', '#')) or in_code:
                        in_code = True
                        # Stop at JSON-like endings
                        if stripped.startswith(('"', '}', ']')):
                            break
                        code_lines.append(line)
                if code_lines:
                    code_content = clean_generated_code('\n'.join(code_lines).strip())
                    return GeneratedCode(code=code_content, explanation="Extracted code lines", confidence=0.4)
                code_content = clean_generated_code(raw_str.strip())
                return GeneratedCode(code=code_content, explanation="Assumption: raw response is code", confidence=0.3)
                
            return GeneratedCode(code="# Parsing failed", explanation=f"Error: {str(e)}", confidence=0.0)

